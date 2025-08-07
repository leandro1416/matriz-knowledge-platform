/**
 * Funções utilitárias auxiliares
 */

/**
 * Formata uma data em diferentes formatos
 */
export const formatDate = (date, format = 'DD/MM/YYYY HH:mm') => {
    if (!date) return '';
  
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
  
    const pad = (num) => num.toString().padStart(2, '0');
  
    const formats = {
        'DD/MM/YYYY': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
        'YYYY-MM-DD': `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        'DD/MM/YYYY HH:mm': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
        'YYYY-MM-DD HH:mm': `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
        'ISO': d.toISOString()
    };
  
    return formats[format] || formats['DD/MM/YYYY HH:mm'];
};

/**
 * Gera um ID único com o tamanho especificado
 */
export const generateUniqueId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  
    return result;
};

/**
 * Sanitiza uma string para uso como nome de arquivo
 */
export const sanitizeFileName = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

/**
 * Converte texto para slug URL-friendly
 */
export const slugify = (text) => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

/**
 * Valida se um email tem formato válido
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Capitaliza a primeira letra de uma string
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Trunca uma string com elipses
 */
export const truncate = (str, length = 100, suffix = '...') => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + suffix;
};

/**
 * Remove tags HTML de uma string
 */
export const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
};

/**
 * Converte markdown básico para HTML
 */
export const markdownToHtml = (markdown) => {
    if (!markdown) return '';
  
    return markdown
    // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
        .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
    // Line breaks
        .replace(/\n/gim, '<br>');
};

/**
 * Converte HTML básico para markdown
 */
export const htmlToMarkdown = (html) => {
    if (!html) return '';
  
    return html
    // Headers
        .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n')
    // Bold
        .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
        .replace(/<b>(.*?)<\/b>/gim, '**$1**')
    // Italic
        .replace(/<em>(.*?)<\/em>/gim, '*$1*')
        .replace(/<i>(.*?)<\/i>/gim, '*$1*')
    // Links
        .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/gim, '[$2]($1)')
    // Line breaks
        .replace(/<br\s*\/?>/gim, '\n')
    // Remove remaining HTML tags
        .replace(/<[^>]*>/g, '');
};

/**
 * Debounce function - executa função após delay sem novas chamadas
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

/**
 * Throttle function - limita execução de função a intervalo específico
 */
export const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Cria um delay assíncrono
 */
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry assíncrono com backoff exponencial
 */
export const retryAsync = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await sleep(delay);
            return retryAsync(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

/**
 * Valida se um objeto tem todas as propriedades requeridas
 */
export const validateRequiredFields = (obj, requiredFields) => {
    const missing = requiredFields.filter(field => !obj[field]);
    if (missing.length > 0) {
        throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }
    return true;
};

/**
 * Formata números para display
 */
export const formatNumber = (num, decimals = 0) => {
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
};

/**
 * Calcula o tempo decorrido entre duas datas
 */
export const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
  
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  
    return formatDate(date, 'DD/MM/YYYY');
};

/**
 * Extrai metadados de frontmatter YAML
 */
export const extractFrontmatter = (content) => {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
  
    if (!match) {
        return { metadata: {}, content };
    }
  
    const yamlContent = match[1];
    const remainingContent = content.replace(frontmatterRegex, '').trim();
  
    // Parser YAML simples
    const metadata = {};
    const lines = yamlContent.split('\n');
  
    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
      
            // Remove aspas se existirem
            const cleanValue = value.replace(/^["']|["']$/g, '');
      
            // Tentar converter para número ou boolean
            if (cleanValue === 'true') metadata[key] = true;
            else if (cleanValue === 'false') metadata[key] = false;
            else if (!isNaN(cleanValue) && cleanValue !== '') metadata[key] = Number(cleanValue);
            else metadata[key] = cleanValue;
        }
    }
  
    return { metadata, content: remainingContent };
};

/**
 * Cria frontmatter YAML a partir de objeto
 */
export const createFrontmatter = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) {
        return '';
    }
  
    let yaml = '---\n';
  
    for (const [key, value] of Object.entries(metadata)) {
        if (value !== null && value !== undefined) {
            if (typeof value === 'string' && value.includes(' ')) {
                yaml += `${key}: "${value}"\n`;
            } else {
                yaml += `${key}: ${value}\n`;
            }
        }
    }
  
    yaml += '---\n';
  
    return yaml;
};

export default {
    formatDate,
    generateUniqueId,
    sanitizeFileName,
    slugify,
    isValidEmail,
    capitalize,
    truncate,
    stripHtml,
    markdownToHtml,
    htmlToMarkdown,
    debounce,
    throttle,
    sleep,
    retryAsync,
    validateRequiredFields,
    formatNumber,
    getTimeAgo,
    extractFrontmatter,
    createFrontmatter
};
