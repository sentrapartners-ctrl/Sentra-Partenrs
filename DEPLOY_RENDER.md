# 🚀 Deploy Sentra Partners no Render.com

## 📋 Pré-requisitos

- Conta no GitHub (github.com)
- Conta no Render (render.com)

## 🔧 Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Nome do repositório:** `Sentra-API`
3. **Descrição:** `Sentra Partners - Trading Management SaaS`
4. **Visibilidade:** Public ou Private
5. **NÃO** marque "Initialize with README"
6. Clique em **"Create repository"**

## 📤 Passo 2: Fazer Upload do Código

### Opção A: Via GitHub Web (Mais Fácil)

1. No repositório criado, clique em **"uploading an existing file"**
2. Arraste o arquivo ZIP do projeto
3. Clique em **"Commit changes"**

### Opção B: Via Git Command Line

```bash
cd /caminho/para/sentra_partners
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/Sentra-API.git
git push -u origin main
```

## 🌐 Passo 3: Deploy no Render

### 3.1 Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Faça login com GitHub

### 3.2 Conectar Repositório

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Blueprint"**
3. Conecte seu repositório GitHub `Sentra-API`
4. O Render vai detectar automaticamente o `render.yaml`
5. Clique em **"Apply"**

### 3.3 Aguardar Deploy

- O Render vai criar automaticamente:
  - ✅ Web Service (API + Frontend)
  - ✅ PostgreSQL Database
  - ✅ SSL Certificate (HTTPS)

- Tempo estimado: **5-10 minutos**

## 🔐 Passo 4: Configurar Variáveis de Ambiente (Opcional)

Se precisar adicionar mais variáveis:

1. Vá em **Dashboard → sentra-api → Environment**
2. Adicione as variáveis necessárias
3. Clique em **"Save Changes"**

### Variáveis Importantes:

```
DATABASE_URL=postgresql://... (gerado automaticamente)
JWT_SECRET=... (gerado automaticamente)
PORT=10000 (já configurado)
NODE_ENV=production (já configurado)
```

## 🎯 Passo 5: Obter URL da API

1. Após deploy concluído, vá em **Dashboard → sentra-api**
2. Copie a URL (exemplo: `https://sentra-api.onrender.com`)
3. **Esta é sua URL permanente!**

## 📱 Passo 6: Atualizar EA MT5

Atualize o parâmetro `MasterServer` no EA:

```
https://sentra-api.onrender.com/api/mt
```

E adicione nas URLs permitidas do MT5:

```
https://sentra-api.onrender.com
```

## ✅ Verificar Deploy

Acesse no navegador:

```
https://sentra-api.onrender.com
```

Você deve ver a tela de login do Sentra Partners!

## 🔄 Atualizações Futuras

Para atualizar o sistema:

1. Faça alterações no código
2. Faça commit e push para GitHub
3. O Render faz deploy automático!

```bash
git add .
git commit -m "Descrição da alteração"
git push
```

## ⚠️ Limitações do Plano Gratuito

- ✅ 750 horas/mês (suficiente para 1 projeto)
- ⚠️ Servidor "dorme" após 15 minutos sem uso
- ⚠️ Primeiro acesso após "dormir" demora ~30 segundos
- ✅ Banco de dados PostgreSQL 1GB grátis

## 💡 Dicas

1. **Manter servidor ativo:** Configure um serviço de ping (UptimeRobot) para fazer requisição a cada 10 minutos
2. **Domínio personalizado:** Você pode adicionar seu próprio domínio nas configurações
3. **Upgrade:** Se precisar de mais recursos, planos pagos começam em $7/mês

## 🆘 Problemas Comuns

### Deploy falhou

- Verifique os logs em **Dashboard → sentra-api → Logs**
- Certifique-se que `package.json` está correto
- Verifique se `render.yaml` está na raiz do projeto

### Banco de dados não conecta

- Verifique se a variável `DATABASE_URL` está configurada
- Aguarde alguns minutos para o banco inicializar

### EA não conecta

- Verifique se adicionou a URL nas configurações do MT5
- Certifique-se que a URL está correta (com `/api/mt`)
- Verifique logs do servidor no Render

## 📞 Suporte

- Documentação Render: https://render.com/docs
- GitHub Issues: Crie issue no repositório

---

**Pronto! Seu Sentra Partners estará online 24/7! 🎉**

