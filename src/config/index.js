import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const config = {
    // Servidor
    port: process.env.PORT || 3000,
    httpPort: process.env.HTTP_PORT || 3001,
    fallbackPorts: [3002, 3003, 3004, 3005], // Portas alternativas
    nodeEnv: process.env.NODE_ENV || 'development',
  
    // Banco de dados
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/matriz',
  
    // Segurança
    sessionSecret: process.env.SESSION_SECRET || 'matriz-secret-key',
    jwtSecret: process.env.JWT_SECRET || 'matriz-jwt-secret',
  
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        aiWindowMs: 15 * 60 * 1000, // 15 minutos
        aiMax: 200 // 200 requests por 15 minutos para IA
    },
  
    // CORS
    cors: {
        production: ['https://matriz.local', 'https://www.matriz.local'],
        development: ['http://localhost:3000', 'https://matriz.local']
    },
  
    // Sessão
    session: {
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 dia
        }
    },
  
    // Caminhos
    paths: {
        public: path.join(__dirname, '../../public'),
        views: path.join(__dirname, '../../public'),
        uploads: path.join(__dirname, '../../uploads')
    },
  
    // IA
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000
    },
  
    // Logs
    logs: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log'
    }
};

export default config; 