import BaseService from './BaseService.js';
import Post from '../models/Post.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Serviço para gerenciamento de posts
 */
class PostService extends BaseService {
    constructor() {
        super(Post);
    }

    /**
   * Buscar post por slug
   */
    async findBySlug(slug) {
        try {
            const post = await this.model
                .findOne({ slug })
                .populate('authorId', 'username');

            if (!post) {
                throw AppError.notFound('Post');
            }

            return post;
        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error('Erro ao buscar post por slug:', error);
            throw error;
        }
    }

    /**
   * Criar post com validações específicas
   */
    async create(data, options = {}) {
        try {
            // Gerar slug se não fornecido
            if (!data.slug && data.title) {
                data.slug = this.generateSlug(data.title);
            }

            // Verificar se slug já existe
            const existingPost = await this.findOne({ slug: data.slug });
            if (existingPost) {
                throw AppError.conflict('Slug já existe');
            }

            const populateOptions = { populate: 'authorId' };
            const post = await super.create(data, populateOptions);

            logger.success(`Post criado: ${post.title}`);
            return post;
        } catch (error) {
            logger.error('Erro ao criar post:', error);
            throw error;
        }
    }

    /**
   * Listar posts com filtros específicos
   */
    async findAll(filter = {}, options = {}) {
        try {
            // Converter filtro de published string para boolean
            if (filter.published !== undefined) {
                filter.published = filter.published === 'true';
            }

            const populateOptions = { 
                ...options, 
                populate: 'authorId' 
            };

            return await super.findAll(filter, populateOptions);
        } catch (error) {
            logger.error('Erro ao listar posts:', error);
            throw error;
        }
    }

    /**
   * Atualizar post com validações
   */
    async update(id, data, options = {}) {
        try {
            // Se mudando o título, regenerar slug
            if (data.title && !data.slug) {
                data.slug = this.generateSlug(data.title);
        
                // Verificar se novo slug já existe em outro post
                const existingPost = await this.findOne({ 
                    slug: data.slug, 
                    _id: { $ne: id } 
                });
        
                if (existingPost) {
                    throw AppError.conflict('Slug já existe');
                }
            }

            const populateOptions = { 
                ...options, 
                populate: 'authorId' 
            };

            return await super.update(id, data, populateOptions);
        } catch (error) {
            logger.error('Erro ao atualizar post:', error);
            throw error;
        }
    }

    /**
   * Toggle like no post
   */
    async toggleLike(postId, userId) {
        try {
            const post = await this.findById(postId);
      
            if (!post.likes) {
                post.likes = [];
            }

            const userIndex = post.likes.indexOf(userId);
      
            if (userIndex > -1) {
                // Remove like
                post.likes.splice(userIndex, 1);
            } else {
                // Adiciona like
                post.likes.push(userId);
            }

            return await this.update(postId, { likes: post.likes });
        } catch (error) {
            logger.error('Erro ao toggle like do post:', error);
            throw error;
        }
    }

    /**
   * Gerar slug a partir do título
   */
    generateSlug(title) {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
}

export default new PostService();