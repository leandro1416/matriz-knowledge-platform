import OpenAI from 'openai';
import Block from '../models/Block.js';
import { sha256 } from '../utils/hash.js';
import logger from '../utils/logger.js';
import { getObsidianIntegration } from '../services/ObsidianIntegrationService.js';
import { getBlockChainPersistence } from '../services/BlockChainPersistence.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sistema de persistência da blockchain
const blockchainPersistence = getBlockChainPersistence();

// Configuração de retry com backoff exponencial
const retryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 segundo
    maxDelay: 10000   // 10 segundos
};

async function retryWithBackoff(fn, retryCount = 0) {
    try {
        return await fn();
    } catch (error) {
        if (retryCount >= retryConfig.maxRetries) {
            throw error;
        }

        const delay = Math.min(
            retryConfig.baseDelay * Math.pow(2, retryCount),
            retryConfig.maxDelay
        );

        logger.warn(`Retry attempt ${retryCount + 1}/${retryConfig.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return retryWithBackoff(fn, retryCount + 1);
    }
}

export const askAI = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ msg: 'prompt obrigatório' });

        // Mock user ID se não houver autenticação
        const userId = req.user?._id || 'mock-user-id';

        let answer;
        let aiMode = 'openai';

        // Tentar usar OpenAI primeiro
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
            try {
                const completion = await retryWithBackoff(async () => {
                    return await openai.chat.completions.create({
                        model: process.env.MODEL || 'gpt-4o-mini',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
                        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
                        top_p: parseFloat(process.env.OPENAI_TOP_P) || 1,
                        frequency_penalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY) || 0,
                        presence_penalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY) || 0,
                        stream: false
                    });
                });

                answer = completion.choices[0].message.content.trim();
                logger.success('OpenAI response generated successfully');
            } catch (openaiError) {
                // Log inteligente do erro
                const errorResult = logger.error('Erro na IA', openaiError);
                
                // Se o auto-fix sugerir usar mock AI
                if (errorResult?.autoFixResult?.mode === 'mock_ai') {
                    aiMode = 'mock';
                    answer = generateFallbackResponse(prompt);
                    logger.info('Switched to mock AI mode due to OpenAI error');
                } else {
                    throw openaiError;
                }
            }
        } else {
            // Modo mock por padrão
            aiMode = 'mock';
            answer = generateFallbackResponse(prompt);
            logger.info('Using mock AI mode (no OpenAI API key configured)');
        }

        // 2. Busca o último bloco do usuário usando persistência
        const last = blockchainPersistence.getLastBlock(userId);

        // 3. Gera hash ➜ SHA256(prevHash + prompt + answer + timestamp)
        const now = Date.now();
        const base = (last?.hash || '') + prompt + answer + now;
        const hash = sha256(base);

        // 4. Cria e salva bloco usando persistência
        const newBlock = {
            userId,
            prompt,
            answer,
            prevHash: last?.hash || null,
            hash,
            ts: now,
            aiMode
        };

        // Salvar bloco no sistema de persistência
        await blockchainPersistence.addBlock(userId, newBlock);

        // 5. Salvar resposta no Obsidian automaticamente
        const obsidianService = getObsidianIntegration();
        const obsidianMetadata = {
            aiMode,
            model: process.env.MODEL || 'gpt-4o-mini',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
            prevHash: last?.hash || null
        };
        
        // Executar salvamento automático no Obsidian em background
        obsidianService.saveAIResponse(prompt, answer, hash, obsidianMetadata)
            .then((result) => {
                logger.success(`📝 Resposta da IA salva: ${result.title} (${result.location})`);
                if (result.url) {
                    logger.info(`🔗 Link direto: ${result.url}`);
                }
            })
            .catch((error) => {
                logger.error('❌ Erro ao salvar resposta da IA:', error.message);
            });

        // 6. Devolve resposta com informações do Obsidian
        const obsidianStats = obsidianService.getStats();
        
        res.json({ 
            answer, 
            hash, 
            prevHash: last?.hash || null,
            aiMode,
            tokens: {
                max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
                model: process.env.MODEL || 'gpt-4o-mini',
                temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
            },
            obsidian: {
                enabled: obsidianStats.config.enabled,
                connected: obsidianStats.isConnected,
                mode: obsidianStats.fallbackMode ? 'fallback' : 'direct',
                saving: true,
                queueLength: obsidianStats.syncQueueLength,
                baseUrl: obsidianStats.config.baseUrl
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Log inteligente do erro final
        const errorResult = logger.error('Erro ao processar pergunta', error);
        
        res.status(500).json({ 
            msg: 'Erro ao processar pergunta',
            error: error.message,
            retry: errorResult?.shouldRetry || false
        });
    }
};

// Função para gerar resposta quando IA real não está disponível
function generateFallbackResponse(prompt) {
    return `Serviço de IA não configurado. Para usar este recurso, configure as credenciais da OpenAI ou outra API de IA nas variáveis de ambiente. Prompt recebido: "${prompt}".`;
}

// Endpoint para verificar configurações da IA
export const getAIStatus = async (req, res) => {
    try {
        const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
        
        // Gerar relatório de erros
        const errorReport = logger.generateErrorReport();
        
        res.json({
            status: hasApiKey ? 'connected' : 'mock',
            model: process.env.MODEL || 'gpt-4o-mini',
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
            top_p: parseFloat(process.env.OPENAI_TOP_P) || 1,
            frequency_penalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY) || 0,
            presence_penalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY) || 0,
            rate_limit: {
                window_ms: 15 * 60 * 1000,
                max_requests: 200
            },
            error_stats: errorReport.errorBreakdown,
            recommendations: errorReport.recommendations
        });
    } catch (error) {
        logger.error('Erro ao obter status da IA', error);
        res.status(500).json({ error: error.message });
    }
};

// Endpoint para obter a cadeia de blocos da IA
export const getAIChain = async (req, res) => {
    try {
        const userId = req.user?._id || 'mock-user-id';
        const userBlocks = blockchainPersistence.getUserBlocks(userId);
        
        // Usar estatísticas do sistema de persistência
        const globalStats = blockchainPersistence.getStats();
        const userStats = {
            totalBlocks: userBlocks.length,
            firstBlock: userBlocks[0]?.ts || null,
            lastBlock: userBlocks[userBlocks.length - 1]?.ts || null,
            averageResponseLength: userBlocks.length > 0 
                ? Math.round(userBlocks.reduce((sum, block) => sum + block.answer.length, 0) / userBlocks.length)
                : 0,
            aiModeBreakdown: userBlocks.reduce((acc, block) => {
                acc[block.aiMode] = (acc[block.aiMode] || 0) + 1;
                return acc;
            }, {})
        };

        // Validar integridade da cadeia
        const integrity = blockchainPersistence.validateChain(userId);

        res.json({
            chain: userBlocks,
            stats: userStats,
            globalStats,
            integrity,
            persistence: {
                totalUsers: globalStats.totalUsers,
                totalBlocks: globalStats.totalBlocks,
                lastSaved: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Erro ao obter cadeia da IA', error);
        res.status(500).json({ error: error.message });
    }
};

// Endpoint para buscar no histórico da IA
export const searchAIHistory = async (req, res) => {
    try {
        const { query, limit = 10, offset = 0 } = req.query;
        const userId = req.user?._id || 'mock-user-id';
        const userBlocks = blockchainPersistence.getUserBlocks(userId);
        
        if (!query) {
            return res.status(400).json({ msg: 'Query de busca obrigatória' });
        }

        // Busca simples por texto
        const searchResults = userBlocks
            .filter(block => 
                block.prompt.toLowerCase().includes(query.toLowerCase()) ||
                block.answer.toLowerCase().includes(query.toLowerCase())
            )
            .slice(offset, offset + parseInt(limit))
            .map(block => ({
                hash: block.hash,
                prompt: block.prompt,
                answer: block.answer.substring(0, 200) + (block.answer.length > 200 ? '...' : ''),
                timestamp: block.ts,
                aiMode: block.aiMode
            }));

        res.json({
            results: searchResults,
            total: userBlocks.filter(block => 
                block.prompt.toLowerCase().includes(query.toLowerCase()) ||
                block.answer.toLowerCase().includes(query.toLowerCase())
            ).length,
            query,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        logger.error('Erro ao buscar histórico da IA', error);
        res.status(500).json({ error: error.message });
    }
};

// Endpoint para avaliar resposta da IA
export const rateAIResponse = async (req, res) => {
    try {
        const { hash } = req.params;
        const { rating, feedback } = req.body;
        const userId = req.user?._id || 'mock-user-id';
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating deve ser entre 1 e 5' });
        }

        const userBlocks = blockchainPersistence.getUserBlocks(userId);
        const blockIndex = userBlocks.findIndex(block => block.hash === hash);
        
        if (blockIndex === -1) {
            return res.status(404).json({ msg: 'Bloco não encontrado' });
        }

        // Adicionar rating ao bloco
        userBlocks[blockIndex].rating = {
            score: rating,
            feedback: feedback || '',
            ratedAt: Date.now()
        };

        // Usar sistema de persistência para salvar mudanças
        await blockchainPersistence.forceSave();

        // Calcular estatísticas de rating
        const ratedBlocks = userBlocks.filter(block => block.rating);
        const averageRating = ratedBlocks.length > 0 
            ? ratedBlocks.reduce((sum, block) => sum + block.rating.score, 0) / ratedBlocks.length
            : 0;

        res.json({
            success: true,
            hash,
            rating: {
                score: rating,
                feedback: feedback || '',
                ratedAt: Date.now()
            },
            stats: {
                totalRated: ratedBlocks.length,
                averageRating: Math.round(averageRating * 100) / 100
            }
        });
    } catch (error) {
        logger.error('Erro ao avaliar resposta da IA', error);
        res.status(500).json({ error: error.message });
    }
};

// Endpoint para backup da blockchain
export const backupBlockchain = async (req, res) => {
    try {
        const backupFile = await blockchainPersistence.exportBackup();
        const stats = blockchainPersistence.getStats();
        
        res.json({
            success: true,
            message: 'Backup da blockchain criado com sucesso',
            backupFile,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao criar backup da blockchain', error);
        res.status(500).json({ error: error.message });
    }
};

// Endpoint para forçar salvamento da blockchain
export const forceBlockchainSave = async (req, res) => {
    try {
        await blockchainPersistence.forceSave();
        const stats = blockchainPersistence.getStats();
        
        res.json({
            success: true,
            message: 'Blockchain salva com sucesso',
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Erro ao salvar blockchain', error);
        res.status(500).json({ error: error.message });
    }
}; 