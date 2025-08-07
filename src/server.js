import fs from 'fs';
import https from 'https';
import http from 'http';
import app from './app.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import { findNearbyPort } from './utils/portUtils.js';

// Verificar se certificados SSL existem
const certExists = fs.existsSync('./cert/matriz.local-key.pem') && 
                   fs.existsSync('./cert/matriz.local.pem');

let httpsServer = null;
let httpServer = null;

// Criar servidor HTTPS se certificados existirem
if (certExists) {
    const httpsOptions = {
        key: fs.readFileSync('./cert/matriz.local-key.pem'),
        cert: fs.readFileSync('./cert/matriz.local.pem')
    };
    
    httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.listen(config.port, '0.0.0.0', () => {
        logger.success(`🚀 Servidor HTTPS rodando em https://matriz.local:${config.port}`);
        logger.info(`📊 Status: https://matriz.local:${config.port}/api/status`);
    });

    httpsServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            logger.warn(`⚠️ Porta ${config.port} em uso. HTTPS desabilitado.`);
        } else {
            logger.error('Erro no servidor HTTPS:', error);
        }
    });
} else {
    logger.warn('⚠️ Certificados SSL não encontrados. Servidor HTTPS não iniciado.');
}

// Criar servidor HTTP
httpServer = http.createServer(app);

httpServer.listen(config.httpPort, '0.0.0.0', () => {
    logger.success(`🚀 Servidor HTTP rodando em http://localhost:${config.httpPort}`);
    logger.info(`📊 Status: http://localhost:${config.httpPort}/api/status`);
    logger.info(`🌐 Frontend: http://localhost:${config.httpPort}`);
    logger.info(`🔧 Ambiente: ${config.nodeEnv}`);
});

httpServer.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
        logger.warn(`⚠️ Porta ${config.httpPort} em uso. Procurando porta disponível...`);
        
        const availablePort = await findNearbyPort(parseInt(config.httpPort) + 1, 10);
        if (availablePort) {
            logger.info(`🔄 Tentando porta ${availablePort}...`);
            httpServer.listen(availablePort, '0.0.0.0', () => {
                logger.success(`🚀 Servidor HTTP rodando em http://localhost:${availablePort}`);
                logger.info(`📊 Status: http://localhost:${availablePort}/api/status`);
            });
        } else {
            logger.error('❌ Nenhuma porta disponível encontrada.');
            throw new Error('No available ports found');
        }
    } else {
        logger.error('Erro no servidor HTTP:', error);
    }
});

// Graceful shutdown
const shutdown = (signal) => {
    logger.info(`${signal} recebido, fechando servidores...`);
    
    if (httpsServer) {
        httpsServer.close(() => {
            logger.success('Servidor HTTPS fechado');
        });
    }
    
    httpServer.close(() => {
        logger.success('Servidor HTTP fechado');
        throw new Error('Server shutdown completed');
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default { httpsServer, httpServer }; 