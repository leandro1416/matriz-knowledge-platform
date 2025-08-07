import StrategicNoteService from '../services/StrategicNoteService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';

// Listar notas estratégicas
export const list = asyncHandler(async (req, res) => {
    const { status, authorId, ...queryOptions } = req.query;
  
    const filter = {};
    if (status) filter.status = status;
    if (authorId) filter.authorId = authorId;

    const result = await StrategicNoteService.findAll(filter, queryOptions);
  
    return ApiResponse.successWithPagination(
        res, 
        result.items, 
        result.pagination, 
        'Notas estratégicas recuperadas com sucesso'
    );
});

// Criar nota estratégica
export const create = asyncHandler(async (req, res) => {
    const {
        title,
        content,
        targetAudience,
        location,
        objectives,
        pillars,
        contentSchedule,
        productionWorkflow,
        metrics,
        growthLeverages,
        accessibility,
        tags
    } = req.body;

    const noteData = {
        title,
        content,
        targetAudience,
        location,
        objectives,
        pillars,
        contentSchedule,
        productionWorkflow,
        metrics,
        growthLeverages,
        accessibility,
        authorId: req.user._id,
        tags
    };

    const note = await StrategicNoteService.create(noteData);
  
    return ApiResponse.created(res, note, 'Nota estratégica criada com sucesso');
});

// Ler nota estratégica por ID
export const read = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const note = await StrategicNoteService.findById(id);
  
    return ApiResponse.success(res, note, 'Nota estratégica recuperada com sucesso');
});

// Atualizar nota estratégica
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        content,
        targetAudience,
        location,
        objectives,
        pillars,
        contentSchedule,
        productionWorkflow,
        metrics,
        growthLeverages,
        accessibility,
        tags,
        status
    } = req.body;

    // Verificar se a nota existe e se o usuário tem permissão
    const existingNote = await StrategicNoteService.findById(id);
  
    if (existingNote.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a atualizar esta nota');
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (targetAudience !== undefined) updates.targetAudience = targetAudience;
    if (location !== undefined) updates.location = location;
    if (objectives !== undefined) updates.objectives = objectives;
    if (pillars !== undefined) updates.pillars = pillars;
    if (contentSchedule !== undefined) updates.contentSchedule = contentSchedule;
    if (productionWorkflow !== undefined) updates.productionWorkflow = productionWorkflow;
    if (metrics !== undefined) updates.metrics = metrics;
    if (growthLeverages !== undefined) updates.growthLeverages = growthLeverages;
    if (accessibility !== undefined) updates.accessibility = accessibility;
    if (tags !== undefined) updates.tags = tags;
    if (status !== undefined) updates.status = status;

    const updatedNote = await StrategicNoteService.update(id, updates);
  
    return ApiResponse.success(res, updatedNote, 'Nota estratégica atualizada com sucesso');
});

// Deletar nota estratégica
export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se a nota existe e se o usuário tem permissão
    const existingNote = await StrategicNoteService.findById(id);
  
    if (existingNote.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a deletar esta nota');
    }

    await StrategicNoteService.delete(id);
  
    return ApiResponse.success(res, null, 'Nota estratégica deletada com sucesso');
});

// Arquivar nota estratégica
export const archive = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se o usuário tem permissão
    const existingNote = await StrategicNoteService.findById(id);
  
    if (existingNote.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a arquivar esta nota');
    }

    const archivedNote = await StrategicNoteService.archive(id);
  
    return ApiResponse.success(res, archivedNote, 'Nota estratégica arquivada com sucesso');
});

// Ativar nota estratégica
export const activate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se o usuário tem permissão
    const existingNote = await StrategicNoteService.findById(id);
  
    if (existingNote.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a ativar esta nota');
    }

    const activatedNote = await StrategicNoteService.activate(id);
  
    return ApiResponse.success(res, activatedNote, 'Nota estratégica ativada com sucesso');
});

// Completar nota estratégica
export const complete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se o usuário tem permissão
    const existingNote = await StrategicNoteService.findById(id);
  
    if (existingNote.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw AppError.unauthorized('Não autorizado a completar esta nota');
    }

    const completedNote = await StrategicNoteService.complete(id);
  
    return ApiResponse.success(res, completedNote, 'Nota estratégica marcada como completa');
});

// Obter estatísticas das notas
export const stats = asyncHandler(async (req, res) => {
    const statistics = await StrategicNoteService.getStats();
  
    return ApiResponse.success(res, statistics, 'Estatísticas recuperadas com sucesso');
});

// Buscar notas por tags
export const findByTags = asyncHandler(async (req, res) => {
    const { tags } = req.query;
  
    if (!tags) {
        throw AppError.validation('Parameter tags é obrigatório');
    }

    const tagArray = tags.split(',').map(tag => tag.trim());
    const result = await StrategicNoteService.findByTags(tagArray);
  
    return ApiResponse.success(res, result.items, 'Notas encontradas por tags');
});