import bcrypt from 'bcryptjs';
import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
    try {
        // Run schema first
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Split by semicolons and execute each statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const stmt of statements) {
            await pool.query(stmt);
        }
        console.log('✅ Schema created successfully');

        // Seed default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
            `INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
            ['1', 'admin', hashedPassword, 'admin']
        );

        // Seed default user
        const hashedUserPassword = await bcrypt.hash('user123', 10);
        await pool.query(
            `INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
            ['2', 'user', hashedUserPassword, 'user']
        );

        console.log('✅ Default users seeded:');
        console.log('   Admin → admin / admin123');
        console.log('   User  → user / user123');
        console.log('');
        console.log('🎉 Database setup complete!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}

seed();
