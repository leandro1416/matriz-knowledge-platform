import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const router = Router();

// Middleware para verificar se é admin (em produção)
const isAdmin = (req, res, next) => {
    // Em desenvolvimento, permitir acesso
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    
    // Em produção, verificar autenticação
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    
    next();
};

// Rota principal de logs (sem autenticação em desenvolvimento)
router.get('/', (req, res) => {
    try {
        // Gerar logs de exemplo para demonstração
        const mockLogs = [
            {
                level: 'info',
                message: 'Sistema iniciado com sucesso',
                timestamp: new Date().toISOString()
            },
            {
                level: 'success',
                message: 'Post criado: Bem-vindo à Matriz',
                timestamp: new Date(Date.now() - 60000).toISOString()
            },
            {
                level: 'warning',
                message: 'MongoDB em modo mock - dados simulados',
                timestamp: new Date(Date.now() - 120000).toISOString()
            },
            {
                level: 'error',
                message: 'Erro de conexão MongoDB - continuando em modo mock',
                timestamp: new Date(Date.now() - 180000).toISOString()
            },
            {
                level: 'info',
                message: 'Dashboard acessado por usuário',
                timestamp: new Date(Date.now() - 240000).toISOString()
            }
        ];
        
        res.json({
            success: true,
            logs: mockLogs,
            total: mockLogs.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter estatísticas de erro
router.get('/stats', isAdmin, (req, res) => {
    try {
        const stats = logger.getErrorStats();
        const report = logger.generateErrorReport();
        
        res.json({
            success: true,
            errorStats: stats,
            totalErrors: report.totalErrors,
            recommendations: report.recommendations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter logs por tipo
router.get('/:type', isAdmin, (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 100, offset = 0 } = req.query;
        
        const logFile = path.join('./logs', `${type}.log`);
        
        if (!fs.existsSync(logFile)) {
            return res.status(404).json({ error: 'Log file not found' });
        }
        
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        // Aplicar paginação
        const start = parseInt(offset);
        const end = start + parseInt(limit);
        const paginatedLines = lines.slice(start, end);
        
        // Parsear JSON de cada linha
        const logs = paginatedLines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return { raw: line, parseError: true };
            }
        });
        
        res.json({
            success: true,
            logs,
            total: lines.length,
            offset: start,
            limit: parseInt(limit),
            hasMore: end < lines.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obter relatório de erro completo
router.get('/report/full', isAdmin, (req, res) => {
    try {
        const report = logger.generateErrorReport();
        
        res.json({
            success: true,
            report,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Limpar logs antigos
router.delete('/cleanup', isAdmin, (req, res) => {
    try {
        const { days = 7 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        const logsDir = path.join('./logs');
        const files = fs.readdirSync(logsDir);
        
        let cleanedCount = 0;
        
        files.forEach(file => {
            if (file.endsWith('.log')) {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    cleanedCount++;
                }
            }
        });
        
        res.json({
            success: true,
            message: 'Logs limpos com sucesso',
            cleanedCount,
            cutoffDate: cutoffDate.toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 