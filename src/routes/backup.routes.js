import express from 'express';
import logger from '../utils/logger.js';
import DatabaseBackup from '../../scripts/backup-database.js';
import DatabaseRestore from '../../scripts/restore-database.js';

const router = express.Router();

/**
 * GET /api/backup/status
 * Obter status do sistema de backup
 */
router.get('/status', async (req, res) => {
    try {
        const backupService = req.app.locals.backupService;
        
        if (!backupService) {
            return res.status(503).json({
                success: false,
                message: 'Serviço de backup não disponível',
                timestamp: new Date().toISOString()
            });
        }
        
        const status = backupService.getStatus();
        
        res.json({
            success: true,
            message: 'Status do backup obtido',
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao obter status do backup:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/backup/list
 * Listar backups disponíveis
 */
router.get('/list', async (req, res) => {
    try {
        const backup = new DatabaseBackup();
        const backups = backup.listBackups();
        
        res.json({
            success: true,
            message: 'Backups listados',
            data: backups,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao listar backups:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar backups',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/backup/create
 * Criar backup manual
 */
router.post('/create', async (req, res) => {
    try {
        const backupService = req.app.locals.backupService;
        
        if (!backupService) {
            return res.status(503).json({
                success: false,
                message: 'Serviço de backup não disponível',
                timestamp: new Date().toISOString()
            });
        }
        
        logger.info('📦 Iniciando backup manual via API...');
        const backupPath = await backupService.forceBackup();
        
        res.json({
            success: true,
            message: 'Backup criado com sucesso',
            data: {
                path: backupPath,
                timestamp: new Date()
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro ao criar backup:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao criar backup: ${  error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/backup/restore
 * Restaurar backup
 */
router.post('/restore', async (req, res) => {
    try {
        const { backupName } = req.body;
        
        if (!backupName) {
            return res.status(400).json({
                success: false,
                message: 'Nome do backup é obrigatório',
                timestamp: new Date().toISOString()
            });
        }
        
        logger.info(`🔄 Iniciando restauração via API: ${backupName}`);
        
        const restore = new DatabaseRestore();
        await restore.performRestore(backupName);
        
        // Verificar integridade após restauração
        const integrityReport = await restore.verifyDataIntegrity();
        
        res.json({
            success: true,
            message: 'Backup restaurado com sucesso',
            data: {
                backupName,
                timestamp: new Date(),
                integrity: integrityReport
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro ao restaurar backup:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao restaurar backup: ${  error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/backup/schedule
 * Configurar agendamento de backup
 */
router.post('/schedule', async (req, res) => {
    try {
        const { intervalHours } = req.body;
        
        if (!intervalHours || intervalHours < 1 || intervalHours > 8760) {
            return res.status(400).json({
                success: false,
                message: 'Intervalo deve ser entre 1 e 8760 horas',
                timestamp: new Date().toISOString()
            });
        }
        
        const backupService = req.app.locals.backupService;
        
        if (!backupService) {
            return res.status(503).json({
                success: false,
                message: 'Serviço de backup não disponível',
                timestamp: new Date().toISOString()
            });
        }
        
        backupService.reschedule(intervalHours);
        
        res.json({
            success: true,
            message: 'Agendamento de backup atualizado',
            data: {
                intervalHours,
                nextBackup: backupService.getNextBackupTime()
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro ao agendar backup:', error);
        res.status(500).json({
            success: false,
            message: `Erro ao agendar backup: ${  error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * DELETE /api/backup/cleanup
 * Limpar backups antigos
 */
router.delete('/cleanup', async (req, res) => {
    try {
        const { daysToKeep = 30 } = req.body;
        
        if (daysToKeep < 1 || daysToKeep > 365) {
            return res.status(400).json({
                success: false,
                message: 'Dias para manter deve ser entre 1 e 365',
                timestamp: new Date().toISOString()
            });
        }
        
        const backupService = req.app.locals.backupService;
        
        if (!backupService) {
            return res.status(503).json({
                success: false,
                message: 'Serviço de backup não disponível',
                timestamp: new Date().toISOString()
            });
        }
        
        await backupService.cleanupOldBackups(daysToKeep);
        
        res.json({
            success: true,
            message: 'Limpeza de backups concluída',
            data: {
                daysToKeep,
                cleanupDate: new Date()
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro na limpeza de backups:', error);
        res.status(500).json({
            success: false,
            message: `Erro na limpeza: ${  error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/backup/verify
 * Verificar integridade dos dados
 */
router.get('/verify', async (req, res) => {
    try {
        const restore = new DatabaseRestore();
        const report = await restore.verifyDataIntegrity();
        
        if (!report) {
            return res.status(503).json({
                success: false,
                message: 'Não foi possível verificar integridade',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            message: 'Verificação de integridade concluída',
            data: report,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro na verificação de integridade:', error);
        res.status(500).json({
            success: false,
            message: `Erro na verificação: ${  error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/backup/health
 * Health check do sistema de backup
 */
router.get('/health', async (req, res) => {
    try {
        const backupService = req.app.locals.backupService;
        const backup = new DatabaseBackup();
        
        const health = {
            serviceRunning: !!backupService && backupService.isRunning,
            backupsAvailable: backup.listBackups().length,
            lastBackup: null,
            diskSpace: 'unknown',
            status: 'healthy'
        };
        
        if (backupService) {
            const status = backupService.getStatus();
            health.lastBackup = status.lastBackup;
        }
        
        // Verificar se há backups recentes (últimas 48h)
        const backups = backup.listBackups();
        if (backups.length > 0) {
            const latestBackup = backups[0];
            const timeDiff = Date.now() - latestBackup.created.getTime();
            const hours48 = 48 * 60 * 60 * 1000;
            
            if (timeDiff > hours48) {
                health.status = 'warning';
                health.warning = 'Último backup há mais de 48 horas';
            }
        } else {
            health.status = 'warning';
            health.warning = 'Nenhum backup encontrado';
        }
        
        res.json({
            success: true,
            message: 'Health check do backup',
            data: health,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erro no health check do backup:', error);
        res.status(500).json({
            success: false,
            message: 'Erro no health check',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
