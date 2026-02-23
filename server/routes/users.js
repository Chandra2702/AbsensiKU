import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/users - List all users (admin only, password excluded)
router.get('/', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, role FROM users ORDER BY id');
        res.json(rows);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Gagal mengambil data user' });
    }
});

// POST /api/users - Create user (admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { id, username, password, role } = req.body;

        if (!id || !username || !password || !role) {
            return res.status(400).json({ error: 'Semua field diperlukan' });
        }

        // Check duplicate username
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Username sudah digunakan' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
            [id, username, hashedPassword, role]
        );

        res.status(201).json({ id, username, role });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Gagal menambahkan user' });
    }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role } = req.body;

        // Check duplicate username (excluding current user)
        if (username) {
            const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
            if (existing.length > 0) {
                return res.status(409).json({ error: 'Username sudah digunakan' });
            }
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?',
                [username, hashedPassword, role, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET username = ?, role = ? WHERE id = ?',
                [username, role, id]
            );
        }

        res.json({ id, username, role });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Gagal mengupdate user' });
    }
});

// DELETE /api/users/:id - Delete user (admin only, protect admin utama)
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Protect admin utama (ID = '1')
        if (id === '1') {
            return res.status(403).json({ error: 'Admin Utama tidak dapat dihapus.' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User berhasil dihapus' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Gagal menghapus user' });
    }
});

export default router;
