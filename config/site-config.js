// Configuração do Site Matriz
const siteConfig = {
    // Informações básicas
    name: "Matriz",
    tagline: "Construindo o futuro, um pensamento por vez",
    description: "Um espaço para compartilhar minha visão de mundo, conectar ideias e construir uma comunidade de pensamento crítico.",
    
    // URLs e navegação
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    pages: {
        home: "/",
        visao: "/pages/visao.html",
        narrativa: "/pages/narrativa.html",
        comunidade: "/pages/comunidade.html",
        workspace: "/pages/workspace.html",
        dinheiro: "/pages/dinheiro.html"
    },
    
    // Informações do autor
    author: {
        name: "Seu Nome",
        email: "seu-email@exemplo.com",
        bio: "Desenvolvedor e pensador crítico, construindo um segundo cérebro digital.",
        social: {
            twitter: "@seutwitter",
            linkedin: "seu-linkedin",
            github: "seu-github"
        }
    },
    
    // Configurações do workspace
    workspace: {
        name: "MacBook M4 Workspace",
        description: "Organização digital do meu ambiente de trabalho e conhecimento",
        folders: {
            desktop: [
                "Projetos Ativos",
                "Documentos", 
                "Downloads",
                "Matriz Website"
            ],
            documents: [
                "Estudos",
                "Projetos",
                "Reflexões",
                "Segundo Cérebro"
            ],
            applications: [
                "VS Code",
                "Terminal",
                "Chrome",
                "Notion",
                "Obsidian"
            ],
            development: [
                "GitHub",
                "Repositórios",
                "Servidores",
                "Databases"
            ]
        }
    },
    
    // Configurações da comunidade
    community: {
        name: "Comunidade Matriz",
        description: "Um espaço colaborativo onde ideias podem florescer",
        values: [
            {
                name: "Pensamento Crítico",
                description: "Valorizamos a análise profunda e o questionamento constante"
            },
            {
                name: "Diversidade",
                description: "Buscamos diferentes perspectivas e experiências"
            },
            {
                name: "Respeito",
                description: "Debates construtivos e respeitosos são fundamentais"
            },
            {
                name: "Inovação",
                description: "Incentivamos ideias criativas e soluções inovadoras"
            }
        ]
    },
    
    // Configurações de desenvolvimento
    development: {
        server: {
            port: process.env.PORT || 3000,
            environment: process.env.NODE_ENV || "development"
        },
        database: {
            url: process.env.MONGODB_URI || "mongodb://localhost:27017/matriz",
            name: "matriz"
        }
    },
    
    // Configurações de SEO
    seo: {
        title: "Matriz - Visão de Mundo e Pensamento Crítico",
        description: "Um espaço para compartilhar minha visão de mundo, conectar ideias e construir uma comunidade de pensamento crítico.",
        keywords: ["pensamento crítico", "tecnologia", "filosofia", "comunidade", "segundo cérebro", "matriz"],
        author: "Seu Nome",
        ogImage: "/images/og-image.jpg"
    },
    
    // Configurações de analytics
    analytics: {
        googleAnalytics: process.env.GA_TRACKING_ID || "",
        googleTagManager: process.env.GTM_ID || ""
    },
    
    // Configurações de newsletter
    newsletter: {
        name: "Newsletter Matriz",
        description: "Receba atualizações sobre novos conteúdos e eventos da comunidade",
        interests: [
            "tecnologia",
            "filosofia", 
            "sociedade",
            "inovacao",
            "pensamento-critico"
        ]
    }
};

export default siteConfig; 