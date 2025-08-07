import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { syncStrategicNoteMiddleware, syncDeleteMiddleware } from '../middlewares/obsidianSync.middleware.js';
import {
    list,
    create,
    read,
    update,
    remove
} from '../controllers/strategicNote.controller.js';

const router = Router();

// Middleware de autenticação opcional (só em produção)
const optionalAuth = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return auth(req, res, next);
    }
    next();
};

// Rotas com autenticação opcional
router.use(optionalAuth);

// CRUD completo com sincronização Obsidian
router.get('/', list);
router.post('/', syncStrategicNoteMiddleware, create);
router.get('/:id', read);
router.put('/:id', syncStrategicNoteMiddleware, update);
router.delete('/:id', syncDeleteMiddleware('strategic-note'), remove);

export default router; 