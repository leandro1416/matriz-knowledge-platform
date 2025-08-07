/**
 * Serviço de Persistência da Cadeia de Blocos
 * Garante que todos os blocos sejam salvos e recuperados corretamente
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

class BlockChainPersistence {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.blocksFile = path.join(this.dataDir, 'blockchain.json');
        this.backupDir = path.join(this.dataDir, 'backups');
        this.inMemoryBlocks = new Map(); // Cache em memória
        this.saveQueue = []; // Fila de salvamento
        this.isSaving = false;
        
        this.initializeStorage();
        this.startAutoSave();
    }

    /**
     * Inicializa estrutura de armazenamento
     */
    async initializeStorage() {
        try {
            // Criar diretórios se não existirem
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(this.backupDir, { recursive: true });
            
            // Carregar dados existentes
            await this.loadFromDisk();
            
            logger.success('📁 Sistema de persistência de blockchain inicializado');
        } catch (error) {
            logger.error('❌ Erro ao inicializar persistência:', error);
        }
    }

    /**
     * Carrega dados do disco para memória
     */
    async loadFromDisk() {
        try {
            // Verificar se arquivo existe
            try {
                await fs.access(this.blocksFile);
            } catch {
                // Arquivo não existe, criar estrutura vazia
                logger.info('📂 Criando novo arquivo de blockchain');
                await this.saveToDisk();
                return;
            }

            // Ler dados do arquivo
            const data = await fs.readFile(this.blocksFile, 'utf8');
            const parsed = JSON.parse(data);
            
            // Restaurar dados em memória
            this.inMemoryBlocks.clear();
            Object.entries(parsed.users || {}).forEach(([userId, blocks]) => {
                this.inMemoryBlocks.set(userId, blocks);
            });
            
            const totalBlocks = Array.from(this.inMemoryBlocks.values())
                .reduce((sum, blocks) => sum + blocks.length, 0);
            
            logger.success(`✅ Blockchain carregado: ${totalBlocks} blocos de ${this.inMemoryBlocks.size} usuários`);
            
        } catch (error) {
            logger.error('❌ Erro ao carregar blockchain do disco:', error);
            // Em caso de erro, usar estrutura vazia
            this.inMemoryBlocks.clear();
        }
    }

    /**
     * Salva dados da memória para o disco
     */
    async saveToDisk() {
        try {
            // Converter Map para objeto serializável
            const usersData = {};
            this.inMemoryBlocks.forEach((blocks, userId) => {
                usersData[userId] = blocks;
            });
            
            const data = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                users: usersData,
                metadata: {
                    totalUsers: this.inMemoryBlocks.size,
                    totalBlocks: Object.values(usersData).reduce((sum, blocks) => sum + blocks.length, 0)
                }
            };
            
            // Salvar arquivo principal
            await fs.writeFile(this.blocksFile, JSON.stringify(data, null, 2), 'utf8');
            
            // Criar backup com timestamp
            const backupFile = path.join(
                this.backupDir, 
                `blockchain-backup-${Date.now()}.json`
            );
            await fs.writeFile(backupFile, JSON.stringify(data, null, 2), 'utf8');
            
            // Limpar backups antigos (manter apenas os 10 mais recentes)
            await this.cleanupOldBackups();
            
            logger.debug(`💾 Blockchain salvo no disco: ${data.metadata.totalBlocks} blocos`);
            
        } catch (error) {
            logger.error('❌ Erro ao salvar blockchain no disco:', error);
        }
    }

    /**
     * Remove backups antigos, mantendo apenas os 10 mais recentes
     */
    async cleanupOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('blockchain-backup-'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    timestamp: parseInt(file.match(/blockchain-backup-(\d+)\.json$/)?.[1] || '0')
                }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            // Manter apenas os 10 mais recentes
            const filesToDelete = backupFiles.slice(10);
            
            for (const file of filesToDelete) {
                await fs.unlink(file.path);
                logger.debug(`🗑️ Backup antigo removido: ${file.name}`);
            }
            
        } catch (error) {
            logger.error('❌ Erro ao limpar backups antigos:', error);
        }
    }

    /**
     * Inicia salvamento automático periódico
     */
    startAutoSave() {
        // Salvar a cada 30 segundos se houver mudanças
        setInterval(async () => {
            if (this.saveQueue.length > 0 && !this.isSaving) {
                await this.processSaveQueue();
            }
        }, 30000);
        
        logger.info('🔄 Auto-save do blockchain iniciado (30s)');
    }

    /**
     * Processa fila de salvamento
     */
    async processSaveQueue() {
        if (this.isSaving) return;
        
        this.isSaving = true;
        try {
            // Processar todos os itens da fila
            while (this.saveQueue.length > 0) {
                this.saveQueue.shift(); // Remove item da fila
            }
            
            // Salvar no disco
            await this.saveToDisk();
            
        } catch (error) {
            logger.error('❌ Erro ao processar fila de salvamento:', error);
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Adiciona novo bloco à cadeia
     */
    async addBlock(userId, block) {
        try {
            // Obter cadeia do usuário
            const userBlocks = this.inMemoryBlocks.get(userId) || [];
            
            // Adicionar novo bloco
            userBlocks.push(block);
            this.inMemoryBlocks.set(userId, userBlocks);
            
            // Marcar para salvamento
            this.saveQueue.push({ action: 'add', userId, block });
            
            // Salvamento imediato para operações críticas
            if (userBlocks.length % 5 === 0) { // A cada 5 blocos
                await this.processSaveQueue();
            }
            
            logger.debug(`🧱 Bloco adicionado: ${block.hash.substring(0, 8)} (usuário: ${userId})`);
            
            return block;
            
        } catch (error) {
            logger.error('❌ Erro ao adicionar bloco:', error);
            throw error;
        }
    }

    /**
     * Obtém cadeia de blocos do usuário
     */
    getUserBlocks(userId) {
        return this.inMemoryBlocks.get(userId) || [];
    }

    /**
     * Obtém último bloco do usuário
     */
    getLastBlock(userId) {
        const userBlocks = this.getUserBlocks(userId);
        return userBlocks.length > 0 ? userBlocks[userBlocks.length - 1] : null;
    }

    /**
     * Busca bloco por hash
     */
    findBlockByHash(hash) {
        for (const [userId, blocks] of this.inMemoryBlocks) {
            const block = blocks.find(b => b.hash === hash);
            if (block) {
                return { block, userId };
            }
        }
        return null;
    }

    /**
     * Obtém estatísticas da blockchain
     */
    getStats() {
        const allBlocks = Array.from(this.inMemoryBlocks.values()).flat();
        
        return {
            totalUsers: this.inMemoryBlocks.size,
            totalBlocks: allBlocks.length,
            averageBlocksPerUser: this.inMemoryBlocks.size > 0 
                ? Math.round(allBlocks.length / this.inMemoryBlocks.size) 
                : 0,
            averageResponseLength: allBlocks.length > 0
                ? Math.round(allBlocks.reduce((sum, block) => sum + (block.answer?.length || 0), 0) / allBlocks.length)
                : 0,
            aiModeBreakdown: allBlocks.reduce((acc, block) => {
                acc[block.aiMode || 'unknown'] = (acc[block.aiMode || 'unknown'] || 0) + 1;
                return acc;
            }, {}),
            firstBlock: allBlocks.length > 0 ? Math.min(...allBlocks.map(b => b.ts)) : null,
            lastBlock: allBlocks.length > 0 ? Math.max(...allBlocks.map(b => b.ts)) : null
        };
    }

    /**
     * Valida integridade da cadeia
     */
    validateChain(userId) {
        const userBlocks = this.getUserBlocks(userId);
        
        if (userBlocks.length === 0) {
            return { valid: true, message: 'Cadeia vazia' };
        }
        
        for (let i = 1; i < userBlocks.length; i++) {
            const currentBlock = userBlocks[i];
            const previousBlock = userBlocks[i - 1];
            
            // Verificar se o prevHash está correto
            if (currentBlock.prevHash !== previousBlock.hash) {
                return { 
                    valid: false, 
                    message: `Hash anterior inválido no bloco ${i}`,
                    blockIndex: i 
                };
            }
        }
        
        return { valid: true, message: 'Cadeia válida' };
    }

    /**
     * Força salvamento imediato
     */
    async forceSave() {
        await this.processSaveQueue();
        logger.info('💾 Salvamento forçado do blockchain concluído');
    }

    /**
     * Exporta blockchain para backup
     */
    async exportBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFile = path.join(this.backupDir, `export-${timestamp}.json`);
            
            const stats = this.getStats();
            const data = {
                exportedAt: new Date().toISOString(),
                version: '1.0.0',
                stats,
                blockchain: Object.fromEntries(this.inMemoryBlocks)
            };
            
            await fs.writeFile(exportFile, JSON.stringify(data, null, 2), 'utf8');
            
            logger.success(`📦 Backup exportado: ${exportFile}`);
            return exportFile;
            
        } catch (error) {
            logger.error('❌ Erro ao exportar backup:', error);
            throw error;
        }
    }
}

// Instância singleton
let blockChainPersistenceInstance = null;

export const getBlockChainPersistence = () => {
    if (!blockChainPersistenceInstance) {
        blockChainPersistenceInstance = new BlockChainPersistence();
    }
    return blockChainPersistenceInstance;
};

export default BlockChainPersistence;
