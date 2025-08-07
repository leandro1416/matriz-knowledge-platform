# Matriz - Plataforma de Conhecimento

Plataforma web moderna com backend robusto, banco de dados MongoDB e integração com IA para gestão de conhecimento.

## 🎯 Funcionalidades

- **Sistema de Posts** - Criação e gerenciamento de artigos
- **Notas Estratégicas** - Organização de ideias e insights  
- **Integração com IA** - Chat inteligente com OpenAI
- **Autenticação JWT** - Sistema seguro de usuários
- **API RESTful** - Backend escalável e bem estruturado
- **Interface Responsiva** - Design moderno e acessível

## 🚀 Stack Tecnológica

- **Backend**: Node.js + Express.js + MongoDB + Mongoose
- **Segurança**: JWT, bcryptjs, helmet, CORS, rate limiting
- **IA**: Integração OpenAI com modo mock para desenvolvimento
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Ferramentas**: nodemon, ESLint

## 🔧 Instalação e Uso

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npm run setup

# Desenvolvimento
npm run dev

# Produção
npm start

# Verificar saúde
npm run health
```

## 🌐 API Principal

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Perfil do usuário

### Posts
- `GET /api/posts` - Listar posts
- `POST /api/posts` - Criar post
- `GET /api/posts/:id` - Obter post
- `PUT /api/posts/:id` - Atualizar post
- `DELETE /api/posts/:id` - Deletar post

### IA & Notas
- `POST /api/ai/ask` - Perguntar à IA
- `GET /api/strategic-notes` - Listar notas estratégicas
- `POST /api/strategic-notes` - Criar nota

## 📁 Estrutura do Projeto

```
├── public/              # Interface web (HTML, CSS, JS)
├── src/                 # Código fonte principal
│   ├── app.js          # Configuração Express e middlewares
│   ├── server.js       # Servidor HTTP/HTTPS e inicialização
│   ├── controllers/    # Lógica dos endpoints da API
│   ├── routes/         # Definições de rotas organizadas
│   ├── models/         # Modelos MongoDB (User, Post, etc.)
│   ├── services/       # Lógica de negócio e integrações
│   ├── middlewares/    # Middlewares customizados (auth, logging, etc.)
│   ├── config/         # Configurações da aplicação
│   └── utils/          # Utilitários e helpers
├── scripts/            # Scripts de manutenção e deploy
├── obsidian-sync/      # Sincronização com Obsidian (local fallback)
├── data/               # Dados persistentes (blockchain, backups)
├── logs/               # Sistema de logs estruturados
└── docs/               # Documentação técnica
```

## 🔐 Segurança & Performance

- **Autenticação JWT** com refresh tokens
- **Rate limiting** por IP e usuário
- **Helmet** para headers seguros
- **CORS** configurado adequadamente
- **Hash bcrypt** para senhas
- **Validação** de entrada de dados
- **Cache inteligente** em memória
- **Logs estruturados** para monitoramento

## 🚀 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Inicia servidor em produção |
| `npm run dev` | Desenvolvimento com hot reload |
| `npm run setup` | Configura banco de dados |
| `npm run health` | Verifica saúde da aplicação |
| `npm run lint` | Analisa qualidade do código |
| `npm run lint:fix` | Corrige problemas automaticamente |

## 📈 Status do Projeto

- ✅ **Backend**: API completa e funcional
- ✅ **Frontend**: Interface responsiva
- ✅ **Banco de dados**: MongoDB configurado
- ✅ **Autenticação**: Sistema JWT implementado
- ✅ **IA**: Integração OpenAI com fallback mock
- ✅ **Testes**: Health check automatizado
- ✅ **Deploy**: Pronto para produção

---

**Projeto otimizado e ready para crescimento sustentável! 🚀**