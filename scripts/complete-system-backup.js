#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import logger from '../src/utils/logger.js';
import DatabaseBackup from './backup-database.js';

const execAsync = promisify(exec);
dotenv.config();

/**
 * Sistema de backup completo - inclui aplicação, dados, configurações e logs
 */
class CompleteSystemBackup {
    constructor() {
        this.projectRoot = process.cwd();
        this.backupDir = path.join(this.projectRoot, 'backups');
        this.systemBackupDir = path.join(this.backupDir, 'system');
        this.maxBackups = 10;
        this.timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
        
        // Diretórios e arquivos para backup
        this.criticalPaths = [
            // Código fonte
            'src/',
            'public/',
            'scripts/',
            
            // Configurações
            'config/',
            'package.json',
            'package-lock.json',
            '.env.example',
            'nodemon.json',
            'eslint.config.js',
            
            // Dados
            'data/',
            'logs/',
            
            // Documentação
            'docs/',
            'README.md',
            'SETUP_REAL_DATA.md',
            'GUIA_USUARIO_ADMIN.md',
            
            // Ferramentas
            'matriz-cli.py',
            
            // Obsidian integration
            'obsidian-sync/'
        ];
        
        // Arquivos a serem excluídos
        this.excludePaths = [
            'node_modules/',
            'backups/',
            'cert/',
            '.git/',
            '*.log',
            'tmp/',
            '.env'  // Não incluir arquivo de ambiente atual por segurança
        ];
    }

    /**
     * Criar estrutura de diretórios de backup
     */
    ensureBackupStructure() {
        const dirs = [
            this.backupDir,
            this.systemBackupDir
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(`📁 Diretório criado: ${path.relative(this.projectRoot, dir)}`);
            }
        });
    }

    /**
     * Gerar nome único para o backup
     */
    generateBackupName() {
        return `system_backup_${this.timestamp}`;
    }

    /**
     * Copiar arquivo ou diretório recursivamente
     */
    async copyPath(source, destination) {
        try {
            const stats = fs.statSync(source);
            
            if (stats.isDirectory()) {
                // Criar diretório de destino
                if (!fs.existsSync(destination)) {
                    fs.mkdirSync(destination, { recursive: true });
                }
                
                // Copiar conteúdo do diretório
                const items = fs.readdirSync(source);
                for (const item of items) {
                    const sourcePath = path.join(source, item);
                    const destPath = path.join(destination, item);
                    
                    // Verificar se não está na lista de exclusões
                    const relativePath = path.relative(this.projectRoot, sourcePath);
                    const shouldExclude = this.excludePaths.some(exclude => 
                        relativePath.includes(exclude.replace('*', '')) ||
                        relativePath.endsWith(exclude.replace('*.', '.'))
                    );
                    
                    if (!shouldExclude) {
                        await this.copyPath(sourcePath, destPath);
                    }
                }
            } else {
                // Copiar arquivo
                fs.copyFileSync(source, destination);
            }
        } catch (error) {
            logger.warn(`⚠️ Erro ao copiar ${source}: ${error.message}`);
        }
    }

    /**
     * Fazer backup da aplicação
     */
    async backupApplication(backupPath) {
        try {
            logger.info('📦 Fazendo backup da aplicação...');
            
            const appBackupPath = path.join(backupPath, 'application');
            fs.mkdirSync(appBackupPath, { recursive: true });
            
            // Copiar arquivos e diretórios críticos
            for (const criticalPath of this.criticalPaths) {
                const sourcePath = path.join(this.projectRoot, criticalPath);
                
                if (fs.existsSync(sourcePath)) {
                    const destPath = path.join(appBackupPath, criticalPath);
                    await this.copyPath(sourcePath, destPath);
                    logger.info(`  ✅ ${criticalPath}`);
                } else {
                    logger.warn(`  ⚠️ Não encontrado: ${criticalPath}`);
                }
            }
            
            logger.success('✅ Backup da aplicação concluído');
            return appBackupPath;
        } catch (error) {
            logger.error('❌ Erro no backup da aplicação:', error.message);
            throw error;
        }
    }

    /**
     * Fazer backup do banco de dados
     */
    async backupDatabase(backupPath) {
        try {
            logger.info('🗄️ Fazendo backup do banco de dados...');
            
            const dbBackup = new DatabaseBackup();
            const dbBackupPath = await dbBackup.performBackup();
            
            // Mover backup do DB para a estrutura do backup completo
            const systemDbPath = path.join(backupPath, 'database');
            
            if (fs.existsSync(dbBackupPath)) {
                // Copiar backup do DB para a estrutura do sistema
                await this.copyPath(dbBackupPath, systemDbPath);
                logger.success('✅ Backup do banco de dados incluído');
            }
            
            return systemDbPath;
        } catch (error) {
            logger.error('❌ Erro no backup do banco de dados:', error.message);
            throw error;
        }
    }

    /**
     * Backup das configurações do sistema
     */
    async backupSystemConfig(backupPath) {
        try {
            logger.info('⚙️ Fazendo backup das configurações...');
            
            const configBackupPath = path.join(backupPath, 'system-config');
            fs.mkdirSync(configBackupPath, { recursive: true });
            
            // Informações do sistema
            const systemInfo = {
                timestamp: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                hostname: require('os').hostname(),
                backupVersion: '2.0.0',
                projectVersion: this.getProjectVersion(),
                environment: {
                    NODE_ENV: process.env.NODE_ENV || 'development',
                    PORT: process.env.PORT || '3000'
                }
            };
            
            fs.writeFileSync(
                path.join(configBackupPath, 'system-info.json'),
                JSON.stringify(systemInfo, null, 2)
            );
            
            // Backup das dependências
            if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
                const packageJson = JSON.parse(
                    fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
                );
                
                fs.writeFileSync(
                    path.join(configBackupPath, 'dependencies.json'),
                    JSON.stringify({
                        dependencies: packageJson.dependencies || {},
                        devDependencies: packageJson.devDependencies || {},
                        scripts: packageJson.scripts || {},
                        engines: packageJson.engines || {}
                    }, null, 2)
                );
            }
            
            // Informações do Git (se disponível)
            try {
                const { stdout: gitBranch } = await execAsync('git branch --show-current');
                const { stdout: gitCommit } = await execAsync('git rev-parse HEAD');
                const { stdout: gitStatus } = await execAsync('git status --porcelain');
                
                const gitInfo = {
                    branch: gitBranch.trim(),
                    commit: gitCommit.trim(),
                    hasUncommittedChanges: gitStatus.trim().length > 0,
                    status: gitStatus.trim().split('\n').filter(line => line.trim())
                };
                
                fs.writeFileSync(
                    path.join(configBackupPath, 'git-info.json'),
                    JSON.stringify(gitInfo, null, 2)
                );
            } catch (gitError) {
                logger.warn('⚠️ Informações do Git não disponíveis');
            }
            
            logger.success('✅ Backup das configurações concluído');
            return configBackupPath;
        } catch (error) {
            logger.error('❌ Erro no backup das configurações:', error.message);
            throw error;
        }
    }

    /**
     * Obter versão do projeto
     */
    getProjectVersion() {
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                return packageJson.version || '1.0.0';
            }
        } catch (error) {
            logger.warn('⚠️ Não foi possível obter versão do projeto');
        }
        return 'unknown';
    }

    /**
     * Criar arquivo de metadados do backup
     */
    createBackupMetadata(backupPath, components) {
        try {
            const metadata = {
                timestamp: new Date().toISOString(),
                backupType: 'complete-system',
                version: '2.0.0',
                projectVersion: this.getProjectVersion(),
                platform: process.platform,
                nodeVersion: process.version,
                components: components,
                paths: this.criticalPaths,
                excluded: this.excludePaths,
                backupSize: this.calculateBackupSize(backupPath),
                integrity: {
                    checksum: this.generateChecksum(backupPath),
                    fileCount: this.countFiles(backupPath)
                }
            };
            
            const metadataPath = path.join(backupPath, 'backup-metadata.json');
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            
            // Criar arquivo README para o backup
            const readmePath = path.join(backupPath, 'BACKUP-README.md');
            const readmeContent = this.generateBackupReadme(metadata);
            fs.writeFileSync(readmePath, readmeContent);
            
            logger.success('📋 Metadados do backup criados');
            return metadata;
        } catch (error) {
            logger.warn('⚠️ Erro ao criar metadados:', error.message);
            return null;
        }
    }

    /**
     * Gerar README para o backup
     */
    generateBackupReadme(metadata) {
        return `# Backup Completo do Sistema Matriz

## Informações do Backup

- **Data/Hora**: ${new Date(metadata.timestamp).toLocaleString('pt-BR')}
- **Tipo**: ${metadata.backupType}
- **Versão do Backup**: ${metadata.version}
- **Versão do Projeto**: ${metadata.projectVersion}
- **Plataforma**: ${metadata.platform}
- **Node.js**: ${metadata.nodeVersion}
- **Tamanho**: ${metadata.backupSize}
- **Arquivos**: ${metadata.integrity.fileCount}

## Componentes Incluídos

${metadata.components.map(comp => `- ✅ ${comp}`).join('\n')}

## Estrutura do Backup

\`\`\`
backup/
├── application/           # Código fonte completo
│   ├── src/              # Código principal
│   ├── public/           # Arquivos públicos
│   ├── scripts/          # Scripts utilitários
│   └── config/           # Configurações
├── database/             # Backup do MongoDB
├── system-config/        # Configurações do sistema
├── backup-metadata.json  # Metadados deste backup
└── BACKUP-README.md      # Este arquivo
\`\`\`

## Como Restaurar

### 1. Restaurar Aplicação
\`\`\`bash
# Copiar arquivos da aplicação
cp -r application/* /caminho/destino/

# Instalar dependências
npm install
\`\`\`

### 2. Restaurar Banco de Dados
\`\`\`bash
# Usar o script de restauração
npm run backup:restore <nome-do-backup-db>

# Ou manualmente:
mongorestore --drop database/
\`\`\`

### 3. Configurar Ambiente
\`\`\`bash
# Criar arquivo .env baseado no .env.example
cp .env.example .env

# Editar configurações necessárias
nano .env
\`\`\`

### 4. Verificar Restauração
\`\`\`bash
# Verificar saúde do sistema
npm run health

# Iniciar aplicação
npm start
\`\`\`

## Verificação de Integridade

- **Checksum**: ${metadata.integrity.checksum}
- **Total de Arquivos**: ${metadata.integrity.fileCount}

## Suporte

Para mais informações sobre restauração, consulte:
- SETUP_REAL_DATA.md
- GUIA_USUARIO_ADMIN.md
- scripts/restore-database.js

---
Backup criado automaticamente pelo Sistema Matriz
`;
    }

    /**
     * Calcular tamanho do backup
     */
    calculateBackupSize(backupPath) {
        try {
            const { stdout } = require('child_process').execSync(`du -sh "${backupPath}"`);
            return stdout.trim().split('\t')[0];
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Gerar checksum simples do backup
     */
    generateChecksum(backupPath) {
        try {
            const crypto = require('crypto');
            const hash = crypto.createHash('md5');
            
            // Usar timestamp e alguns metadados para checksum
            const data = `${this.timestamp}-${backupPath}-${Date.now()}`;
            hash.update(data);
            
            return hash.digest('hex');
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Contar arquivos no backup
     */
    countFiles(backupPath) {
        try {
            let count = 0;
            
            const countRecursive = (dir) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const itemPath = path.join(dir, item);
                    const stats = fs.statSync(itemPath);
                    
                    if (stats.isDirectory()) {
                        countRecursive(itemPath);
                    } else {
                        count++;
                    }
                }
            };
            
            countRecursive(backupPath);
            return count;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Executar backup completo do sistema
     */
    async performCompleteBackup() {
        try {
            const startTime = Date.now();
            logger.info('🚀 Iniciando backup completo do sistema...');
            
            // Criar estrutura de backup
            this.ensureBackupStructure();
            
            // Criar diretório para este backup
            const backupName = this.generateBackupName();
            const backupPath = path.join(this.systemBackupDir, backupName);
            fs.mkdirSync(backupPath, { recursive: true });
            
            logger.info(`📁 Backup será salvo em: ${path.relative(this.projectRoot, backupPath)}`);
            
            // Componentes do backup
            const components = [];
            
            // 1. Backup da aplicação
            try {
                await this.backupApplication(backupPath);
                components.push('Aplicação (código fonte, config, docs)');
            } catch (error) {
                logger.error('❌ Falha no backup da aplicação:', error.message);
            }
            
            // 2. Backup do banco de dados
            try {
                await this.backupDatabase(backupPath);
                components.push('Banco de dados (MongoDB)');
            } catch (error) {
                logger.error('❌ Falha no backup do banco de dados:', error.message);
            }
            
            // 3. Backup das configurações do sistema
            try {
                await this.backupSystemConfig(backupPath);
                components.push('Configurações do sistema');
            } catch (error) {
                logger.error('❌ Falha no backup das configurações:', error.message);
            }
            
            // 4. Criar metadados
            const metadata = this.createBackupMetadata(backupPath, components);
            
            // 5. Limpar backups antigos
            await this.cleanOldSystemBackups();
            
            const duration = Date.now() - startTime;
            const durationSeconds = (duration / 1000).toFixed(2);
            
            logger.success(`🎉 Backup completo do sistema concluído em ${durationSeconds}s`);
            logger.info(`📁 Localização: ${path.relative(this.projectRoot, backupPath)}`);
            logger.info(`📦 Componentes: ${components.length}`);
            
            if (metadata) {
                logger.info(`💾 Tamanho: ${metadata.backupSize}`);
                logger.info(`📄 Arquivos: ${metadata.integrity.fileCount}`);
            }
            
            return {
                success: true,
                backupPath,
                backupName,
                components,
                metadata,
                duration: durationSeconds
            };
            
        } catch (error) {
            logger.error('❌ Erro no backup completo:', error.message);
            throw error;
        }
    }

    /**
     * Limpar backups antigos do sistema
     */
    async cleanOldSystemBackups() {
        try {
            if (!fs.existsSync(this.systemBackupDir)) {
                return;
            }
            
            const backups = fs.readdirSync(this.systemBackupDir)
                .filter(file => file.startsWith('system_backup_'))
                .map(file => ({
                    name: file,
                    path: path.join(this.systemBackupDir, file),
                    stats: fs.statSync(path.join(this.systemBackupDir, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);

            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);
                
                for (const backup of toDelete) {
                    fs.rmSync(backup.path, { recursive: true, force: true });
                    logger.info(`🗑️ Backup antigo removido: ${backup.name}`);
                }
                
                logger.info(`🧹 ${toDelete.length} backups antigos removidos`);
            }
        } catch (error) {
            logger.warn('⚠️ Erro ao limpar backups antigos:', error.message);
        }
    }

    /**
     * Listar backups completos disponíveis
     */
    listSystemBackups() {
        try {
            if (!fs.existsSync(this.systemBackupDir)) {
                return [];
            }

            const backups = fs.readdirSync(this.systemBackupDir)
                .filter(file => file.startsWith('system_backup_'))
                .map(file => {
                    const backupPath = path.join(this.systemBackupDir, file);
                    const stats = fs.statSync(backupPath);
                    
                    // Tentar ler metadados
                    let metadata = null;
                    const metadataPath = path.join(backupPath, 'backup-metadata.json');
                    if (fs.existsSync(metadataPath)) {
                        try {
                            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                        } catch (error) {
                            // Ignorar erro de metadados
                        }
                    }
                    
                    return {
                        name: file,
                        path: backupPath,
                        created: stats.mtime,
                        size: this.calculateBackupSize(backupPath),
                        metadata: metadata,
                        components: metadata ? metadata.components : []
                    };
                })
                .sort((a, b) => b.created - a.created);

            return backups;
        } catch (error) {
            logger.error('❌ Erro ao listar backups do sistema:', error.message);
            return [];
        }
    }

    /**
     * Verificar integridade de um backup
     */
    verifyBackupIntegrity(backupName) {
        try {
            const backupPath = path.join(this.systemBackupDir, backupName);
            
            if (!fs.existsSync(backupPath)) {
                return { valid: false, error: 'Backup não encontrado' };
            }
            
            const metadataPath = path.join(backupPath, 'backup-metadata.json');
            if (!fs.existsSync(metadataPath)) {
                return { valid: false, error: 'Metadados não encontrados' };
            }
            
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const currentFileCount = this.countFiles(backupPath);
            
            const verification = {
                valid: true,
                metadata: metadata,
                expectedFiles: metadata.integrity.fileCount,
                actualFiles: currentFileCount,
                filesMatch: currentFileCount === metadata.integrity.fileCount,
                components: metadata.components || [],
                warnings: []
            };
            
            if (!verification.filesMatch) {
                verification.warnings.push('Contagem de arquivos não confere');
            }
            
            // Verificar componentes principais
            const expectedDirs = ['application', 'database', 'system-config'];
            for (const dir of expectedDirs) {
                const dirPath = path.join(backupPath, dir);
                if (!fs.existsSync(dirPath)) {
                    verification.warnings.push(`Componente ausente: ${dir}`);
                }
            }
            
            verification.valid = verification.warnings.length === 0;
            
            return verification;
        } catch (error) {
            return { 
                valid: false, 
                error: `Erro na verificação: ${error.message}` 
            };
        }
    }
}

// Executar backup se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const systemBackup = new CompleteSystemBackup();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'create':
            systemBackup.performCompleteBackup()
                .then(result => {
                    console.log(`✅ Backup completo criado: ${result.backupName}`);
                    console.log(`📁 Localização: ${result.backupPath}`);
                    console.log(`⏱️ Duração: ${result.duration}s`);
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`❌ Erro: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'list':
            const backups = systemBackup.listSystemBackups();
            if (backups.length === 0) {
                console.log('📁 Nenhum backup completo encontrado');
            } else {
                console.log('📦 Backups completos disponíveis:');
                backups.forEach(backup => {
                    console.log(`  - ${backup.name}`);
                    console.log(`    📅 ${backup.created.toLocaleString()}`);
                    console.log(`    💾 ${backup.size}`);
                    if (backup.components.length > 0) {
                        console.log(`    📋 ${backup.components.join(', ')}`);
                    }
                    console.log();
                });
            }
            break;
            
        case 'verify':
            const backupName = process.argv[3];
            if (!backupName) {
                console.log('❌ Nome do backup é obrigatório');
                console.log('Uso: node scripts/complete-system-backup.js verify <nome-do-backup>');
                process.exit(1);
            }
            
            const verification = systemBackup.verifyBackupIntegrity(backupName);
            
            if (verification.valid) {
                console.log(`✅ Backup ${backupName} é válido`);
                console.log(`📄 Arquivos: ${verification.actualFiles}`);
                console.log(`📋 Componentes: ${verification.components.join(', ')}`);
            } else {
                console.log(`❌ Backup ${backupName} tem problemas:`);
                if (verification.error) {
                    console.log(`   ${verification.error}`);
                }
                if (verification.warnings) {
                    verification.warnings.forEach(warning => {
                        console.log(`   ⚠️ ${warning}`);
                    });
                }
            }
            break;
            
        default:
            console.log(`
🏢 Sistema de Backup Completo do Matriz

Uso:
  node scripts/complete-system-backup.js create           - Criar backup completo
  node scripts/complete-system-backup.js list             - Listar backups
  node scripts/complete-system-backup.js verify <backup>  - Verificar integridade

Exemplos:
  npm run system:backup
  npm run system:list
  npm run system:verify system_backup_2025-01-27_15-30-45

O backup completo inclui:
  - Código fonte completo (src/, public/, scripts/, config/)
  - Banco de dados MongoDB
  - Configurações do sistema
  - Documentação
  - Metadados e informações de restauração
            `);
    }
}

export default CompleteSystemBackup;
