import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';
import StrategicNote from '../src/models/StrategicNote.js';
import logger from '../src/utils/logger.js';

dotenv.config();

async function setupDatabase() {
    try {
        logger.info('🔧 Iniciando setup do banco de dados...');

        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        logger.success('✅ Conectado ao MongoDB');

        // Limpar dados existentes
        await User.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});
        await StrategicNote.deleteMany({});
        logger.info('🧹 Dados anteriores limpos');

        // Criar usuário admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            username: 'admin',
            email: 'admin@matriz.local',
            password: hashedPassword,
            role: 'admin'
        });
        logger.success('👤 Usuário admin criado');

        // Criar usuário normal
        const user = await User.create({
            username: 'user',
            email: 'user@matriz.local',
            password: hashedPassword,
            role: 'user'
        });
        logger.success('👤 Usuário normal criado');

        // Criar posts de exemplo
        const posts = [];
        const postData = [
            {
                title: 'Bem-vindo à Matriz',
                content: 'Este é o primeiro post da plataforma Matriz. Aqui você encontrará reflexões sobre tecnologia, sociedade e inovação.',
                tags: ['bem-vindo', 'matriz', 'tecnologia']
            },
            {
                title: 'Pensamento Crítico na Era Digital',
                content: 'Como desenvolver o pensamento crítico em um mundo cada vez mais digital e conectado.',
                tags: ['pensamento-critico', 'digital', 'filosofia']
            },
            {
                title: 'Construindo um Segundo Cérebro',
                content: 'Técnicas e ferramentas para organizar conhecimento e construir um sistema de pensamento eficiente.',
                tags: ['segundo-cerebro', 'produtividade', 'organizacao']
            }
        ];

        for (const data of postData) {
            const post = await Post.create({
                authorId: admin._id,
                title: data.title,
                slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                content: data.content,
                tags: data.tags,
                published: true
            });
            posts.push(post);
            logger.success(`📝 Post "${data.title}" criado`);
        }

        // Criar comentários de exemplo
        const commentData = [
            'Excelente post! Muito útil para começar.',
            'Concordo com os pontos levantados.',
            'Vou implementar essas ideias no meu dia a dia.',
            'Interessante perspectiva sobre o tema.'
        ];

        for (let i = 0; i < commentData.length; i++) {
            const post = posts[i % posts.length];
            const author = i % 2 === 0 ? admin : user;

            await Comment.create({
                postId: post._id,
                authorId: author._id,
                content: commentData[i]
            });
            logger.success(`💬 Comentário ${i + 1} criado`);
        }

        // Criar notas estratégicas de exemplo
        const strategicNotesData = [
            {
                title: 'Estratégia de Conteúdo - Matriz 2025',
                content: 'Plano estratégico completo para crescimento da plataforma Matriz em 2025, focando em qualidade de conteúdo e engajamento da comunidade.',
                targetAudience: 'Desenvolvedores, pensadores críticos e entusiastas de tecnologia',
                location: 'Digital/Global',
                objectives: [
                    'Crescer base de usuários em 300%',
                    'Aumentar engajamento em 150%',
                    'Lançar 2 funcionalidades principais',
                    'Estabelecer parcerias estratégicas'
                ],
                pillars: [
                    {
                        name: 'Conteúdo de Qualidade',
                        description: 'Foco em artigos técnicos e reflexões profundas',
                        format: 'Posts longos, tutoriais, análises',
                        frequency: 'Semanal'
                    },
                    {
                        name: 'Comunidade Ativa',
                        description: 'Estimular discussões e networking',
                        format: 'Comentários, debates, eventos',
                        frequency: 'Contínuo'
                    }
                ],
                contentSchedule: [
                    {
                        day: 'Segunda',
                        format: 'Artigo técnico',
                        pattern: 'Deep dive em tecnologias emergentes',
                        cta: 'Compartilhe sua experiência'
                    },
                    {
                        day: 'Quinta',
                        format: 'Reflexão filosófica',
                        pattern: 'Pensamento crítico sobre sociedade e tecnologia',
                        cta: 'Participe da discussão'
                    }
                ],
                status: 'active',
                tags: ['estratégia', 'crescimento', '2025', 'matriz']
            },
            {
                title: 'Roadmap Técnico - Plataforma Matriz',
                content: 'Planejamento técnico para implementação de novas funcionalidades e melhorias na infraestrutura da plataforma.',
                targetAudience: 'Equipe de desenvolvimento e colaboradores técnicos',
                location: 'Repositório/Desenvolvimento',
                objectives: [
                    'Implementar sistema de notificações',
                    'Adicionar busca avançada',
                    'Otimizar performance do frontend',
                    'Melhorar sistema de cache'
                ],
                pillars: [
                    {
                        name: 'Performance',
                        description: 'Otimizações de velocidade e responsividade',
                        format: 'Refatorações, caching, otimizações',
                        frequency: 'Sprint-based'
                    },
                    {
                        name: 'Funcionalidades',
                        description: 'Novas features para usuários',
                        format: 'APIs, interfaces, integrações',
                        frequency: 'Mensal'
                    }
                ],
                contentSchedule: [
                    {
                        day: 'Sprint Planning',
                        format: 'Priorização de tasks',
                        pattern: 'Análise de impacto vs esforço',
                        cta: 'Review de código'
                    }
                ],
                status: 'active',
                tags: ['técnico', 'roadmap', 'desenvolvimento', 'features']
            }
        ];

        for (const noteData of strategicNotesData) {
            await StrategicNote.create({
                authorId: admin._id,
                ...noteData
            });
            logger.success(`📋 Nota estratégica "${noteData.title}" criada`);
        }

        logger.success('🎉 Setup do banco de dados concluído!');
        logger.info('📊 Resumo:');
        logger.info(`   - ${await User.countDocuments()} usuários`);
        logger.info(`   - ${await Post.countDocuments()} posts`);
        logger.info(`   - ${await Comment.countDocuments()} comentários`);
        logger.info(`   - ${await StrategicNote.countDocuments()} notas estratégicas`);

        // Credenciais de acesso
        logger.info('🔐 Credenciais de acesso:');
        logger.info('   Admin: admin@matriz.local / admin123');
        logger.info('   User: user@matriz.local / admin123');

    } catch (error) {
        logger.error('❌ Erro durante setup:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        logger.info('✅ Desconectado do MongoDB');
        process.exit(0);
    }
}

setupDatabase(); 