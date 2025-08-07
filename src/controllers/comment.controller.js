import CommentService from '../services/CommentService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';

// Listar comentários de um post
export const list = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const queryOptions = req.query;

    const result = await CommentService.findByPost(postId, queryOptions);
  
    return ApiResponse.successWithPagination(
        res, 
        result.items, 
        result.pagination, 
        'Comentários recuperados com sucesso'
    );
});

// Criar comentário
export const create = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content, parentId } = req.body;

    const commentData = {
        postId,
        content,
        parentId,
        authorId: req.user._id
    };

    const comment = await CommentService.create(commentData);
  
    return ApiResponse.created(res, comment, 'Comentário criado com sucesso');
});

// Atualizar comentário
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    // Verificar se o comentário existe e se o usuário tem permissão
    const existingComment = await CommentService.findById(id);
  
    if (existingComment.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a atualizar este comentário');
    }

    const updatedComment = await CommentService.update(id, { content });
  
    return ApiResponse.success(res, updatedComment, 'Comentário atualizado com sucesso');
});

// Deletar comentário
export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se o comentário existe e se o usuário tem permissão
    const existingComment = await CommentService.findById(id);
  
    if (existingComment.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a deletar este comentário');
    }

    await CommentService.delete(id);
  
    return ApiResponse.success(res, null, 'Comentário deletado com sucesso');
});

// Toggle like em comentário
export const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const updatedComment = await CommentService.toggleLike(id, req.user._id);
  
    return ApiResponse.success(res, updatedComment, 'Like atualizado com sucesso');
});

// Listar respostas de um comentário
export const listReplies = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const queryOptions = req.query;

    const result = await CommentService.findReplies(id, queryOptions);
  
    return ApiResponse.successWithPagination(
        res, 
        result.items, 
        result.pagination, 
        'Respostas recuperadas com sucesso'
    );
});

// Obter estatísticas de comentários
export const stats = asyncHandler(async (req, res) => {
    const statistics = await CommentService.getStats();
  
    return ApiResponse.success(res, statistics, 'Estatísticas recuperadas com sucesso');
});

// Listar comentários recentes
export const recent = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
  
    const result = await CommentService.findRecent(parseInt(limit));
  
    return ApiResponse.success(res, result.items, 'Comentários recentes recuperados');
});