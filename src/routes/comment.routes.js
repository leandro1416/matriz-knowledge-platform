import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import * as c from '../controllers/comment.controller.js';

const r = Router();

// Rotas públicas
r.get('/post/:postId', c.list);

// Rotas protegidas
r.post('/post/:postId', auth, c.create);
r.put('/:id', auth, c.update);
r.delete('/:id', auth, c.remove);
r.post('/:id/like', auth, c.toggleLike);

export default r; 