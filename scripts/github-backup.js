#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import logger from '../src/utils/logger.js';

const execAsync = promisify(exec);
dotenv.config();

/**
 * Sistema de backup para GitHub
 * Sincroniza todo o código e dados para o repositório remoto
 */
class GitHubBackup {
    constructor() {
        this.projectRoot = process.cwd();
        this.repositoryUrl = 'https://github.com/leandro1416/matriz-knowledge-platform.git';
        this.backupBranch = 'main';
        this.timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
    }

    /**
     * Verificar se o Git está configurado
     */
    async verifyGitSetup() {
        try {
            // Verificar se é um repositório Git
            await execAsync('git status');
            
            // Verificar se há remote configurado
            const { stdout: remotes } = await execAsync('git remote -v');
            
            if (!remotes.includes('origin')) {
                logger.info('🔗 Configurando remote origin...');
                await execAsync(`git remote add origin ${this.repositoryUrl}`);
            }
            
            // Verificar configuração do usuário
            try {
                await execAsync('git config user.name');
                await execAsync('git config user.email');
            } catch (error) {
                logger.warn('⚠️ Configuração do Git não encontrada');
                logger.info('💡 Configure com: git config --global user.name "Seu Nome"');
                logger.info('💡 Configure com: git config --global user.email "seu@email.com"');
            }
            
            return true;
        } catch (error) {
            if (error.message.includes('not a git repository')) {
                logger.info('📂 Inicializando repositório Git...');
                await execAsync('git init');
                await execAsync(`git remote add origin ${this.repositoryUrl}`);
                return true;
            }
            throw error;
        }
    }

    /**
     * Preparar arquivos para commit
     */
    async prepareFiles() {
        try {
            logger.info('📋 Preparando arquivos para backup...');
            
            // Criar ou atualizar .gitignore
            await this.ensureGitignore();
            
            // Criar arquivo de informações do backup
            await this.createBackupInfo();
            
            // Adicionar todos os arquivos relevantes
            await execAsync('git add .');
            
            logger.success('✅ Arquivos preparados para commit');
        } catch (error) {
            logger.error('❌ Erro ao preparar arquivos:', error.message);
            throw error;
        }
    }

    /**
     * Garantir que .gitignore está configurado corretamente
     */
    async ensureGitignore() {
        const gitignorePath = path.join(this.projectRoot, '.gitignore');
        
        const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.development

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Certificates and keys
cert/
*.key
*.crt
*.pem

# Temporary files
tmp/
temp/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Backup files (locais são mantidos, mas não versionados)
backups/

# Large data files (manter estrutura, não dados grandes)
data/backups/*.json
data/blockchain.json

# Keep structure but ignore large files
!data/backups/.gitkeep
!data/.gitkeep
!logs/.gitkeep
`;

        fs.writeFileSync(gitignorePath, gitignoreContent);
        logger.info('📝 .gitignore atualizado');
    }

    /**
     * Criar arquivo de informações do backup
     */
    async createBackupInfo() {
        try {
            const backupInfo = {
                timestamp: new Date().toISOString(),
                backupType: 'github-sync',
                version: '1.0.0',
                platform: process.platform,
                nodeVersion: process.version,
                projectVersion: this.getProjectVersion(),
                branch: await this.getCurrentBranch(),
                lastSync: new Date().toISOString(),
                repository: this.repositoryUrl,
                description: 'Backup completo do sistema Matriz Knowledge Platform',
                components: [
                    'Código fonte completo',
                    'Configurações da aplicação',
                    'Scripts de manutenção',
                    'Documentação',
                    'Estrutura de dados',
                    'Integração Obsidian'
                ],
                instructions: {
                    clone: `git clone ${this.repositoryUrl}`,
                    setup: 'npm install && npm run setup',
                    start: 'npm start',
                    development: 'npm run dev'
                }
            };

            const backupInfoPath = path.join(this.projectRoot, 'BACKUP-INFO.json');
            fs.writeFileSync(backupInfoPath, JSON.stringify(backupInfo, null, 2));
            
            // Criar também um README atualizado com informações de backup
            await this.updateBackupReadme(backupInfo);
            
            logger.info('📋 Informações de backup criadas');
        } catch (error) {
            logger.warn('⚠️ Erro ao criar informações de backup:', error.message);
        }
    }

    /**
     * Atualizar README com informações de backup
     */
    async updateBackupReadme(backupInfo) {
        const readmePath = path.join(this.projectRoot, 'BACKUP-STATUS.md');
        
        const readmeContent = `# 🔄 Status do Backup - Matriz Knowledge Platform

## 📊 Última Sincronização

- **Data/Hora**: ${new Date(backupInfo.timestamp).toLocaleString('pt-BR')}
- **Tipo**: Backup completo no GitHub
- **Branch**: ${backupInfo.branch}
- **Versão**: ${backupInfo.projectVersion}
- **Node.js**: ${backupInfo.nodeVersion}
- **Plataforma**: ${backupInfo.platform}

## 🚀 Repositório

\`\`\`bash
${backupInfo.repository}
\`\`\`

## 📦 Componentes Incluídos

${backupInfo.components.map(comp => `- ✅ ${comp}`).join('\n')}

## 🔧 Como Usar Este Backup

### 1. Clonar o Repositório
\`\`\`bash
git clone ${backupInfo.repository}
cd matriz-knowledge-platform
\`\`\`

### 2. Instalar Dependências
\`\`\`bash
npm install
\`\`\`

### 3. Configurar Ambiente
\`\`\`bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
\`\`\`

### 4. Configurar Banco de Dados
\`\`\`bash
npm run setup
\`\`\`

### 5. Iniciar Aplicação
\`\`\`bash
# Desenvolvimento
npm run dev

# Produção
npm start
\`\`\`

## 📋 Scripts Disponíveis

\`\`\`bash
npm start              # Iniciar em produção
npm run dev            # Desenvolvimento com hot reload
npm run setup          # Configurar banco de dados
npm run health         # Verificar saúde do sistema
npm run backup:create  # Criar backup do banco
npm run system:backup  # Backup completo do sistema
npm run github:backup  # Sincronizar com GitHub
\`\`\`

## 🔗 Links Importantes

- **Repositório**: [${backupInfo.repository}](${backupInfo.repository})
- **Documentação**: [GUIA_USUARIO_ADMIN.md](./GUIA_USUARIO_ADMIN.md)
- **Setup**: [SETUP_REAL_DATA.md](./SETUP_REAL_DATA.md)
- **Integração Obsidian**: [docs/OBSIDIAN_INTEGRATION.md](./docs/OBSIDIAN_INTEGRATION.md)

## 🔐 Configurações de Segurança

⚠️ **Importante**: 
- O arquivo \`.env\` não está versionado por segurança
- Configurações sensíveis devem ser definidas manualmente
- Certificados e chaves não estão incluídos no repositório

## ✅ Verificação de Integridade

Para verificar se o backup foi restaurado corretamente:

\`\`\`bash
npm run health
\`\`\`

## 📞 Suporte

Para questões sobre restauração ou configuração:
1. Consulte a documentação no repositório
2. Verifique os logs em \`logs/\`
3. Execute \`npm run health\` para diagnóstico

---
🤖 Backup automático criado em ${new Date().toLocaleString('pt-BR')}
`;

        fs.writeFileSync(readmePath, readmeContent);
        logger.info('📖 BACKUP-STATUS.md atualizado');
    }

    /**
     * Obter branch atual
     */
    async getCurrentBranch() {
        try {
            const { stdout } = await execAsync('git branch --show-current');
            return stdout.trim() || 'main';
        } catch (error) {
            return 'main';
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
     * Verificar se há mudanças para commit
     */
    async hasChanges() {
        try {
            const { stdout } = await execAsync('git status --porcelain');
            return stdout.trim().length > 0;
        } catch (error) {
            return true; // Assumir que há mudanças em caso de erro
        }
    }

    /**
     * Criar commit com as mudanças
     */
    async createCommit() {
        try {
            if (!(await this.hasChanges())) {
                logger.info('📝 Nenhuma mudança detectada para commit');
                return false;
            }

            const commitMessage = `🔄 Backup automático do sistema - ${new Date().toLocaleString('pt-BR')}

- Código fonte atualizado
- Configurações sincronizadas  
- Documentação atualizada
- Scripts de manutenção incluídos
- Estrutura de dados preservada

Backup ID: ${this.timestamp}
Plataforma: ${process.platform}
Node.js: ${process.version}`;

            await execAsync(`git commit -m "${commitMessage}"`);
            logger.success('✅ Commit criado com sucesso');
            return true;
        } catch (error) {
            logger.error('❌ Erro ao criar commit:', error.message);
            throw error;
        }
    }

    /**
     * Fazer push para o GitHub
     */
    async pushToGitHub() {
        try {
            logger.info('📤 Enviando backup para GitHub...');
            
            // Verificar se a branch existe no remoto
            try {
                await execAsync('git ls-remote --heads origin main');
            } catch (error) {
                // Branch não existe no remoto, criar
                logger.info('🌿 Criando branch main no remoto...');
                await execAsync('git push -u origin main');
                return;
            }
            
            // Fazer push normal
            await execAsync('git push origin main');
            logger.success('✅ Backup enviado para GitHub com sucesso');
            
        } catch (error) {
            if (error.message.includes('no upstream branch')) {
                logger.info('🔗 Configurando upstream branch...');
                await execAsync('git push --set-upstream origin main');
                logger.success('✅ Backup enviado para GitHub com sucesso');
            } else {
                logger.error('❌ Erro ao enviar para GitHub:', error.message);
                throw error;
            }
        }
    }

    /**
     * Sincronizar com GitHub (pull + push)
     */
    async syncWithGitHub() {
        try {
            logger.info('🔄 Sincronizando com GitHub...');
            
            // Tentar fazer pull primeiro (se a branch existir)
            try {
                await execAsync('git fetch origin');
                await execAsync('git merge origin/main --no-edit');
                logger.info('📥 Mudanças remotas incorporadas');
            } catch (error) {
                logger.info('📥 Nenhuma mudança remota para incorporar');
            }
            
            // Preparar e enviar mudanças locais
            await this.performBackup();
            
        } catch (error) {
            logger.error('❌ Erro na sincronização:', error.message);
            throw error;
        }
    }

    /**
     * Executar backup completo para GitHub
     */
    async performBackup() {
        try {
            const startTime = Date.now();
            logger.info('🚀 Iniciando backup para GitHub...');
            
            // 1. Verificar setup do Git
            await this.verifyGitSetup();
            
            // 2. Preparar arquivos
            await this.prepareFiles();
            
            // 3. Criar commit se há mudanças
            const hasCommit = await this.createCommit();
            
            if (hasCommit) {
                // 4. Enviar para GitHub
                await this.pushToGitHub();
                
                const duration = Date.now() - startTime;
                const durationSeconds = (duration / 1000).toFixed(2);
                
                logger.success(`🎉 Backup para GitHub concluído em ${durationSeconds}s`);
                logger.info(`🔗 Repositório: ${this.repositoryUrl}`);
                logger.info(`🌿 Branch: ${this.backupBranch}`);
                
                return {
                    success: true,
                    repository: this.repositoryUrl,
                    branch: this.backupBranch,
                    timestamp: this.timestamp,
                    duration: durationSeconds
                };
            } else {
                logger.info('📝 Backup desnecessário - nenhuma mudança detectada');
                return {
                    success: true,
                    repository: this.repositoryUrl,
                    branch: this.backupBranch,
                    timestamp: this.timestamp,
                    skipped: true,
                    reason: 'Nenhuma mudança detectada'
                };
            }
            
        } catch (error) {
            logger.error('❌ Erro no backup para GitHub:', error.message);
            throw error;
        }
    }

    /**
     * Verificar status do repositório
     */
    async getRepositoryStatus() {
        try {
            const status = {
                isGitRepo: false,
                hasRemote: false,
                currentBranch: null,
                hasUncommittedChanges: false,
                lastCommit: null,
                remoteUrl: null
            };
            
            // Verificar se é repositório Git
            try {
                await execAsync('git status');
                status.isGitRepo = true;
            } catch (error) {
                return status;
            }
            
            // Obter branch atual
            try {
                const { stdout } = await execAsync('git branch --show-current');
                status.currentBranch = stdout.trim() || 'main';
            } catch (error) {
                // Ignorar erro
            }
            
            // Verificar mudanças não commitadas
            status.hasUncommittedChanges = await this.hasChanges();
            
            // Verificar remote
            try {
                const { stdout } = await execAsync('git remote get-url origin');
                status.hasRemote = true;
                status.remoteUrl = stdout.trim();
            } catch (error) {
                // Sem remote configurado
            }
            
            // Último commit
            try {
                const { stdout } = await execAsync('git log -1 --format="%H|%s|%ai"');
                const [hash, message, date] = stdout.trim().split('|');
                status.lastCommit = {
                    hash: hash.substring(0, 8),
                    message,
                    date: new Date(date)
                };
            } catch (error) {
                // Sem commits
            }
            
            return status;
        } catch (error) {
            logger.error('❌ Erro ao obter status:', error.message);
            return null;
        }
    }
}

// Executar backup se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const githubBackup = new GitHubBackup();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'push':
        case 'backup':
            githubBackup.performBackup()
                .then(result => {
                    if (result.skipped) {
                        console.log(`ℹ️ ${result.reason}`);
                    } else {
                        console.log(`✅ Backup enviado para GitHub`);
                        console.log(`🔗 ${result.repository}`);
                        console.log(`⏱️ Duração: ${result.duration}s`);
                    }
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`❌ Erro: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'sync':
            githubBackup.syncWithGitHub()
                .then(() => {
                    console.log('✅ Sincronização com GitHub concluída');
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`❌ Erro: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'status':
            githubBackup.getRepositoryStatus()
                .then(status => {
                    if (!status) {
                        console.log('❌ Erro ao obter status');
                        process.exit(1);
                    }
                    
                    console.log('📊 Status do Repositório Git:');
                    console.log(`  Repositório Git: ${status.isGitRepo ? '✅' : '❌'}`);
                    console.log(`  Remote configurado: ${status.hasRemote ? '✅' : '❌'}`);
                    
                    if (status.currentBranch) {
                        console.log(`  Branch atual: ${status.currentBranch}`);
                    }
                    
                    if (status.remoteUrl) {
                        console.log(`  URL remota: ${status.remoteUrl}`);
                    }
                    
                    console.log(`  Mudanças pendentes: ${status.hasUncommittedChanges ? '⚠️ Sim' : '✅ Não'}`);
                    
                    if (status.lastCommit) {
                        console.log(`  Último commit: ${status.lastCommit.hash} - ${status.lastCommit.message}`);
                        console.log(`  Data: ${status.lastCommit.date.toLocaleString()}`);
                    }
                    
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`❌ Erro: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        default:
            console.log(`
🐙 Sistema de Backup para GitHub - Matriz Knowledge Platform

Uso:
  node scripts/github-backup.js push     - Fazer backup para GitHub
  node scripts/github-backup.js sync     - Sincronizar (pull + push)
  node scripts/github-backup.js status   - Ver status do repositório

Comandos NPM:
  npm run github:backup   - Backup para GitHub
  npm run github:sync     - Sincronização completa

Repositório: https://github.com/leandro1416/matriz-knowledge-platform

O backup inclui:
  - Todo o código fonte
  - Configurações da aplicação
  - Scripts e ferramentas
  - Documentação completa
  - Estrutura de dados (sem dados sensíveis)
  - Informações de restauração

Nota: Dados sensíveis (.env, certificados) não são incluídos por segurança.
            `);
    }
}

export default GitHubBackup;
