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
 * Sistema de recuperação de dados do MongoDB
 */
class DatabaseRestore {
    constructor() {
        this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/matriz';
        this.backupDir = path.join(process.cwd(), 'backups');
        
        // Extrair informações da URI
        const uriParts = this.mongoUri.match(/mongodb:\/\/([^\/]+)\/(.+)/);
        this.host = uriParts ? uriParts[1] : 'localhost:27017';
        this.database = uriParts ? uriParts[2] : 'matriz';
    }

    /**
     * Listar backups disponíveis
     */
    listAvailableBackups() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                logger.warn('📁 Diretório de backups não encontrado');
                return [];
            }

            const backups = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('backup_'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    
                    // Verificar tipo de backup
                    let type = 'unknown';
                    if (file.includes('_json')) {
                        type = 'json';
                    } else if (file.includes('_manual')) {
                        type = 'manual';
                    } else {
                        type = 'mongodump';
                    }
                    
                    return {
                        name: file,
                        path: filePath,
                        type: type,
                        created: stats.mtime,
                        size: this.formatBytes(stats.size || this.getDirSize(filePath))
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
     * Obter tamanho de diretório
     */
    getDirSize(dirPath) {
        try {
            if (!fs.statSync(dirPath).isDirectory()) {
                return fs.statSync(dirPath).size;
            }
            
            let totalSize = 0;
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    totalSize += this.getDirSize(filePath);
                } else {
                    totalSize += stats.size;
                }
            }
            
            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Restaurar usando mongorestore
     */
    async restoreFromMongoDump(backupPath) {
        try {
            const dbPath = path.join(backupPath, this.database);
            
            if (!fs.existsSync(dbPath)) {
                throw new Error(`Database backup não encontrado em: ${dbPath}`);
            }
            
            logger.info('🚀 Iniciando restauração via mongorestore...');
            
            // Fazer backup de segurança antes da restauração
            await this.createSafetyBackup();
            
            const command = `mongorestore --host ${this.host} --db ${this.database} --drop "${dbPath}"`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('done')) {
                throw new Error(stderr);
            }
            
            logger.success('✅ Restauração via mongorestore concluída');
            return true;
        } catch (error) {
            if (error.message.includes('command not found')) {
                logger.warn('⚠️ mongorestore não encontrado, tentando restauração JSON...');
                return false;
            }
            throw error;
        }
    }

    /**
     * Restaurar de backup JSON
     */
    async restoreFromJSON(backupPath) {
        try {
            logger.info('🚀 Iniciando restauração via mongoimport...');
            
            // Fazer backup de segurança antes da restauração
            await this.createSafetyBackup();
            
            const jsonFiles = fs.readdirSync(backupPath)
                .filter(file => file.endsWith('.json') && file !== 'metadata.json');
            
            for (const file of jsonFiles) {
                const collection = path.basename(file, '.json');
                const filePath = path.join(backupPath, file);
                
                try {
                    // Limpar coleção existente
                    const dropCommand = `mongo ${this.mongoUri} --eval "db.${collection}.drop()"`;
                    await execAsync(dropCommand).catch(() => {}); // Ignorar erros de coleção não existente
                    
                    // Importar dados
                    const importCommand = `mongoimport --host ${this.host} --db ${this.database} --collection ${collection} --file "${filePath}" --jsonArray`;
                    
                    await execAsync(importCommand);
                    logger.info(`📦 Coleção ${collection} restaurada`);
                } catch (collectionError) {
                    logger.warn(`⚠️ Erro ao restaurar coleção ${collection}: ${collectionError.message}`);
                }
            }
            
            logger.success('✅ Restauração via JSON concluída');
            return true;
        } catch (error) {
            if (error.message.includes('command not found')) {
                logger.warn('⚠️ mongoimport não encontrado, tentando restauração manual...');
                return false;
            }
            throw error;
        }
    }

    /**
     * Restaurar manualmente via conexão direta
     */
    async restoreManually(backupPath) {
        try {
            const mongoose = await import('mongoose');
            
            logger.info('🚀 Iniciando restauração manual...');
            
            // Fazer backup de segurança antes da restauração
            await this.createSafetyBackup();
            
            // Conectar ao MongoDB
            await mongoose.default.connect(this.mongoUri);
            logger.info('🔌 Conectado ao MongoDB para restauração manual');
            
            const db = mongoose.default.connection.db;
            
            const jsonFiles = fs.readdirSync(backupPath)
                .filter(file => file.endsWith('.json') && file !== 'metadata.json');
            
            for (const file of jsonFiles) {
                const collectionName = path.basename(file, '.json');
                const filePath = path.join(backupPath, file);
                
                try {
                    // Ler dados do arquivo
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    if (Array.isArray(data) && data.length > 0) {
                        const collection = db.collection(collectionName);
                        
                        // Limpar coleção existente
                        await collection.drop().catch(() => {}); // Ignorar se não existir
                        
                        // Inserir dados
                        await collection.insertMany(data);
                        logger.info(`📦 Coleção ${collectionName} restaurada: ${data.length} documentos`);
                    }
                } catch (collectionError) {
                    logger.warn(`⚠️ Erro ao restaurar coleção ${collectionName}: ${collectionError.message}`);
                }
            }
            
            await mongoose.default.disconnect();
            logger.success('✅ Restauração manual concluída');
            return true;
        } catch (error) {
            logger.error('❌ Erro na restauração manual:', error.message);
            throw error;
        }
    }

    /**
     * Criar backup de segurança antes da restauração
     */
    async createSafetyBackup() {
        try {
            const BackupClass = await import('./backup-database.js');
            const backup = new BackupClass.default();
            
            logger.info('🛡️ Criando backup de segurança...');
            const safetyBackupPath = await backup.performBackup();
            
            // Renomear para indicar que é um backup de segurança
            const safetyName = `safety_backup_${Date.now()}`;
            const newPath = path.join(path.dirname(safetyBackupPath), safetyName);
            fs.renameSync(safetyBackupPath, newPath);
            
            logger.success(`🛡️ Backup de segurança criado: ${safetyName}`);
            return newPath;
        } catch (error) {
            logger.warn('⚠️ Não foi possível criar backup de segurança:', error.message);
            return null;
        }
    }

    /**
     * Executar restauração completa
     */
    async performRestore(backupName) {
        try {
            const backups = this.listAvailableBackups();
            const selectedBackup = backups.find(backup => backup.name === backupName);
            
            if (!selectedBackup) {
                throw new Error(`Backup não encontrado: ${backupName}`);
            }
            
            logger.info(`🔄 Iniciando restauração do backup: ${selectedBackup.name}`);
            logger.info(`📅 Data do backup: ${selectedBackup.created.toLocaleString()}`);
            logger.info(`📦 Tipo: ${selectedBackup.type}`);
            logger.info(`💾 Tamanho: ${selectedBackup.size}`);
            
            // Verificar se há metadados
            const metadataPath = path.join(selectedBackup.path, 'metadata.json');
            if (fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                logger.info(`ℹ️ Backup criado em: ${metadata.timestamp}`);
                logger.info(`ℹ️ Database: ${metadata.database}`);
            }
            
            // Tentar restauração baseada no tipo
            let success = false;
            
            if (selectedBackup.type === 'mongodump') {
                success = await this.restoreFromMongoDump(selectedBackup.path);
            }
            
            if (!success && (selectedBackup.type === 'json' || selectedBackup.type === 'mongodump')) {
                success = await this.restoreFromJSON(selectedBackup.path);
            }
            
            if (!success) {
                success = await this.restoreManually(selectedBackup.path);
            }
            
            if (success) {
                logger.success('🎉 Restauração concluída com sucesso!');
                logger.info('💡 Recomendação: Verifique a integridade dos dados');
            } else {
                throw new Error('Falha em todos os métodos de restauração');
            }
            
        } catch (error) {
            logger.error('❌ Erro na restauração:', error.message);
            throw error;
        }
    }

    /**
     * Verificar integridade dos dados após restauração
     */
    async verifyDataIntegrity() {
        try {
            const mongoose = await import('mongoose');
            
            await mongoose.default.connect(this.mongoUri);
            const db = mongoose.default.connection.db;
            
            const collections = await db.listCollections().toArray();
            const report = {
                totalCollections: collections.length,
                collections: {}
            };
            
            for (const collectionInfo of collections) {
                const collection = db.collection(collectionInfo.name);
                const count = await collection.countDocuments();
                
                report.collections[collectionInfo.name] = {
                    documents: count,
                    indexes: (await collection.indexes()).length
                };
            }
            
            await mongoose.default.disconnect();
            
            logger.success('📊 Relatório de integridade:');
            logger.info(`📦 Total de coleções: ${report.totalCollections}`);
            
            Object.entries(report.collections).forEach(([name, info]) => {
                logger.info(`  - ${name}: ${info.documents} docs, ${info.indexes} índices`);
            });
            
            return report;
        } catch (error) {
            logger.error('❌ Erro na verificação:', error.message);
            return null;
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

// Executar restauração se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
    const restore = new DatabaseRestore();
    
    const command = process.argv[2];
    const backupName = process.argv[3];
    
    switch (command) {
        case 'restore':
            if (!backupName) {
                console.log('❌ Nome do backup é obrigatório');
                console.log('Uso: node scripts/restore-database.js restore <nome-do-backup>');
                process.exit(1);
            }
            
            restore.performRestore(backupName)
                .then(() => {
                    console.log('✅ Restauração concluída');
                    return restore.verifyDataIntegrity();
                })
                .then(() => {
                    process.exit(0);
                })
                .catch(error => {
                    console.error(`❌ Erro: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        case 'list':
            const backups = restore.listAvailableBackups();
            if (backups.length === 0) {
                console.log('📁 Nenhum backup encontrado');
            } else {
                console.log('📦 Backups disponíveis para restauração:');
                backups.forEach(backup => {
                    console.log(`  - ${backup.name} (${backup.type}) - ${backup.size} - ${backup.created.toLocaleString()}`);
                });
            }
            break;
            
        case 'verify':
            restore.verifyDataIntegrity()
                .then(() => process.exit(0))
                .catch(error => {
                    console.error(`❌ Erro: ${error.message}`);
                    process.exit(1);
                });
            break;
            
        default:
            console.log(`
🔄 Sistema de Restauração do Matriz

Uso:
  node scripts/restore-database.js list                    - Listar backups
  node scripts/restore-database.js restore <backup-name>   - Restaurar backup
  node scripts/restore-database.js verify                  - Verificar integridade

Exemplos:
  npm run backup:list
  npm run backup:restore backup_matriz_2025-01-01_12-00-00
  npm run backup:verify
            `);
    }
}

export default DatabaseRestore;
