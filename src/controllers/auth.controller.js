import AuthService from '../services/AuthService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    return ApiResponse.success(res, {
        token: result.token,
        user: result.user
    }, 'Login realizado com sucesso');
});

export const register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const result = await AuthService.register({ username, email, password });

    return ApiResponse.created(res, {
        token: result.token,
        user: result.user
    }, 'Usuário registrado com sucesso');
});

export const me = asyncHandler(async (req, res) => {
    // O usuário já foi validado pelo middleware auth
    const user = req.user;

    return ApiResponse.success(res, { user }, 'Dados do usuário recuperados com sucesso');
}); 