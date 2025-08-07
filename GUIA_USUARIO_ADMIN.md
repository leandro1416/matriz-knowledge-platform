# 👑 Guia do Usuário Admin - Sistema Matriz

## 🎯 **Bem-vindo ao seu Sistema!**

Este é seu guia completo para navegar e utilizar toda a plataforma Matriz como usuário administrador. O sistema foi organizado para ser intuitivo e poderoso.

---

## 🌐 **Como Acessar**

### **Páginas Principais:**
- **🏠 Home:** `http://localhost:3001/` - Página inicial elegante
- **👑 Admin Dashboard:** `http://localhost:3001/admin-dashboard.html` - **SEU CENTRO DE CONTROLE**
- **🤖 Dashboard IA:** `http://localhost:3001/dashboard.html` - Chat com IA
- **📝 Notas:** `http://localhost:3001/strategic-notes.html` - Gerenciar notas
- **📊 Logs:** `http://localhost:3001/logs-dashboard.html` - Monitoramento

### **Terminal CLI:**
```bash
python3 matriz-cli.py           # Modo interativo
python3 matriz-cli.py status    # Status do sistema
python3 matriz-cli.py open dashboard  # Abrir no navegador
```

---

## 👑 **Admin Dashboard - SEU PAINEL PRINCIPAL**

### **📊 Visão Geral**
**O que você vê:**
- ✅ **Status em tempo real** de todos os serviços
- 🤖 **IA Status** (OpenAI/Mock)
- 📝 **Obsidian** (Conectado/Fallback)
- 🗄️ **MongoDB** (Conectado/Mock)
- 📦 **Backup** (Ativo/Parado)

**Ações Rápidas:**
- 🤖 **Testar IA** - Fazer pergunta e ver integração
- 📦 **Backup Manual** - Criar backup completo
- 📋 **Ver Logs** - Logs em tempo real
- 💻 **Terminal CLI** - Comandos diretos

---

## 🤖 **Gerenciamento de IA**

### **💬 Chat IA**
- Digite sua pergunta
- Veja resposta com markdown formatado
- **Automático:** Cada resposta é salva no Obsidian
- Hash único para cada interação

### **📜 Histórico**
- Todas as conversas anteriores
- Busca por conteúdo
- Cadeia de blocos completa

### **⚙️ Configurações**
- Status atual da IA
- Modelo em uso (GPT-4o-mini)
- Modo (OpenAI/Mock)

---

## 📝 **Controle do Obsidian**

### **📊 Status**
- **Conectado:** ✅ Salva direto no Obsidian
- **Fallback:** ⚠️ Salva localmente (sincroniza depois)
- **Fila:** Número de itens pendentes

### **🔄 Sincronização**
- **Sincronizar Tudo:** Processa todos os documentos
- **Processar Fila:** Força sync dos pendentes
- **Testar Conexão:** Verifica se Obsidian está online

### **📁 Explorar Arquivos**
- Lista arquivos em diretórios específicos
- AI Responses, Strategic Notes, Blog Posts, Blocks

---

## 🧪 **Testador de API**

### **🌐 Teste Manual**
- **Método:** GET, POST, PUT, DELETE
- **Endpoint:** Qualquer endpoint da API
- **Body:** JSON para POST/PUT
- **Resposta:** Formatada e detalhada

### **⚡ Testes Rápidos**
Botões para testar endpoints importantes:
- 📊 `/api/status` - Status geral
- 🤖 `/api/ai/status` - Status da IA
- 📝 `/api/obsidian/status` - Status Obsidian
- 📦 `/api/backup/status` - Status backup

---

## 📦 **Gerenciador de Backup**

### **💾 Criar Backup**
- **📦 Backup Completo** - Todo o sistema
- **🗄️ Backup Database** - Apenas dados
- **🔗 Backup Blockchain** - Apenas cadeia IA

### **📋 Status**
- Último backup criado
- Total de backups
- Status do serviço automático

---

## 📋 **Visualizador de Logs**

### **🔴 Live**
- Logs em tempo real
- Atualização automática

### **❌ Erros**
- Apenas logs de erro
- Para debugging

### **ℹ️ Info**
- Logs informativos
- Funcionamento normal

---

## ⚙️ **Monitor do Sistema**

### **📊 Métricas**
- CPU, RAM, Uptime
- Performance em tempo real
- Estatísticas detalhadas

### **🔍 Informações**
- Versão do sistema
- Configurações ativas
- Status de conectividade

---

## 🎯 **Como Usar no Dia a Dia**

### **1. 🌅 Rotina Matinal**
```bash
# Via terminal
python3 matriz-cli.py status

# Ou no navegador
http://localhost:3001/admin-dashboard.html
```
**Verifique:**
- ✅ Todos os serviços online
- 📦 Backup funcionando
- 🤖 IA respondendo

### **2. 💬 Interagir com IA**
```bash
# Via web (recomendado)
Admin Dashboard → Gerenciar IA → Chat IA

# Via CLI
python3 matriz-cli.py test-ai
```
**Resultado:** Resposta salva automaticamente no Obsidian

### **3. 📝 Verificar Obsidian**
```bash
Admin Dashboard → Controle Obsidian → Status
```
**Se offline:**
- Arquivos salvos localmente em `obsidian-sync/`
- Sincroniza automaticamente quando voltar online

### **4. 🔍 Debugging**
```bash
Admin Dashboard → Logs → Live
```
**Para problemas:**
- Veja logs de erro
- Teste APIs específicas
- Reinicie serviços se necessário

### **5. 📦 Backup Preventivo**
```bash
Admin Dashboard → Backup → Backup Completo
```
**Quando fazer:**
- Antes de mudanças importantes
- Semanalmente (automático é diário)

---

## 🚨 **Solução de Problemas**

### **🤖 IA não responde**
1. Verifique status: `Admin Dashboard → IA Status`
2. Se "mock", configure OpenAI API key
3. Se erro, veja logs de erro

### **📝 Obsidian offline**
1. Instale plugin "Local REST API" no Obsidian
2. Configure porta 27124 (HTTPS)
3. Teste conexão no Admin Dashboard

### **🗄️ MongoDB offline**
1. Sistema funciona em modo mock
2. Para conectar: instale MongoDB localmente
3. Configure MONGODB_URI no .env

### **📦 Backup falhou**
1. Verifique espaço em disco
2. Veja logs de erro específicos
3. Teste backup manual

---

## 📊 **APIs Disponíveis**

### **Sistema Geral**
- `GET /api/status` - Status completo
- `GET /api/health` - Health check

### **IA**
- `POST /api/ai/ask` - Perguntar à IA
- `GET /api/ai/status` - Status da IA
- `GET /api/ai/chain` - Cadeia completa
- `GET /api/ai/search?query=termo` - Buscar histórico

### **Obsidian**
- `GET /api/obsidian/status` - Status
- `POST /api/obsidian/test-connection` - Testar
- `POST /api/obsidian/sync/all` - Sincronizar tudo
- `GET /api/obsidian/queue` - Ver fila

### **Backup**
- `GET /api/backup/status` - Status
- `POST /api/backup/create` - Criar backup
- `GET /api/backup/list` - Listar backups

---

## 💡 **Dicas Pro**

### **🎯 Eficiência**
1. **Bookmark:** `http://localhost:3001/admin-dashboard.html`
2. **CLI Alias:** `alias matriz="python3 /caminho/matriz-cli.py"`
3. **Auto-refresh:** Admin Dashboard atualiza sozinho

### **🔧 Personalização**
1. **Temas:** Modifique `public/css/main.css`
2. **Configurações:** Edite arquivos em `src/config/`
3. **Endpoints:** Adicione em `src/routes/`

### **📈 Monitoramento**
1. **Logs em tempo real:** Sempre habilitado
2. **Métricas:** Atualizadas a cada 30s
3. **Notificações:** Sistema de alertas visual

### **🚀 Performance**
1. **Cache:** Ativado automaticamente
2. **Compressão:** Habilitada por padrão
3. **Rate limiting:** Proteção contra spam

---

## 📱 **Interface Mobile**

O Admin Dashboard é **100% responsivo**:
- 📱 **Mobile:** Funciona perfeitamente no celular
- 💻 **Desktop:** Interface completa
- 📱 **Tablet:** Layout adaptado

---

## 🎉 **Recursos Únicos**

### **🧠 IA + Obsidian Automático**
- Cada pergunta vira nota estruturada
- Títulos inteligentes automáticos
- Tags e metadados completos
- Links internos para navegação

### **🔄 Sistema de Fallback**
- Nunca perde dados
- Funciona offline
- Sincroniza automaticamente

### **📊 Dashboard Unificado**
- Tudo em um lugar
- Status em tempo real
- Ações com um clique

### **💻 CLI Poderosa**
- Modo interativo
- Comandos diretos
- Integração completa

---

## 🛡️ **Segurança**

- **🔒 HTTPS** quando certificados disponíveis
- **🛡️ Rate limiting** contra ataques
- **🔐 JWT** para autenticação futura
- **📝 Logs** de todas as ações
- **📦 Backups** automáticos

---

## 🚀 **Próximos Passos**

1. **📖 Explore:** Navegue pelo Admin Dashboard
2. **🤖 Teste:** Faça perguntas à IA
3. **📝 Configure:** Instale Obsidian plugin se desejar
4. **📊 Monitore:** Acompanhe logs e métricas
5. **📦 Backup:** Configure backups regulares

---

## 🆘 **Suporte**

### **Documentação:**
- `/docs/OBSIDIAN_INTEGRATION.md` - Integração Obsidian
- `README.md` - Instalação e configuração

### **Comandos Úteis:**
```bash
# Status completo
python3 matriz-cli.py status

# Abrir admin dashboard
python3 matriz-cli.py open dashboard

# Teste completo
python3 matriz-cli.py test-ai

# Backup manual
python3 matriz-cli.py backup
```

### **Logs de Debug:**
```bash
# Ver logs em tempo real
tail -f logs/info.log

# Filtrar erros
tail -f logs/error.log
```

---

**🎯 Seu sistema está pronto! Use o Admin Dashboard como seu centro de comando principal para controlar toda a plataforma Matriz de forma simples e intuitiva! 🚀**
