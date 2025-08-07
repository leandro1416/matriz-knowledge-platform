import BaseService from './BaseService.js';
import StrategicNote from '../models/StrategicNote.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Serviço para gerenciamento de notas estratégicas
 */
class StrategicNoteService extends BaseService {
    constructor() {
        super(StrategicNote);
    }

    /**
   * Criar nota estratégica com validações específicas
   */
    async create(data, options = {}) {
        try {
            // Validações específicas
            if (!data.title || data.title.trim().length === 0) {
                throw AppError.validation('Título é obrigatório');
            }

            if (!data.targetAudience || data.targetAudience.trim().length === 0) {
                throw AppError.validation('Público-alvo é obrigatório');
            }

            if (!data.location || data.location.trim().length === 0) {
                throw AppError.validation('Localização é obrigatória');
            }

            // Definir status padrão se não fornecido
            if (!data.status) {
                data.status = 'draft';
            }

            // Validar status
            const validStatuses = ['draft', 'active', 'completed', 'archived'];
            if (!validStatuses.includes(data.status)) {
                throw AppError.validation(`Status deve ser um dos seguintes: ${validStatuses.join(', ')}`);
            }

            // Garantir que arrays existam
            data.objectives = data.objectives || [];
            data.pillars = data.pillars || [];
            data.contentSchedule = data.contentSchedule || [];
            data.productionWorkflow = data.productionWorkflow || [];
            data.metrics = data.metrics || [];
            data.growthLeverages = data.growthLeverages || [];
            data.accessibility = data.accessibility || [];
            data.tags = data.tags || [];

            const populateOptions = { populate: 'authorId' };
            const note = await super.create(data, populateOptions);

            logger.success(`Nota estratégica criada: ${note.title}`);
            return note;
        } catch (error) {
            logger.error('Erro ao criar nota estratégica:', error);
            throw error;
        }
    }

    /**
   * Listar notas com filtros específicos
   */
    async findAll(filter = {}, options = {}) {
        try {
            // Processar filtros específicos
            const processedFilter = { ...filter };

            // Converter filtro de autor se necessário
            if (filter.authorId && typeof filter.authorId === 'string') {
                processedFilter.authorId = filter.authorId;
            }

            const populateOptions = { 
                ...options, 
                populate: 'authorId' 
            };

            const result = await super.findAll(processedFilter, populateOptions);

            logger.info(`Notas estratégicas listadas: ${result.items.length}`);
            return result;
        } catch (error) {
            logger.error('Erro ao listar notas estratégicas:', error);
            throw error;
        }
    }

    /**
   * Atualizar nota estratégica com validações
   */
    async update(id, data, options = {}) {
        try {
            // Validar status se fornecido
            if (data.status) {
                const validStatuses = ['draft', 'active', 'completed', 'archived'];
                if (!validStatuses.includes(data.status)) {
                    throw AppError.validation(`Status deve ser um dos seguintes: ${validStatuses.join(', ')}`);
                }
            }

            // Validar campos obrigatórios se fornecidos
            if (data.title !== undefined && data.title.trim().length === 0) {
                throw AppError.validation('Título não pode estar vazio');
            }

            if (data.targetAudience !== undefined && data.targetAudience.trim().length === 0) {
                throw AppError.validation('Público-alvo não pode estar vazio');
            }

            if (data.location !== undefined && data.location.trim().length === 0) {
                throw AppError.validation('Localização não pode estar vazia');
            }

            const populateOptions = { 
                ...options, 
                populate: 'authorId' 
            };

            const updatedNote = await super.update(id, data, populateOptions);

            logger.success(`Nota estratégica atualizada: ${id}`);
            return updatedNote;
        } catch (error) {
            logger.error('Erro ao atualizar nota estratégica:', error);
            throw error;
        }
    }

    /**
   * Buscar notas por status
   */
    async findByStatus(status) {
        try {
            return await this.findAll({ status });
        } catch (error) {
            logger.error('Erro ao buscar notas por status:', error);
            throw error;
        }
    }

    /**
   * Buscar notas por autor
   */
    async findByAuthor(authorId) {
        try {
            return await this.findAll({ authorId });
        } catch (error) {
            logger.error('Erro ao buscar notas por autor:', error);
            throw error;
        }
    }

    /**
   * Buscar notas por tags
   */
    async findByTags(tags) {
        try {
            const notes = await this.model
                .find({ tags: { $in: tags } })
                .populate('authorId', 'username')
                .sort({ createdAt: -1 });

            return { items: notes, pagination: null };
        } catch (error) {
            logger.error('Erro ao buscar notas por tags:', error);
            throw error;
        }
    }

    /**
   * Arquivar nota estratégica
   */
    async archive(id) {
        try {
            return await this.update(id, { status: 'archived' });
        } catch (error) {
            logger.error('Erro ao arquivar nota estratégica:', error);
            throw error;
        }
    }

    /**
   * Ativar nota estratégica
   */
    async activate(id) {
        try {
            return await this.update(id, { status: 'active' });
        } catch (error) {
            logger.error('Erro ao ativar nota estratégica:', error);
            throw error;
        }
    }

    /**
   * Completar nota estratégica
   */
    async complete(id) {
        try {
            return await this.update(id, { status: 'completed' });
        } catch (error) {
            logger.error('Erro ao completar nota estratégica:', error);
            throw error;
        }
    }

    /**
   * Obter estatísticas das notas
   */
    async getStats() {
        try {
            const [total, drafts, active, completed, archived] = await Promise.all([
                this.count(),
                this.count({ status: 'draft' }),
                this.count({ status: 'active' }),
                this.count({ status: 'completed' }),
                this.count({ status: 'archived' })
            ]);

            return {
                total,
                byStatus: {
                    draft: drafts,
                    active,
                    completed,
                    archived
                }
            };
        } catch (error) {
            logger.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}

export default new StrategicNoteService();