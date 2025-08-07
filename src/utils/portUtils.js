import net from 'net';

/**
 * Verifica se uma porta está disponível
 * @param {number} port - Porta a verificar
 * @returns {Promise<boolean>} true se disponível
 */
export const isPortAvailable = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        
        server.on('error', () => resolve(false));
    });
};

/**
 * Encontra a primeira porta disponível a partir de uma lista
 * @param {number[]} ports - Lista de portas para tentar
 * @returns {Promise<number|null>} Porta disponível ou null
 */
export const findAvailablePort = async (ports) => {
    for (const port of ports) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    return null;
};

/**
 * Encontra porta disponível próxima a uma porta base
 * @param {number} basePort - Porta base
 * @param {number} maxTries - Máximo de tentativas
 * @returns {Promise<number|null>} Porta disponível ou null
 */
export const findNearbyPort = async (basePort, maxTries = 10) => {
    const parsedBasePort = parseInt(basePort);
    if (isNaN(parsedBasePort) || parsedBasePort < 0 || parsedBasePort > 65535) {
        throw new Error(`Invalid base port: ${basePort}`);
    }
    
    const portsToTry = [];
    for (let i = 0; i < maxTries; i++) {
        const port = parsedBasePort + i;
        if (port <= 65535) {
            portsToTry.push(port);
        }
    }
    return await findAvailablePort(portsToTry);
};

export default {
    isPortAvailable,
    findAvailablePort,
    findNearbyPort
};