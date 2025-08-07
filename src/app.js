import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import securityMiddleware, { aiLimiter } from './middlewares/security.middleware.js';
import configureSession from './middlewares/session.middleware.js';
import { requestLogger, errorLogger, performanceLogger } from './middlewares/logging.middleware.js';
import apiRoutes from './routes/index.js';
import pagesRoutes from './routes/pages.routes.js';
import databaseService from './services/database.service.js';
import { intelligentErrorHandler, unhandledErrorHandler, cleanupErrorCache } from './middlewares/errorHandler.middleware.js';
import { globalErrorHandler } from './middlewares/asyncHandler.middleware.js';
import { getBackupService } from './services/BackupService.js';
import { getObsidianIntegration } from './services/ObsidianIntegrationService.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware de compressão
app.use(compression());

// Middleware de segurança
app.use(securityMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar sessão
app.use(configureSession());

// Middleware de logging
app.use(requestLogger);
app.use(performanceLogger);

// Arquivos estáticos
app.use(express.static(config.paths.public));

// Comprehensive global error handlers para unhandled rejections
process.removeAllListeners('unhandledRejection');
process.removeAllListeners('uncaughtException');

process.on('unhandledRejection', (reason, promise) => {
    const errorMessage = reason?.message || String(reason);
    const errorName = reason?.constructor?.name || '';
    
    // Comprehensive MongoDB error detection and silencing
    if (errorName.includes('Mongo') || 
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('connect ECONNREFUSED') ||
        errorMessage.includes('localhost:27017') ||
        errorMessage.includes('::1:27017') ||
        errorMessage.includes('127.0.0.1:27017') ||
        errorMessage.includes('MongoServerSelectionError') ||
        errorMessage.includes('MongoNetworkError') ||
        errorMessage.includes('TopologyDescription')) {
        // MongoDB rejections são completamente silenciadas (sistema mock ativo)
        return;
    }
    
    // Log apenas erros não relacionados ao MongoDB
    logger.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    // Não sair do processo em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Application shutdown required');
    }
});

// Conectar ao banco de dados (não bloqueante com melhor error handling)
databaseService.connect()
    .then(() => {
        // Disponibilizar conexão do banco para as rotas
        app.locals.databaseConnection = databaseService;
        
        // Iniciar serviço de backup automático
        const backupService = getBackupService();
        backupService.start();
        app.locals.backupService = backupService;
        
        // Iniciar serviço de sincronização com Obsidian
        const obsidianService = getObsidianIntegration();
        obsidianService.startSyncService();
        app.locals.obsidianService = obsidianService;
        
        logger.success('✅ Sistema inicializado com sucesso');
    })
    .catch((error) => {
        logger.info('⚠️ Sistema iniciado em modo mock (MongoDB não disponível)');
        app.locals.databaseConnection = databaseService;
        
        // Iniciar backup mesmo em modo mock (para desenvolvimento)
        const backupService = getBackupService();
        app.locals.backupService = backupService;
        
        // Iniciar serviço de sincronização com Obsidian mesmo em modo mock
        const obsidianService = getObsidianIntegration();
        app.locals.obsidianService = obsidianService;
    });

// Rate limiting específico para IA
app.use('/api/ai/', aiLimiter);

// Rotas da API
app.use('/api', apiRoutes);

// Rotas das páginas
app.use('/', pagesRoutes);

// Inicializar tratamento inteligente de erros
unhandledErrorHandler();
cleanupErrorCache();

// Middleware de tratamento inteligente de erros
app.use(intelligentErrorHandler);

// Middleware global de tratamento de erros (AppError)
app.use(globalErrorHandler);

// Middleware de logging de erros
app.use(errorLogger);

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

export default app; 