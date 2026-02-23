import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.json(settings);
    } catch (err) {
        console.error('Get settings error:', err);
        res.status(500).json({ error: 'Gagal mengambil settings' });
    }
});

// PUT /api/settings - Update settings
router.put('/', requireAuth, async (req, res) => {
    try {
        const { academic_year, school_name } = req.body;

        if (academic_year) {
            await pool.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                ['academic_year', academic_year, academic_year]
            );
        }

        if (school_name) {
            await pool.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                ['school_name', school_name, school_name]
            );
        }

        res.json({ message: 'Settings berhasil disimpan' });
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ error: 'Gagal menyimpan settings' });
    }
});

export default router;
