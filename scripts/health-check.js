#!/usr/bin/env node

import { config } from '../src/config/index.js';

/**
 * Health check script para verificar se a aplicação está funcionando
 */
async function healthCheck() {
    // Lista expandida de portas para verificar
    const basePorts = [config.httpPort, ...config.fallbackPorts];
    const additionalPorts = [3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
    const ports = [...basePorts, ...additionalPorts];
    let serverFound = false;
    
    console.log('🔍 Verificando saúde da aplicação Matriz...\n');
    
    for (const port of ports) {
        try {
            const response = await fetch(`http://localhost:${port}/api/health`, {
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Servidor encontrado na porta ${port}`);
                console.log(`📊 Status: ${data.status}`);
                console.log(`💾 MongoDB: ${data.mongodb}`);
                console.log(`⏱️ Uptime: ${Math.floor(data.uptime)}s`);
                console.log(`🔧 Ambiente: ${data.environment}`);
                
                // Verificar endpoints principais
                await checkEndpoints(port);
                
                serverFound = true;
                break;
            }
        } catch (error) {
            // Continuar tentando outras portas
            continue;
        }
    }
    
    if (!serverFound) {
        console.log('❌ Nenhum servidor encontrado nas portas:', ports);
        process.exit(1);
    }
    
    console.log('\n🎉 Health check concluído com sucesso!');
}

async function checkEndpoints(port) {
    const endpoints = [
        '/api/status',
        '/api/ai/status',
        '/'
    ];
    
    console.log('\n🔍 Verificando endpoints:');
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`http://localhost:${port}${endpoint}`, {
                timeout: 3000
            });
            
            const status = response.ok ? '✅' : '❌';
            console.log(`  ${status} ${endpoint} (${response.status})`);
        } catch (error) {
            console.log(`  ❌ ${endpoint} (erro de conexão)`);
        }
    }
}

// Executar health check
healthCheck().catch(error => {
    console.error('❌ Erro no health check:', error.message);
    process.exit(1);
});