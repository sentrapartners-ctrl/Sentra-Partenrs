# 🚀 EXECUTAR MIGRATIONS - GUIA COMPLETO

## ⚠️ IMPORTANTE: Execute AGORA para corrigir os erros

Você está vendo estes erros:
- ❌ `Unknown column 'ram' in 'field list'`
- ❌ `Unknown column 'price' in 'field list'`

**Causa:** As tabelas não existem no banco de dados.

**Solução:** Executar os scripts SQL abaixo.

---

## 📋 Passo a Passo

### **Opção 1: Via Railway Dashboard (RECOMENDADO)**

1. **Acesse o Railway:**
   - Vá para https://railway.app
   - Entre no projeto `Sentra-Partenrs`
   - Clique no serviço **MySQL**

2. **Abra o Query Editor:**
   - Clique na aba **"Data"** ou **"Query"**
   - Você verá um editor SQL

3. **Execute o Script de Criação:**
   - Copie TODO o conteúdo de `CREATE_ALL_TABLES.sql`
   - Cole no editor SQL
   - Clique em **"Run"** ou **"Execute"**
   - ✅ Aguarde confirmação de sucesso

4. **Execute o Script de Seed (OPCIONAL):**
   - Copie TODO o conteúdo de `SEED_PRODUCTS.sql`
   - Cole no editor SQL
   - Clique em **"Run"** ou **"Execute"**
   - ✅ Aguarde confirmação de sucesso

---

### **Opção 2: Via Railway CLI**

```bash
# 1. Instalar Railway CLI (se não tiver)
npm install -g @railway/cli

# 2. Fazer login
railway login

# 3. Linkar ao projeto
railway link

# 4. Conectar ao MySQL
railway connect mysql

# 5. Executar scripts (dentro do MySQL)
source CREATE_ALL_TABLES.sql;
source SEED_PRODUCTS.sql;
```

---

### **Opção 3: Via Cliente MySQL**

```bash
# 1. Obter credenciais no Railway Dashboard
# MySQL > Variables > Copiar MYSQL_URL

# 2. Conectar
mysql -h <host> -P <port> -u <user> -p<password> <database>

# 3. Executar scripts
source CREATE_ALL_TABLES.sql;
source SEED_PRODUCTS.sql;
```

---

## ✅ Como Verificar se Funcionou

### **1. Testar APIs**

```bash
# Planos de assinatura
curl https://sentrapartners.com/api/subscription-plans

# VPS
curl https://sentrapartners.com/api/vps-products

# Expert Advisors
curl https://sentrapartners.com/api/expert-advisors
```

**Esperado:** `{"success": true, ...}`

### **2. Testar no Admin**

1. Acesse `/admin`
2. Vá em **"Assinaturas"**
3. Clique em **"Novo Plano"**
4. Preencha e salve
5. ✅ Deve funcionar sem erros

### **3. Testar Páginas Públicas**

- `/subscriptions` - Deve mostrar planos
- `/marketplace-vps` - Deve mostrar VPS
- `/marketplace-eas` - Deve mostrar EAs

---

## 📊 O Que Será Criado

### **Tabelas:**
1. ✅ `subscription_plans` - Planos de assinatura
2. ✅ `vps_products` - Produtos VPS
3. ✅ `expert_advisors` - Expert Advisors
4. ✅ `landing_page_content` - Conteúdo da landing page

### **Dados de Exemplo (se executar SEED):**
- 3 planos de assinatura (Básico, Pro, Premium)
- 4 produtos VPS (Starter, Professional, Premium, Enterprise)
- 3 Expert Advisors (Scalper Pro, Trend Master, Grid Trading)
- 3 seções de landing page (Hero, Features, Pricing)

---

## 🎯 Após Executar

1. ✅ Erros de "Unknown column" desaparecem
2. ✅ Admin funciona completamente
3. ✅ Páginas públicas mostram produtos
4. ✅ Gateway de pagamento funciona
5. ✅ Você pode criar/editar produtos livremente

---

## 🆘 Problemas?

### **Erro: "Table already exists"**
✅ **Normal!** O script usa `IF NOT EXISTS`, então é seguro executar múltiplas vezes.

### **Erro: "Access denied"**
❌ Verifique se está usando as credenciais corretas do Railway.

### **Erro: "Unknown database"**
❌ Certifique-se de estar conectado ao banco correto (geralmente `defaultdb` ou `railway`).

---

## 📝 Arquivos

- `CREATE_ALL_TABLES.sql` - Cria todas as tabelas
- `SEED_PRODUCTS.sql` - Popula com dados de exemplo
- `EXECUTAR_AGORA.md` - Este guia

---

**🚀 EXECUTE AGORA E TODOS OS ERROS SERÃO RESOLVIDOS!**
