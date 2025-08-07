import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Wrapper para handlers assíncronos que captura erros automaticamente
 * Elimina a necessidade de try-catch em cada controller
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            // Se já é um AppError, apenas passe para frente
            if (error instanceof AppError) {
                return next(error);
            }

            // Log do erro original para debugging
            logger.error('Erro capturado pelo asyncHandler:', error);

            // Converter erros conhecidos do MongoDB
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return next(AppError.validation(validationErrors.join(', ')));
            }

            if (error.name === 'CastError') {
                return next(AppError.validation('ID inválido'));
            }

            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                return next(AppError.conflict(`${field} já existe`));
            }

            // Erros de JWT
            if (error.name === 'JsonWebTokenError') {
                return next(AppError.unauthorized('Token inválido'));
            }

            if (error.name === 'TokenExpiredError') {
                return next(AppError.unauthorized('Token expirado'));
            }

            // Para outros erros, criar AppError genérico
            const appError = new AppError(
                process.env.NODE_ENV === 'production' 
                    ? 'Erro interno do servidor' 
                    : error.message,
                error.statusCode || 500,
                false // Não é operacional
            );

            next(appError);
        });
    };
};

/**
 * Middleware global para tratamento de erros
 * Deve ser o último middleware antes da resposta 404
 */
export const globalErrorHandler = (error, req, res, next) => {
    // Se headers já foram enviados, delegue para o handler padrão do Express
    if (res.headersSent) {
        return next(error);
    }

    // Garantir que temos um AppError
    let appError = error;
    if (!(error instanceof AppError)) {
        appError = new AppError(
            process.env.NODE_ENV === 'production' 
                ? 'Erro interno do servidor' 
                : error.message,
            error.statusCode || 500,
            false
        );
    }

    // Log apenas erros não operacionais ou em desenvolvimento
    if (!appError.isOperational || process.env.NODE_ENV === 'development') {
        logger.error('Global Error Handler:', {
            error: appError.toJSON(),
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }

    // Resposta padronizada
    const errorResponse = {
        success: false,
        message: appError.message,
        timestamp: appError.timestamp
    };

    // Incluir stack trace apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = appError.stack;
    }

    res.status(appError.statusCode).json(errorResponse);
};

export default { asyncHandler, globalErrorHandler };