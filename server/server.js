import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import userRoutes from './routes/users.js';
import settingRoutes from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'absensiku-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,  // Set true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);

async function startServer() {
    if (isDev) {
        // Development: use Vite dev server as middleware
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            root: path.resolve(__dirname, '..'),
            server: { middlewareMode: true },
            appType: 'spa'
        });
        app.use(vite.middlewares);
    } else {
        // Production: serve built files
        const distPath = path.resolve(__dirname, '..', 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            if (!req.path.startsWith('/api')) {
                res.sendFile(path.join(distPath, 'index.html'));
            }
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('🎓 ═══════════════════════════════════════');
        console.log('   AbsensiKU Server');
        console.log('═══════════════════════════════════════════');
        console.log(`   🌐 URL:  http://localhost:${PORT}`);
        console.log(`   📦 Mode: ${isDev ? 'Development' : 'Production'}`);
        console.log('═══════════════════════════════════════════');
        console.log('');
    });
}

startServer();
