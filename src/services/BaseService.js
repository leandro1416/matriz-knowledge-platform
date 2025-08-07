import { PaginationHelper } from '../utils/ApiResponse.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Serviço base que fornece operações CRUD comuns
 * Usa apenas dados reais do banco de dados
 */
export class BaseService {
    constructor(model) {
        this.model = model;
        this.modelName = model?.modelName || 'Resource';
    }

    /**
   * Listar recursos com paginação
   */
    async findAll(filter = {}, options = {}) {
        try {
            const { page, limit, skip } = PaginationHelper.fromQuery(options);
            const sort = PaginationHelper.getSortFromQuery(options);

            const total = await this.model.countDocuments(filter);
            const items = await this.model
                .find(filter)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .populate(options.populate || []);

            const pagination = PaginationHelper.createResponse(page, limit, total);

            logger.info(`${this.modelName} listados: ${items.length} de ${total}`);

            return { items, pagination };
        } catch (error) {
            logger.error(`Erro ao listar ${this.modelName}:`, error);
            throw error;
        }
    }

    /**
   * Buscar recurso por ID
   */
    async findById(id, options = {}) {
        try {
            const item = await this.model
                .findById(id)
                .populate(options.populate || []);

            if (!item) {
                throw AppError.notFound(this.modelName);
            }

            logger.info(`${this.modelName} encontrado: ${id}`);
            return item;
        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error(`Erro ao buscar ${this.modelName} por ID:`, error);
            throw error;
        }
    }

    /**
   * Buscar recurso por filtro único
   */
    async findOne(filter, options = {}) {
        try {
            const item = await this.model
                .findOne(filter)
                .populate(options.populate || []);

            return item; // Pode retornar null se não encontrar
        } catch (error) {
            logger.error(`Erro ao buscar ${this.modelName}:`, error);
            throw error;
        }
    }

    /**
   * Criar novo recurso
   */
    async create(data, options = {}) {
        try {
            const item = new this.model(data);
            await item.save();

            if (options.populate) {
                await item.populate(options.populate);
            }

            logger.success(`${this.modelName} criado: ${item._id}`);
            return item;
        } catch (error) {
            logger.error(`Erro ao criar ${this.modelName}:`, error);
            throw error;
        }
    }

    /**
   * Atualizar recurso
   */
    async update(id, data, options = {}) {
        try {
            // Adicionar timestamp de atualização
            data.updatedAt = new Date();

            const item = await this.model
                .findByIdAndUpdate(id, data, { 
                    new: true, 
                    runValidators: true 
                })
                .populate(options.populate || []);

            if (!item) {
                throw AppError.notFound(this.modelName);
            }

            logger.success(`${this.modelName} atualizado: ${id}`);
            return item;
        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error(`Erro ao atualizar ${this.modelName}:`, error);
            throw error;
        }
    }

    /**
   * Deletar recurso
   */
    async delete(id) {
        try {
            const item = await this.model.findByIdAndDelete(id);

            if (!item) {
                throw AppError.notFound(this.modelName);
            }

            logger.success(`${this.modelName} deletado: ${id}`);
            return item;
        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error(`Erro ao deletar ${this.modelName}:`, error);
            throw error;
        }
    }

    /**
   * Contar documentos
   */
    async count(filter = {}) {
        try {
            return await this.model.countDocuments(filter);
        } catch (error) {
            logger.error(`Erro ao contar ${this.modelName}:`, error);
            throw error;
        }
    }

    /**
   * Verificar se recurso existe
   */
    async exists(filter) {
        try {
            const count = await this.model.countDocuments(filter);
            return count > 0;
        } catch (error) {
            logger.error(`Erro ao verificar existência de ${this.modelName}:`, error);
            throw error;
        }
    }
}

export default BaseService;