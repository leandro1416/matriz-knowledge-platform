/**
 * Configurações do Obsidian para integração via Local REST API
 */

import { config } from './index.js';

export const obsidianConfig = {
    // URL base do Local REST API do Obsidian
    baseUrl: process.env.OBSIDIAN_BASE_URL || 'https://127.0.0.1:27124',
  
    // Chave da API do Local REST API
    apiKey: process.env.OBSIDIAN_API_KEY || '1ad7f936211543d7c15d2348e054e4217f292f236dd21c1dbfa6d925f7c111d6',
  
    // Configurações de timeout e retry
    timeout: parseInt(process.env.OBSIDIAN_TIMEOUT || '5000'),
    retryAttempts: parseInt(process.env.OBSIDIAN_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.OBSIDIAN_RETRY_DELAY || '1000'),
  
    // Configurações de diretórios no vault
    directories: {
        strategicNotes: process.env.OBSIDIAN_STRATEGIC_NOTES_DIR || 'Strategic Notes',
        blogPosts: process.env.OBSIDIAN_BLOG_POSTS_DIR || 'Blog Posts',
        blocks: process.env.OBSIDIAN_BLOCKS_DIR || 'Blocks',
        templates: process.env.OBSIDIAN_TEMPLATES_DIR || 'Templates',
        attachments: process.env.OBSIDIAN_ATTACHMENTS_DIR || 'Assets'
    },
  
    // Configurações de sincronização
    sync: {
        enabled: process.env.OBSIDIAN_SYNC_ENABLED !== 'false',
        realTime: process.env.OBSIDIAN_REAL_TIME_SYNC === 'true',
        batchSize: parseInt(process.env.OBSIDIAN_BATCH_SIZE || '10'),
        syncInterval: parseInt(process.env.OBSIDIAN_SYNC_INTERVAL || '30000'), // 30 segundos
        webhookEnabled: process.env.OBSIDIAN_WEBHOOK_ENABLED === 'true',
        webhookUrl: process.env.OBSIDIAN_WEBHOOK_URL || ''
    },
  
    // Configurações de templates
    templates: {
        strategicNote: process.env.OBSIDIAN_STRATEGIC_NOTE_TEMPLATE || 'strategic-note-template.md',
        blogPost: process.env.OBSIDIAN_BLOG_POST_TEMPLATE || 'blog-post-template.md',
        block: process.env.OBSIDIAN_BLOCK_TEMPLATE || 'block-template.md',
        useTemplates: process.env.OBSIDIAN_USE_TEMPLATES !== 'false'
    },
  
    // Configurações de metadados (frontmatter)
    metadata: {
        useYamlFrontmatter: process.env.OBSIDIAN_USE_YAML_FRONTMATTER !== 'false',
        includeTimestamps: process.env.OBSIDIAN_INCLUDE_TIMESTAMPS !== 'false',
        includeIds: process.env.OBSIDIAN_INCLUDE_IDS !== 'false',
        includeStatus: process.env.OBSIDIAN_INCLUDE_STATUS !== 'false'
    },
  
    // Configurações de segurança
    security: {
        verifySSL: process.env.OBSIDIAN_VERIFY_SSL !== 'false',
        allowSelfSigned: process.env.OBSIDIAN_ALLOW_SELF_SIGNED === 'true'
    }
};

// Validação das configurações essenciais
export const validateObsidianConfig = () => {
    const errors = [];
  
    if (!obsidianConfig.apiKey) {
        errors.push('OBSIDIAN_API_KEY é obrigatória');
    }
  
    if (!obsidianConfig.baseUrl) {
        errors.push('OBSIDIAN_BASE_URL é obrigatória');
    }
  
    if (obsidianConfig.sync.webhookEnabled && !obsidianConfig.sync.webhookUrl) {
        errors.push('OBSIDIAN_WEBHOOK_URL é obrigatória quando webhooks estão habilitados');
    }
  
    if (errors.length > 0) {
        throw new Error(`Configuração do Obsidian inválida: ${errors.join(', ')}`);
    }
  
    return true;
};

export default obsidianConfig;
