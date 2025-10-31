# 🔧 Guia de Execução de Migrations

## ⚠️ Problema Identificado

As tabelas de produtos (`subscription_plans`, `vps_products`, `expert_advisors`) e `landing_page_content` **não foram criadas** no banco de dados de produção.

**Sintomas:**
- ❌ Erro: `Unknown column 'price'` ao criar planos/VPS
- ❌ Erro: `Table doesn't exist` ao acessar produtos
- ❌ Frontend mostra erro `toFixed is not a function`

---

## ✅ Solução

### Opção 1: Executar via Endpoint (Recomendado)

O sistema já possui um endpoint para executar todas as migrations automaticamente:

```bash
# Via curl (substitua URL_DO_SEU_SERVIDOR)
curl -X POST https://sentra-partenrs-production.up.railway.app/api/migrations/run-all

# Ou acesse via navegador (faça POST)
https://sentra-partenrs-production.up.railway.app/api/migrations/run-all
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Migrations executadas com sucesso",
  "stats": {
    "total": 15,
    "success": 10,
    "skipped": 5,
    "errors": 0
  }
}
```

---

### Opção 2: Executar Manualmente via MySQL

Se preferir executar diretamente no banco:

```sql
-- 1. Conectar ao MySQL
mysql -h <HOST> -u <USER> -p <DATABASE>

-- 2. Executar o script consolidado
SOURCE /caminho/para/server/migrations/run_all_migrations.sql;
```

---

### Opção 3: Executar via Railway CLI

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Fazer login
railway login

# 3. Conectar ao projeto
railway link

# 4. Abrir shell no servidor
railway run bash

# 5. Executar migrations via curl interno
curl -X POST http://localhost:5000/api/migrations/run-all
```

---

## 📋 Verificar se Migrations Foram Executadas

### Via Endpoint de Status

```bash
curl https://sentra-partenrs-production.up.railway.app/api/migrations/status
```

### Via MySQL

```sql
-- Verificar se tabelas existem
SHOW TABLES LIKE 'subscription_plans';
SHOW TABLES LIKE 'vps_products';
SHOW TABLES LIKE 'expert_advisors';
SHOW TABLES LIKE 'landing_page_content';

-- Verificar estrutura das tabelas
DESCRIBE subscription_plans;
DESCRIBE vps_products;
DESCRIBE expert_advisors;
DESCRIBE landing_page_content;
```

---

## 🎯 Próximos Passos Após Migrations

1. **Executar Seed de Dados**
   ```bash
   # Via SSH no servidor
   npx tsx server/seed-products.ts
   ```

2. **Verificar no Admin Panel**
   - Acessar `/admin`
   - Verificar se as abas estão vazias (esperado após migrations)
   - Criar produtos de teste

3. **Testar CRUD**
   - Criar novo plano de assinatura
   - Criar nova VPS
   - Criar novo EA
   - Editar e deletar itens

---

## 🔍 Troubleshooting

### Erro: "Connection refused"
- Verificar se o servidor está rodando
- Verificar URL do Railway

### Erro: "Access denied"
- Verificar credenciais do MySQL
- Verificar se usuário tem permissões de CREATE TABLE

### Erro: "Table already exists"
- Normal! O script usa `CREATE TABLE IF NOT EXISTS`
- Será ignorado automaticamente

### Erro: "Duplicate column"
- Normal! O script ignora colunas que já existem
- Será ignorado automaticamente

---

## 📁 Arquivos de Migration

| Arquivo | Descrição |
|:--------|:----------|
| `run_all_migrations.sql` | Script consolidado com TODAS as migrations |
| `008_create_admin_products_tables.sql` | Tabelas de produtos (planos, VPS, EAs) |
| `009_create_landing_page_table.sql` | Tabela de conteúdo da landing page |
| `create-admin-products-tables.ts` | Versão TypeScript (não usada) |
| `create-landing-page-table.ts` | Versão TypeScript (não usada) |

---

## ⚡ Execução Rápida (TL;DR)

```bash
# 1. Executar migrations
curl -X POST https://sentra-partenrs-production.up.railway.app/api/migrations/run-all

# 2. Executar seed (via SSH no servidor)
npx tsx server/seed-products.ts

# 3. Verificar no admin
# Acessar: https://sentra-partenrs-production.up.railway.app/admin
```

---

## 🆘 Suporte

Se continuar com problemas:

1. Verificar logs do Railway
2. Verificar logs do MySQL
3. Executar migrations manualmente via MySQL Workbench
4. Contatar desenvolvedor com logs completos

---

**Última atualização:** 2025-10-31  
**Versão:** 1.0
