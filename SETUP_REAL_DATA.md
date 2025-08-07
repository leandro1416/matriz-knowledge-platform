# Configuração do Sistema com Dados Reais

## ✅ Mudanças Realizadas

O sistema foi atualizado para usar **apenas dados reais** do banco de dados MongoDB. Todas as funcionalidades de dados mock foram removidas.

### Principais Alterações:

1. **Serviços Atualizados**: Removida toda lógica de dados mock dos serviços:
   - `PostService.js`
   - `StrategicNoteService.js` 
   - `AuthService.js`
   - `CommentService.js`
   - `BaseService.js`

2. **Banco de Dados Obrigatório**: O sistema agora exige conexão com MongoDB para funcionar

3. **Modelos Corrigidos**: Atualizados os schemas para consistência com dados reais

4. **Mock Providers Removidos**: Eliminados arquivos de dados simulados

## 🚀 Como Inicializar o Sistema

### 1. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

**Configurações obrigatórias no `.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/matriz
JWT_SECRET=sua-chave-secreta-muito-forte-aqui-min-32-chars
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar MongoDB

Certifique-se que o MongoDB está rodando:

```bash
# Ubuntu/Debian
sudo systemctl start mongod

# macOS (Homebrew)
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Inicializar Banco de Dados

```bash
npm run setup-db
```

Este comando criará:
- ✅ Usuário administrador
- ✅ Usuário normal para testes
- ✅ Posts de exemplo
- ✅ Comentários de exemplo  
- ✅ Notas estratégicas de exemplo

### 5. Iniciar o Servidor

```bash
# Produção
npm start

# Desenvolvimento
npm run dev
```

## 🔐 Credenciais de Acesso

Após executar `npm run setup-db`, você pode fazer login com:

**Administrador:**
- Email: `admin@matriz.local`
- Senha: `admin123`

**Usuário Normal:**
- Email: `user@matriz.local`  
- Senha: `admin123`

## 📊 Verificar Status

```bash
# Verificar saúde do sistema
npm run health

# Informações do servidor
npm run info

# Verificar configuração de deploy
npm run deploy-check
```

## 🔧 Funcionalidades Principais

### ✅ Posts
- Criar, editar, deletar posts
- Sistema de likes (array de usuários)
- Busca por slug, tags, autor
- População automática de dados do autor

### ✅ Comentários  
- Comentários aninhados (replies)
- Sistema de likes
- Busca por post, autor
- Validações de conteúdo

### ✅ Notas Estratégicas
- CRUD completo
- Estados: draft, active, completed, archived  
- Busca por status, autor, tags
- Estrutura complexa com objetivos, pilares, cronogramas

### ✅ Autenticação
- Registro e login
- JWT tokens
- Roles (user, admin)
- Hash seguro de senhas

### ✅ Blockchain/IA (Opcional)
- Sistema de blockchain para logs de IA
- Integração com OpenAI (se configurado)
- Fallback quando IA não disponível

## 🛠️ Scripts Disponíveis

```bash
npm start           # Iniciar servidor
npm run dev         # Desenvolvimento com nodemon
npm run setup-db    # Configurar banco de dados
npm run health      # Verificar saúde do sistema
npm run info        # Informações do servidor
npm run lint        # Verificar código
npm run backup:create    # Criar backup do banco
npm run backup:restore   # Restaurar backup
```

## ⚠️ Troubleshooting

### Erro de Conexão MongoDB
```
❌ Erro ao conectar ao MongoDB
❌ Banco de dados é obrigatório. Verifique a configuração do MongoDB.
```

**Solução:**
1. Verifique se MongoDB está rodando
2. Confirme a `MONGODB_URI` no `.env`
3. Teste a conexão: `mongosh "mongodb://localhost:27017/matriz"`

### JWT Secret Error
```
Error: JWT_SECRET is required
```

**Solução:**
1. Configure `JWT_SECRET` no `.env` com pelo menos 32 caracteres
2. Use uma chave forte e única

### IA não configurada
Se você não configurar `OPENAI_API_KEY`, o sistema funcionará normalmente, mas retornará mensagens informativas quando tentar usar IA.

## 📂 Estrutura de Dados

### Usuários
```javascript
{
  username: String,
  email: String, 
  password: String, // hash bcrypt
  role: 'user' | 'admin'
}
```

### Posts
```javascript
{
  authorId: ObjectId,
  title: String,
  slug: String, // gerado automaticamente
  content: String,
  tags: [String],
  likes: [ObjectId], // array de usuários
  published: Boolean
}
```

### Comentários
```javascript
{
  postId: ObjectId,
  authorId: ObjectId,
  parentId: ObjectId, // para replies
  content: String,
  likes: [ObjectId] // array de usuários
}
```

### Notas Estratégicas
```javascript
{
  title: String,
  content: String,
  targetAudience: String,
  location: String,
  objectives: [String],
  pillars: [Object],
  contentSchedule: [Object],
  status: 'draft' | 'active' | 'completed' | 'archived',
  authorId: ObjectId,
  tags: [String]
}
```

## 🎉 Sistema Pronto!

Agora o sistema está configurado para usar apenas dados reais do MongoDB. Todas as funcionalidades estão integradas com o banco de dados e não dependem mais de dados simulados.
