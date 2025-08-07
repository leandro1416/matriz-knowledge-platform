import BaseService from './BaseService.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

/**
 * Serviço para gerenciamento de autenticação e usuários
 */
class AuthService extends BaseService {
    constructor() {
        super(User);
    }

    /**
   * Fazer login do usuário
   */
    async login(email, password) {
        try {
            if (!email || !password) {
                throw AppError.validation('Email e senha são obrigatórios');
            }

            // Buscar usuário no banco de dados
            const user = await this.model.findOne({ email });

            if (!user) {
                throw AppError.unauthorized('Credenciais inválidas');
            }

            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw AppError.unauthorized('Credenciais inválidas');
            }

            // Gerar token
            const token = this.generateToken(user);
      
            // Remover senha do objeto de resposta
            const userResponse = {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            };

            logger.success(`Login realizado: ${user.email}`);
            return {
                user: userResponse,
                token
            };

        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error('Erro no login:', error);
            throw AppError.unauthorized('Credenciais inválidas');
        }
    }

    /**
   * Registrar novo usuário
   */
    async register(userData) {
        try {
            const { email, password, username } = userData;

            if (!email || !password || !username) {
                throw AppError.validation('Email, senha e username são obrigatórios');
            }

            // Validar formato do email
            if (!this.isValidEmail(email)) {
                throw AppError.validation('Formato de email inválido');
            }

            // Validar força da senha
            if (password.length < 6) {
                throw AppError.validation('Senha deve ter pelo menos 6 caracteres');
            }

            // Verificar se email já existe
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw AppError.conflict('Email já está em uso');
            }

            // Criar usuário
            const newUserData = {
                email,
                password,
                username,
                role: 'user' // Usuários normais por padrão
            };

            const user = await this.create(newUserData);

            // Gerar token
            const token = this.generateToken(user);

            // Remover senha do objeto de resposta
            const userResponse = {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            };

            logger.success(`Usuário registrado: ${user.email}`);
            return {
                user: userResponse,
                token
            };

        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error('Erro no registro:', error);
            throw error;
        }
    }

    /**
   * Buscar usuário por email
   */
    async findByEmail(email) {
        try {
            return await this.model.findOne({ email });
        } catch (error) {
            logger.error('Erro ao buscar usuário por email:', error);
            return null;
        }
    }

    /**
   * Buscar usuário por ID (sem senha)
   */
    async findById(id, options = {}) {
        try {
            const user = await super.findById(id, options);
      
            if (user && user.password) {
                // Remover senha do resultado
                const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
                return userWithoutPassword;
            }

            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error('Erro ao buscar usuário por ID:', error);
            throw error;
        }
    }

    /**
   * Verificar token JWT
   */
    async verifyToken(token) {
        try {
            if (!token) {
                throw AppError.unauthorized('Token não fornecido');
            }

            const decoded = jwt.verify(token, config.jwtSecret);
      
            // Buscar usuário real no banco de dados
            const user = await this.findById(decoded.userId);
            if (!user) {
                throw AppError.unauthorized('Usuário não encontrado');
            }

            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
      
            if (error.name === 'JsonWebTokenError') {
                throw AppError.unauthorized('Token inválido');
            }
      
            if (error.name === 'TokenExpiredError') {
                throw AppError.unauthorized('Token expirado');
            }

            logger.error('Erro ao verificar token:', error);
            throw AppError.unauthorized('Token inválido');
        }
    }

    /**
   * Gerar token JWT
   */
    generateToken(user) {
        return jwt.sign(
            { 
                userId: user._id, 
                email: user.email 
            },
            config.jwtSecret,
            { expiresIn: '24h' }
        );
    }

    /**
   * Validar formato de email
   */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
   * Atualizar senha
   */
    async updatePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.model.findById(userId);
            if (!user) {
                throw AppError.notFound('Usuário');
            }

            // Verificar senha atual
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                throw AppError.unauthorized('Senha atual incorreta');
            }

            // Validar nova senha
            if (newPassword.length < 6) {
                throw AppError.validation('Nova senha deve ter pelo menos 6 caracteres');
            }

            // Hash da nova senha
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await this.update(userId, { password: hashedPassword });

            logger.success(`Senha atualizada para usuário: ${user.email}`);
            return true;
        } catch (error) {
            if (error instanceof AppError) throw error;
      
            logger.error('Erro ao atualizar senha:', error);
            throw error;
        }
    }
}

export default new AuthService();