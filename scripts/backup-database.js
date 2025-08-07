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
 * Sistema de backup automático para MongoDB
 */
class DatabaseBackup {
    constructor() {
        this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/matriz';
        this.backupDir = path.join(process.cwd(), 'backups');
        this.maxBackups = 10; // Manter até 10 backups
        
        // Extrair informações da URI
        const uriParts = this.mongoUri.match(/mongodb:\/\/([^\/]+)\/(.+)/);
        this.host = uriParts ? uriParts[1] : 'localhost:27017';
        this.database = uriParts ? uriParts[2] : 'matriz';
    }

    /**
     * Criar diretório de backup se não existir
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            logger.success('📁 Diretório de backup criado');
        }
    }

    /**
     * Gerar nome do arquivo de backup
     */
    generateBackupFileName() {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .split('.')[0];
        return `backup_${this.database}_${timestamp}`;
    }

    /**
     * Fazer backup usando mongodump
     */
    async createMongoDump() {
        try {
            const backupName = this.generateBackupFileName();
            const backupPath = path.join(this.backupDir, backupName);
            
            const command = `mongodump --host ${this.host} --db ${this.database} --out "${backupPath}"`;
            
            logger.info('🚀 Iniciando backup do MongoDB...');
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('done dumping')) {
                throw new Error(stderr);
            }
            
            logger.success(`✅ Backup criado: ${backupPath}`);
            return backupPath;
        } catch (error) {
            if (error.message.includes('command not found')) {
                logger.warn('⚠️ mongodump não encontrado, usando backup JSON...');
                return await this.createJSONBackup();
            }
            throw error;
        }
    }

    /**
     * Backup alternativo usando mongoexport (JSON)
     */
    async createJSONBackup() {
        try {
            const backupName = this.generateBackupFileName();
            const backupPath = path.join(this.backupDir, `${backupName}_json`);
            
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }
            
            // Coleções principais para backup
            const collections = [
                'users',
                'posts', 
                'strategicnotes',
                'blocks',
                'comments'
            ];
            
            logger.info('🚀 Iniciando backup JSON...');
            
            for (const collection of collections) {
                try {
                    const outputFile = path.join(backupPath, `${collection}.json`);
                    const command = `mongoexport --host ${this.host} --db ${this.database} --collection ${collection} --out "${outputFile}" --jsonArray`;
                    
                    await execAsync(command);
                    logger.info(`📦 Backup da coleção ${collection} concluído`);
                } catch (collectionError) {
                    // Ignorar erros de coleções que não existem
                    if (!collectionError.message.includes('Collection') || !collectionError.message.includes('not found')) {
                        logger.warn(`⚠️ Erro no backup da coleção ${collection}: ${collectionError.message}`);
                    }
                }
            }
            
            logger.success(`✅ Backup JSON criado: ${backupPath}`);
            return backupPath;
        } catch (error) {
            if (error.message.includes('command not found')) {
                logger.warn('⚠️ mongoexport não encontrado, usando backup manual...');
                return await this.createManualBackup();
            }
            throw error;
        }
    }

    /**
     * Backup manual conectando diretamente ao MongoDB
     */
    async createManualBackup() {
        try {
            const mongoose = await import('mongoose');
            
            const backupName = this.generateBackupFileName();
            const backupPath = path.join(this.backupDir, `${backupName}_manual`);
            
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }
            
            // Conectar ao MongoDB
            await mongoose.default.connect(this.mongoUri);
            logger.info('🔌 Conectado ao MongoDB para backup manual');
            
            // Obter todas as coleções
            const db = mongoose.default.connection.db;
            const collections = await db.listCollections().toArray();
            
            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                const collection = db.collection(collectionName);
                
                // Exportar dados da coleção
                const documents = await collection.find({}).toArray();
                const outputFile = path.join(backupPath, `${collectionName}.json`);
                
                fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2));
                logger.info(`📦 Backup manual da coleção ${collectionName}: ${documents.length} documentos`);
            }
            
            await mongoose.default.disconnect();
            logger.success(`✅ Backup manual criado: ${backupPath}`);
            return backupPath;
        } catch (error) {
            logger.error('❌ Erro no backup manual:', error.message);
            throw error;
        }
    }

    /**
     * Limpar backups antigos
     */
    async cleanOldBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('backup_'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    stats: fs.statSync(path.join(this.backupDir, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);

            if (files.length > this.maxBackups) {
                const toDelete = files.slice(this.maxBackups);
                
                for (const file of toDelete) {
                    if (file.stats.isDirectory()) {
                        fs.rmSync(file.path, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(file.path);
                    }
                    logger.info(`🗑️ Backup antigo removido: ${file.name}`);
                }
            }
        } catch (error) {
            logger.warn('⚠️ Erro ao limpar backups antigos:', error.message);
        }
    }

    /**
     * Executar backup completo
     */
    async performBackup() {
        try {
            this.ensureBackupDirectory();
            
            // Tentar mongodump primeiro, depois JSON, depois manual
            let backupPath;
            try {
                backupPath = await this.createMongoDump();
            } catch (error) {
                logger.warn('⚠️ Erro no mongodump, tentando backup JSON...');
                try {
                    backupPath = await this.createJSONBackup();
                } catch (jsonError) {
                    logger.warn('⚠️ Erro no backup JSON, tentando backup manual...');
                    backupPath = await this.createManualBackup();
                }
            }
            
            // Limpar backups antigos
            await this.cleanOldBackups();
            
            // Criar arquivo de metadados
            const metadataFile = path.join(backupPath, 'metadata.json');
            const metadata = {
                timestamp: new Date().toISOString(),
                database: this.database,
                host: this.host,
                backupType: 'full',
                version: '1.0.0'
            };
            
            fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
            
            logger.success('🎉 Backup concluído com sucesso!');
            return backupPath;
        } catch (error) {
            logger.error('❌ Erro no backup:', error.message);
            throw error;
        }
    }

    /**
     * Listar backups disponíveis
     */
    listBackups() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                logger.info('📁 Nenhum backup encontrado');
                return [];
            }

            const backups = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('backup_'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        created: stats.mtime,
                        size: this.formatBytes(stats.size)
                    };
                })
                .sort((a, b) => b.created - a.created);

            return backups;
        } catch (error) {
            logger.error('❌ Erro ao listar backups:', error.message);
            return [];
        }
    }

    /**
     * Formatar bytes em formato legível
     */
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Executar backup se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const backup = new DatabaseBackup();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'create':
            backup.performBackup()
                .then(path => {
                    console.log(`✅ Backup criado: ${path}`);
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`❌ Erro: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'list':
            const backups = backup.listBackups();
            if (backups.length === 0) {
                console.log('📁 Nenhum backup encontrado');
            } else {
                console.log('📦 Backups disponíveis:');
                backups.forEach(backup => {
                    console.log(`  - ${backup.name} (${backup.size}) - ${backup.created.toLocaleString()}`);
                });
            }
            break;
            
        default:
            console.log(`
📦 Sistema de Backup do Matriz

Uso:
  node scripts/backup-database.js create  - Criar backup
  node scripts/backup-database.js list    - Listar backups

Exemplos:
  npm run backup:create
  npm run backup:list
            `);
    }
}

export default DatabaseBackup;
