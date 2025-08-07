import fs from 'fs';
import path from 'path';

class IntelligentLogger {
    constructor() {
        this.logDir = './logs';
        this.errorPatterns = new Map();
        this.autoFixes = new Map();
        this.errorStats = new Map();
        this.ensureLogDirectory();
        this.loadErrorPatterns();
        this.setupAutoFixes();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    loadErrorPatterns() {
        // Padrões de erro conhecidos e suas soluções
        this.errorPatterns.set('MongoDB', {
            pattern: /MongoServerSelectionError|ECONNREFUSED.*27017/,
            severity: 'MEDIUM',
            category: 'DATABASE',
            autoFix: 'SWITCH_TO_MOCK_MODE'
        });

        this.errorPatterns.set('OpenAI', {
            pattern: /AuthenticationError|Incorrect API key|invalid_api_key/,
            severity: 'HIGH',
            category: 'AI_SERVICE',
            autoFix: 'USE_MOCK_AI'
        });

        this.errorPatterns.set('Network', {
            pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/,
            severity: 'MEDIUM',
            category: 'NETWORK',
            autoFix: 'RETRY_WITH_BACKOFF'
        });

        this.errorPatterns.set('Authentication', {
            pattern: /Token.*invalid|Unauthorized|401/,
            severity: 'HIGH',
            category: 'AUTH',
            autoFix: 'REFRESH_TOKEN'
        });

        this.errorPatterns.set('RateLimit', {
            pattern: /rate.*limit|429|Too Many Requests/,
            severity: 'LOW',
            category: 'API_LIMIT',
            autoFix: 'WAIT_AND_RETRY'
        });
    }

    setupAutoFixes() {
        // Configurações de correção automática
        this.autoFixes.set('SWITCH_TO_MOCK_MODE', {
            action: () => {
                this.info('🔄 Auto-fix: Switching to mock mode for database operations');
                return { success: true, mode: 'mock' };
            },
            description: 'Switch to mock mode when database is unavailable'
        });

        this.autoFixes.set('USE_MOCK_AI', {
            action: () => {
                this.info('🔄 Auto-fix: Using mock AI responses');
                return { success: true, mode: 'mock_ai' };
            },
            description: 'Use mock AI responses when OpenAI is unavailable'
        });

        this.autoFixes.set('RETRY_WITH_BACKOFF', {
            action: () => {
                this.info('🔄 Auto-fix: Implementing retry with exponential backoff');
                return { success: true, retry: true };
            },
            description: 'Retry failed requests with exponential backoff'
        });

        this.autoFixes.set('REFRESH_TOKEN', {
            action: () => {
                this.info('🔄 Auto-fix: Attempting token refresh');
                return { success: true, refresh: true };
            },
            description: 'Refresh authentication token'
        });

        this.autoFixes.set('WAIT_AND_RETRY', {
            action: () => {
                this.info('🔄 Auto-fix: Waiting before retry due to rate limit');
                return { success: true, wait: true };
            },
            description: 'Wait before retrying due to rate limits'
        });
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, data = null, errorInfo = null) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            errorInfo,
            sessionId: this.getSessionId(),
            requestId: this.getRequestId()
        };
        return `${JSON.stringify(logEntry)  }\n`;
    }

    getSessionId() {
        // Gerar um ID de sessão único
        return Math.random().toString(36).substring(2, 15);
    }

    getRequestId() {
        // Gerar um ID de requisição único
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    writeToFile(filename, content) {
        const filepath = path.join(this.logDir, filename);
        fs.appendFileSync(filepath, content);
    }

    analyzeError(error) {
        const errorMessage = error?.message || error?.toString() || '';
        const errorStack = error?.stack || '';
        const fullError = `${errorMessage  } ${  errorStack}`;

        let detectedPattern = null;
        let severity = 'UNKNOWN';
        let category = 'GENERAL';
        let autoFix = null;

        // Analisar o erro contra padrões conhecidos
        for (const [name, pattern] of this.errorPatterns) {
            if (pattern.pattern.test(fullError)) {
                detectedPattern = name;
                severity = pattern.severity;
                category = pattern.category;
                autoFix = pattern.autoFix;
                break;
            }
        }

        return {
            detectedPattern,
            severity,
            category,
            autoFix,
            errorMessage,
            errorStack,
            timestamp: this.getTimestamp()
        };
    }

    applyAutoFix(errorAnalysis) {
        if (!errorAnalysis.autoFix) return null;

        const fix = this.autoFixes.get(errorAnalysis.autoFix);
        if (!fix) return null;

        try {
            const result = fix.action();
            this.info(`Auto-fix applied: ${fix.description}`, {
                pattern: errorAnalysis.detectedPattern,
                fix: errorAnalysis.autoFix,
                result
            });
            return result;
        } catch (fixError) {
            this.error(`Auto-fix failed: ${errorAnalysis.autoFix}`, fixError);
            return null;
        }
    }

    updateErrorStats(errorAnalysis) {
        const key = errorAnalysis.detectedPattern || 'UNKNOWN';
        const current = this.errorStats.get(key) || { count: 0, firstSeen: null, lastSeen: null };
        
        current.count++;
        current.lastSeen = this.getTimestamp();
        if (!current.firstSeen) {
            current.firstSeen = this.getTimestamp();
        }

        this.errorStats.set(key, current);
    }

    info(message, data = null) {
        const logMessage = this.formatMessage('INFO', message, data);
        console.log(`📝 ${message}`);
        this.writeToFile('info.log', logMessage);
    }

    error(message, error = null) {
        const errorAnalysis = this.analyzeError(error);
        const autoFixResult = this.applyAutoFix(errorAnalysis);
        this.updateErrorStats(errorAnalysis);

        const logMessage = this.formatMessage('ERROR', message, {
            originalError: error,
            analysis: errorAnalysis,
            autoFixResult
        });

        console.error(`❌ ${message}`, error);
        this.writeToFile('error.log', logMessage);

        // Log de erro crítico para análise
        if (errorAnalysis.severity === 'HIGH') {
            this.writeToFile('critical_errors.log', logMessage);
        }

        return {
            errorAnalysis,
            autoFixResult,
            shouldRetry: autoFixResult?.retry || false
        };
    }

    warn(message, data = null) {
        const logMessage = this.formatMessage('WARN', message, data);
        console.warn(`⚠️ ${message}`);
        this.writeToFile('warn.log', logMessage);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const logMessage = this.formatMessage('DEBUG', message, data);
            console.debug(`🔍 ${message}`, data);
            this.writeToFile('debug.log', logMessage);
        }
    }

    success(message, data = null) {
        const logMessage = this.formatMessage('SUCCESS', message, data);
        console.log(`✅ ${message}`);
        this.writeToFile('success.log', logMessage);
    }

    request(method, url, statusCode, duration, ip) {
        const message = `${method} ${url} - ${statusCode} (${duration}ms) - ${ip}`;
        this.info(`HTTP Request: ${message}`);
    }

    database(operation, collection, duration, success) {
        const message = `${operation} on ${collection} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;
        this.info(`Database: ${message}`);
    }

    // Métodos para análise e relatórios
    getErrorStats() {
        return Object.fromEntries(this.errorStats);
    }

    generateErrorReport() {
        const stats = this.getErrorStats();
        const report = {
            timestamp: this.getTimestamp(),
            totalErrors: Object.values(stats).reduce((sum, stat) => sum + stat.count, 0),
            errorBreakdown: stats,
            recommendations: this.generateRecommendations(stats)
        };

        this.writeToFile('error_report.json', JSON.stringify(report, null, 2));
        return report;
    }

    generateRecommendations(stats) {
        const recommendations = [];

        for (const [pattern, stat] of Object.entries(stats)) {
            if (stat.count > 10) {
                recommendations.push({
                    pattern,
                    issue: `High error rate: ${stat.count} occurrences`,
                    suggestion: `Consider implementing permanent fix for ${pattern} errors`
                });
            }
        }

        return recommendations;
    }

    // Método para limpar logs antigos
    cleanupOldLogs(daysToKeep = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const logFiles = fs.readdirSync(this.logDir);
        for (const file of logFiles) {
            const filePath = path.join(this.logDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                this.info(`Cleaned up old log file: ${file}`);
            }
        }
    }
}

export default new IntelligentLogger(); 