/**
 * Middleware para sincronização automática com Obsidian
 * Captura mudanças nos modelos e dispara sincronização em tempo real
 */

import { getObsidianIntegration } from '../services/ObsidianIntegrationService.js';
import logger from '../utils/logger.js';

/**
 * Middleware para interceptar criação e atualização de notas estratégicas
 */
export const syncStrategicNoteMiddleware = async (req, res, next) => {
    // Interceptar resposta para capturar dados salvos
    const originalSend = res.send;
  
    res.send = function(data) {
    // Se a operação foi bem-sucedida e há dados
        if (res.statusCode >= 200 && res.statusCode < 300 && data) {
            try {
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
                // Verificar se contém dados de nota estratégica
                if (parsedData.success && parsedData.data && parsedData.data.title) {
                    const operation = req.method === 'POST' ? 'create' : 'update';
          
                    // Sincronizar diretamente com Obsidian
                    const obsidianService = getObsidianIntegration();
                    obsidianService.syncStrategicNote(parsedData.data, operation)
                        .then(() => {
                            logger.debug(`✅ Nota estratégica sincronizada: ${parsedData.data.title}`);
                        })
                        .catch((error) => {
                            logger.error('❌ Erro ao sincronizar nota estratégica:', error.message);
                        });
          
                    logger.info(`📋 Nota estratégica marcada para sincronização: ${parsedData.data.title}`);
                }
            } catch (error) {
                logger.error('Erro ao processar dados para sincronização com Obsidian:', error);
            }
        }
    
        // Chamar o método original
        originalSend.call(this, data);
    };
  
    next();
};

/**
 * Middleware para interceptar criação e atualização de posts do blog
 */
export const syncBlogPostMiddleware = async (req, res, next) => {
    // Interceptar resposta para capturar dados salvos
    const originalSend = res.send;
  
    res.send = function(data) {
    // Se a operação foi bem-sucedida e há dados
        if (res.statusCode >= 200 && res.statusCode < 300 && data) {
            try {
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
                // Verificar se contém dados de post do blog
                if (parsedData.success && parsedData.data && parsedData.data.title) {
                    const operation = req.method === 'POST' ? 'create' : 'update';
          
                    // Sincronizar diretamente com Obsidian
                    const obsidianService = getObsidianIntegration();
                    obsidianService.syncBlogPost(parsedData.data, operation)
                        .then(() => {
                            logger.debug(`✅ Post do blog sincronizado: ${parsedData.data.title}`);
                        })
                        .catch((error) => {
                            logger.error('❌ Erro ao sincronizar post do blog:', error.message);
                        });
          
                    logger.info(`📝 Post do blog marcado para sincronização: ${parsedData.data.title}`);
                }
            } catch (error) {
                logger.error('Erro ao processar dados para sincronização com Obsidian:', error);
            }
        }
    
        // Chamar o método original
        originalSend.call(this, data);
    };
  
    next();
};

/**
 * Middleware para interceptar criação e atualização de blocos de nota
 */
export const syncBlockMiddleware = async (req, res, next) => {
    // Interceptar resposta para capturar dados salvos
    const originalSend = res.send;
  
    res.send = function(data) {
    // Se a operação foi bem-sucedida e há dados
        if (res.statusCode >= 200 && res.statusCode < 300 && data) {
            try {
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
                // Verificar se contém dados de bloco
                if (parsedData.success && parsedData.data && parsedData.data.hash) {
                    const operation = req.method === 'POST' ? 'create' : 'update';
          
                    // Sincronizar diretamente com Obsidian
                    const obsidianService = getObsidianIntegration();
                    obsidianService.syncBlock(parsedData.data, operation)
                        .then(() => {
                            logger.debug(`✅ Bloco sincronizado: ${parsedData.data.hash}`);
                        })
                        .catch((error) => {
                            logger.error('❌ Erro ao sincronizar bloco:', error.message);
                        });
          
                    logger.info(`🧱 Bloco de nota marcado para sincronização: ${parsedData.data.hash}`);
                }
            } catch (error) {
                logger.error('Erro ao processar dados de bloco para sincronização com Obsidian:', error);
            }
        }
    
        // Chamar o método original
        originalSend.call(this, data);
    };
  
    next();
};

/**
 * Middleware para interceptar deleção de documentos
 */
export const syncDeleteMiddleware = (type) => {
    return async (req, res, next) => {
    // Capturar dados antes da deleção
        const originalSend = res.send;
        const documentId = req.params.id;
    
        // Buscar documento antes da deleção
        let documentData = null;
        try {
            if (type === 'strategic-note') {
                const StrategicNote = await import('../models/StrategicNote.js');
                documentData = await StrategicNote.default.findById(documentId);
            } else if (type === 'blog-post') {
                const Post = await import('../models/Post.js');
                documentData = await Post.default.findById(documentId);
            } else if (type === 'block') {
                const Block = await import('../models/Block.js');
                documentData = await Block.default.findById(documentId);
            }
        } catch (error) {
            logger.error(`Erro ao buscar documento para deleção: ${error.message}`);
        }
    
        res.send = function(data) {
            // Se a deleção foi bem-sucedida
            if (res.statusCode >= 200 && res.statusCode < 300 && documentData) {
                try {
                    // Sincronizar deleção com Obsidian
                    const obsidianService = getObsidianIntegration();
          
                    if (type === 'strategic-note') {
                        obsidianService.syncStrategicNote(documentData, 'delete');
                    } else if (type === 'blog-post') {
                        obsidianService.syncBlogPost(documentData, 'delete');
                    } else if (type === 'block') {
                        obsidianService.syncBlock(documentData, 'delete');
                    }
          
                    const displayName = documentData.title || documentData.hash || documentData._id;
                    logger.info(`🗑️ Documento marcado para deleção no Obsidian: ${displayName}`);
                } catch (error) {
                    logger.error('Erro ao processar deleção para sincronização com Obsidian:', error);
                }
            }
      
            // Chamar o método original
            originalSend.call(this, data);
        };
    
        next();
    };
};

/**
 * Middleware para webhook do Obsidian (sincronização bidirecional)
 */
export const obsidianWebhookMiddleware = async (req, res, next) => {
    try {
        const { event, file, content } = req.body;
    
        logger.info(`📥 Webhook do Obsidian recebido: ${event} - ${file}`);
    
        // Processar diferentes tipos de eventos
        switch (event) {
        case 'file.created':
        case 'file.updated':
            await handleObsidianFileChange(file, content, event);
            break;
        case 'file.deleted':
            await handleObsidianFileDelete(file);
            break;
        default:
            logger.warn(`Evento não suportado: ${event}`);
        }
    
        res.json({ success: true, message: 'Webhook processado' });
    } catch (error) {
        logger.error('Erro ao processar webhook do Obsidian:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Processa mudanças em arquivos do Obsidian
 */
async function handleObsidianFileChange(filePath, content, event) {
    try {
    // Extrair metadados do frontmatter
        const { extractFrontmatter } = await import('../utils/helpers.js');
        const { metadata, content: markdownContent } = extractFrontmatter(content);
    
        // Verificar se é um arquivo gerenciado pelo sistema
        if (!metadata.database_id || !metadata.type) {
            logger.debug(`Arquivo não gerenciado pelo sistema: ${filePath}`);
            return;
        }
    
        // Processar baseado no tipo
        if (metadata.type === 'strategic-note') {
            await updateStrategicNoteFromObsidian(metadata.database_id, markdownContent, metadata);
        } else if (metadata.type === 'blog-post') {
            await updateBlogPostFromObsidian(metadata.database_id, markdownContent, metadata);
        }
    
        logger.success(`✅ Documento atualizado do Obsidian: ${metadata.title}`);
    } catch (error) {
        logger.error(`Erro ao processar mudança do Obsidian: ${error.message}`);
    }
}

/**
 * Processa deleção de arquivos do Obsidian
 */
async function handleObsidianFileDelete(filePath) {
    try {
    // Tentar identificar o documento baseado no caminho do arquivo
    // Isso requer uma estratégia de mapeamento ou metadados adicionais
        logger.info(`Arquivo deletado no Obsidian: ${filePath}`);
    
    // Por enquanto, apenas registrar o evento
    // Implementação futura pode incluir lógica para encontrar e deletar o documento correspondente
    } catch (error) {
        logger.error(`Erro ao processar deleção do Obsidian: ${error.message}`);
    }
}

/**
 * Atualiza nota estratégica baseada em mudanças do Obsidian
 */
async function updateStrategicNoteFromObsidian(id, content, metadata) {
    try {
        const StrategicNote = await import('../models/StrategicNote.js');
    
        const updateData = {
            title: metadata.title,
            content,
            status: metadata.status,
            targetAudience: metadata.target_audience,
            location: metadata.location,
            tags: metadata.tags || [],
            updatedAt: new Date()
        };
    
        await StrategicNote.default.findByIdAndUpdate(id, updateData, { new: true });
        logger.info(`Nota estratégica atualizada do Obsidian: ${metadata.title}`);
    } catch (error) {
        logger.error(`Erro ao atualizar nota estratégica: ${error.message}`);
    }
}

/**
 * Atualiza post do blog baseado em mudanças do Obsidian
 */
async function updateBlogPostFromObsidian(id, content, metadata) {
    try {
        const Post = await import('../models/Post.js');
    
        const updateData = {
            title: metadata.title,
            content,
            published: metadata.published,
            tags: metadata.tags || [],
            updatedAt: new Date()
        };
    
        await Post.default.findByIdAndUpdate(id, updateData, { new: true });
        logger.info(`Post do blog atualizado do Obsidian: ${metadata.title}`);
    } catch (error) {
        logger.error(`Erro ao atualizar post do blog: ${error.message}`);
    }
}

/**
 * Middleware genérico para status de sincronização
 */
export const syncStatusMiddleware = async (req, res, next) => {
    // Adicionar informações de status da sincronização à resposta
    const originalJson = res.json;
  
    res.json = function(data) {
        try {
            const obsidianService = getObsidianIntegration();
            const syncStats = obsidianService.getStats();
      
            // Adicionar informações de sincronização se for uma resposta de sucesso
            if (data && typeof data === 'object' && data.success) {
                data.syncStatus = {
                    obsidianConnected: syncStats.isConnected,
                    queueLength: syncStats.syncQueueLength,
                    isSyncing: syncStats.isSyncing
                };
            }
        } catch (error) {
            logger.error('Erro ao adicionar status de sincronização:', error);
        }
    
        // Chamar o método original
        originalJson.call(this, data);
    };
  
    next();
};

export default {
    syncStrategicNoteMiddleware,
    syncBlogPostMiddleware,
    syncBlockMiddleware,
    syncDeleteMiddleware,
    obsidianWebhookMiddleware,
    syncStatusMiddleware
};
