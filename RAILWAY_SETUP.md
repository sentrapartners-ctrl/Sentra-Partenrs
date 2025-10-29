# 🚂 Guia de Configuração Railway - Sentra Partners

## 📋 Pré-requisitos
- Conta no Railway (https://railway.app)
- Repositório GitHub conectado
- Credenciais do banco Aiven (já configurado)

---

## 🚀 Passo 1: Criar Projeto no Railway

1. Acesse: https://railway.app/dashboard
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório: `sentrapartners-ctrl/Sentra-Partenrs`
5. Railway vai detectar automaticamente Node.js

---

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

No painel do Railway, vá em **"Variables"** e adicione:

### **Banco de Dados:**
```
AIVEN_DATABASE_URL=mysql://avnadmin:YOUR_PASSWORD@mysql-144d74da-sentrapartners-172c.f.aivencloud.com:11642/defaultdb?ssl-mode=REQUIRED
```
*(Substitua `YOUR_PASSWORD` pela senha do Aiven)*

### **Sessão:**
```
SESSION_SECRET=sentra-partners-secret-2025
```

### **Ambiente:**
```
NODE_ENV=production
PORT=3000
```

### **API URL (depois do deploy):**
```
VITE_API_URL=https://seu-app.up.railway.app
```
*(Substitua `seu-app` pela URL que o Railway gerar)*

---

## 🔧 Passo 3: Configurar Build

Railway detecta automaticamente, mas confirme:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Root Directory:** `/`

---

## 📦 Passo 4: Configurar Recursos

Para **50 contas**, configure:

- **Memory:** 16 GB
- **CPU:** 4 vCPUs
- **Restart Policy:** On Failure

---

## 🌐 Passo 5: Domínio Personalizado (Opcional)

1. Vá em **"Settings" → "Domains"**
2. Adicione seu domínio: `sentrapartners.com`
3. Configure DNS:
   - Tipo: `CNAME`
   - Nome: `@` ou `www`
   - Valor: `seu-app.up.railway.app`

---

## ✅ Passo 6: Deploy

1. Clique em **"Deploy"**
2. Aguarde ~5 minutos
3. Acesse a URL gerada
4. Verifique se está funcionando

---

## 🔄 Passo 7: Atualizar EAs

Depois do deploy, atualize a URL nos EAs:

**Arquivo:** `SentraPartners_MT4.mq4` e `SentraPartners_MT5.mq5`

```mql4
string ServerURL = "https://seu-app.up.railway.app/api/mt";
```

Recompile e reconecte os EAs.

---

## 📊 Monitoramento

Railway oferece:
- Logs em tempo real
- Métricas de CPU/RAM
- Alertas de erro
- Restart automático

---

## 💰 Custo Estimado

Para 50 contas:
- **Railway Pro:** ~$50-70/mês
- **Aiven MySQL:** Free tier (1 GB)

**Total:** ~$50-70/mês

---

## 🆘 Problemas Comuns

### **Erro de conexão com banco:**
- Verifique se `AIVEN_DATABASE_URL` está correta
- Confirme que SSL está habilitado

### **Deploy falha:**
- Verifique logs no Railway
- Confirme que `package.json` tem `build` e `start` scripts

### **Memória insuficiente:**
- Aumente para 16 GB nas configurações

---

## 📞 Suporte

Se precisar de ajuda, me avise! 🚀
