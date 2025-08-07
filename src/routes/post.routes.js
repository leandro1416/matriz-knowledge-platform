import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { syncBlogPostMiddleware, syncDeleteMiddleware } from '../middlewares/obsidianSync.middleware.js';
import * as c from '../controllers/post.controller.js';

const r = Router();

// Rotas públicas
r.get('/', c.list);
r.get('/:slug', c.read);

// Rotas protegidas com sincronização Obsidian
r.post('/', auth, syncBlogPostMiddleware, c.create);
r.put('/:id', auth, syncBlogPostMiddleware, c.update);
r.delete('/:id', auth, syncDeleteMiddleware('blog-post'), c.remove);
r.post('/:id/like', auth, c.toggleLike);

export default r; 