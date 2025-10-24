# 🚀 Deploy Sentra Partners no Render com PostgreSQL/Supabase

## ✅ Pré-requisitos

1. Conta no [Supabase](https://supabase.com) (gratuita)
2. Conta no [Render](https://render.com) (gratuita)
3. Conta no [GitHub](https://github.com) (gratuita)

---

## 📦 PASSO 1: Configurar Banco de Dados no Supabase

### 1.1 Criar Projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **New Project**
3. Preencha:
   - **Name:** Sentra Partners
   - **Database Password:** Escolha uma senha forte (guarde!)
   - **Region:** Escolha o mais próximo (ex: South America - São Paulo)
4. Clique em **Create new project**
5. Aguarde 2-3 minutos

### 1.2 Executar SQL para Criar Tabelas

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `supabase_schema_v2.sql` (que está no pacote)
4. **Copie TODO o conteúdo** e cole no SQL Editor
5. Clique em **Run** (ou pressione F5)
6. Aguarde aparecer **"Success. No rows returned"**

### 1.3 Pegar Connection String

1. No menu lateral, clique em **⚙️ Settings**
2. Clique em **Database**
3. Role até **Connection string**
4. Selecione **Transaction** (não Session!)
5. Copie a URL (algo como):
   ```
   postgresql://postgres.XXXXX:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. **Troque `[YOUR-PASSWORD]` pela senha que você criou no passo 1.1**
7. **Guarde essa URL completa!**

---

## 🚀 PASSO 2: Deploy no Render

### 2.1 Fazer Upload do Código no GitHub

1. Acesse [github.com](https://github.com)
2. Clique em **New repository**
3. Nome: `sentra-partners`
4. Visibilidade: **Private** (recomendado)
5. Clique em **Create repository**
6. **No seu computador:**
   - Extraia o arquivo `sentra_partners_postgresql.tar.gz`
   - Abra o terminal na pasta extraída
   - Execute:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - PostgreSQL version"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/sentra-partners.git
   git push -u origin main
   ```

### 2.2 Criar Web Service no Render

1. Acesse [render.com/dashboard](https://dashboard.render.com)
2. Clique em **New +** → **Web Service**
3. Conecte seu GitHub (se ainda não conectou)
4. Selecione o repositório **sentra-partners**
5. Clique em **Connect**

### 2.3 Configurar o Serviço

**Preencha os campos:**

- **Name:** `sentra-partners` (ou outro nome)
- **Region:** Escolha o mais próximo
- **Branch:** `main`
- **Root Directory:** (deixe vazio)
- **Runtime:** `Node`
- **Build Command:**
  ```bash
  pnpm install && pnpm run build
  ```
- **Start Command:**
  ```bash
  node dist/index.js
  ```
- **Instance Type:** `Free` (para começar)

### 2.4 Adicionar Variáveis de Ambiente

Role até **Environment Variables** e adicione:

#### DATABASE_URL
```
postgresql://postgres:SUA_SENHA@db.XXXXX.supabase.co:5432/postgres
```
*(Use a URL completa que você copiou no Passo 1.3)*

#### JWT_SECRET
```
sentra_partners_jwt_secret_super_seguro_2025_minimo_32_chars
```

#### OWNER_EMAIL
```
adm1@sentra.com
```

#### OWNER_OPEN_ID
```
admin_default_001
```

#### VITE_APP_TITLE
```
Sentra Partners
```

#### VITE_API_URL
```
https://SEU_SERVICO.onrender.com
```
*(Troque SEU_SERVICO pelo nome que você escolheu no passo 2.3)*

#### NODE_ENV
```
production
```

### 2.5 Fazer Deploy

1. Clique em **Create Web Service**
2. Aguarde 5-10 minutos (primeira vez demora mais)
3. Quando aparecer **"Live"** em verde, está pronto!

---

## 🎯 PASSO 3: Acessar o Sistema

1. Clique na URL do seu serviço (ex: `https://sentra-partners.onrender.com`)
2. Faça login com:
   - **Email:** `adm1@sentra.com`
   - **Senha:** `admin123`
3. **IMPORTANTE:** Mude a senha imediatamente após primeiro login!

---

## 🔧 PASSO 4: Configurar Expert Advisor (MT5)

### 4.1 Compilar o EA

1. Abra o MetaEditor no MT5
2. Abra o arquivo `SentraPartners_MT5_COMPLETE.mq5`
3. Pressione **F7** para compilar
4. Aguarde aparecer **"0 error(s), 0 warning(s)"**

### 4.2 Configurar Parâmetros

1. No MT5, arraste o EA para um gráfico
2. Configure:
   - **UserEmail:** Seu email cadastrado no sistema
   - **MasterServer:** `https://SEU_SERVICO.onrender.com/api/mt`
   - **HeartbeatInterval:** `60` (segundos)
3. Marque **"Allow WebRequest for listed URL"**
4. Clique em **OK**

### 4.3 Verificar Conexão

1. Abra a aba **"Experts"** no MT5
2. Deve aparecer:
   ```
   ✓ Heartbeat COMPLETO enviado com sucesso
   ✓ Enviado para /api/mt/heartbeat (Status: 200)
   ```
3. No sistema web, vá em **Contas** e veja sua conta conectada!

---

## 🐛 Solução de Problemas

### Erro: "Invalid URL"
- Verifique se `VITE_API_URL` está correto
- Faça **Clear build cache & deploy** no Render

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está correta
- Teste a conexão no Supabase (Settings → Database → Connection pooler)

### EA não conecta
- Verifique se a URL do `MasterServer` está correta
- Certifique-se que termina com `/api/mt`
- Verifique se o email está cadastrado no sistema

### Contas não aparecem
- Aguarde 60 segundos (intervalo do heartbeat)
- Verifique os logs do EA no MT5 (aba Experts)
- Veja os logs do Render (Dashboard → Logs)

---

## 📊 Próximos Passos

1. **Criar usuários gerentes:**
   - Acesse **Admin → Usuários**
   - Clique em **Novo Usuário**
   - Selecione role **Gerente**

2. **Atribuir clientes:**
   - Acesse **Clientes**
   - Selecione o gerente responsável

3. **Configurar alertas:**
   - Acesse **Alertas**
   - Configure notificações de drawdown, profit, etc

4. **Personalizar:**
   - Logo: Edite `VITE_APP_LOGO` nas variáveis de ambiente
   - Título: Edite `VITE_APP_TITLE`

---

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs no Render (Dashboard → Logs)
2. Verifique os logs do EA no MT5 (aba Experts)
3. Teste a conexão do banco no Supabase

---

**✅ Pronto! Seu sistema está no ar!** 🎉

