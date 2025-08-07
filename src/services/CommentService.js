import BaseService from './BaseService.js';
import Comment from '../models/Comment.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Serviço para gerenciamento de comentários
 */
class CommentService extends BaseService {
    constructor() {
        super(Comment);
    }

    /**
   * Criar comentário com validações específicas
   */
    async create(data, options = {}) {
        try {
            // Validações específicas
            if (!data.content || data.content.trim().length === 0) {
                throw AppError.validation('Conteúdo do comentário é obrigatório');
            }

            if (data.content.length > 1000) {
                throw AppError.validation('Comentário não pode ter mais de 1000 caracteres');
            }

            if (!data.postId) {
                throw AppError.validation('ID do post é obrigatório');
            }

            if (!data.authorId) {
                throw AppError.validation('ID do autor é obrigatório');
            }

            // Validar se parentId existe (se fornecido)
            if (data.parentId) {
                const parentComment = await this.findById(data.parentId);
                if (!parentComment) {
                    throw AppError.notFound('Comentário pai não encontrado');
                }
            }

            const populateOptions = { 
                populate: ['authorId', 'parentId'] 
            };
      
            const comment = await super.create(data, populateOptions);

            logger.success(`Comentário criado: ${comment._id} no post ${data.postId}`);
            return comment;
        } catch (error) {
            logger.error('Erro ao criar comentário:', error);
            throw error;
        }
    }

    /**
   * Listar comentários com filtros específicos
   */
    async findAll(filter = {}, options = {}) {
        try {
            const populateOptions = { 
                ...options, 
                populate: ['authorId', 'parentId'] 
            };

            const result = await super.findAll(filter, populateOptions);

            logger.info(`Comentários listados: ${result.items.length}`);
            return result;
        } catch (error) {
            logger.error('Erro ao listar comentários:', error);
            throw error;
        }
    }

    /**
   * Buscar comentários por post
   */
    async findByPost(postId, options = {}) {
        try {
            const filter = { postId };
            return await this.findAll(filter, options);
        } catch (error) {
            logger.error('Erro ao buscar comentários por post:', error);
            throw error;
        }
    }

    /**
   * Buscar comentários por autor
   */
    async findByAuthor(authorId, options = {}) {
        try {
            const filter = { authorId };
            return await this.findAll(filter, options);
        } catch (error) {
            logger.error('Erro ao buscar comentários por autor:', error);
            throw error;
        }
    }

    /**
   * Buscar respostas de um comentário
   */
    async findReplies(commentId, options = {}) {
        try {
            const filter = { parentId: commentId };
            return await this.findAll(filter, options);
        } catch (error) {
            logger.error('Erro ao buscar respostas:', error);
            throw error;
        }
    }

    /**
   * Atualizar comentário com validações
   */
    async update(id, data, options = {}) {
        try {
            // Validar conteúdo se fornecido
            if (data.content !== undefined) {
                if (data.content.trim().length === 0) {
                    throw AppError.validation('Conteúdo do comentário não pode estar vazio');
                }
        
                if (data.content.length > 1000) {
                    throw AppError.validation('Comentário não pode ter mais de 1000 caracteres');
                }
            }

            const populateOptions = { 
                ...options, 
                populate: ['authorId', 'parentId'] 
            };

            const updatedComment = await super.update(id, data, populateOptions);

            logger.success(`Comentário atualizado: ${id}`);
            return updatedComment;
        } catch (error) {
            logger.error('Erro ao atualizar comentário:', error);
            throw error;
        }
    }

    /**
   * Toggle like no comentário
   */
    async toggleLike(commentId, userId) {
        try {
            const comment = await this.findById(commentId);
      
            if (!comment.likes) {
                comment.likes = [];
            }

            const userIndex = comment.likes.indexOf(userId);
      
            if (userIndex > -1) {
                // Remove like
                comment.likes.splice(userIndex, 1);
            } else {
                // Adiciona like
                comment.likes.push(userId);
            }

            return await this.update(commentId, { likes: comment.likes });
        } catch (error) {
            logger.error('Erro ao toggle like do comentário:', error);
            throw error;
        }
    }

    /**
   * Deletar comentário e suas respostas
   */
    async delete(id) {
        try {
            // Buscar e deletar todas as respostas primeiro
            const replies = await this.findReplies(id);
      
            if (replies.items && replies.items.length > 0) {
                for (const reply of replies.items) {
                    await super.delete(reply._id);
                }
            }

            // Deletar o comentário principal
            const deletedComment = await super.delete(id);

            logger.success(`Comentário e ${replies.items?.length || 0} respostas deletados: ${id}`);
            return deletedComment;
        } catch (error) {
            logger.error('Erro ao deletar comentário:', error);
            throw error;
        }
    }

    /**
   * Obter estatísticas de comentários
   */
    async getStats() {
        try {
            const total = await this.count();
            const topLevelComments = await this.count({ parentId: null });
            const replies = total - topLevelComments;

            return {
                total,
                topLevelComments,
                replies,
                averageRepliesPerComment: topLevelComments > 0 ? (replies / topLevelComments).toFixed(2) : 0
            };
        } catch (error) {
            logger.error('Erro ao obter estatísticas de comentários:', error);
            throw error;
        }
    }

    /**
   * Buscar comentários recentes
   */
    async findRecent(limit = 10) {
        try {
            const options = {
                limit,
                sort: { createdAt: -1 }
            };

            return await this.findAll({}, options);
        } catch (error) {
            logger.error('Erro ao buscar comentários recentes:', error);
            throw error;
        }
    }
}

export default new CommentService();