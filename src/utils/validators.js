import { body, param, query, validationResult } from 'express-validator';

// Validações para autenticação
export const validateRegistration = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username deve ter entre 3 e 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username deve conter apenas letras, números e underscore'),
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('firstName')
        .isLength({ min: 2, max: 50 })
        .withMessage('Nome deve ter entre 2 e 50 caracteres'),
    body('lastName')
        .isLength({ min: 2, max: 50 })
        .withMessage('Sobrenome deve ter entre 2 e 50 caracteres')
];

export const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Senha é obrigatória')
];

// Validações para posts
export const validatePost = [
    body('title')
        .isLength({ min: 3, max: 200 })
        .withMessage('Título deve ter entre 3 e 200 caracteres')
        .trim(),
    body('content')
        .isLength({ min: 10, max: 10000 })
        .withMessage('Conteúdo deve ter entre 10 e 10000 caracteres'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags deve ser um array'),
    body('tags.*')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Cada tag deve ter entre 1 e 30 caracteres'),
    body('category')
        .optional()
        .isIn(['tecnologia', 'sociedade', 'filosofia', 'inovacao', 'reflexoes', 'comunidade'])
        .withMessage('Categoria inválida'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Status inválido')
];

export const validatePostUpdate = [
    param('id')
        .isMongoId()
        .withMessage('ID do post inválido'),
    body('title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('Título deve ter entre 3 e 200 caracteres')
        .trim(),
    body('content')
        .optional()
        .isLength({ min: 10, max: 10000 })
        .withMessage('Conteúdo deve ter entre 10 e 10000 caracteres'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags deve ser um array'),
    body('category')
        .optional()
        .isIn(['tecnologia', 'sociedade', 'filosofia', 'inovacao', 'reflexoes', 'comunidade'])
        .withMessage('Categoria inválida'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Status inválido')
];

// Validações para comentários
export const validateComment = [
    body('content')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Comentário deve ter entre 1 e 2000 caracteres')
        .trim(),
    body('postId')
        .isMongoId()
        .withMessage('ID do post inválido'),
    body('parentId')
        .optional()
        .isMongoId()
        .withMessage('ID do comentário pai inválido')
];

export const validateCommentUpdate = [
    param('id')
        .isMongoId()
        .withMessage('ID do comentário inválido'),
    body('content')
        .isLength({ min: 1, max: 2000 })
        .withMessage('Comentário deve ter entre 1 e 2000 caracteres')
        .trim()
];

// Validações para usuários
export const validateUserProfile = [
    body('firstName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nome deve ter entre 2 e 50 caracteres')
        .trim(),
    body('lastName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Sobrenome deve ter entre 2 e 50 caracteres')
        .trim(),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio deve ter no máximo 500 caracteres'),
    body('socialLinks.website')
        .optional()
        .isURL()
        .withMessage('Website deve ser uma URL válida'),
    body('socialLinks.twitter')
        .optional()
        .matches(/^@?[a-zA-Z0-9_]{1,15}$/)
        .withMessage('Twitter deve ser um username válido'),
    body('socialLinks.linkedin')
        .optional()
        .matches(/^[a-zA-Z0-9-]+$/)
        .withMessage('LinkedIn deve ser um username válido'),
    body('socialLinks.github')
        .optional()
        .matches(/^[a-zA-Z0-9-]+$/)
        .withMessage('GitHub deve ser um username válido')
];

export const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Senha atual é obrigatória'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Nova senha deve ter pelo menos 6 caracteres'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Confirmação de senha não confere');
            }
            return true;
        })
];

// Validações para newsletter
export const validateNewsletter = [
    body('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    body('interests')
        .optional()
        .isArray()
        .withMessage('Interesses deve ser um array'),
    body('interests.*')
        .optional()
        .isIn(['tecnologia', 'filosofia', 'sociedade', 'inovacao', 'pensamento-critico'])
        .withMessage('Interesse inválido')
];

// Validações para busca
export const validateSearch = [
    query('q')
        .isLength({ min: 2, max: 100 })
        .withMessage('Termo de busca deve ter entre 2 e 100 caracteres'),
    query('type')
        .optional()
        .isIn(['posts', 'users', 'comments', 'all'])
        .withMessage('Tipo de busca inválido'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite deve ser entre 1 e 100')
];

// Validações para paginação
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite deve ser entre 1 e 100'),
    query('sort')
        .optional()
        .isIn(['newest', 'oldest', 'popular', 'relevance'])
        .withMessage('Ordenação inválida')
];

// Middleware para tratar erros de validação
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }
    next();
};

// Validações para upload de arquivos
export const validateFileUpload = [
    body('type')
        .isIn(['image', 'document'])
        .withMessage('Tipo de arquivo inválido'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Descrição deve ter no máximo 500 caracteres')
];

// Validações para configurações
export const validateSiteConfig = [
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('description')
        .isLength({ min: 10, max: 500 })
        .withMessage('Descrição deve ter entre 10 e 500 caracteres'),
    body('author.name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do autor deve ter entre 2 e 100 caracteres'),
    body('author.email')
        .isEmail()
        .withMessage('Email do autor inválido')
]; 