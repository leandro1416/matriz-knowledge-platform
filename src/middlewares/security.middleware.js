import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

// Middleware de segurança adaptativo HTTP/HTTPS
export const adaptiveSecurityMiddleware = (req, res, next) => {
    const isHTTPS = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    
    // Configuração diferenciada por protocolo
    if (isHTTPS || (!isLocalhost && config.nodeEnv === 'production')) {
        // HTTPS: Segurança completa
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ['\'self\''],
                    styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
                    fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
                    scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.jsdelivr.net'],
                    imgSrc: ['\'self\'', 'data:', 'https:'],
                    upgradeInsecureRequests: []
                },
            },
            hsts: {
                maxAge: 15552000,
                includeSubDomains: true
            }
        })(req, res, next);
    } else {
        // HTTP localhost: Segurança minimal (sem CSP problemático)
        return helmet({
            contentSecurityPolicy: false, // Desabilitar CSP para localhost HTTP
            hsts: false, // Sem HSTS para HTTP
            crossOriginEmbedderPolicy: false, // Relaxar políticas
            crossOriginOpenerPolicy: false,
            crossOriginResourcePolicy: false
        })(req, res, next);
    }
};

// Configuração legacy do Helmet para compatibilidade
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['\'self\''],
            styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
            fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
            scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdn.jsdelivr.net'],
            imgSrc: ['\'self\'', 'data:', 'https:'],
        },
    },
    hsts: false
});

// Configuração do CORS
export const corsConfig = cors({
    origin: config.nodeEnv === 'production' 
        ? config.cors.production
        : config.cors.development,
    credentials: true
});

// Rate Limiting geral
export const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        message: 'Muitas requisições, tente novamente mais tarde.'
    }
});

// Rate Limiting específico para IA
export const aiLimiter = rateLimit({
    windowMs: config.rateLimit.aiWindowMs,
    max: config.rateLimit.aiMax,
    message: {
        success: false,
        message: 'Limite de IA atingido, tente novamente em alguns minutos.'
    }
});

// Middleware de segurança completo
export const securityMiddleware = [
    adaptiveSecurityMiddleware,  // Novo middleware adaptativo
    corsConfig,
    generalLimiter
];

export default securityMiddleware; 