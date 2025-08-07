#!/usr/bin/env node


import { config } from '../src/config/index.js';

/**
 * Script para mostrar informações do servidor em execução
 */
async function getServerInfo() {
    console.log('🔍 Buscando informações do servidor Matriz...\n');
    
    const basePorts = [config.httpPort, ...config.fallbackPorts];
    const additionalPorts = [3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
    const ports = [...basePorts, ...additionalPorts];
    
    let serverFound = false;
    
    for (const port of ports) {
        try {
            // Tentar conectar ao servidor
            const response = await fetch(`http://localhost:${port}/api/status`, {
                timeout: 2000
            });
            
            if (response.ok) {
                const data = await response.json();
                
                console.log(`🚀 **SERVIDOR ENCONTRADO**`);
                console.log(`   Porta: ${port}`);
                console.log(`   URL: http://localhost:${port}`);
                console.log(`   Status: ${data.ok ? '✅ OK' : '❌ ERROR'}`);
                console.log(`   Ambiente: ${data.environment}`);
                console.log(`   MongoDB: ${data.mongodb}`);
                console.log(`   Versão: ${data.version}`);
                
                console.log(`\n🌐 **LINKS ÚTEIS**`);
                console.log(`   Frontend: http://localhost:${port}`);
                console.log(`   API Status: http://localhost:${port}/api/status`);
                console.log(`   Health Check: http://localhost:${port}/api/health`);
                console.log(`   AI Status: http://localhost:${port}/api/ai/status`);
                
                // Verificar performance
                const start = Date.now();
                await fetch(`http://localhost:${port}/api/health`);
                const responseTime = Date.now() - start;
                
                console.log(`\n⚡ **PERFORMANCE**`);
                console.log(`   Tempo de resposta: ${responseTime}ms`);
                console.log(`   Performance: ${responseTime < 100 ? '🚀 Excelente' : responseTime < 500 ? '✅ Boa' : '⚠️ Regular'}`);
                
                // Comandos úteis
                console.log(`\n🛠️ **COMANDOS ÚTEIS**`);
                console.log(`   Parar servidor: Ctrl+C ou pkill -f "node src/server.js"`);
                console.log(`   Health check: npm run health`);
                console.log(`   Reiniciar: npm start`);
                console.log(`   Desenvolvimento: npm run dev`);
                
                serverFound = true;
                break;
            }
        } catch (error) {
            // Continuar tentando outras portas
            continue;
        }
    }
    
    if (!serverFound) {
        console.log('❌ **SERVIDOR NÃO ENCONTRADO**');
        console.log('   Nenhum servidor Matriz detectado nas portas:', ports.slice(0, 10).join(', '), '...');
        console.log('\n🚀 Para iniciar o servidor:');
        console.log('   npm start');
        console.log('\n🔧 Para desenvolvimento:');
        console.log('   npm run dev');
    }
}

// Executar
getServerInfo().catch(error => {
    console.error('❌ Erro ao obter informações do servidor:', error.message);
    process.exit(1);
});