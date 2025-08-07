import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Disable global mongoose buffering to prevent background rejections
mongoose.set('bufferCommands', false);
dotenv.config();

class DatabaseService {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected) {
                logger.info('✅ MongoDB já está conectado');
                return true;
            }

            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/matriz';
            
            // Wrap MongoDB connection with explicit promise handling and durability configuration
            const connectPromise = mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                // Minimal pool size to prevent background connections
                maxPoolSize: 5,
                minPoolSize: 1,
                maxIdleTimeMS: 30000,
                bufferCommands: false,
                // Configurações de durabilidade
                writeConcern: {
                    w: 'majority',
                    j: true, // Journal habilitado para durabilidade
                    wtimeout: 1000
                },
                readConcern: { level: 'majority' },
                // Retry automático
                retryWrites: true,
                retryReads: true
            });

            this.connection = await connectPromise;

            this.isConnected = true;
            logger.success('✅ Conectado ao MongoDB');
            
            // Configurar listeners de eventos
            mongoose.connection.on('error', (err) => {
                logger.error('❌ Erro na conexão MongoDB:', err.message || err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('⚠️ MongoDB desconectado');
                this.isConnected = false;
            });

            return this.isConnected;
        } catch (error) {
            logger.error('❌ Erro ao conectar ao MongoDB:', error.message || error);
            logger.info('⚠️ Sistema iniciando em modo mock (MongoDB não disponível)');
            this.isConnected = false;
            return false; // Não terminar aplicação, continuar em modo mock
        }
    }

    async disconnect() {
        try {
            if (this.connection && this.isConnected) {
                await mongoose.disconnect();
                this.isConnected = false;
                logger.success('✅ Desconectado do MongoDB');
            }
        } catch (error) {
            logger.error('❌ Erro ao desconectar do MongoDB:', error);
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState
        };
    }

    getConnection() {
        return mongoose.connection;
    }

    isDatabaseConnected() {
        return this.isConnected;
    }

    async healthCheck() {
        try {
            const status = this.getStatus();
            return {
                connected: status.isConnected,
                status: status.isConnected ? 'healthy' : 'disconnected'
            };
        } catch (error) {
            return {
                connected: false,
                status: 'error',
                error: error.message
            };
        }
    }
}

export default new DatabaseService(); 