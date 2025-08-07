import { body, param, query, validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

/**
 * Middleware para processar resultados da validação
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => {
            return `${error.path}: ${error.msg}`;
        });
    
        throw AppError.validation(errorMessages.join(', '));
    }
  
    next();
};

/**
 * Validações para autenticação
 */
export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Formato de email inválido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    handleValidationErrors
];

export const validateRegister = [
    body('username')
        .isLength({ min: 2, max: 50 })
        .withMessage('Username deve ter entre 2 e 50 caracteres')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username pode conter apenas letras, números, _ e -'),
    body('email')
        .isEmail()
        .withMessage('Formato de email inválido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('Senha deve conter pelo menos uma letra e um número'),
    handleValidationErrors
];

/**
 * Validações para posts
 */
export const validateCreatePost = [
    body('title')
        .isLength({ min: 3, max: 200 })
        .withMessage('Título deve ter entre 3 e 200 caracteres')
        .trim(),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Conteúdo deve ter pelo menos 10 caracteres')
        .trim(),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags devem ser um array'),
    body('tags.*')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Cada tag deve ter entre 1 e 30 caracteres'),
    body('published')
        .optional()
        .isBoolean()
        .withMessage('Published deve ser um boolean'),
    handleValidationErrors
];

export const validateUpdatePost = [
    body('title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('Título deve ter entre 3 e 200 caracteres')
        .trim(),
    body('content')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Conteúdo deve ter pelo menos 10 caracteres')
        .trim(),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags devem ser um array'),
    body('tags.*')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Cada tag deve ter entre 1 e 30 caracteres'),
    body('published')
        .optional()
        .isBoolean()
        .withMessage('Published deve ser um boolean'),
    handleValidationErrors
];

/**
 * Validações para comentários
 */
export const validateCreateComment = [
    body('content')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comentário deve ter entre 1 e 1000 caracteres')
        .trim(),
    body('parentId')
        .optional()
        .isMongoId()
        .withMessage('Parent ID deve ser um ID válido do MongoDB'),
    handleValidationErrors
];

export const validateUpdateComment = [
    body('content')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comentário deve ter entre 1 e 1000 caracteres')
        .trim(),
    handleValidationErrors
];

/**
 * Validações para notas estratégicas
 */
export const validateCreateStrategicNote = [
    body('title')
        .isLength({ min: 3, max: 200 })
        .withMessage('Título deve ter entre 3 e 200 caracteres')
        .trim(),
    body('content')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Conteúdo deve ter pelo menos 10 caracteres')
        .trim(),
    body('targetAudience')
        .isLength({ min: 3, max: 500 })
        .withMessage('Público-alvo deve ter entre 3 e 500 caracteres')
        .trim(),
    body('location')
        .isLength({ min: 2, max: 100 })
        .withMessage('Localização deve ter entre 2 e 100 caracteres')
        .trim(),
    body('status')
        .optional()
        .isIn(['draft', 'active', 'completed', 'archived'])
        .withMessage('Status deve ser: draft, active, completed ou archived'),
    body('objectives')
        .optional()
        .isArray()
        .withMessage('Objetivos devem ser um array'),
    body('objectives.*')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Cada objetivo deve ter entre 1 e 200 caracteres'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags devem ser um array'),
    body('tags.*')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Cada tag deve ter entre 1 e 30 caracteres'),
    handleValidationErrors
];

export const validateUpdateStrategicNote = [
    body('title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('Título deve ter entre 3 e 200 caracteres')
        .trim(),
    body('content')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Conteúdo deve ter pelo menos 10 caracteres')
        .trim(),
    body('targetAudience')
        .optional()
        .isLength({ min: 3, max: 500 })
        .withMessage('Público-alvo deve ter entre 3 e 500 caracteres')
        .trim(),
    body('location')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Localização deve ter entre 2 e 100 caracteres')
        .trim(),
    body('status')
        .optional()
        .isIn(['draft', 'active', 'completed', 'archived'])
        .withMessage('Status deve ser: draft, active, completed ou archived'),
    body('objectives')
        .optional()
        .isArray()
        .withMessage('Objetivos devem ser um array'),
    body('objectives.*')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Cada objetivo deve ter entre 1 e 200 caracteres'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags devem ser um array'),
    body('tags.*')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Cada tag deve ter entre 1 e 30 caracteres'),
    handleValidationErrors
];

/**
 * Validações para parâmetros de URL
 */
export const validateMongoId = (paramName = 'id') => [
    param(paramName)
        .isMongoId()
        .withMessage(`${paramName} deve ser um ID válido do MongoDB`),
    handleValidationErrors
];

export const validateSlug = [
    param('slug')
        .isLength({ min: 1, max: 100 })
        .withMessage('Slug deve ter entre 1 e 100 caracteres')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug pode conter apenas letras minúsculas, números e hífens'),
    handleValidationErrors
];

/**
 * Validações para query parameters
 */
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page deve ser um número inteiro maior que 0'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit deve ser um número inteiro entre 1 e 100'),
    handleValidationErrors
];

export const validateSort = [
    query('sort')
        .optional()
        .matches(/^[a-zA-Z0-9_,-]+$/)
        .withMessage('Sort deve conter apenas letras, números, vírgulas e hífens'),
    handleValidationErrors
];

/**
 * Validações para IA
 */
export const validateAIPrompt = [
    body('prompt')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Prompt deve ter entre 1 e 2000 caracteres')
        .trim(),
    handleValidationErrors
];

/**
 * Validação genérica para IDs
 */
export const validateIds = (fields) => {
    const validators = fields.map(field => 
        body(field)
            .optional()
            .isMongoId()
            .withMessage(`${field} deve ser um ID válido do MongoDB`)
    );
  
    return [...validators, handleValidationErrors];
};

/**
 * Sanitização de campos de texto
 */
export const sanitizeTextFields = (fields) => {
    return fields.map(field => 
        body(field)
            .optional()
            .trim()
            .escape() // Escape HTML characters
    );
};

/**
 * Validação de status genérico
 */
export const validateStatus = (validStatuses) => [
    body('status')
        .optional()
        .isIn(validStatuses)
        .withMessage(`Status deve ser um dos seguintes: ${validStatuses.join(', ')}`),
    handleValidationErrors
];

export default {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validateCreatePost,
    validateUpdatePost,
    validateCreateComment,
    validateUpdateComment,
    validateCreateStrategicNote,
    validateUpdateStrategicNote,
    validateMongoId,
    validateSlug,
    validatePagination,
    validateSort,
    validateAIPrompt,
    validateIds,
    sanitizeTextFields,
    validateStatus
};