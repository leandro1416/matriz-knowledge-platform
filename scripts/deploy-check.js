#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Script para verificar se o projeto está pronto para deploy
 */
function deployCheck() {
    console.log('🚀 Verificando prontidão para deploy...\n');
    
    const checks = [
        {
            name: 'package.json existe',
            check: () => fs.existsSync('package.json'),
            critical: true
        },
        {
            name: '.env.example existe',
            check: () => fs.existsSync('.env.example'),
            critical: false
        },
        {
            name: 'README.md existe',
            check: () => fs.existsSync('README.md'),
            critical: false
        },
        {
            name: 'Estrutura src/ válida',
            check: () => fs.existsSync('src/app.js') && fs.existsSync('src/server.js'),
            critical: true
        },
        {
            name: 'Scripts essenciais no package.json',
            check: () => {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                return pkg.scripts?.start && pkg.scripts?.setup;
            },
            critical: true
        },
        {
            name: 'Dependências básicas instaladas',
            check: () => fs.existsSync('node_modules'),
            critical: true
        },
        {
            name: 'Logs directory existe',
            check: () => fs.existsSync('logs'),
            critical: false
        },
        {
            name: 'Health check script existe',
            check: () => fs.existsSync('scripts/health-check.js'),
            critical: false
        }
    ];
    
    let passed = 0;
    let failed = 0;
    let criticalFailed = 0;
    
    console.log('📋 **CHECKLIST DE DEPLOY**\n');
    
    checks.forEach(check => {
        const result = check.check();
        const icon = result ? '✅' : '❌';
        const priority = check.critical ? '[CRÍTICO]' : '[OPCIONAL]';
        
        console.log(`   ${icon} ${check.name} ${priority}`);
        
        if (result) {
            passed++;
        } else {
            failed++;
            if (check.critical) {
                criticalFailed++;
            }
        }
    });
    
    console.log(`\n📊 **RESUMO**`);
    console.log(`   ✅ Passou: ${passed}`);
    console.log(`   ❌ Falhou: ${failed}`);
    console.log(`   🚨 Críticos falharam: ${criticalFailed}`);
    
    if (criticalFailed === 0) {
        console.log(`\n🎉 **PRONTO PARA DEPLOY!**`);
        console.log(`   O projeto passou em todos os checks críticos.`);
        
        console.log(`\n🚀 **PASSOS PARA DEPLOY**:`);
        console.log(`   1. Configure variáveis de ambiente:`);
        console.log(`      - NODE_ENV=production`);
        console.log(`      - MONGODB_URI=<sua-uri-mongodb>`);
        console.log(`      - JWT_SECRET=<chave-secreta-forte>`);
        console.log(`      - SESSION_SECRET=<outra-chave-secreta>`);
        console.log(`      - OPENAI_API_KEY=<sua-chave-openai>`);
        
        console.log(`\n   2. Instale dependências:`);
        console.log(`      npm install --production`);
        
        console.log(`\n   3. Configure banco de dados:`);
        console.log(`      npm run setup`);
        
        console.log(`\n   4. Inicie servidor:`);
        console.log(`      npm start`);
        
        console.log(`\n   5. Verifique saúde:`);
        console.log(`      npm run health`);
        
    } else {
        console.log(`\n🚨 **NÃO ESTÁ PRONTO PARA DEPLOY**`);
        console.log(`   ${criticalFailed} check(s) crítico(s) falharam.`);
        console.log(`   Corrija os problemas antes do deploy.`);
        process.exit(1);
    }
    
    // Informações adicionais
    console.log(`\n📝 **INFORMAÇÕES ADICIONAIS**:`);
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log(`   Nome: ${pkg.name}`);
        console.log(`   Versão: ${pkg.version}`);
        console.log(`   Dependências: ${Object.keys(pkg.dependencies || {}).length}`);
        console.log(`   Scripts: ${Object.keys(pkg.scripts || {}).length}`);
    } catch (error) {
        console.log(`   ❌ Erro ao ler package.json`);
    }
    
    // Tamanho do projeto
    try {
        const stats = fs.statSync('.');
        console.log(`   Modificado: ${stats.mtime.toISOString().split('T')[0]}`);
    } catch (error) {
        // Ignorar erro
    }
}

// Executar verificação
deployCheck();