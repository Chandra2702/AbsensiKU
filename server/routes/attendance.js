import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/attendance - List all attendance records
router.get('/', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, student_id AS studentId, DATE_FORMAT(date, "%Y-%m-%d") AS date, 
       status, recorded_by AS recordedBy, recorded_at AS timestamp 
       FROM attendance ORDER BY date DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Get attendance error:', err);
        res.status(500).json({ error: 'Gagal mengambil data absensi' });
    }
});

// POST /api/attendance - Create/Update attendance (upsert)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { id, studentId, date, status, recordedBy } = req.body;

        if (!id || !studentId || !date || !status) {
            return res.status(400).json({ error: 'Semua field diperlukan' });
        }

        await pool.query(
            `INSERT INTO attendance (id, student_id, date, status, recorded_by) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_by = VALUES(recorded_by), recorded_at = CURRENT_TIMESTAMP`,
            [id, studentId, date, status, recordedBy || null]
        );

        res.status(201).json({ id, studentId, date, status, recordedBy });
    } catch (err) {
        console.error('Save attendance error:', err);
        res.status(500).json({ error: 'Gagal menyimpan absensi' });
    }
});

export default router;
