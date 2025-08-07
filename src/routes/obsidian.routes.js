/**
 * Rotas da API para integração com Obsidian
 * Permite controle manual da sincronização e configuração
 */

import express from 'express';
import { getObsidianIntegration } from '../services/ObsidianIntegrationService.js';
import { obsidianWebhookMiddleware } from '../middlewares/obsidianSync.middleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/obsidian/status
 * Obtém o status da conexão e sincronização com Obsidian
 */
router.get('/status', async (req, res) => {
    try {
        const obsidianService = getObsidianIntegration();
        const stats = obsidianService.getStats();
    
        // Testar conexão atual
        const connectionTest = await obsidianService.testConnection();
    
        res.json({
            success: true,
            message: 'Status do Obsidian obtido',
            data: {
                ...stats,
                connectionTest,
                lastConnectionTest: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao obter status do Obsidian:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/test-connection
 * Testa a conexão com o Obsidian
 */
router.post('/test-connection', async (req, res) => {
    try {
        const obsidianService = getObsidianIntegration();
        const isConnected = await obsidianService.testConnection();
    
        res.json({
            success: true,
            message: isConnected ? 'Conexão com Obsidian estabelecida' : 'Falha na conexão com Obsidian',
            data: {
                connected: isConnected,
                timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao testar conexão com Obsidian:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao testar conexão',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/sync/strategic-note/:id
 * Sincroniza uma nota estratégica específica com o Obsidian
 */
router.post('/sync/strategic-note/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { operation = 'update' } = req.body;
    
        // Buscar a nota estratégica
        const StrategicNote = await import('../models/StrategicNote.js');
        const note = await StrategicNote.default.findById(id);
    
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Nota estratégica não encontrada',
                timestamp: new Date().toISOString()
            });
        }
    
        // Sincronizar com Obsidian
        const obsidianService = getObsidianIntegration();
        const result = await obsidianService.syncStrategicNote(note, operation);
    
        res.json({
            success: true,
            message: `Nota estratégica ${operation === 'delete' ? 'deletada' : 'sincronizada'} com sucesso`,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao sincronizar nota estratégica:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao sincronizar nota estratégica',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/sync/blog-post/:id
 * Sincroniza um post do blog específico com o Obsidian
 */
router.post('/sync/blog-post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { operation = 'update' } = req.body;
    
        // Buscar o post do blog
        const Post = await import('../models/Post.js');
        const post = await Post.default.findById(id);
    
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post do blog não encontrado',
                timestamp: new Date().toISOString()
            });
        }
    
        // Sincronizar com Obsidian
        const obsidianService = getObsidianIntegration();
        const result = await obsidianService.syncBlogPost(post, operation);
    
        res.json({
            success: true,
            message: `Post do blog ${operation === 'delete' ? 'deletado' : 'sincronizado'} com sucesso`,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao sincronizar post do blog:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao sincronizar post do blog',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/sync/block/:id
 * Sincroniza um bloco específico com o Obsidian
 */
router.post('/sync/block/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { operation = 'update' } = req.body;
    
        // Buscar o bloco
        const Block = await import('../models/Block.js');
        const block = await Block.default.findById(id);
    
        if (!block) {
            return res.status(404).json({
                success: false,
                message: 'Bloco não encontrado',
                timestamp: new Date().toISOString()
            });
        }
    
        // Sincronizar com Obsidian
        const obsidianService = getObsidianIntegration();
        const result = await obsidianService.syncBlock(block, operation);
    
        res.json({
            success: true,
            message: `Bloco ${operation === 'delete' ? 'deletado' : 'sincronizado'} com sucesso`,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao sincronizar bloco:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao sincronizar bloco',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/sync/all
 * Sincroniza todos os documentos com o Obsidian
 */
router.post('/sync/all', async (req, res) => {
    try {
        const { force = false } = req.body;
        const obsidianService = getObsidianIntegration();
        const results = [];
    
        // Sincronizar todas as notas estratégicas
        const StrategicNote = await import('../models/StrategicNote.js');
        const strategicNotes = await StrategicNote.default.find({});
    
        for (const note of strategicNotes) {
            try {
                const result = await obsidianService.syncStrategicNote(note, 'update');
                results.push({
                    type: 'strategic-note',
                    id: note._id,
                    title: note.title,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    type: 'strategic-note',
                    id: note._id,
                    title: note.title,
                    success: false,
                    error: error.message
                });
            }
        }
    
        // Sincronizar todos os posts do blog
        const Post = await import('../models/Post.js');
        const posts = await Post.default.find({});
    
        for (const post of posts) {
            try {
                const result = await obsidianService.syncBlogPost(post, 'update');
                results.push({
                    type: 'blog-post',
                    id: post._id,
                    title: post.title,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    type: 'blog-post',
                    id: post._id,
                    title: post.title,
                    success: false,
                    error: error.message
                });
            }
        }
    
        // Sincronizar todos os blocos
        const Block = await import('../models/Block.js');
        const blocks = await Block.default.find({});
    
        for (const block of blocks) {
            try {
                const result = await obsidianService.syncBlock(block, 'update');
                results.push({
                    type: 'block',
                    id: block._id,
                    hash: block.hash,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    type: 'block',
                    id: block._id,
                    hash: block.hash,
                    success: false,
                    error: error.message
                });
            }
        }
    
        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;
    
        res.json({
            success: true,
            message: `Sincronização completa: ${successCount} sucessos, ${errorCount} erros`,
            data: {
                summary: {
                    total: results.length,
                    success: successCount,
                    errors: errorCount
                },
                results
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro na sincronização completa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na sincronização completa',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/obsidian/queue
 * Obtém informações sobre a fila de sincronização
 */
router.get('/queue', async (req, res) => {
    try {
        const obsidianService = getObsidianIntegration();
        const stats = obsidianService.getStats();
    
        res.json({
            success: true,
            message: 'Informações da fila obtidas',
            data: {
                queueLength: stats.syncQueueLength,
                isSyncing: stats.isSyncing,
                config: stats.config
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao obter informações da fila:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/queue/process
 * Força o processamento da fila de sincronização
 */
router.post('/queue/process', async (req, res) => {
    try {
        const obsidianService = getObsidianIntegration();
    
        // Verificar se já está processando
        const stats = obsidianService.getStats();
        if (stats.isSyncing) {
            return res.json({
                success: false,
                message: 'Sincronização já está em andamento',
                data: { isSyncing: true },
                timestamp: new Date().toISOString()
            });
        }
    
        // Processar fila
        await obsidianService.processSyncQueue();
    
        res.json({
            success: true,
            message: 'Fila de sincronização processada',
            data: { processed: true },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao processar fila de sincronização:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar fila',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/obsidian/files
 * Lista arquivos no vault do Obsidian
 */
router.get('/files', async (req, res) => {
    try {
        const { directory = '' } = req.query;
        const obsidianService = getObsidianIntegration();
    
        const files = await obsidianService.listFiles(directory);
    
        res.json({
            success: true,
            message: 'Arquivos listados com sucesso',
            data: {
                directory: directory || 'root',
                files
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao listar arquivos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar arquivos',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/obsidian/search
 * Busca arquivos no vault do Obsidian
 */
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
    
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro query é obrigatório',
                timestamp: new Date().toISOString()
            });
        }
    
        const obsidianService = getObsidianIntegration();
        const results = await obsidianService.searchFiles(query);
    
        res.json({
            success: true,
            message: 'Busca realizada com sucesso',
            data: {
                query,
                results
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro na busca:', error);
        res.status(500).json({
            success: false,
            message: 'Erro na busca',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/webhook
 * Webhook para receber atualizações do Obsidian (sincronização bidirecional)
 */
router.post('/webhook', obsidianWebhookMiddleware);

/**
 * POST /api/obsidian/service/start
 * Inicia o serviço de sincronização automática
 */
router.post('/service/start', async (req, res) => {
    try {
        const obsidianService = getObsidianIntegration();
        obsidianService.startSyncService();
    
        res.json({
            success: true,
            message: 'Serviço de sincronização iniciado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao iniciar serviço:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao iniciar serviço',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/obsidian/service/stop
 * Para o serviço de sincronização automática
 */
router.post('/service/stop', async (req, res) => {
    try {
        const obsidianService = getObsidianIntegration();
        obsidianService.stopSyncService();
    
        res.json({
            success: true,
            message: 'Serviço de sincronização parado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao parar serviço:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao parar serviço',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
