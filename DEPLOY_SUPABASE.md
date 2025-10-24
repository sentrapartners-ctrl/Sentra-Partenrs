# 🚀 Deploy Sentra Partners no Supabase

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Node.js 18+ instalado
3. Código fonte do projeto

## 🗄️ Configuração do Banco de Dados

### 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em "New Project"
3. Escolha:
   - **Name**: sentra-partners
   - **Database Password**: (crie uma senha forte)
   - **Region**: (escolha a mais próxima)
4. Aguarde a criação do projeto (2-3 minutos)

### 2. Executar Script SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New Query"
3. Cole o conteúdo do arquivo `supabase_schema.sql`
4. Clique em "Run" para executar
5. Verifique se todas as tabelas foram criadas em **Table Editor**

### 3. Obter Credenciais

1. Vá em **Settings** → **Database**
2. Copie as seguintes informações:
   - **Host**: `db.xxxxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (a senha que você criou)

3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (para uso no frontend se necessário)
   - **service_role key**: (para uso no backend)

## ⚙️ Configuração do Projeto

### 1. Instalar Dependências

```bash
cd sentra_partners
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres

# JWT Secret (gere uma chave aleatória forte)
JWT_SECRET=sua_chave_secreta_muito_forte_aqui

# Server
PORT=3000
NODE_ENV=production

# Supabase (opcional, para features avançadas)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_KEY=sua_service_role_key
```

### 3. Atualizar Drizzle Config

Edite `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Mudou de mysql para postgresql
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 4. Atualizar Schema do Drizzle

Edite `drizzle/schema.ts` e substitua todos os imports:

**DE:**
```typescript
import { mysqlTable, int, varchar, ... } from "drizzle-orm/mysql-core";
```

**PARA:**
```typescript
import { pgTable, serial, varchar, ... } from "drizzle-orm/pg-core";
```

E substitua:
- `mysqlTable` → `pgTable`
- `int` → `integer` ou `serial` (para auto-increment)
- `mysqlEnum` → `varchar` com CHECK constraint ou use `pgEnum`
- `timestamp` → `timestamp`
- `boolean` → `boolean`

### 5. Atualizar Conexão do Banco

Edite `server/db.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

export async function getDb() {
  return db;
}
```

### 6. Instalar Dependências PostgreSQL

```bash
pnpm remove mysql2
pnpm add postgres drizzle-orm@latest
```

## 🚀 Deploy

### Opção 1: Deploy no Render.com

1. Crie conta no [Render](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: sentra-partners
   - **Environment**: Node
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start`
5. Adicione as variáveis de ambiente (`.env`)
6. Clique em "Create Web Service"

### Opção 2: Deploy no Vercel

1. Instale Vercel CLI: `pnpm add -g vercel`
2. Execute: `vercel`
3. Siga as instruções
4. Adicione variáveis de ambiente no dashboard

### Opção 3: Deploy no Railway

1. Crie conta no [Railway](https://railway.app)
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione o repositório
4. Adicione variáveis de ambiente
5. Deploy automático!

## 🔧 Configuração do EA (MT5)

Após o deploy, atualize o EA com a nova URL:

```mql5
input string MasterServer = "https://seu-app.render.com/api/mt";
input string UserEmail = "adm1@sentra.com";
```

## ✅ Verificação

1. Acesse sua URL de produção
2. Faça login com:
   - Email: `adm1@sentra.com`
   - Senha: `admin123`
3. Conecte o EA no MT5
4. Aguarde 60 segundos
5. Verifique se os dados aparecem no dashboard

## 🔐 Segurança

### Alterar Senhas Padrão

```sql
-- No SQL Editor do Supabase
UPDATE users 
SET password = '$2b$10$NOVA_HASH_BCRYPT_AQUI'
WHERE email = 'adm1@sentra.com';
```

Gere hash bcrypt em: https://bcrypt-generator.com/

### Habilitar SSL

No `.env`:
```env
DATABASE_URL=postgresql://postgres:senha@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

### Configurar Row Level Security (RLS)

No Supabase SQL Editor:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
-- ... repita para todas as tabelas

-- Criar políticas (exemplo para trades)
CREATE POLICY "Users can only see their own trades"
  ON trades FOR SELECT
  USING (user_id = auth.uid());
```

## 📊 Monitoramento

### Logs do Supabase

1. Vá em **Logs** no painel do Supabase
2. Monitore queries lentas
3. Configure alertas

### Métricas

1. Vá em **Reports** → **Database**
2. Monitore:
   - Conexões ativas
   - Uso de CPU/RAM
   - Tamanho do banco

## 🆘 Troubleshooting

### Erro: "Connection refused"
- Verifique se o IP está na whitelist do Supabase
- Vá em **Settings** → **Database** → **Connection pooling**

### Erro: "SSL required"
- Adicione `?sslmode=require` na DATABASE_URL

### Trades não aparecem
- Verifique logs do servidor
- Confirme que EA está enviando para URL correta
- Verifique se porta está aberta (3000 ou 3002)

## 📞 Suporte

- Documentação Supabase: https://supabase.com/docs
- Discord Supabase: https://discord.supabase.com
- Issues do projeto: (seu GitHub)

---

**Desenvolvido com ❤️ para Sentra Partners**

