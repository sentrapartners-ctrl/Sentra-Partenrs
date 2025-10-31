# 🔧 CORRIGIR ERRO DE COLUNAS - EXECUTAR AGORA

## ❌ Problema

Erro: `Unknown column 'ram' in 'field list'`

**Causa:** As tabelas de produtos (`subscription_plans`, `vps_products`, `expert_advisors`) não foram criadas no banco de dados de produção.

---

## ✅ Solução Rápida (1 minuto)

### Opção 1: Via API (Recomendado)

Após o deploy terminar, execute:

```bash
curl -X POST https://sentra-partenrs-production.up.railway.app/api/ensure-tables
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Todas as tabelas foram verificadas e criadas com sucesso!",
  "results": {
    "subscription_plans": true,
    "vps_products": true,
    "expert_advisors": true,
    "landing_page_content": true
  }
}
```

---

### Opção 2: Via Railway CLI

```bash
# 1. Conectar ao Railway
railway login

# 2. Selecionar projeto
railway link

# 3. Executar script
railway run npx tsx server/scripts/ensure-product-tables.ts
```

---

### Opção 3: Via SSH no Railway

```bash
# 1. Abrir shell no Railway
railway shell

# 2. Executar script
npx tsx server/scripts/ensure-product-tables.ts
```

---

## 📊 O Que Será Criado

### 1. **subscription_plans**
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- name (VARCHAR(100), NOT NULL)
- slug (VARCHAR(50), NOT NULL, UNIQUE)
- price (DECIMAL(10,2), NOT NULL, DEFAULT 0)
- features (TEXT)
- active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
```

### 2. **vps_products**
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- name (VARCHAR(100), NOT NULL)
- price (DECIMAL(10,2), NOT NULL, DEFAULT 0)
- ram (VARCHAR(20))
- cpu (VARCHAR(50))
- storage (VARCHAR(50))
- bandwidth (VARCHAR(50))
- max_mt4_instances (INT, DEFAULT 5)
- max_mt5_instances (INT, DEFAULT 5)
- is_free (BOOLEAN, DEFAULT false)
- is_recommended (BOOLEAN, DEFAULT false)
- active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
```

### 3. **expert_advisors**
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- name (VARCHAR(100), NOT NULL)
- description (TEXT)
- price (DECIMAL(10,2), NOT NULL, DEFAULT 0)
- platform (VARCHAR(20), NOT NULL)
- file_url (VARCHAR(500))
- downloads (INT, DEFAULT 0)
- active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
```

### 4. **landing_page_content**
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- section (VARCHAR(50), NOT NULL, UNIQUE)
- title (VARCHAR(200))
- subtitle (VARCHAR(300))
- content (TEXT)
- image_url (VARCHAR(500))
- cta_text (VARCHAR(100))
- cta_link (VARCHAR(300))
- active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
```

---

## 🎯 Após Criar as Tabelas

Execute o seed para popular com dados:

```bash
# Via Railway
railway run npx tsx server/seed-products.ts

# Ou via SSH
npx tsx server/seed-products.ts
```

Isso criará:
- ✅ 3 planos de assinatura
- ✅ 3 produtos VPS
- ✅ 3 Expert Advisors

---

## 🔍 Verificar se Funcionou

Teste no admin:
1. Acesse `/admin`
2. Clique em "Assinaturas" → "Novo Plano" → Preencha e salve
3. Clique em "VPS" → "Nova VPS" → Preencha e salve
4. Clique em "EAs" → "Novo EA" → Preencha e salve

**Se não der erro, está funcionando!** ✅

---

## 📝 Arquivos Criados

- `server/routes/ensure-tables.ts` - Endpoint para criar tabelas via API
- `server/scripts/ensure-product-tables.ts` - Script para criar tabelas via CLI
- `server/migrations/008_create_admin_products_tables.sql` - Migration SQL
- `server/migrations/009_create_landing_page_table.sql` - Migration SQL

---

## 🚨 Importante

**NÃO ESQUEÇA DE EXECUTAR APÓS O DEPLOY!**

Sem executar o endpoint ou script, as tabelas não serão criadas e o erro continuará.

---

## 🎉 Resultado Final

Após executar:
- ✅ Todas as tabelas criadas
- ✅ Todas as colunas presentes
- ✅ CRUD de planos funcionando
- ✅ CRUD de VPS funcionando
- ✅ CRUD de EAs funcionando
- ✅ Landing page editável

**Nenhum erro de coluna inexistente!**
