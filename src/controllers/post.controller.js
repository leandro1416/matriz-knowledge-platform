import PostService from '../services/PostService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';

// Listar posts
export const list = asyncHandler(async (req, res) => {
    const { published, ...queryOptions } = req.query;
  
    const filter = {};
    if (published !== undefined) {
        filter.published = published;
    }

    const result = await PostService.findAll(filter, queryOptions);
  
    return ApiResponse.successWithPagination(
        res, 
        result.items, 
        result.pagination, 
        'Posts recuperados com sucesso'
    );
});

// Ler post por slug
export const read = asyncHandler(async (req, res) => {
    const { slug } = req.params;
  
    const post = await PostService.findBySlug(slug);
  
    return ApiResponse.success(res, post, 'Post recuperado com sucesso');
});

// Criar post
export const create = asyncHandler(async (req, res) => {
    const { title, content, tags, published } = req.body;
  
    const postData = {
        authorId: req.user._id,
        title,
        content,
        tags: tags || [],
        published: published || false
    };

    const post = await PostService.create(postData);
  
    return ApiResponse.created(res, post, 'Post criado com sucesso');
});

// Atualizar post
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, content, tags, published } = req.body;

    // Verificar se o post existe e se o usuário tem permissão
    const existingPost = await PostService.findById(id);
  
    if (existingPost.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a atualizar este post');
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (published !== undefined) updates.published = published;

    const updatedPost = await PostService.update(id, updates);
  
    return ApiResponse.success(res, updatedPost, 'Post atualizado com sucesso');
});

// Deletar post
export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se o post existe e se o usuário tem permissão
    const existingPost = await PostService.findById(id);
  
    if (existingPost.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a deletar este post');
    }

    await PostService.delete(id);
  
    return ApiResponse.success(res, null, 'Post deletado com sucesso');
});

// Toggle like
export const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const updatedPost = await PostService.toggleLike(id, req.user._id);
  
    return ApiResponse.success(res, updatedPost, 'Like atualizado com sucesso');
}); 