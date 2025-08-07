import DatabaseBackup from '../../scripts/backup-database.js';
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Serviço de backup automático integrado à aplicação
 */
class BackupService {
    constructor() {
        this.backup = new DatabaseBackup();
        this.isRunning = false;
        this.backupInterval = config.backup?.intervalHours || 24; // Padrão: a cada 24 horas
        this.autoBackupEnabled = config.backup?.enabled !== false; // Padrão: habilitado
        this.intervalId = null;
        this.lastBackupTime = null;
    }

    /**
     * Iniciar serviço de backup automático
     */
    start() {
        if (!this.autoBackupEnabled) {
            logger.info('📦 Backup automático desabilitado via configuração');
            return;
        }

        if (this.isRunning) {
            logger.warn('⚠️ Serviço de backup já está rodando');
            return;
        }

        try {
            // Agendar backup automático usando setInterval
            const intervalMs = this.backupInterval * 60 * 60 * 1000; // Converter horas para ms
            
            this.intervalId = setInterval(async () => {
                await this.performScheduledBackup();
            }, intervalMs);

            this.isRunning = true;
            
            logger.success(`🕒 Backup automático agendado: a cada ${this.backupInterval} horas`);
            logger.info('📦 Próximo backup será executado conforme agendamento');
            
            // Fazer backup inicial se não houver backups
            this.checkInitialBackup();
            
        } catch (error) {
            logger.error('❌ Erro ao iniciar serviço de backup:', error.message);
        }
    }

    /**
     * Parar serviço de backup automático
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        logger.info('🛑 Serviço de backup automático parado');
    }

    /**
     * Verificar se existe backup inicial
     */
    async checkInitialBackup() {
        try {
            const backups = this.backup.listBackups();
            
            if (backups.length === 0) {
                logger.info('📦 Nenhum backup encontrado, criando backup inicial...');
                setTimeout(() => {
                    this.performBackup('inicial');
                }, 5000); // Aguardar 5 segundos para aplicação estabilizar
            }
        } catch (error) {
            logger.warn('⚠️ Erro ao verificar backups existentes:', error.message);
        }
    }

    /**
     * Executar backup agendado
     */
    async performScheduledBackup() {
        try {
            logger.info('🕒 Iniciando backup automático agendado...');
            await this.performBackup('agendado');
        } catch (error) {
            logger.error('❌ Erro no backup agendado:', error.message);
            
            // Tentar novamente em 1 hora em caso de erro
            setTimeout(() => {
                this.performBackup('retry').catch(() => {
                    logger.error('❌ Falha no retry do backup');
                });
            }, 60 * 60 * 1000);
        }
    }

    /**
     * Executar backup com contexto
     */
    async performBackup(context = 'manual') {
        try {
            const startTime = Date.now();
            logger.info(`🚀 Iniciando backup (${context})...`);
            
            const backupPath = await this.backup.performBackup();
            this.lastBackupTime = new Date();
            
            const duration = Date.now() - startTime;
            logger.success(`✅ Backup (${context}) concluído em ${duration}ms`);
            logger.info(`📁 Caminho: ${backupPath}`);
            
            // Registrar estatísticas
            this.logBackupStats();
            
            return backupPath;
        } catch (error) {
            logger.error(`❌ Erro no backup (${context}):`, error.message);
            throw error;
        }
    }

    /**
     * Registrar estatísticas de backup
     */
    logBackupStats() {
        try {
            const backups = this.backup.listBackups();
            logger.info(`📊 Total de backups: ${backups.length}`);
            
            if (backups.length > 0) {
                const latest = backups[0];
                logger.info(`📅 Último backup: ${latest.created.toLocaleString()}`);
                logger.info(`💾 Tamanho: ${latest.size}`);
            }
        } catch (error) {
            logger.warn('⚠️ Erro ao coletar estatísticas:', error.message);
        }
    }

    /**
     * Obter status do serviço
     */
    getStatus() {
        const backups = this.backup.listBackups();
        
        return {
            enabled: this.autoBackupEnabled,
            running: this.isRunning,
            intervalHours: this.backupInterval,
            totalBackups: backups.length,
            lastBackup: this.lastBackupTime || (backups.length > 0 ? backups[0].created : null),
            nextBackup: this.getNextBackupTime()
        };
    }

    /**
     * Calcular próximo horário de backup
     */
    getNextBackupTime() {
        if (!this.isRunning || !this.lastBackupTime) return null;
        
        try {
            const nextBackup = new Date(this.lastBackupTime);
            nextBackup.setHours(nextBackup.getHours() + this.backupInterval);
            return nextBackup;
        } catch (error) {
            return null;
        }
    }

    /**
     * Forçar backup manual
     */
    async forceBackup() {
        try {
            logger.info('🔧 Backup manual solicitado...');
            return await this.performBackup('manual');
        } catch (error) {
            logger.error('❌ Erro no backup manual:', error.message);
            throw error;
        }
    }

    /**
     * Configurar novo agendamento
     */
    reschedule(newIntervalHours) {
        try {
            if (this.intervalId) {
                this.stop();
            }
            
            this.backupInterval = newIntervalHours;
            this.start();
            
            logger.success(`🔄 Backup reagendado para: a cada ${newIntervalHours} horas`);
        } catch (error) {
            logger.error('❌ Erro ao reagendar backup:', error.message);
            throw error;
        }
    }

    /**
     * Limpar backups antigos baseado em critérios
     */
    async cleanupOldBackups(daysToKeep = 30) {
        try {
            const backups = this.backup.listBackups();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const toDelete = backups.filter(backup => backup.created < cutoffDate);
            
            if (toDelete.length === 0) {
                logger.info('📦 Nenhum backup antigo para remover');
                return;
            }
            
            for (const backup of toDelete) {
                try {
                    const fs = await import('fs');
                    if (fs.default.existsSync(backup.path)) {
                        if (fs.default.statSync(backup.path).isDirectory()) {
                            fs.default.rmSync(backup.path, { recursive: true, force: true });
                        } else {
                            fs.default.unlinkSync(backup.path);
                        }
                        logger.info(`🗑️ Backup antigo removido: ${backup.name}`);
                    }
                } catch (deleteError) {
                    logger.warn(`⚠️ Erro ao remover backup ${backup.name}:`, deleteError.message);
                }
            }
            
            logger.success(`✅ Limpeza concluída: ${toDelete.length} backups removidos`);
        } catch (error) {
            logger.error('❌ Erro na limpeza de backups:', error.message);
            throw error;
        }
    }
}

// Singleton instance
let backupServiceInstance = null;

export function getBackupService() {
    if (!backupServiceInstance) {
        backupServiceInstance = new BackupService();
    }
    return backupServiceInstance;
}

export default BackupService;
