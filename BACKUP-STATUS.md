# 🔄 Status do Backup - Matriz Knowledge Platform

## 📊 Última Sincronização

- **Data/Hora**: 27/01/2025, 20:45:00
- **Tipo**: Backup completo no GitHub
- **Branch**: main
- **Versão**: 1.0.0
- **Node.js**: v18.17.0
- **Plataforma**: darwin

## 🚀 Repositório

```bash
https://github.com/leandro1416/matriz-knowledge-platform.git
```

## 📦 Componentes Incluídos

- ✅ Código fonte completo
- ✅ Configurações da aplicação
- ✅ Scripts de manutenção
- ✅ Documentação
- ✅ Estrutura de dados
- ✅ Integração Obsidian

## 🔧 Como Usar Este Backup

### 1. Clonar o Repositório
```bash
git clone https://github.com/leandro1416/matriz-knowledge-platform.git
cd matriz-knowledge-platform
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

### 4. Configurar Banco de Dados
```bash
npm run setup
```

### 5. Iniciar Aplicação
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📋 Scripts Disponíveis

```bash
npm start              # Iniciar em produção
npm run dev            # Desenvolvimento com hot reload
npm run setup          # Configurar banco de dados
npm run health         # Verificar saúde do sistema
npm run backup:create  # Criar backup do banco
npm run system:backup  # Backup completo do sistema
npm run github:backup  # Sincronizar com GitHub
```

## 🔗 Links Importantes

- **Repositório**: [https://github.com/leandro1416/matriz-knowledge-platform.git](https://github.com/leandro1416/matriz-knowledge-platform.git)
- **Documentação**: [GUIA_USUARIO_ADMIN.md](./GUIA_USUARIO_ADMIN.md)
- **Setup**: [SETUP_REAL_DATA.md](./SETUP_REAL_DATA.md)
- **Integração Obsidian**: [docs/OBSIDIAN_INTEGRATION.md](./docs/OBSIDIAN_INTEGRATION.md)

## 🔐 Configurações de Segurança

⚠️ **Importante**: 
- O arquivo `.env` não está versionado por segurança
- Configurações sensíveis devem ser definidas manualmente
- Certificados e chaves não estão incluídos no repositório

## ✅ Verificação de Integridade

Para verificar se o backup foi restaurado corretamente:

```bash
npm run health
```

## 📞 Suporte

Para questões sobre restauração ou configuração:
1. Consulte a documentação no repositório
2. Verifique os logs em `logs/`
3. Execute `npm run health` para diagnóstico

---
🤖 Backup automático criado em 27/01/2025, 20:45:00
