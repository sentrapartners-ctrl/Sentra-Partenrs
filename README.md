# 🚀 Sentra Partners - Trading Management SaaS

Sistema completo de gerenciamento de trading com suporte a MT4/MT5, análise de performance, copy trading e muito mais.

## 📋 Tecnologias

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Recharts (gráficos)
- tRPC Client

### Backend
- Node.js + TypeScript
- tRPC (type-safe API)
- Drizzle ORM
- MySQL2
- JWT Authentication
- bcryptjs

### Banco de Dados
- MySQL (Aiven ou compatível)
- 11 tabelas otimizadas
- Índices para performance

---

## 🚀 Deploy Rápido (Render + Aiven)

### 1️⃣ Criar Banco de Dados Aiven

1. Acesse: https://aiven.io/free-mysql-database
2. Crie conta e serviço MySQL (plano Free)
3. Copie a **Service URI** (DATABASE_URL)

### 2️⃣ Deploy no Render

1. Acesse: https://render.com
2. New + → **Web Service**
3. Conecte este repositório
4. Configure:

```
Name: sentra-partners
Build Command: pnpm install && pnpm build
Start Command: pnpm start
```

### 3️⃣ Variáveis de Ambiente

Adicione no Render (Environment):

```bash
# Banco de Dados Aiven (OBRIGATÓRIO)
AIVEN_DATABASE_URL=mysql://avnadmin:SENHA@mysql-xxx.aivencloud.com:11642/defaultdb?ssl-mode=REQUIRED

# JWT Secret (gere um aleatório)
JWT_SECRET=sua_chave_secreta_muito_segura_aqui

# Node Environment
NODE_ENV=production

# App Info (opcional)
VITE_APP_TITLE=Sentra Partners
VITE_APP_LOGO=https://i.imgur.com/seu-logo.png
```

**Gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4️⃣ Criar Tabelas no Banco

Após o deploy, execute:

```bash
# Instale dependências localmente
pnpm install

# Configure a URL do Aiven
export AIVEN_DATABASE_URL="sua_url_aqui"

# Crie as tabelas
pnpm db:push
```

### 5️⃣ Criar Usuário Admin

Conecte ao banco Aiven e execute:

```sql
INSERT INTO users (email, password, name, role, isActive, createdAt, updatedAt, lastSignedIn)
VALUES (
  'admin@sentra.com',
  '$2b$10$lZzCa2acgC/cuyeLuLVITeMirYClUJw4TeX9yzusbYA5gQai3/dVO',
  'Administrador',
  'admin',
  1,
  NOW(),
  NOW(),
  NOW()
);
```

**Credenciais:**
- Email: `admin@sentra.com`
- Senha: `admin123`

⚠️ Altere a senha após o primeiro login!

---

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- pnpm
- MySQL (Aiven ou local)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/sentrapartners-ctrl/Sentra-Partenrs.git
cd Sentra-Partenrs

# Instale dependências
pnpm install

# Configure variáveis de ambiente
# Crie arquivo .env com:
AIVEN_DATABASE_URL=mysql://...
JWT_SECRET=sua_chave_secreta

# Crie as tabelas
pnpm db:push

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse: http://localhost:3002

---

## 📊 Estrutura do Banco de Dados

### 11 Tabelas:

1. **users** - Usuários (admin, manager, user)
2. **trading_accounts** - Contas MT4/MT5
3. **trades** - Histórico de trades
4. **balance_history** - Evolução do saldo
5. **transactions** - Depósitos e saques
6. **user_settings** - Preferências
7. **strategies** - Estratégias de trading
8. **trade_notes** - Notas de análise
9. **economic_events** - Calendário econômico
10. **copy_trading_configs** - Copy trading
11. **alerts** - Sistema de alertas

---

## 🎯 Funcionalidades

### Dashboard
- Visão geral de contas
- Gráficos de performance
- Resumo de trades

### Contas
- Gerenciamento MT4/MT5
- Status em tempo real
- Histórico de saldo

### Trades
- Lista completa
- Filtros avançados
- Análise de performance

### Análises
- Win rate
- Profit factor
- Drawdown máximo

### Copy Trading
- Copiar entre contas
- Configuração de ratio
- Filtros de símbolos

### Admin
- Gerenciar usuários
- Atribuir gerentes
- Visualizar todas as contas

---

## 🔧 Scripts Disponíveis

```bash
pnpm dev          # Desenvolvimento
pnpm build        # Build para produção
pnpm start        # Iniciar produção
pnpm db:push      # Criar/atualizar tabelas
pnpm check        # Type checking
```

---

## 📁 Estrutura do Projeto

```
sentra_partners/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários
├── server/              # Backend Node.js
│   ├── _core/           # Core do servidor
│   ├── routers/         # Rotas tRPC
│   ├── db.ts            # Conexão banco
│   └── auth.ts          # Autenticação
├── drizzle/             # Schema do banco
│   └── schema.ts        # Definição das tabelas
├── package.json
└── README.md
```

---

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Senhas com bcrypt (10 rounds)
- ✅ SSL/TLS obrigatório
- ✅ Validação de dados (tRPC + Zod)
- ✅ Proteção SQL injection (Drizzle ORM)

---

## 🆘 Troubleshooting

### Erro de conexão com banco
- Verifique `AIVEN_DATABASE_URL`
- Confirme que `ssl-mode=REQUIRED` está na URL
- Verifique se o serviço Aiven está "Running"

### Tabelas não existem
- Execute `pnpm db:push`
- Ou execute o script SQL manualmente

### Login não funciona
- Verifique se o usuário admin foi criado
- Confirme que o hash da senha está correto

---

## 📞 Suporte

- **Documentação Aiven:** https://docs.aiven.io/
- **Documentação Render:** https://render.com/docs
- **Drizzle ORM:** https://orm.drizzle.team/

---

## 📄 Licença

Proprietário - Sentra Partners

---

## 🎉 Status

✅ **Pronto para Produção**

- Código otimizado
- Banco configurado (Aiven MySQL)
- Deploy automatizado (Render)
- Autenticação funcionando
- 11 tabelas criadas

**Versão:** 2.0.0  
**Data:** Outubro 2025

