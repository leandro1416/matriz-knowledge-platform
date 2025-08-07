import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Rota para a página principal
router.get('/', (req, res) => {
    res.sendFile(path.join(config.paths.public, 'index.html'));
});

// Rota de status para compatibilidade com frontend
router.get('/status', (req, res) => {
    const dbStatus = req.app.locals.databaseConnection?.getStatus() || { isConnected: false };
    res.json({ 
        ok: true, 
        message: 'Matriz funcionando!',
        timestamp: new Date().toISOString(),
        mongodb: dbStatus.isConnected ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// Rota para o dashboard
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(config.paths.public, 'dashboard.html'));
});

// Rota para Second Brain
router.get('/second-brain', (req, res) => {
    res.sendFile(path.join(config.paths.public, 'second-brain.html'));
});

// Rota para notas estratégicas
router.get('/strategic-notes', (req, res) => {
    res.sendFile(path.join(config.paths.public, 'strategic-notes.html'));
});

// Rota para dashboard de logs
router.get('/logs-dashboard', (req, res) => {
    res.sendFile(path.join(config.paths.public, 'logs-dashboard.html'));
});

// Rota para posts
router.get('/post', (req, res) => {
    res.sendFile(path.join(config.paths.public, 'post.html'));
});

export default router; 