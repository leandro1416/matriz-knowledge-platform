import session from 'express-session';
import MongoStore from 'connect-mongo';
import { config } from '../config/index.js';

// Configuração base da sessão
const sessionConfig = {
    secret: config.sessionSecret,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
    cookie: config.session.cookie
};

// Adicionar store do MongoDB apenas se estiver disponível
export const configureSession = () => {
    try {
        sessionConfig.store = MongoStore.create({
            mongoUrl: config.mongodbUri,
            ttl: 24 * 60 * 60 // 1 dia
        });
        console.log('✅ MongoDB configurado para sessões');
    } catch (error) {
        console.log('⚠️ MongoDB não disponível para sessões, usando memória');
    }
    
    return session(sessionConfig);
};

export default configureSession; 