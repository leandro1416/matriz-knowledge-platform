# Integração com Obsidian

Este documento explica como configurar e usar a integração do sistema com o Obsidian para sincronização em tempo real de notas estratégicas e posts do blog.

## 📋 Pré-requisitos

1. **Obsidian** instalado e funcionando
2. **Plugin Local REST API** instalado e configurado no Obsidian
3. **Chave da API** configurada no plugin Local REST API
4. **Node.js** com as dependências instaladas (`npm install`)

## 🔧 Configuração

### 1. Instalar o Plugin Local REST API no Obsidian

1. Abra o Obsidian
2. Vá para **Settings** (Configurações)
3. Navegue até **Community Plugins** (Plugins da Comunidade)
4. Clique em **Browse** (Navegar)
5. Procure por **"Local REST API"**
6. Instale e ative o plugin
7. Nas configurações do plugin, gere uma **API Key**
8. Anote a **porta** utilizada (geralmente 27123 para HTTP ou 27124 para HTTPS)

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as seguintes variáveis:

```bash
# Integração com Obsidian
OBSIDIAN_API_KEY=sua-chave-api-obsidian-aqui
OBSIDIAN_BASE_URL=http://127.0.0.1:27123
OBSIDIAN_TIMEOUT=5000
OBSIDIAN_RETRY_ATTEMPTS=3
OBSIDIAN_RETRY_DELAY=1000

# Configurações de diretórios no Obsidian
OBSIDIAN_STRATEGIC_NOTES_DIR=Strategic Notes
OBSIDIAN_BLOG_POSTS_DIR=Blog Posts
OBSIDIAN_TEMPLATES_DIR=Templates
OBSIDIAN_ATTACHMENTS_DIR=Assets

# Configurações de sincronização
OBSIDIAN_SYNC_ENABLED=true
OBSIDIAN_REAL_TIME_SYNC=true
OBSIDIAN_BATCH_SIZE=10
OBSIDIAN_SYNC_INTERVAL=30000
OBSIDIAN_WEBHOOK_ENABLED=false
OBSIDIAN_WEBHOOK_URL=

# Configurações de templates
OBSIDIAN_STRATEGIC_NOTE_TEMPLATE=strategic-note-template.md
OBSIDIAN_BLOG_POST_TEMPLATE=blog-post-template.md
OBSIDIAN_USE_TEMPLATES=true

# Configurações de metadados
OBSIDIAN_USE_YAML_FRONTMATTER=true
OBSIDIAN_INCLUDE_TIMESTAMPS=true
OBSIDIAN_INCLUDE_IDS=true
OBSIDIAN_INCLUDE_STATUS=true

# Configurações de segurança do Obsidian
OBSIDIAN_VERIFY_SSL=false
OBSIDIAN_ALLOW_SELF_SIGNED=true
```

### 3. Instalar Dependências

```bash
npm install
```

## 🚀 Como Funciona

### Sincronização Automática

O sistema monitora automaticamente:

- **Criação** de notas estratégicas e posts
- **Atualização** de conteúdo existente
- **Deleção** de documentos

Quando uma dessas operações acontece, o sistema:

1. Adiciona o item à **fila de sincronização**
2. Converte o conteúdo para **Markdown** com frontmatter YAML
3. Envia para o **vault do Obsidian** via API
4. Organiza nos **diretórios corretos**

### Estrutura dos Arquivos

#### Notas Estratégicas

```markdown
---
title: "Título da Nota"
type: strategic-note
status: draft
target_audience: "Público-alvo"
location: "Local"
tags:
  - estrategia
  - marketing
created: 2024-01-01T10:00:00Z
updated: 2024-01-01T11:00:00Z
database_id: 507f1f77bcf86cd799439011
---

# Título da Nota

## 📊 Informações Gerais

- **Público-alvo:** Empreendedores
- **Local:** São Paulo
- **Status:** draft
- **Tags:** estrategia, marketing

## 📝 Conteúdo

Conteúdo da nota estratégica...

## 🎯 Objetivos

1. Objetivo 1
2. Objetivo 2

## 🏛️ Pilares de Conteúdo

### 1. Pilar Educacional

**Descrição:** Conteúdo educativo
**Formato:** Video
**Frequência:** Semanal

---

*Criado em: 01/01/2024 10:00*
*Atualizado em: 01/01/2024 11:00*
*ID: `507f1f77bcf86cd799439011`*
```

#### Posts do Blog

```markdown
---
title: "Título do Post"
type: blog-post
slug: titulo-do-post
published: true
tags:
  - tecnologia
  - tutorial
likes: 5
created: 2024-01-01T10:00:00Z
updated: 2024-01-01T11:00:00Z
database_id: 507f1f77bcf86cd799439011
---

# Título do Post

## 📋 Informações do Post

- **Slug:** `titulo-do-post`
- **Status:** 🟢 Publicado
- **Likes:** 5
- **Tags:** tecnologia, tutorial

## 📝 Conteúdo

Conteúdo do post do blog...

---

*Criado em: 01/01/2024 10:00*
*Atualizado em: 01/01/2024 11:00*
*ID: `507f1f77bcf86cd799439011`*
```

## 🔌 API Endpoints

### Status e Monitoramento

```bash
# Verificar status da integração
GET /api/obsidian/status

# Testar conexão
POST /api/obsidian/test-connection

# Ver fila de sincronização
GET /api/obsidian/queue

# Processar fila manualmente
POST /api/obsidian/queue/process
```

### Sincronização Manual

```bash
# Sincronizar nota estratégica específica
POST /api/obsidian/sync/strategic-note/:id
{
  "operation": "update" // create, update, delete
}

# Sincronizar post específico
POST /api/obsidian/sync/blog-post/:id
{
  "operation": "update"
}

# Sincronizar tudo
POST /api/obsidian/sync/all
{
  "force": false
}
```

### Exploração do Vault

```bash
# Listar arquivos
GET /api/obsidian/files?directory=Strategic%20Notes

# Buscar arquivos
GET /api/obsidian/search?query=marketing
```

### Controle do Serviço

```bash
# Iniciar serviço de sincronização
POST /api/obsidian/service/start

# Parar serviço de sincronização
POST /api/obsidian/service/stop
```

## 🛠️ Configurações Avançadas

### Sincronização Bidirecional (Experimental)

Para habilitar sincronização do Obsidian para o sistema:

1. Configure um webhook no Obsidian (plugin adicional necessário)
2. Configure as variáveis:
   ```bash
   OBSIDIAN_WEBHOOK_ENABLED=true
   OBSIDIAN_WEBHOOK_URL=http://localhost:3001/api/obsidian/webhook
   ```

### Personalização de Templates

1. Crie templates no diretório configurado
2. Use variáveis como `{{title}}`, `{{content}}`, etc.
3. Configure os nomes dos templates nas variáveis de ambiente

### Configuração de Diretórios

Personalize onde os arquivos são salvos:

```bash
OBSIDIAN_STRATEGIC_NOTES_DIR=Projetos/Estrategicas
OBSIDIAN_BLOG_POSTS_DIR=Blog/Posts
OBSIDIAN_TEMPLATES_DIR=Templates/Sistema
OBSIDIAN_ATTACHMENTS_DIR=Anexos
```

## 🔍 Monitoramento e Debug

### Logs

O sistema registra todas as operações de sincronização:

```bash
# Ver logs em tempo real
tail -f logs/app.log | grep Obsidian

# Filtrar apenas erros
tail -f logs/app.log | grep "ERROR.*Obsidian"
```

### Status da Sincronização

Todas as respostas da API incluem informações de status:

```json
{
  "success": true,
  "data": { ... },
  "syncStatus": {
    "obsidianConnected": true,
    "queueLength": 2,
    "isSyncing": false
  }
}
```

### Verificação de Saúde

```bash
curl http://localhost:3001/api/obsidian/status
```

## 🚨 Solução de Problemas

### Erro de Conexão

1. **Verificar se o Obsidian está rodando**
2. **Confirmar se o plugin Local REST API está ativo**
3. **Validar a API Key**
4. **Testar a URL manualmente**:
   ```bash
   curl -H "Authorization: Bearer SUA_API_KEY" http://127.0.0.1:27123/
   ```

### Erro de SSL/HTTPS

Se estiver usando HTTPS (porta 27124):

```bash
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
OBSIDIAN_VERIFY_SSL=false
```

### Fila de Sincronização Travada

```bash
# Ver status da fila
curl http://localhost:3001/api/obsidian/queue

# Forçar processamento
curl -X POST http://localhost:3001/api/obsidian/queue/process
```

### Arquivos Não Aparecendo

1. **Verificar permissões** do diretório
2. **Confirmar estrutura** de pastas no Obsidian
3. **Verificar logs** para erros específicos

## 📝 Notas de Desenvolvimento

### Extensibilidade

O sistema foi projetado para ser extensível:

- **Novos tipos de documento** podem ser adicionados facilmente
- **Templates personalizados** podem ser criados
- **Hooks de sincronização** podem ser implementados

### Performance

- **Fila assíncrona** evita bloqueios
- **Rate limiting** protege a API do Obsidian
- **Retry automático** com backoff exponencial
- **Cache inteligente** (se habilitado)

### Segurança

- **API Key** protegida via variáveis de ambiente
- **Validação** de entrada para todos os endpoints
- **Sanitização** de nomes de arquivo
- **Logs** não expõem informações sensíveis

---

## 🤝 Contribuição

Para contribuir com melhorias na integração:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Implemente** os testes necessários
4. **Submeta** um pull request

### Áreas de Melhoria

- [ ] Sincronização bidirecional completa
- [ ] Interface visual para monitoramento
- [ ] Templates mais avançados
- [ ] Suporte a plugins adicionais do Obsidian
- [ ] Integração com Graph View
- [ ] Backup automático do vault

---

Para mais informações, consulte a [documentação principal](../README.md) ou abra uma [issue](https://github.com/seu-usuario/matriz/issues) no GitHub.
