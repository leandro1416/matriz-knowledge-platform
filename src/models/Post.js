import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    authorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    slug: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true
    },
    content: { 
        type: String, 
        required: true 
    },
    tags: [String],
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    published: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Middleware para validação antes de salvar
postSchema.pre('save', function(next) {
    // Validar se title não está vazio após trim
    if (!this.title || this.title.trim().length === 0) {
        return next(new Error('Título é obrigatório'));
    }
  
    // Validar se content tem tamanho mínimo
    if (!this.content || this.content.length < 10) {
        return next(new Error('Conteúdo deve ter pelo menos 10 caracteres'));
    }
  
    // Gerar slug automaticamente se não fornecido
    if (!this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
  
    next();
});

// Middleware para garantir unicidade do slug
postSchema.pre('save', async function(next) {
    if (this.isModified('slug')) {
        const existingPost = await this.constructor.findOne({ 
            slug: this.slug, 
            _id: { $ne: this._id } 
        });
    
        if (existingPost) {
            this.slug = `${this.slug}-${Date.now()}`;
        }
    }
    next();
});

// Índices para performance e integridade
postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ published: 1, createdAt: -1 });
postSchema.index({ authorId: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('Post', postSchema); 