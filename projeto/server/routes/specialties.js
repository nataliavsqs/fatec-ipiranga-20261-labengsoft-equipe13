const express = require('express');
const database = require('../config/database');
const { authMiddleware, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// Listar todas as especialidades
router.get('/list', async (req, res) => {
    try {
        const specialties = await database.query(`
            SELECT id, name, slug, icon
            FROM specialties
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            message: 'Especialidades obtidas com sucesso',
            data: specialties
        });

    } catch (error) {
        console.error('❌ Erro ao obter especialidades:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

// Obter especialidades de um professor específico
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const teacherId = req.params.teacherId;

        const specialties = await database.query(`
            SELECT s.id, s.name, s.slug, s.icon
            FROM specialties s
            INNER JOIN teacher_specialties ts ON s.id = ts.specialty_id
            WHERE ts.teacher_id = ?
            ORDER BY s.name ASC
        `, [teacherId]);

        res.json({
            success: true,
            message: 'Especialidades do professor obtidas com sucesso',
            data: specialties
        });

    } catch (error) {
        console.error('❌ Erro ao obter especialidades do professor:', error);
        res.status(500).json({
            error: true,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;