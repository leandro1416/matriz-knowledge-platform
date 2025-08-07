/**
 * Utilitário para padronizar respostas da API
 * Garante consistência em todas as respostas
 */
export class ApiResponse {
    /**
   * Resposta de sucesso padrão
   */
    static success(res, data, message = 'Operação realizada com sucesso', statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };

        return res.status(statusCode).json(response);
    }

    /**
   * Resposta de sucesso com paginação
   */
    static successWithPagination(res, data, pagination, message = 'Dados recuperados com sucesso') {
        const response = {
            success: true,
            message,
            data,
            pagination,
            timestamp: new Date().toISOString()
        };

        return res.status(200).json(response);
    }

    /**
   * Resposta de criação bem-sucedida
   */
    static created(res, data, message = 'Recurso criado com sucesso') {
        return this.success(res, data, message, 201);
    }

    /**
   * Resposta para operações sem conteúdo
   */
    static noContent(res, message = 'Operação realizada com sucesso') {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString()
        };

        return res.status(204).json(response);
    }

    /**
   * Resposta de erro (não deve ser usada diretamente, use AppError)
   */
    static error(res, message, statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }
}

/**
 * Helper para criar objetos de paginação padronizados
 */
export class PaginationHelper {
    /**
   * Cria objeto de paginação baseado nos parâmetros da query
   */
    static fromQuery(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
        const skip = (page - 1) * limit;

        return { page, limit, skip };
    }

    /**
   * Cria objeto de paginação para resposta
   */
    static createResponse(page, limit, total) {
        return {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        };
    }

    /**
   * Cria objeto de ordenação baseado na query
   */
    static getSortFromQuery(query, defaultSort = { createdAt: -1 }) {
        if (!query.sort) return defaultSort;

        const sortParts = query.sort.split(',');
        const sort = {};

        sortParts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed.startsWith('-')) {
                sort[trimmed.substring(1)] = -1;
            } else {
                sort[trimmed] = 1;
            }
        });

        return Object.keys(sort).length > 0 ? sort : defaultSort;
    }
}

export default { ApiResponse, PaginationHelper };