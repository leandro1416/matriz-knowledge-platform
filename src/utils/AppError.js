/**
 * Classe personalizada para erros da aplicação
 * Permite melhor controle e padronização do tratamento de erros
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
    
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
    
        // Capture stack trace, excluindo o constructor call
        Error.captureStackTrace(this, this.constructor);
    }

    /**
   * Factory method para erros de validação
   */
    static validation(message, field = null) {
        const fullMessage = field ? `${field}: ${message}` : message;
        return new AppError(fullMessage, 400);
    }

    /**
   * Factory method para erros de autorização
   */
    static unauthorized(message = 'Acesso não autorizado') {
        return new AppError(message, 401);
    }

    /**
   * Factory method para erros de recurso não encontrado
   */
    static notFound(resource = 'Recurso') {
        return new AppError(`${resource} não encontrado`, 404);
    }

    /**
   * Factory method para erros de conflito
   */
    static conflict(message) {
        return new AppError(message, 409);
    }

    /**
   * Factory method para erros de rate limit
   */
    static tooManyRequests(message = 'Muitas requisições. Tente novamente em alguns minutos.') {
        return new AppError(message, 429);
    }

    /**
   * Factory method para erros de servidor
   */
    static internal(message = 'Erro interno do servidor') {
        return new AppError(message, 500);
    }

    /**
   * Converte para JSON para logging
   */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            isOperational: this.isOperational,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

export default AppError;