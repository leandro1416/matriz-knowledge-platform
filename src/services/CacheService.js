import logger from '../utils/logger.js';

/**
 * Serviço de cache em memória para a aplicação
 * Implementa TTL (Time To Live) e invalidação por padrão
 */
class CacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos
        this.cleanupInterval = 60 * 1000; // 1 minuto
    
        // Iniciar limpeza automática
        this.startCleanupTimer();
    
        logger.info('🗄️ Cache service inicializado');
    }

    /**
   * Obter item do cache
   */
    get(key) {
        const item = this.cache.get(key);
    
        if (!item) {
            return null;
        }

        // Verificar se expirou
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            logger.info(`🗑️ Cache expirado removido: ${key}`);
            return null;
        }

        // Atualizar último acesso
        item.lastAccessed = Date.now();
        logger.info(`📖 Cache hit: ${key}`);
    
        return item.value;
    }

    /**
   * Armazenar item no cache
   */
    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + ttl;
    
        const cacheItem = {
            value,
            expiresAt,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            hitCount: 0
        };

        this.cache.set(key, cacheItem);
        logger.info(`💾 Item cacheado: ${key} (TTL: ${ttl}ms)`);
    
        return true;
    }

    /**
   * Remover item específico do cache
   */
    delete(key) {
        const deleted = this.cache.delete(key);
    
        if (deleted) {
            logger.info(`🗑️ Item removido do cache: ${key}`);
        }
    
        return deleted;
    }

    /**
   * Invalidar cache por padrão
   */
    invalidate(pattern) {
        let deletedCount = 0;
    
        for (const key of this.cache.keys()) {
            if (this.matchesPattern(key, pattern)) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
    
        if (deletedCount > 0) {
            logger.info(`🗑️ Cache invalidado: ${deletedCount} itens com padrão "${pattern}"`);
        }
    
        return deletedCount;
    }

    /**
   * Verificar se uma chave corresponde ao padrão
   */
    matchesPattern(key, pattern) {
    // Suporte para wildcards simples
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(key);
        }
    
        // Correspondência exata ou prefixo
        return key === pattern || key.startsWith(pattern);
    }

    /**
   * Limpar todo o cache
   */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
    
        logger.info(`🧹 Cache limpo: ${size} itens removidos`);
        return size;
    }

    /**
   * Obter estatísticas do cache
   */
    getStats() {
        const stats = {
            size: this.cache.size,
            items: []
        };

        for (const [key, item] of this.cache.entries()) {
            stats.items.push({
                key,
                createdAt: new Date(item.createdAt).toISOString(),
                expiresAt: new Date(item.expiresAt).toISOString(),
                lastAccessed: new Date(item.lastAccessed).toISOString(),
                hitCount: item.hitCount,
                isExpired: Date.now() > item.expiresAt
            });
        }

        return stats;
    }

    /**
   * Wrapper para cache com fallback
   */
    async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    // Tentar obter do cache primeiro
        let value = this.get(key);
    
        if (value !== null) {
            return value;
        }

        // Se não estiver no cache, executar função e cachear resultado
        try {
            logger.info(`🔄 Cache miss: ${key} - executando fetch function`);
            value = await fetchFunction();
      
            if (value !== null && value !== undefined) {
                this.set(key, value, ttl);
            }
      
            return value;
        } catch (error) {
            logger.error(`❌ Erro ao executar fetch function para cache ${key}:`, error);
            throw error;
        }
    }

    /**
   * Gerar chave de cache baseada em parâmetros
   */
    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');
    
        return sortedParams ? `${prefix}:${sortedParams}` : prefix;
    }

    /**
   * Cache específico para operações de banco
   */
    async cacheDbOperation(operation, params, fetchFunction, ttl = this.defaultTTL) {
        const key = this.generateKey(`db:${operation}`, params);
        return this.getOrSet(key, fetchFunction, ttl);
    }

    /**
   * Cache específico para APIs externas
   */
    async cacheApiCall(apiName, params, fetchFunction, ttl = 10 * 60 * 1000) { // 10 min para APIs
        const key = this.generateKey(`api:${apiName}`, params);
        return this.getOrSet(key, fetchFunction, ttl);
    }

    /**
   * Cache específico para cálculos pesados
   */
    async cacheComputation(computationName, params, fetchFunction, ttl = 30 * 60 * 1000) { // 30 min
        const key = this.generateKey(`comp:${computationName}`, params);
        return this.getOrSet(key, fetchFunction, ttl);
    }

    /**
   * Invalidação inteligente baseada em eventos
   */
    invalidateByEvent(eventType, entityId = null) {
        const patterns = this.getInvalidationPatterns(eventType, entityId);
    
        let totalDeleted = 0;
        patterns.forEach(pattern => {
            totalDeleted += this.invalidate(pattern);
        });
    
        if (totalDeleted > 0) {
            logger.info(`🔄 Invalidação por evento ${eventType}: ${totalDeleted} itens removidos`);
        }
    
        return totalDeleted;
    }

    /**
   * Obter padrões de invalidação para diferentes eventos
   */
    getInvalidationPatterns(eventType, entityId) {
        const patterns = [];
    
        switch (eventType) {
        case 'post:created':
        case 'post:updated':
        case 'post:deleted':
            patterns.push('db:post:*', 'db:posts:*');
            if (entityId) patterns.push(`db:post:${entityId}*`);
            break;
        
        case 'comment:created':
        case 'comment:updated':
        case 'comment:deleted':
            patterns.push('db:comment:*', 'db:comments:*');
            if (entityId) patterns.push(`db:comment:${entityId}*`);
            break;
        
        case 'user:updated':
            patterns.push('db:user:*', 'db:users:*');
            if (entityId) patterns.push(`db:user:${entityId}*`);
            break;
        
        case 'strategic-note:created':
        case 'strategic-note:updated':
        case 'strategic-note:deleted':
            patterns.push('db:strategic-note:*', 'db:strategic-notes:*');
            if (entityId) patterns.push(`db:strategic-note:${entityId}*`);
            break;
        
        default:
            patterns.push('*'); // Invalidar tudo se evento desconhecido
        }
    
        return patterns;
    }

    /**
   * Limpeza automática de itens expirados
   */
    cleanup() {
        let deletedCount = 0;
        const now = Date.now();
    
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
    
        if (deletedCount > 0) {
            logger.info(`🧹 Limpeza automática: ${deletedCount} itens expirados removidos`);
        }
    
        return deletedCount;
    }

    /**
   * Iniciar timer de limpeza automática
   */
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    
        logger.info(`⏰ Timer de limpeza iniciado (${this.cleanupInterval}ms)`);
    }

    /**
   * Parar timer de limpeza
   */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            logger.info('⏹️ Timer de limpeza parado');
        }
    }

    /**
   * Destruir instância do cache
   */
    destroy() {
        this.stopCleanupTimer();
        this.clear();
        logger.info('💥 Cache service destruído');
    }
}

// Instância singleton
const cacheService = new CacheService();

export default cacheService;