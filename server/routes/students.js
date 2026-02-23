import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/students - List all students
router.get('/', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, class_grade AS classGrade, DATE_FORMAT(joined_date, "%Y-%m-%d") AS joinedDate FROM students ORDER BY class_grade, name');
        res.json(rows);
    } catch (err) {
        console.error('Get students error:', err);
        res.status(500).json({ error: 'Gagal mengambil data siswa' });
    }
});

// POST /api/students - Create student
router.post('/', requireAuth, async (req, res) => {
    try {
        const { id, name, classGrade, joinedDate } = req.body;

        if (!id || !name || !classGrade || !joinedDate) {
            return res.status(400).json({ error: 'Semua field diperlukan' });
        }

        await pool.query(
            'INSERT INTO students (id, name, class_grade, joined_date) VALUES (?, ?, ?, ?)',
            [id, name, classGrade, joinedDate]
        );

        res.status(201).json({ id, name, classGrade, joinedDate });
    } catch (err) {
        console.error('Create student error:', err);
        res.status(500).json({ error: 'Gagal menambahkan siswa' });
    }
});

// PUT /api/students/:id - Update student
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, classGrade, joinedDate } = req.body;

        await pool.query(
            'UPDATE students SET name = ?, class_grade = ?, joined_date = ? WHERE id = ?',
            [name, classGrade, joinedDate, id]
        );

        res.json({ id, name, classGrade, joinedDate });
    } catch (err) {
        console.error('Update student error:', err);
        res.status(500).json({ error: 'Gagal mengupdate siswa' });
    }
});

// DELETE /api/students/:id - Delete student (cascades to attendance)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM students WHERE id = ?', [id]);
        res.json({ message: 'Siswa berhasil dihapus' });
    } catch (err) {
        console.error('Delete student error:', err);
        res.status(500).json({ error: 'Gagal menghapus siswa' });
    }
});

// DELETE /api/students/class/:classGrade - Bulk delete by class
router.delete('/class/:classGrade', requireAuth, async (req, res) => {
    try {
        const classGrade = decodeURIComponent(req.params.classGrade);
        await pool.query('DELETE FROM students WHERE class_grade = ?', [classGrade]);
        res.json({ message: `Data kelas ${classGrade} berhasil dihapus` });
    } catch (err) {
        console.error('Delete class error:', err);
        res.status(500).json({ error: 'Gagal menghapus data kelas' });
    }
});

// PUT /api/students/class/promote - Promote class
router.put('/class/promote', requireAuth, async (req, res) => {
    try {
        const { fromClass, toClass } = req.body;

        if (!fromClass || !toClass) {
            return res.status(400).json({ error: 'fromClass dan toClass diperlukan' });
        }

        await pool.query(
            'UPDATE students SET class_grade = ? WHERE class_grade = ?',
            [toClass, fromClass]
        );

        res.json({ message: `Kelas ${fromClass} berhasil dipindahkan ke ${toClass}` });
    } catch (err) {
        console.error('Promote class error:', err);
        res.status(500).json({ error: 'Gagal memindahkan kelas' });
    }
});

export default router;
