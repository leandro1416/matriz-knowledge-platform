import logger from '../utils/logger.js';

// Middleware de logging de requisições
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.request(req.method, req.url, res.statusCode, duration, req.ip);
    });
    
    next();
};

// Middleware de logging de erros
export const errorLogger = (err, req, res, next) => {
    logger.error('Erro na requisição:', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        error: err.message,
        stack: err.stack
    });
    
    next(err);
};

// Middleware de logging de performance
export const performanceLogger = (req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        
        if (duration > 1000) { // Log apenas requisições lentas (> 1s)
            logger.warn(`Requisição lenta detectada: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
        }
    });
    
    next();
};

export default {
    requestLogger,
    errorLogger,
    performanceLogger
}; 