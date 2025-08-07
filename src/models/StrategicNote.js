import mongoose from 'mongoose';

const strategicNoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    targetAudience: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    objectives: [{
        type: String,
        trim: true
    }],
    pillars: [{
        name: String,
        description: String,
        format: String,
        frequency: String
    }],
    contentSchedule: [{
        day: String,
        format: String,
        pattern: String,
        cta: String
    }],
    productionWorkflow: [{
        step: String,
        description: String,
        timing: String
    }],
    metrics: [{
        kpi: String,
        target: String,
        tool: String
    }],
    growthLeverages: [{
        type: String,
        description: String,
        impact: String
    }],
    accessibility: [{
        requirement: String,
        description: String,
        status: {
            type: String,
            enum: ['pending', 'implemented', 'testing'],
            default: 'pending'
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'archived'],
        default: 'draft'
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para atualizar updatedAt
strategicNoteSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Middleware para validação antes de salvar
strategicNoteSchema.pre('save', function(next) {
    // Validar se title não está vazio após trim
    if (!this.title || this.title.trim().length === 0) {
        return next(new Error('Título é obrigatório'));
    }
  
    // Validar se content tem tamanho mínimo
    if (!this.content || this.content.length < 10) {
        return next(new Error('Conteúdo deve ter pelo menos 10 caracteres'));
    }
  
    next();
});

// Índices para performance e integridade
strategicNoteSchema.index({ authorId: 1 });
strategicNoteSchema.index({ status: 1, createdAt: -1 });
strategicNoteSchema.index({ tags: 1 });
strategicNoteSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('StrategicNote', strategicNoteSchema); 