/**
 * Serviço de Integração Completa com Obsidian
 * Sistema automatizado para salvamento de respostas da IA e sincronização
 */

import axios from 'axios';
import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { obsidianConfig } from '../config/obsidian.js';
import logger from '../utils/logger.js';
import { formatDate, generateUniqueId } from '../utils/helpers.js';

class ObsidianIntegrationService {
    constructor() {
        this.config = obsidianConfig;
        this.isConnected = false;
        this.syncQueue = [];
        this.isSyncing = false;
        this.retryCount = new Map();
        this.fallbackMode = false;
        this.localSyncPath = path.join(process.cwd(), 'obsidian-sync');
    
        this.setupHttpClient();
        this.initializeFallbackMode();
    }

    /**
   * Configura o cliente HTTP para comunicação com a API do Obsidian
   */
    setupHttpClient() {
    // Validar configuração essencial
        if (!this.config.apiKey) {
            logger.warn('🔑 API Key do Obsidian não configurada - ativando modo fallback');
            this.fallbackMode = true;
            return;
        }

        logger.info(`🔧 Configurando cliente Obsidian: ${this.config.baseUrl}`);

        this.httpClient = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            // Para HTTPS self-signed
            httpsAgent: this.config.security?.verifySSL === false ? new https.Agent({
                rejectUnauthorized: false
            }) : undefined
        });

        // Interceptors para logging detalhado
        this.httpClient.interceptors.request.use(
            (config) => {
                logger.debug(`🔍 Obsidian Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('❌ Erro na requisição Obsidian:', error.message);
                return Promise.reject(error);
            }
        );

        this.httpClient.interceptors.response.use(
            (response) => {
                logger.debug(`✅ Obsidian Response: ${response.status} ${response.config.url}`);
                return response;
            },
            async (error) => {
                // Log menos verboso para erros frequentes de conexão
                if (this.isConnectionError(error)) {
                    if (!this.fallbackMode) {
                        logger.warn('🔄 Ativando modo fallback devido a erro de conexão');
                    }
                    this.fallbackMode = true;
                    this.isConnected = false;
                } else {
                    logger.error('❌ Erro na resposta da Obsidian API:', error.message);
                }
        
                return Promise.reject(error);
            }
        );
    }

    /**
   * Verifica se é um erro de conexão
   */
    isConnectionError(error) {
        return error.code === 'ECONNREFUSED' || 
           error.code === 'ENOTFOUND' || 
           error.code === 'ETIMEDOUT' ||
           error.message.includes('connect ECONNREFUSED');
    }

    /**
   * Inicializa modo fallback (salvamento local)
   */
    async initializeFallbackMode() {
        try {
            await fs.mkdir(this.localSyncPath, { recursive: true });
            await fs.mkdir(path.join(this.localSyncPath, 'AI Responses'), { recursive: true });
            await fs.mkdir(path.join(this.localSyncPath, 'Strategic Notes'), { recursive: true });
            await fs.mkdir(path.join(this.localSyncPath, 'Blog Posts'), { recursive: true });
            await fs.mkdir(path.join(this.localSyncPath, 'Blocks'), { recursive: true });
      
            logger.info(`📁 Diretório de fallback pronto: ${this.localSyncPath}`);
        } catch (error) {
            logger.error('❌ Erro ao criar diretórios de fallback:', error);
        }
    }

    /**
   * Testa a conexão com o Obsidian com retry otimizado
   */
    async testConnection() {
        if (!this.httpClient) {
            if (!this.fallbackMode) {
                logger.warn('📁 Cliente HTTP não configurado - modo fallback ativo');
            }
            return false;
        }

        try {
            // Log menos verboso para testes frequentes
            logger.debug('🔍 Testando conexão com Obsidian...');
            const response = await this.httpClient.get('/');
      
            if (response.status === 200) {
                const wasInFallback = this.fallbackMode;
                this.isConnected = true;
                this.fallbackMode = false;
        
                // Log apenas quando reconectar após falha
                if (wasInFallback) {
                    logger.success('✅ Obsidian reconectado com sucesso!');
                    logger.info(`📊 Versão: ${response.data?.versions?.self || 'N/A'}`);
                }
                return true;
            }
        } catch (error) {
            this.isConnected = false;
      
            // Log menos verboso para erros frequentes
            if (!this.fallbackMode) {
                logger.warn(`⚠️ Obsidian não disponível (${error.message}) - usando modo fallback`);
                this.fallbackMode = true;
            }
        }
    
        return false;
    }

    /**
   * Cria diretório no Obsidian se não existir
   */
    async ensureDirectory(dirPath) {
        try {
            // Tenta acessar o diretório
            await this.httpClient.get(`/vault/${encodeURIComponent(dirPath)}/`);
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                logger.info(`📁 Criando diretório: ${dirPath}`);
                // O diretório será criado automaticamente quando criarmos o primeiro arquivo
                return true;
            }
            throw error;
        }
    }

    /**
   * Salva resposta da IA automaticamente no Obsidian
   */
    async saveAIResponse(prompt, answer, hash, metadata = {}) {
        try {
            logger.info(`🤖 Salvando resposta da IA: ${hash.substring(0, 8)}`);
      
            // Gerar título inteligente
            const title = this.generateSmartTitle(prompt);
            const fileName = this.generateFileName(title, 'ai-response');
            const filePath = `AI Responses/${fileName}`;
      
            // Gerar conteúdo markdown estruturado
            const markdown = this.generateAIResponseMarkdown(prompt, answer, hash, metadata, title);

            // Tentar salvar no Obsidian ou fallback local
            if (this.fallbackMode || !this.isConnected) {
                await this.testConnection();
            }

            if (!this.fallbackMode && this.isConnected) {
                await this.saveToObsidian(filePath, markdown);
                logger.success(`✅ Resposta da IA salva no Obsidian: ${title}`);
                return { 
                    success: true, 
                    location: 'obsidian', 
                    filePath, 
                    title,
                    url: `obsidian://vault/${encodeURIComponent(filePath)}`
                };
            } else {
                await this.saveToLocal(filePath, markdown);
                logger.success(`📁 Resposta da IA salva localmente: ${title}`);
                this.addToSyncQueue({ type: 'ai-response', filePath, markdown });
                return { 
                    success: true, 
                    location: 'local', 
                    filePath, 
                    title,
                    localPath: path.join(this.localSyncPath, filePath)
                };
            }
        } catch (error) {
            logger.error('❌ Erro ao salvar resposta da IA:', error);
            throw error;
        }
    }

    /**
   * Salva arquivo diretamente no Obsidian
   */
    async saveToObsidian(filePath, content) {
        try {
            // Garantir que o diretório existe
            const dirPath = path.dirname(filePath);
            await this.ensureDirectory(dirPath);

            // Criar o arquivo usando a API correta
            const response = await this.httpClient.put(
                `/vault/${encodeURIComponent(filePath)}`, 
                content,
                {
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                }
            );

            logger.debug(`📝 Arquivo salvo no Obsidian: ${filePath}`);
            return response.data;
        } catch (error) {
            logger.error(`❌ Erro ao salvar no Obsidian ${filePath}:`, error.message);
      
            // Se falhar, ativar fallback
            this.fallbackMode = true;
            this.isConnected = false;
            throw error;
        }
    }

    /**
   * Salva arquivo localmente como fallback
   */
    async saveToLocal(filePath, content) {
        try {
            const localPath = path.join(this.localSyncPath, filePath);
            const localDir = path.dirname(localPath);
      
            await fs.mkdir(localDir, { recursive: true });
            await fs.writeFile(localPath, content, 'utf8');
      
            logger.debug(`📁 Arquivo salvo localmente: ${localPath}`);
            return { localPath, saved: true };
        } catch (error) {
            logger.error(`❌ Erro ao salvar arquivo localmente ${filePath}:`, error);
            throw error;
        }
    }

    /**
   * Gera título inteligente baseado no prompt
   */
    generateSmartTitle(prompt) {
    // Limpar e processar o prompt
        let title = prompt.trim();
    
        // Remover caracteres especiais e normalizar
        title = title.replace(/[^\w\s-.]/g, ' ').replace(/\s+/g, ' ').trim();
    
        // Se for muito longo, pegar as primeiras palavras importantes
        if (title.length > 60) {
            const words = title.split(' ');
            let shortTitle = '';
      
            for (const word of words) {
                if (shortTitle.length + word.length + 1 <= 60) {
                    shortTitle += (shortTitle ? ' ' : '') + word;
                } else {
                    break;
                }
            }
      
            title = shortTitle;
        }
    
        // Se ainda ficou muito curto ou vazio, usar padrão
        if (title.length < 5) {
            const now = new Date();
            title = `AI Response ${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}h${now.getMinutes().toString().padStart(2, '0')}`;
        }
    
        return title;
    }

    /**
   * Gera nome de arquivo único e seguro
   */
    generateFileName(title, type) {
    // Sanitizar título
        const sanitized = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    
        const date = new Date();
        const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const uniqueId = generateUniqueId(6);
    
        return `${timestamp}-${sanitized}-${uniqueId}.md`;
    }

    /**
   * Gera conteúdo markdown estruturado para resposta da IA
   */
    generateAIResponseMarkdown(prompt, answer, hash, metadata = {}, title = '') {
        const now = new Date();
        const timestamp = formatDate(now);
    
        // Frontmatter YAML estruturado
        const frontmatter = `---
type: ai-response
title: "${title}"
created: ${now.toISOString()}
updated: ${now.toISOString()}
hash: ${hash}
prompt_length: ${prompt.length}
answer_length: ${answer.length}
ai_model: ${metadata.model || 'gpt-4o-mini'}
ai_mode: ${metadata.aiMode || 'openai'}
temperature: ${metadata.temperature || 0.7}
max_tokens: ${metadata.maxTokens || 4000}
tags:
  - ai-response
  - matriz-ai
  - ${metadata.aiMode || 'openai'}
  - auto-generated
status: published
sync_status: ${this.fallbackMode ? 'local' : 'synced'}
---`;

        // Construir markdown estruturado
        let markdown = `${frontmatter}\n\n`;
    
        // Título principal
        markdown += `# ${title}\n\n`;
    
        // Badge de status
        const statusBadge = this.fallbackMode ? '📁 Salvo Localmente' : '☁️ Sincronizado';
        markdown += `> **Status:** ${statusBadge} | **Data:** ${timestamp} | **Hash:** \`${hash.substring(0, 8)}\`\n\n`;
    
        // Informações da IA
        markdown += '## 🤖 Configuração da IA\n\n';
        markdown += '| Parâmetro | Valor |\n';
        markdown += '|-----------|-------|\n';
        markdown += `| **Modelo** | ${metadata.model || 'gpt-4o-mini'} |\n`;
        markdown += `| **Modo** | ${metadata.aiMode || 'openai'} |\n`;
        markdown += `| **Temperatura** | ${metadata.temperature || 0.7} |\n`;
        markdown += `| **Max Tokens** | ${metadata.maxTokens || 4000} |\n`;
        markdown += `| **Tamanho Prompt** | ${prompt.length} caracteres |\n`;
        markdown += `| **Tamanho Resposta** | ${answer.length} caracteres |\n\n`;

        // Prompt original
        markdown += '## ❓ Pergunta\n\n';
        markdown += `\`\`\`\n${prompt}\n\`\`\`\n\n`;

        // Resposta da IA
        markdown += '## 💬 Resposta\n\n';
        markdown += `${answer}\n\n`;

        // Seções adicionais
        markdown += '## 📝 Notas e Observações\n\n';
        markdown += '<!-- Adicione suas anotações sobre esta resposta aqui -->\n\n';
    
        markdown += '## 🔗 Links e Referências\n\n';
        markdown += '- [[AI Responses]] - Índice de todas as respostas\n';
        markdown += `- [[${hash.substring(0, 8)}]] - Hash único desta interação\n`;
    
        // Se há contexto de cadeia de blocos
        if (metadata.prevHash) {
            markdown += `- [[${metadata.prevHash.substring(0, 8)}]] - Resposta anterior na cadeia\n`;
        }
    
        markdown += '\n## 🏷️ Tags\n\n';
        markdown += `#ai-response #matriz-ai #${metadata.aiMode || 'openai'} #auto-generated\n\n`;

        // Footer com metadados
        markdown += '---\n\n';
        markdown += '**Criado automaticamente pela Plataforma Matriz**\n';
        markdown += `*Hash completo: \`${hash}\`*\n`;
        markdown += `*Timestamp: ${now.toISOString()}*\n`;
    
        if (this.fallbackMode) {
            markdown += '*⚠️ Salvo localmente - será sincronizado quando Obsidian estiver disponível*\n';
        }

        return markdown;
    }

    /**
   * Adiciona item à fila de sincronização
   */
    addToSyncQueue(item) {
        this.syncQueue.push({
            ...item,
            timestamp: new Date(),
            retries: 0
        });
    
        logger.debug(`📋 Item adicionado à fila de sincronização: ${item.filePath}`);
    
        // Tentar processar imediatamente se possível
        if (this.config.sync.realTime && !this.isSyncing) {
            this.processSyncQueue();
        }
    }

    /**
   * Processa fila de sincronização
   */
    async processSyncQueue() {
        if (this.isSyncing || this.syncQueue.length === 0) {
            return;
        }

        // Se estiver em modo fallback, tentar reconectar primeiro
        if (this.fallbackMode) {
            const connected = await this.testConnection();
            if (!connected) {
                logger.debug('📁 Obsidian ainda indisponível - mantendo fila');
                return;
            }
        }

        this.isSyncing = true;
        logger.info(`🔄 Processando fila de sincronização: ${this.syncQueue.length} itens`);

        const processedItems = [];
    
        while (this.syncQueue.length > 0 && processedItems.length < this.config.sync.batchSize) {
            const item = this.syncQueue.shift();
      
            try {
                if (item.type === 'ai-response') {
                    await this.saveToObsidian(item.filePath, item.markdown);
                    processedItems.push(item);
                    logger.success(`✅ Sincronizado: ${item.filePath}`);
                } else if (item.type === 'strategic-note' || item.type === 'blog-post' || item.type === 'block') {
                    await this.saveToObsidian(item.filePath, item.markdown);
                    processedItems.push(item);
                    logger.success(`✅ Sincronizado: ${item.filePath}`);
                } else if (item.type === 'delete') {
                    // Para deleções, seria necessário implementar o método deleteFile
                    logger.warn(`⚠️ Deleção não implementada para: ${item.filePath}`);
                }
            } catch (error) {
                logger.error(`❌ Erro ao sincronizar ${item.filePath}:`, error.message);
        
                // Recolocar na fila se não excedeu tentativas
                if (item.retries < this.config.retryAttempts) {
                    item.retries++;
                    this.syncQueue.push(item);
                } else {
                    logger.error(`❌ Item descartado após ${this.config.retryAttempts} tentativas: ${item.filePath}`);
                }
            }
        }

        this.isSyncing = false;
    
        if (processedItems.length > 0) {
            logger.success(`✅ Fila processada: ${processedItems.length} itens sincronizados`);
        }
    }

    /**
   * Inicia serviço de sincronização automática
   */
    startSyncService() {
        logger.info('🔄 Iniciando serviço de sincronização automática com Obsidian');
    
        // Teste inicial de conexão
        this.testConnection();
    
        if (!this.config.sync.enabled) {
            logger.info('⚠️ Sincronização automática desabilitada na configuração');
            return;
        }
    
        // Sincronização periódica
        this.syncInterval = setInterval(async () => {
            try {
                // Tentar reconectar se estiver em modo fallback (menos verboso)
                if (this.fallbackMode && this.syncQueue.length > 0) {
                    logger.debug(`🔄 Tentando reconectar para processar fila... ${this.syncQueue.length}`);
                    await this.testConnection();
                }
        
                // Processar fila se houver itens
                if (this.syncQueue.length > 0) {
                    await this.processSyncQueue();
                }
            } catch (error) {
                logger.error('❌ Erro no ciclo de sincronização:', error.message);
            }
        }, this.config.sync.syncInterval);
    
        logger.success('✅ Serviço de sincronização iniciado');
    }

    /**
   * Para o serviço de sincronização
   */
    stopSyncService() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            logger.info('🛑 Serviço de sincronização parado');
        }
    }

    /**
   * Obtém estatísticas do serviço
   */
    getStats() {
        return {
            isConnected: this.isConnected,
            fallbackMode: this.fallbackMode,
            syncQueueLength: this.syncQueue.length,
            isSyncing: this.isSyncing,
            localSyncPath: this.localSyncPath,
            config: {
                enabled: this.config.sync.enabled,
                realTime: this.config.sync.realTime,
                batchSize: this.config.sync.batchSize,
                syncInterval: this.config.sync.syncInterval,
                baseUrl: this.config.baseUrl
            }
        };
    }

    /**
   * Força uma tentativa de sincronização
   */
    async forcSync() {
        logger.info('🔄 Forçando sincronização...');
    
        // Testar conexão
        await this.testConnection();
    
        // Processar fila
        await this.processSyncQueue();
    
        return this.getStats();
    }

    /**
   * Sincroniza uma nota estratégica com o Obsidian
   */
    async syncStrategicNote(note, operation = 'create') {
        try {
            logger.info(`📋 Sincronizando nota estratégica: ${note.title}`);
      
            const fileName = this.generateFileName(note.title, 'strategic-note');
            const filePath = `Strategic Notes/${fileName}`;
            const markdown = this.generateStrategicNoteMarkdown(note);

            if (operation === 'delete') {
                // Para deleção, apenas adicionar à fila
                this.addToSyncQueue({ type: 'delete', filePath });
                return { success: true, filePath, operation };
            }

            // Salvar no Obsidian ou localmente
            if (!this.fallbackMode && this.isConnected) {
                await this.saveToObsidian(filePath, markdown);
                logger.success(`✅ Nota estratégica salva no Obsidian: ${note.title}`);
            } else {
                await this.saveToLocal(filePath, markdown);
                this.addToSyncQueue({ type: 'strategic-note', filePath, markdown });
                logger.success(`📁 Nota estratégica salva localmente: ${note.title}`);
            }

            return { success: true, filePath, operation };
        } catch (error) {
            logger.error(`❌ Erro ao sincronizar nota estratégica ${note.title}:`, error);
            throw error;
        }
    }

    /**
   * Sincroniza um post do blog com o Obsidian
   */
    async syncBlogPost(post, operation = 'create') {
        try {
            logger.info(`📝 Sincronizando post do blog: ${post.title}`);
      
            const fileName = this.generateFileName(post.title, 'blog-post');
            const filePath = `Blog Posts/${fileName}`;
            const markdown = this.generateBlogPostMarkdown(post);

            if (operation === 'delete') {
                this.addToSyncQueue({ type: 'delete', filePath });
                return { success: true, filePath, operation };
            }

            // Salvar no Obsidian ou localmente
            if (!this.fallbackMode && this.isConnected) {
                await this.saveToObsidian(filePath, markdown);
                logger.success(`✅ Post do blog salvo no Obsidian: ${post.title}`);
            } else {
                await this.saveToLocal(filePath, markdown);
                this.addToSyncQueue({ type: 'blog-post', filePath, markdown });
                logger.success(`📁 Post do blog salvo localmente: ${post.title}`);
            }

            return { success: true, filePath, operation };
        } catch (error) {
            logger.error(`❌ Erro ao sincronizar post do blog ${post.title}:`, error);
            throw error;
        }
    }

    /**
   * Sincroniza um bloco de nota com o Obsidian
   */
    async syncBlock(block, operation = 'create') {
        try {
            logger.info(`🧱 Sincronizando bloco: ${block.hash.substring(0, 8)}`);
      
            const fileName = this.generateFileName(`Block ${block.hash.substring(0, 8)}`, 'block');
            const filePath = `Blocks/${fileName}`;
            const markdown = this.generateBlockMarkdown(block);

            if (operation === 'delete') {
                this.addToSyncQueue({ type: 'delete', filePath });
                return { success: true, filePath, operation };
            }

            // Salvar no Obsidian ou localmente
            if (!this.fallbackMode && this.isConnected) {
                await this.saveToObsidian(filePath, markdown);
                logger.success(`✅ Bloco salvo no Obsidian: ${block.hash.substring(0, 8)}`);
            } else {
                await this.saveToLocal(filePath, markdown);
                this.addToSyncQueue({ type: 'block', filePath, markdown });
                logger.success(`📁 Bloco salvo localmente: ${block.hash.substring(0, 8)}`);
            }

            return { success: true, filePath, operation };
        } catch (error) {
            logger.error(`❌ Erro ao sincronizar bloco ${block.hash}:`, error);
            throw error;
        }
    }

    /**
   * Gera markdown para nota estratégica
   */
    generateStrategicNoteMarkdown(note) {
        const now = new Date();
        const frontmatter = `---
type: strategic-note
title: "${note.title}"
status: ${note.status || 'draft'}
target_audience: "${note.targetAudience || ''}"
location: "${note.location || ''}"
created: ${note.createdAt ? note.createdAt.toISOString() : now.toISOString()}
updated: ${note.updatedAt ? note.updatedAt.toISOString() : now.toISOString()}
database_id: ${note._id}
tags:
  - strategic-note
  - ${note.status || 'draft'}
---`;

        let markdown = `${frontmatter}\n\n# ${note.title}\n\n`;
    
        markdown += '## 📊 Informações Gerais\n\n';
        markdown += `- **Público-alvo:** ${note.targetAudience || 'Não definido'}\n`;
        markdown += `- **Local:** ${note.location || 'Não definido'}\n`;
        markdown += `- **Status:** ${note.status || 'draft'}\n`;
        markdown += `- **Tags:** ${note.tags?.join(', ') || 'Nenhuma'}\n\n`;
    
        markdown += `## 📝 Conteúdo\n\n${note.content || 'Conteúdo não definido'}\n\n`;
    
        // Adicionar objetivos se existirem
        if (note.objectives && note.objectives.length > 0) {
            markdown += '## 🎯 Objetivos\n\n';
            note.objectives.forEach((obj, index) => {
                markdown += `${index + 1}. ${obj}\n`;
            });
            markdown += '\n';
        }

        return markdown;
    }

    /**
   * Gera markdown para post do blog
   */
    generateBlogPostMarkdown(post) {
        const now = new Date();
        const frontmatter = `---
type: blog-post
title: "${post.title}"
slug: ${post.slug || ''}
published: ${post.published || false}
likes: ${post.likes || 0}
created: ${post.createdAt ? post.createdAt.toISOString() : now.toISOString()}
updated: ${post.updatedAt ? post.updatedAt.toISOString() : now.toISOString()}
database_id: ${post._id}
tags:
  - blog-post
  - ${post.published ? 'published' : 'draft'}
---`;

        let markdown = `${frontmatter}\n\n# ${post.title}\n\n`;
    
        markdown += '## 📋 Informações do Post\n\n';
        markdown += `- **Slug:** \`${post.slug || 'não definido'}\`\n`;
        markdown += `- **Status:** ${post.published ? '🟢 Publicado' : '🟡 Rascunho'}\n`;
        markdown += `- **Likes:** ${post.likes || 0}\n`;
        markdown += `- **Tags:** ${post.tags?.join(', ') || 'Nenhuma'}\n\n`;
    
        markdown += `## 📝 Conteúdo\n\n${post.content || 'Conteúdo não definido'}\n\n`;

        return markdown;
    }

    /**
   * Gera markdown para bloco
   */
    generateBlockMarkdown(block) {
        const now = new Date();
        const frontmatter = `---
type: block
title: "Block ${block.hash.substring(0, 8)}"
hash: ${block.hash}
prev_hash: ${block.prevHash || ''}
created: ${block.ts ? new Date(block.ts).toISOString() : now.toISOString()}
database_id: ${block._id}
tags:
  - block
  - ai-chain
---`;

        let markdown = `${frontmatter}\n\n# Bloco ${block.hash.substring(0, 8)}\n\n`;
    
        markdown += '## 🔗 Informações do Bloco\n\n';
        markdown += `- **Hash:** \`${block.hash}\`\n`;
        markdown += `- **Hash Anterior:** \`${block.prevHash || 'N/A'}\`\n`;
        markdown += `- **Criado em:** ${block.ts ? formatDate(new Date(block.ts)) : 'N/A'}\n\n`;
    
        markdown += `## 💭 Prompt\n\n\`\`\`\n${block.prompt}\n\`\`\`\n\n`;
        markdown += `## 🤖 Resposta\n\n${block.answer}\n\n`;

        return markdown;
    }
}

// Instância singleton
let obsidianIntegrationInstance = null;

export const getObsidianIntegration = () => {
    if (!obsidianIntegrationInstance) {
        obsidianIntegrationInstance = new ObsidianIntegrationService();
    }
    return obsidianIntegrationInstance;
};

export default ObsidianIntegrationService;
