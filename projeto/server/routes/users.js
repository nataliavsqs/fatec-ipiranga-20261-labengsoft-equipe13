const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Obter perfil do usuário logado
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar dados básicos do usuário
        const users = await database.query(
            `SELECT u.id, u.name, u.email, u.user_type, u.phone, u.profile_image, u.created_at
             FROM users u WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Usuário não encontrado'
            });
        }

        const user = users[0];
        let profileData = { ...user };

        // Se for professor, buscar dados específicos
        if (user.user_type === 'teacher') {
            const teachers = await database.query(
                `SELECT t.subject, t.description, t.education, t.experience_years, 
                        t.hourly_rate, t.availability, t.location, t.rating, t.total_reviews, t.is_active
                 FROM teachers t WHERE t.user_id = ?`,
                [userId]
            );

            if (teachers.length > 0) {
                profileData.teacherInfo = teachers[0];
            }
        }

        // Se for estudante, buscar dados específicos
        if (user.user_type === 'student') {
            const students = await database.query(
                `SELECT s.grade_level, s.subjects_interest, s.learning_goals
                 FROM students s WHERE s.user_id = ?`,
                [userId]
            );

            if (students.length > 0) {
                profileData.studentInfo = students[0];
                // Converter JSON string para object se necessário
                if (profileData.studentInfo.subjects_interest) {
                    try {
                        profileData.studentInfo.subjects_interest = JSON.parse(profileData.studentInfo.subjects_interest);
                    } catch (e) {
                        profileData.studentInfo.subjects_interest = [];
                    }
                }
            }
        }

        res.json({
            success: true,
            message: 'Perfil obtido com sucesso',
            data: profileData
        });

    } catch (error) {
        console.error('❌ Erro ao obter perfil:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Atualizar perfil do usuário
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            name, 
            displayName,
            phone, 
            birthDate,
            profileImage, 
            bio,
            linkedinUrl,
            githubUrl,
            portfolioUrl,
            otherLinks,
            teacherInfo, 
            studentInfo,
            specialties 
        } = req.body;

        // Usar transação para garantir consistência
        await database.transaction(async (connection) => {
            const [userRows] = await connection.execute(
                `SELECT name, display_name, phone, birth_date, profile_image, bio,
                        linkedin_url, github_url, portfolio_url, other_links
                 FROM users WHERE id = ?`,
                [userId]
            );

            if (!userRows.length) {
                throw new Error('Usuário não encontrado');
            }

            const currentUser = userRows[0];
            const hasNameInPayload = typeof name === 'string';
            const nextName = hasNameInPayload ? name.trim() : currentUser.name;

            if (!nextName) {
                throw new Error('Nome é obrigatório');
            }

            // Atualizar dados básicos do usuário
            await connection.execute(
                `UPDATE users SET 
                 name = ?, 
                 display_name = ?,
                 phone = ?, 
                 birth_date = ?,
                 profile_image = ?,
                 bio = ?,
                 linkedin_url = ?,
                 github_url = ?,
                 portfolio_url = ?,
                 other_links = ?
                 WHERE id = ?`,
                [
                    nextName,
                    typeof displayName === 'string' ? (displayName.trim() || nextName) : (currentUser.display_name || nextName),
                    typeof phone !== 'undefined' ? (phone || null) : currentUser.phone,
                    typeof birthDate !== 'undefined' ? (birthDate || null) : currentUser.birth_date,
                    typeof profileImage !== 'undefined' ? (profileImage || null) : currentUser.profile_image,
                    typeof bio !== 'undefined' ? (bio || null) : currentUser.bio,
                    typeof linkedinUrl !== 'undefined' ? (linkedinUrl || null) : currentUser.linkedin_url,
                    typeof githubUrl !== 'undefined' ? (githubUrl || null) : currentUser.github_url,
                    typeof portfolioUrl !== 'undefined' ? (portfolioUrl || null) : currentUser.portfolio_url,
                    typeof otherLinks !== 'undefined' ? (otherLinks || null) : currentUser.other_links,
                    userId
                ]
            );

            // Se for professor e há dados específicos
            if (req.user.userType === 'teacher' && teacherInfo) {
                const {
                    professionalTitle,
                    subject,
                    description,
                    education,
                    experienceYears,
                    hourlyRate,
                    availability,
                    location,
                    isActive
                } = teacherInfo;

                await connection.execute(
                    `UPDATE teachers SET 
                     professional_title = ?,
                     subject = ?, 
                     description = ?, 
                     education = ?, 
                     experience_years = ?,
                     hourly_rate = ?, 
                     availability = ?, 
                     location = ?, 
                     is_active = ?
                     WHERE user_id = ?`,
                    [
                        professionalTitle || '',
                        subject || '',
                        description || '',
                        education || '',
                        parseInt(experienceYears) || 0,
                        parseFloat(hourlyRate) || 0,
                        availability || null,
                        location || '',
                        isActive !== false, // default true
                        userId
                    ]
                );
                
                // Atualizar especialidades do professor
                if (specialties && Array.isArray(specialties)) {
                    // Obter teacher_id
                    const [teacher] = await connection.execute(
                        'SELECT id FROM teachers WHERE user_id = ?',
                        [userId]
                    );
                    
                    if (teacher.length > 0) {
                        const teacherId = teacher[0].id;
                        
                        // Remover especialidades antigas
                        await connection.execute(
                            'DELETE FROM teacher_specialties WHERE teacher_id = ?',
                            [teacherId]
                        );
                        
                        // Adicionar novas especialidades
                        for (const specialtyId of specialties) {
                            await connection.execute(
                                'INSERT INTO teacher_specialties (teacher_id, specialty_id) VALUES (?, ?)',
                                [teacherId, specialtyId]
                            );
                        }
                    }
                }
            }

            // Se for estudante e há dados específicos
            if (req.user.userType === 'student' && studentInfo) {
                const { gradeLevel, subjectsInterest, learningGoals } = studentInfo;

                await connection.execute(
                    'UPDATE students SET grade_level = ?, subjects_interest = ?, learning_goals = ? WHERE user_id = ?',
                    [
                        gradeLevel || 'Não informado',
                        JSON.stringify(subjectsInterest) || '[]',
                        learningGoals || '',
                        userId
                    ]
                );
            }
        });

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        if (error.message === 'Nome é obrigatório') {
            return res.status(400).json({
                error: true,
                message: error.message
            });
        }

        if (error.message === 'Usuário não encontrado') {
            return res.status(404).json({
                error: true,
                message: error.message
            });
        }

        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Obter estatísticas do usuário (dashboard)
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        let stats = {};

        if (req.user.userType === 'teacher') {
            // Estatísticas do professor
            const teacherData = await database.query(
                `SELECT t.id FROM teachers t WHERE t.user_id = ?`,
                [userId]
            );

            if (teacherData.length > 0) {
                const teacherId = teacherData[0].id;

                // Total de aulas
                const [totalSessions] = await database.query(
                    'SELECT COUNT(*) as total FROM sessions WHERE teacher_id = ?',
                    [teacherId]
                );

                // Aulas concluídas
                const [completedSessions] = await database.query(
                    'SELECT COUNT(*) as total FROM sessions WHERE teacher_id = ? AND status = "completed"',
                    [teacherId]
                );

                // Próximas aulas
                const [upcomingSessions] = await database.query(
                    'SELECT COUNT(*) as total FROM sessions WHERE teacher_id = ? AND status = "scheduled" AND scheduled_date > NOW()',
                    [teacherId]
                );

                // Avaliações
                const [reviewsData] = await database.query(
                    'SELECT COUNT(*) as total, AVG(rating) as avgRating FROM reviews WHERE teacher_id = ?',
                    [teacherId]
                );

                stats = {
                    totalSessions: totalSessions.total || 0,
                    completedSessions: completedSessions.total || 0,
                    upcomingSessions: upcomingSessions.total || 0,
                    totalReviews: reviewsData.total || 0,
                    averageRating: parseFloat(reviewsData.avgRating) || 0
                };
            }
        } else {
            // Estatísticas do estudante
            const studentData = await database.query(
                `SELECT s.id FROM students s WHERE s.user_id = ?`,
                [userId]
            );

            if (studentData.length > 0) {
                const studentId = studentData[0].id;

                // Total de aulas
                const [totalSessions] = await database.query(
                    'SELECT COUNT(*) as total FROM sessions WHERE student_id = ?',
                    [studentId]
                );

                // Aulas concluídas
                const [completedSessions] = await database.query(
                    'SELECT COUNT(*) as total FROM sessions WHERE student_id = ? AND status = "completed"',
                    [studentId]
                );

                // Próximas aulas
                const [upcomingSessions] = await database.query(
                    'SELECT COUNT(*) as total FROM sessions WHERE student_id = ? AND status = "scheduled" AND scheduled_date > NOW()',
                    [studentId]
                );

                stats = {
                    totalSessions: totalSessions.total || 0,
                    completedSessions: completedSessions.total || 0,
                    upcomingSessions: upcomingSessions.total || 0
                };
            }
        }

        res.json({
            success: true,
            message: 'Estatísticas obtidas com sucesso',
            data: stats
        });

    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Alterar senha do usuário
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const currentPassword = String(req.body.currentPassword || '');
        const newPassword = String(req.body.newPassword || '');

        // Validações
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: true,
                message: 'Senha atual e nova senha são obrigatórias'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: true,
                message: 'A nova senha deve ter pelo menos 6 caracteres'
            });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({
                error: true,
                message: 'A nova senha deve ser diferente da senha atual'
            });
        }

        // Buscar usuário e verificar senha atual
        const users = await database.query(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Usuário não encontrado'
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: true,
                message: 'Senha atual incorreta'
            });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha
        await database.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao alterar senha:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;