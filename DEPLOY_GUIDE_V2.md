# Sentra Partners - Guia Completo de Deploy (v2.0)

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Deploy no Supabase](#deploy-no-supabase)
4. [Deploy do Backend](#deploy-do-backend)
5. [Deploy do Frontend](#deploy-do-frontend)
6. [Configuração do EA MT5](#configuração-do-ea-mt5)
7. [Funcionalidades Implementadas](#funcionalidades-implementadas)

---

## 🎯 Visão Geral

**Sentra Partners** é uma plataforma SaaS completa para gerenciamento de contas de trading MT5/MT4 com:
- Dashboard em tempo real
- Sistema de hierarquia (Admin → Gerente → Cliente)
- Notas seguras de conta (credenciais MT5 + VPS)
- Análises avançadas e journal de trading
- Copy trading e calendário econômico

**Stack Tecnológica:**
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + tRPC + TypeScript
- **Banco de Dados:** PostgreSQL (Supabase) ou MySQL
- **EA:** MQL5 (Expert Advisor para MT5)

---

## 🔧 Pré-requisitos

- **Node.js** 18+ e **pnpm**
- Conta no **Supabase** (gratuita)
- Conta no **Render** ou **Railway** (para backend)
- Conta no **Vercel** ou **Netlify** (para frontend)
- **MetaTrader 5** instalado

---

## 🗄️ Deploy no Supabase

### Passo 1: Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Anote: **Database URL** e **API Keys**

### Passo 2: Executar Schema SQL
1. Vá em **SQL Editor**
2. Cole o conteúdo de `supabase_schema_v2.sql`
3. Execute (Run)
4. Verifique se 13 tabelas foram criadas

### Passo 3: Configurar SSL
1. Vá em **Settings → Database**
2. Ative **SSL Mode: require**
3. Copie **Connection String** (formato PostgreSQL)

**Exemplo de Connection String:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## 🚀 Deploy do Backend (Render)

### Passo 1: Preparar Código
```bash
cd sentra_partners
git init
git add .
git commit -m "Initial commit"
```

### Passo 2: Criar Web Service no Render
1. Acesse [render.com](https://render.com)
2. **New → Web Service**
3. Conecte seu repositório Git
4. Configure:
   - **Name:** `sentra-partners-api`
   - **Environment:** `Node`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`

### Passo 3: Variáveis de Ambiente
Adicione em **Environment Variables**:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=seu_secret_super_seguro_aqui_min_32_chars
OWNER_EMAIL=adm1@sentra.com
OWNER_OPEN_ID=admin_default_001
VITE_APP_TITLE=Sentra Partners
```

### Passo 4: Deploy
1. Clique em **Create Web Service**
2. Aguarde build (5-10 minutos)
3. Anote a **URL do backend**: `https://sentra-partners-api.onrender.com`

---

## 🌐 Deploy do Frontend (Vercel)

### Passo 1: Build Local
```bash
cd sentra_partners/client
pnpm install
pnpm build
```

### Passo 2: Deploy na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. **New Project → Import Git Repository**
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`

### Passo 3: Variáveis de Ambiente
```env
VITE_API_URL=https://sentra-partners-api.onrender.com
VITE_APP_TITLE=Sentra Partners
```

### Passo 4: Deploy
1. Clique em **Deploy**
2. Aguarde (2-5 minutos)
3. Acesse a URL gerada: `https://sentra-partners.vercel.app`

---

## 🤖 Configuração do EA MT5

### Passo 1: Compilar EA
1. Abra **MetaEditor** no MT5
2. Abra `SentraPartners_MT5_COMPLETE.mq5`
3. Compile (F7)
4. Verifique se não há erros

### Passo 2: Configurar Parâmetros
No MT5, anexe o EA ao gráfico e configure:

```
UserEmail = "adm1@sentra.com"  // Email cadastrado no sistema
MasterServer = "https://sentra-partners-api.onrender.com/api/mt"
HeartbeatInterval = 60  // Segundos
MaxHistoryDays = 90
MaxDealsToSend = 1000
```

### Passo 3: Ativar
1. Certifique-se que **AutoTrading** está ativo
2. Verifique logs na aba **Experts**
3. Deve aparecer: `✓ Heartbeat COMPLETO enviado com sucesso`

---

## ✨ Funcionalidades Implementadas

### 🔐 Sistema de Hierarquia
- **Admin:** Acesso total, gerencia gerentes e clientes
- **Gerente:** Vê apenas clientes atribuídos a ele
- **Cliente:** Vê apenas suas próprias contas

**Página:** `/clients` (apenas admin)

### 📝 Notas de Conta
Cada conta tem um botão de notas (ícone 📄) com:
- **Credenciais MT5/MT4:** Login, senha, servidor, senha investidor
- **Detalhes VPS:** Provedor, IP, usuário, senha, porta RDP
- **Observações gerais**

**Permissões:**
- Admin: vê todas as notas
- Gerente: vê notas dos clientes atribuídos
- Cliente: vê apenas suas notas

### 📊 Dashboard
- Balance total e equity em tempo real
- Posições abertas agregadas
- Drawdown atual
- Trades recentes (últimos 10)
- Gráficos de performance

### 📈 Análises Avançadas
- Evolução do balance (gráfico de linha)
- Win rate por período (gráfico de barras)
- Análise por símbolo (top 10 pares)
- Análise temporal (melhor dia/hora)
- Métricas: Sharpe Ratio, Sortino, Max Drawdown, Recovery Factor

### 📔 Diário de Trading (Journal)
- Calendário mensal com lucro/prejuízo por dia
- Editor de notas diárias
- Campos: Emoção, Condição de Mercado, Anotações
- Resumo do dia selecionado

### 🎨 Interface
- Tema dark/light com toggle
- Logo personalizada do Sentra Partners
- Paleta de cores azul/roxo moderno
- Responsivo (desktop e mobile)

### 🔄 Integração MT5
- Heartbeat automático a cada 60 segundos
- Envia posições abertas + histórico (90 dias)
- Suporta TODOS os ativos (Forex, Índices, Cripto, Ações)
- Detecção automática de contas cent/standard
- Auto-limpeza de contas offline

---

## 🔒 Segurança

### Senhas
- **Nunca** armazene senhas em texto plano
- Use **bcrypt** para hash de senhas de usuários
- Considere criptografar senhas de MT5/VPS no banco

### JWT
- Troque `JWT_SECRET` por valor seguro (min 32 caracteres)
- Use HTTPS em produção
- Configure CORS corretamente

### Supabase
- Ative **Row Level Security (RLS)**
- Configure políticas de acesso por role
- Use **SSL** para conexões

---

## 📞 Suporte

**Email:** suporte@sentrapartners.com  
**Documentação:** [docs.sentrapartners.com](https://docs.sentrapartners.com)

---

## 📄 Licença

Proprietary - Sentra Partners © 2025

---

**Versão:** 2.0  
**Última Atualização:** 24/10/2025  
**Autor:** Sentra Partners Development Team

