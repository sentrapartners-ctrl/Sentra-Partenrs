# Sentra Partners - Trading Management SaaS v2.0

![Sentra Partners Logo](client/public/sentra-logo.png)

## 🚀 Visão Geral

**Sentra Partners** é uma plataforma SaaS completa para gerenciamento profissional de contas de trading MT5/MT4, com foco em transparência, análises avançadas e hierarquia de gerenciamento.

### ✨ Novidades v2.0

- ✅ **Sistema de Hierarquia:** Admin → Gerente → Cliente
- ✅ **Notas de Conta:** Armazene credenciais MT5 e VPS de forma segura
- ✅ **Tema Dark/Light:** Toggle de tema com persistência
- ✅ **Logo Personalizada:** Identidade visual do Sentra Partners
- ✅ **Suporte BIGINT:** Compatível com BTCUSD e ativos de alto valor
- ✅ **Journal de Trading:** Diário com calendário estilo Tradezella

---

## 📦 Conteúdo do Pacote

```
sentra_partners/
├── client/                          # Frontend React + Vite
│   ├── src/
│   │   ├── pages/                   # 10 páginas completas
│   │   │   ├── Home.tsx             # Dashboard principal
│   │   │   ├── Accounts.tsx         # Gerenciamento de contas
│   │   │   ├── Trades.tsx           # Lista de trades
│   │   │   ├── Analytics.tsx        # Análises avançadas
│   │   │   ├── Strategies.tsx       # Diário de trading
│   │   │   ├── Clients.tsx          # Gerenciamento de clientes (admin)
│   │   │   └── ...
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── AccountNotesModal.tsx  # Modal de notas de conta
│   │   │   ├── ThemeToggle.tsx      # Toggle dark/light
│   │   │   └── ...
│   │   └── ...
│   └── public/
│       └── sentra-logo.png          # Logo oficial
│
├── server/                          # Backend Node.js + tRPC
│   ├── routers.ts                   # Endpoints tRPC
│   ├── db.ts                        # Funções de banco de dados
│   ├── mt-api.ts                    # API para MT5 EA
│   └── ...
│
├── drizzle/                         # Schema e migrações
│   ├── schema.ts                    # Definição de 13 tabelas
│   └── *.sql                        # Migrações SQL
│
├── SentraPartners_MT5_COMPLETE.mq5  # Expert Advisor MT5
├── SentraPartners_MT5_DEBUG.mq5     # EA com logs detalhados
│
├── supabase_schema_v2.sql           # Schema PostgreSQL completo
├── DEPLOY_GUIDE_V2.md               # Guia de deploy detalhado
├── README_V2.md                     # Este arquivo
│
└── package.json                     # Dependências do projeto
```

---

## 🎯 Funcionalidades Principais

### 1. Dashboard em Tempo Real
- Balance total e equity agregado
- Posições abertas de todas as contas
- Drawdown atual (equity vs balance)
- Trades recentes (últimos 10)
- Atualização automática a cada 5 segundos

### 2. Sistema de Hierarquia
**3 níveis de acesso:**

| Role     | Permissões                                      |
|----------|-------------------------------------------------|
| **Admin**   | Acesso total, gerencia gerentes e clientes  |
| **Gerente** | Vê apenas clientes atribuídos a ele          |
| **Cliente** | Vê apenas suas próprias contas               |

**Página de Clientes** (`/clients`): Admin pode atribuir clientes para gerentes.

### 3. Notas de Conta (Novo!)
Cada conta tem um botão de notas (📄) que abre modal com:

**Credenciais MT5/MT4:**
- Login
- Senha principal
- Servidor (ex: Exness-MT5Real22)
- Senha investidor

**Detalhes VPS/VM:**
- Provedor (AWS, Contabo, Vultr, etc)
- IP
- Usuário
- Senha
- Porta RDP

**Observações gerais:** Campo de texto livre

**Segurança:** Senhas podem ser ocultadas/exibidas com toggle 👁️

### 4. Análises Avançadas
- **Evolução do Balance:** Gráfico de linha temporal
- **Win Rate por Período:** Gráfico de barras
- **Análise por Símbolo:** Top 10 pares mais negociados
- **Análise Temporal:** Performance por dia da semana e hora
- **Métricas Avançadas:**
  - Sharpe Ratio
  - Sortino Ratio
  - Max Drawdown
  - Recovery Factor

### 5. Diário de Trading (Journal)
Inspirado no **Tradezella**:
- Calendário mensal com lucro/prejuízo visual
- Editor de notas diárias
- Campos: Emoção, Condição de Mercado, Anotações
- Resumo do dia: Total de trades, Lucro, Win Rate

### 6. Integração MT5 Completa
**Expert Advisor envia automaticamente:**
- Heartbeat a cada 60 segundos
- Posições abertas (com SL, TP, Swap, Commission)
- Histórico de trades (últimos 90 dias, até 1000 deals)
- Dados da conta (balance, equity, margin, leverage)

**Suporta TODOS os ativos:**
- ✅ Forex (EURUSD, GBPUSD, etc)
- ✅ Índices (US30, NAS100, etc)
- ✅ Cripto (BTCUSD, ETHUSD, etc)
- ✅ Ações (qualquer símbolo)

**Detecção automática:**
- Contas Cent vs Standard
- Conversão de valores para exibição correta

### 7. Interface Moderna
- **Tema Dark/Light:** Toggle no footer da sidebar
- **Logo Personalizada:** Sentra Partners
- **Paleta de Cores:** Azul/roxo moderno (inspirado no Dashdark X)
- **Responsivo:** Desktop e mobile
- **Ícones:** Lucide React

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **tRPC** (comunicação type-safe com backend)
- **Recharts** (gráficos)
- **Shadcn/ui** (componentes)

### Backend
- **Node.js 22** + **TypeScript**
- **tRPC** (API type-safe)
- **Drizzle ORM** (banco de dados)
- **MySQL** ou **PostgreSQL** (Supabase)

### EA (Expert Advisor)
- **MQL5** (MetaTrader 5)
- Envia dados via HTTP POST (JSON)

---

## 📊 Estrutura do Banco de Dados

**13 Tabelas:**

1. **users** - Usuários (admin, gerente, cliente)
2. **trading_accounts** - Contas MT5/MT4
3. **account_notes** - Notas de conta (credenciais MT5 + VPS) ⭐ NOVO
4. **trades** - Histórico de trades
5. **balance_history** - Evolução do balance
6. **transactions** - Depósitos, saques, etc
7. **user_settings** - Preferências do usuário
8. **strategies** - Estratégias de trading
9. **trade_notes** - Notas de trades individuais
10. **journal_entries** - Diário de trading ⭐ NOVO
11. **economic_events** - Calendário econômico
12. **copy_trading_configs** - Configurações de copy trading
13. **alerts** - Alertas e notificações

---

## 🚀 Como Usar

### 1. Instalação Local

```bash
# Extrair pacote
tar -xzf sentra_partners_v2_complete.tar.gz
cd sentra_partners

# Instalar dependências
pnpm install

# Configurar banco de dados
cp .env.example .env
# Edite .env com suas credenciais

# Aplicar schema
pnpm db:push

# Iniciar desenvolvimento
pnpm dev
```

Acesse: `http://localhost:3002`

### 2. Login Padrão

**Admin 1:**
- Email: `adm1@sentra.com`
- Senha: `admin123`

**Admin 2:**
- Email: `adm2@sentra.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Troque as senhas em produção!

### 3. Configurar EA MT5

1. Abra **MetaEditor** no MT5
2. Abra `SentraPartners_MT5_COMPLETE.mq5`
3. Compile (F7)
4. No MT5, anexe ao gráfico
5. Configure:
   - `UserEmail`: seu email cadastrado
   - `MasterServer`: URL do seu backend + `/api/mt`
6. Ative **AutoTrading**

---

## 📚 Documentação Completa

Consulte `DEPLOY_GUIDE_V2.md` para:
- Deploy no Supabase (PostgreSQL)
- Deploy no Render (backend)
- Deploy na Vercel (frontend)
- Configuração de produção
- Segurança e boas práticas

---

## 🔐 Segurança

- ✅ JWT para autenticação
- ✅ Bcrypt para hash de senhas
- ✅ HTTPS obrigatório em produção
- ✅ CORS configurado
- ⚠️ Considere criptografar senhas de MT5/VPS no banco

---

## 📞 Suporte

**Email:** suporte@sentrapartners.com  
**Website:** [sentrapartners.com](https://sentrapartners.com)

---

## 📄 Licença

Proprietary - Sentra Partners © 2025

---

## 🎉 Changelog v2.0

### Adicionado
- Sistema de hierarquia (Admin, Gerente, Cliente)
- Tabela `account_notes` para credenciais MT5 + VPS
- Modal de notas de conta com toggle de senhas
- Página `/clients` para gerenciamento de clientes
- Campo `managerId` na tabela `users`
- Tema dark/light com toggle e persistência
- Logo personalizada do Sentra Partners
- Suporte BIGINT para BTCUSD e ativos de alto valor
- Diário de trading com calendário mensal
- Tabela `journal_entries`

### Corrigido
- Erro de overflow em `openPrice` para BTCUSD
- Filtro de trades agora busca últimos 90 dias por padrão
- Heartbeat do EA agora envia positions + history juntos
- Frontend agora exibe trades corretamente

### Melhorado
- Interface com paleta azul/roxo moderno
- Permissões granulares por role
- EA envia mais dados (SL, TP, Magic Number, Comment, Swap, Commission)

---

**Versão:** 2.0  
**Data:** 24/10/2025  
**Build:** e46c2503

