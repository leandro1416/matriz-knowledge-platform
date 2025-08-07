import AuthService from '../services/AuthService.js';
import { asyncHandler } from './asyncHandler.middleware.js';
import AppError from '../utils/AppError.js';

export default asyncHandler(async function auth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
  
    if (!token) {
        throw AppError.unauthorized('Token não fornecido');
    }

    const user = await AuthService.verifyToken(token);
    req.user = user;
  
    next();
}); 