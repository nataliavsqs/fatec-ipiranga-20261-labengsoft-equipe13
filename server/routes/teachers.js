const express = require('express');
const database = require('../config/database');
const { authMiddleware, requireStudent } = require('../middleware/auth');

const router = express.Router();

// Listar todos os professores (com filtros e busca)
router.get('/', async (req, res) => {
    try {
        const {
            search = '',
            subject = '',
            minPrice = 0,
            maxPrice = 10000,
            location = '',
            minRating = 0,
            page = 1,
            limit = 12
        } = req.query;

        const toNumber = (value, fallback) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        };

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
        const minPriceNumber = Math.max(0, toNumber(minPrice, 0));
        const maxPriceNumber = Math.max(minPriceNumber, toNumber(maxPrice, 10000));
        const minRatingNumber = Math.min(5, Math.max(0, toNumber(minRating, 0)));
        const searchText = String(search || '').trim();
        const subjectText = String(subject || '').trim();
        const locationText = String(location || '').trim();

        const offset = (pageNumber - 1) * limitNumber;

        // Construir query com filtros
        let whereConditions = ['t.is_active = TRUE'];
        let queryParams = [];

        // Filtro de busca (nome ou matéria)
        if (searchText) {
            whereConditions.push('(u.name LIKE ? OR t.subject LIKE ? OR t.description LIKE ?)');
            const searchParam = `%${searchText}%`;
            queryParams.push(searchParam, searchParam, searchParam);
        }

        // Filtro por matéria específica
        if (subjectText) {
            whereConditions.push('t.subject LIKE ?');
            queryParams.push(`%${subjectText}%`);
        }

        // Filtro por faixa de preço
        if (minPriceNumber > 0) {
            whereConditions.push('t.hourly_rate >= ?');
            queryParams.push(minPriceNumber);
        }
        if (maxPriceNumber < 10000) {
            whereConditions.push('t.hourly_rate <= ?');
            queryParams.push(maxPriceNumber);
        }

        // Filtro por localização
        if (locationText) {
            whereConditions.push('t.location LIKE ?');
            queryParams.push(`%${locationText}%`);
        }

        // Filtro por avaliação mínima
        if (minRatingNumber > 0) {
            whereConditions.push('t.rating >= ?');
            queryParams.push(minRatingNumber);
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Query principal para buscar professores
        const teachersQuery = `
            SELECT 
                t.id,
                u.name,
                u.email,
                u.phone,
                u.profile_image,
                t.subject,
                t.description,
                t.education,
                t.experience_years,
                t.hourly_rate,
                t.location,
                t.rating,
                t.total_reviews,
                t.availability,
                t.created_at
            FROM teachers t
            INNER JOIN users u ON t.user_id = u.id
            ${whereClause}
            ORDER BY t.rating DESC, t.total_reviews DESC
            LIMIT ${limitNumber} OFFSET ${offset}
        `;

        // Query para contar total de professores (para paginação)
        const countQuery = `
            SELECT COUNT(*) as total
            FROM teachers t
            INNER JOIN users u ON t.user_id = u.id
            ${whereClause}
        `;

        // Executar queries
        const teachers = await database.query(teachersQuery, queryParams);
        const [countResult] = await database.query(countQuery, queryParams);
        const totalTeachers = countResult.total;

        // Processar disponibilidade (se for JSON)
        const processedTeachers = teachers.map(teacher => {
            let parsedAvailability = teacher.availability || null;

            if (typeof parsedAvailability === 'string') {
                try {
                    parsedAvailability = JSON.parse(parsedAvailability);
                } catch (e) {
                    // Mantem o valor original quando a disponibilidade nao esta em JSON.
                    parsedAvailability = teacher.availability;
                }
            }

            return {
                ...teacher,
                availability: parsedAvailability
            };
        });

        // Calcular informações de paginação
        const totalPages = Math.ceil(totalTeachers / limitNumber);
        const hasNext = pageNumber < totalPages;
        const hasPrev = pageNumber > 1;

        res.json({
            success: true,
            message: 'Professores encontrados com sucesso',
            data: {
                teachers: processedTeachers,
                pagination: {
                    current: pageNumber,
                    total: totalPages,
                    hasNext,
                    hasPrev,
                    count: teachers.length,
                    totalCount: totalTeachers
                }
            }
        });

    } catch (error) {
        console.error('❌ Erro ao listar professores:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Obter matérias disponíveis (para filtros)
router.get('/subjects/list', async (req, res) => {
    try {
        const subjects = await database.query(`
            SELECT DISTINCT t.subject, COUNT(*) as teacher_count
            FROM teachers t
            WHERE t.is_active = TRUE
            GROUP BY t.subject
            ORDER BY teacher_count DESC, t.subject ASC
        `);

        res.json({
            success: true,
            message: 'Matérias obtidas com sucesso',
            data: subjects
        });

    } catch (error) {
        console.error('❌ Erro ao obter matérias:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Obter detalhes de um professor específico
router.get('/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;

        // Buscar dados do professor
        const teachers = await database.query(`
            SELECT 
                t.id,
                u.name,
                u.email,
                u.phone,
                u.profile_image,
                t.subject,
                t.description,
                t.education,
                t.experience_years,
                t.hourly_rate,
                t.location,
                t.rating,
                t.total_reviews,
                t.availability,
                t.created_at
            FROM teachers t
            INNER JOIN users u ON t.user_id = u.id
            WHERE t.id = ? AND t.is_active = TRUE
        `, [teacherId]);

        if (teachers.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Professor não encontrado'
            });
        }

        const teacher = teachers[0];

        // Buscar avaliações do professor
        const reviews = await database.query(`
            SELECT 
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                u.name as student_name
            FROM reviews r
            INNER JOIN students s ON r.student_id = s.id
            INNER JOIN users u ON s.user_id = u.id
            WHERE r.teacher_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [teacherId]);

        // Processar disponibilidade
        if (teacher.availability) {
            try {
                teacher.availability = typeof teacher.availability === 'string' 
                    ? JSON.parse(teacher.availability) 
                    : teacher.availability;
            } catch (e) {
                teacher.availability = null;
            }
        }

        res.json({
            success: true,
            message: 'Professor encontrado com sucesso',
            data: {
                teacher,
                reviews
            }
        });

    } catch (error) {
        console.error('❌ Erro ao obter detalhes do professor:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Agendar aula com professor (apenas estudantes)
router.post('/:id/schedule', authMiddleware, requireStudent, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { scheduledDate, durationMinutes = 60, notes = '', subject } = req.body;

        if (!scheduledDate || !subject) {
            return res.status(400).json({
                error: true,
                message: 'Data agendada e matéria são obrigatórias'
            });
        }

        // Verificar se o professor existe e está ativo
        const teachers = await database.query(
            'SELECT t.id, t.hourly_rate, u.name FROM teachers t INNER JOIN users u ON t.user_id = u.id WHERE t.id = ? AND t.is_active = TRUE',
            [teacherId]
        );

        if (teachers.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Professor não encontrado ou inativo'
            });
        }

        const teacher = teachers[0];

        // Obter ID do estudante
        const students = await database.query(
            'SELECT id FROM students WHERE user_id = ?',
            [req.user.id]
        );

        if (students.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'Perfil de estudante não encontrado'
            });
        }

        const studentId = students[0].id;

        // Calcular preço baseado na duração
        const pricePerHour = teacher.hourly_rate;
        const totalPrice = (pricePerHour * parseInt(durationMinutes)) / 60;

        // Inserir agendamento
        const result = await database.query(`
            INSERT INTO sessions (teacher_id, student_id, subject, scheduled_date, duration_minutes, price, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [teacherId, studentId, subject, scheduledDate, parseInt(durationMinutes), totalPrice, notes]);

        res.status(201).json({
            success: true,
            message: 'Aula agendada com sucesso',
            data: {
                sessionId: result.insertId,
                teacherName: teacher.name,
                scheduledDate,
                duration: parseInt(durationMinutes),
                totalPrice: totalPrice.toFixed(2),
                subject
            }
        });

    } catch (error) {
        console.error('❌ Erro ao agendar aula:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Avaliar professor (apenas estudantes que tiveram aula)
router.post('/:id/review', authMiddleware, requireStudent, async (req, res) => {
    try {
        const teacherId = req.params.id;
        const { rating, comment = '' } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                error: true,
                message: 'Avaliação deve ser entre 1 e 5'
            });
        }

        // Obter ID do estudante
        const students = await database.query(
            'SELECT id FROM students WHERE user_id = ?',
            [req.user.id]
        );

        if (students.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'Perfil de estudante não encontrado'
            });
        }

        const studentId = students[0].id;

        // Verificar se o estudante teve pelo menos uma aula concluída com o professor
        const completedSessions = await database.query(
            'SELECT id FROM sessions WHERE teacher_id = ? AND student_id = ? AND status = "completed"',
            [teacherId, studentId]
        );

        if (completedSessions.length === 0) {
            return res.status(400).json({
                error: true,
                message: 'Você precisa ter pelo menos uma aula concluída com este professor para avaliá-lo'
            });
        }

        // Verificar se já avaliou este professor
        const existingReviews = await database.query(
            'SELECT id FROM reviews WHERE teacher_id = ? AND student_id = ?',
            [teacherId, studentId]
        );

        if (existingReviews.length > 0) {
            return res.status(400).json({
                error: true,
                message: 'Você já avaliou este professor'
            });
        }

        // Usar transação para inserir avaliação e atualizar média
        await database.transaction(async (connection) => {
            // Inserir avaliação
            await connection.execute(
                'INSERT INTO reviews (teacher_id, student_id, rating, comment) VALUES (?, ?, ?, ?)',
                [teacherId, studentId, parseInt(rating), comment]
            );

            // Recalcular média de avaliações
            const [avgResult] = await connection.execute(
                'SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE teacher_id = ?',
                [teacherId]
            );

            // Atualizar dados do professor
            await connection.execute(
                'UPDATE teachers SET rating = ?, total_reviews = ? WHERE id = ?',
                [parseFloat(avgResult.avg_rating), parseInt(avgResult.total_reviews), teacherId]
            );
        });

        res.status(201).json({
            success: true,
            message: 'Avaliação adicionada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao avaliar professor:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;