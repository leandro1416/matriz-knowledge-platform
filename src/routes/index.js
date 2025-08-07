import express from 'express';
import { aiLimiter } from '../middlewares/security.middleware.js';

// Importar todas as rotas
import postRoutes from './post.routes.js';
import commentRoutes from './comment.routes.js';
import aiRoutes from './ai.js';
import authRoutes from './auth.js';
import strategicNoteRoutes from './strategicNote.routes.js';
import logsRoutes from './logs.js';
import backupRoutes from './backup.routes.js';
import obsidianRoutes from './obsidian.routes.js';

const router = express.Router();

// Rotas da API
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/ai', aiLimiter, aiRoutes); // Rate limiting específico para IA
router.use('/strategic-notes', strategicNoteRoutes);
router.use('/logs', logsRoutes);
router.use('/backup', backupRoutes);
router.use('/obsidian', obsidianRoutes);

// Rotas de status e health
router.get('/status', (req, res) => {
    const dbStatus = req.app.locals.databaseConnection?.getStatus() || { isConnected: false };
    res.json({ 
        ok: true, 
        message: 'Matriz API funcionando!',
        timestamp: new Date().toISOString(),
        mongodb: dbStatus.isConnected ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

router.get('/health', (req, res) => {
    const dbStatus = req.app.locals.databaseConnection?.getStatus() || { isConnected: false };
    res.json({
        status: 'healthy',
        mongodb: dbStatus.isConnected ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV
    });
});

export default router; 