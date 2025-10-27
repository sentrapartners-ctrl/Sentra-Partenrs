# Correção de Problemas de Login e Cadastro

## Problema Identificado

Ambos os métodos de login (email e wallet) estão falhando porque **as tabelas necessárias não existem no banco de dados**. O código foi desenvolvido e commitado, mas as migrations não foram executadas.

### Tabelas Faltando

1. **wallet_sessions** - Para autenticação via Web3/MetaMask
2. **subscription_plans** - Planos de assinatura
3. **user_subscriptions** - Assinaturas ativas dos usuários
4. **vps_products** - Produtos VPS
5. **ea_products** - Expert Advisors para venda
6. **user_purchases** - Compras de usuários
7. **product_reviews** - Avaliações de produtos
8. **crypto_payment_addresses** - Endereços para pagamento em cripto
9. **crypto_exchange_rates** - Taxas de câmbio de criptomoedas
10. **payment_transactions** - Transações de pagamento
11. **manager_assignments** - Atribuição de gerentes a clientes

### Campos Faltando em Tabelas Existentes

**Tabela `users`:**
- `walletAddress` VARCHAR(128) UNIQUE
- `authMethod` ENUM('email', 'wallet', 'both')
- `managerId` INT

**Tabela `accounts`:**
- `classification` VARCHAR(128)
- `isCentAccount` BOOLEAN

**Tabela `trades`:**
- `origin` ENUM('robot', 'manual', 'unknown')

---

## Solução

Execute o script SQL `create_all_tables.sql` no banco de dados MySQL.

### Opção 1: Via Aiven Console (Recomendado)

1. Acesse https://console.aiven.io
2. Navegue até o serviço MySQL do Sentra Partners
3. Clique em "Query Editor" ou "SQL"
4. Copie e cole o conteúdo de `create_all_tables.sql`
5. Execute o script
6. Verifique se todas as tabelas foram criadas

### Opção 2: Via MySQL Workbench

1. Abra MySQL Workbench
2. Conecte ao banco de dados Aiven:
   - Host: `mysql-sentrapartners-sentrapartners.l.aivencloud.com`
   - Port: `28778`
   - User: `avnadmin`
   - Password: (sua senha)
   - Database: `defaultdb`
3. Abra o arquivo `create_all_tables.sql`
4. Execute o script (Ctrl+Shift+Enter)

### Opção 3: Via Linha de Comando

```bash
mysql -h mysql-sentrapartners-sentrapartners.l.aivencloud.com \
  -P 28778 \
  -u avnadmin \
  -p \
  defaultdb < create_all_tables.sql
```

---

## Verificação Pós-Execução

Após executar o script, verifique se as tabelas foram criadas:

```sql
-- Verificar tabelas criadas
SHOW TABLES;

-- Verificar estrutura da tabela users
DESCRIBE users;

-- Verificar se wallet_sessions existe
SELECT COUNT(*) FROM wallet_sessions;

-- Verificar planos de assinatura inseridos
SELECT * FROM subscription_plans;

-- Verificar endereços crypto inseridos
SELECT * FROM crypto_payment_addresses;
```

**Resultado esperado:**

```
+---------------------------+
| Tables_in_defaultdb       |
+---------------------------+
| accounts                  |
| balance_history           |
| crypto_exchange_rates     |
| crypto_payment_addresses  |
| ea_products               |
| manager_assignments       |
| payment_transactions      |
| product_reviews           |
| subscription_plans        |
| trades                    |
| user_purchases            |
| user_subscriptions        |
| users                     |
| vps_products              |
| wallet_sessions           |
+---------------------------+
```

---

## Teste de Login Após Correção

### Teste 1: Login via Email

1. Acesse https://sentrapartners.com
2. Clique em "Login"
3. Insira email e senha de um usuário existente
4. Clique em "Entrar"

**Resultado esperado:** Login bem-sucedido, redirecionamento para dashboard

### Teste 2: Cadastro via Email

1. Acesse https://sentrapartners.com
2. Clique em "Cadastrar"
3. Preencha:
   - Nome completo
   - Email
   - Senha
4. Clique em "Criar conta"

**Resultado esperado:** Conta criada, login automático, redirecionamento para dashboard

### Teste 3: Login via Wallet

1. Acesse https://sentrapartners.com
2. Clique em "Conectar Wallet" ou ícone da MetaMask
3. Selecione MetaMask
4. Aprove a conexão
5. Assine a mensagem de autenticação

**Resultado esperado:** Login bem-sucedido, redirecionamento para dashboard

**Se for primeiro acesso:**
- Novo usuário criado automaticamente
- Nome padrão: "User 0x1234..." (primeiros 6 caracteres da wallet)
- Role: client
- Gerente atribuído automaticamente (round-robin)

---

## Estrutura das Novas Tabelas

### wallet_sessions

Armazena sessões de autenticação via Web3.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| walletAddress | VARCHAR(128) | Endereço da carteira |
| nonce | VARCHAR(256) | Mensagem assinada (nonce) |
| signature | VARCHAR(512) | Assinatura da mensagem |
| isVerified | BOOLEAN | Se a assinatura foi verificada |
| expiresAt | TIMESTAMP | Data de expiração da sessão |
| createdAt | TIMESTAMP | Data de criação |

### subscription_plans

Define os planos de assinatura disponíveis.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| name | VARCHAR(128) | Nome do plano (Free, Pro, Premium) |
| slug | VARCHAR(128) | Slug único (free, pro, premium) |
| priceMonthly | INT | Preço mensal em centavos |
| priceQuarterly | INT | Preço trimestral em centavos |
| priceYearly | INT | Preço anual em centavos |
| features | TEXT | Features em JSON |
| maxAccounts | INT | Máximo de contas permitidas |
| copyTradingEnabled | BOOLEAN | Copy trading habilitado |
| advancedAnalyticsEnabled | BOOLEAN | Analytics avançado habilitado |
| freeVpsEnabled | BOOLEAN | VPS gratuito incluído |
| prioritySupport | BOOLEAN | Suporte prioritário |

**Planos inseridos automaticamente:**

1. **Free** - $0/mês
   - 1 conta de trading
   - Analytics básico
   - Suporte por email

2. **Pro** - $49/mês ($139 trimestral, $499 anual)
   - 5 contas de trading
   - Analytics avançado
   - Copy trading
   - Suporte prioritário

3. **Premium** - $99/mês ($289 trimestral, $999 anual)
   - Contas ilimitadas
   - Analytics avançado
   - Copy trading
   - VPS gratuito
   - Suporte 24/7

### crypto_payment_addresses

Endereços de carteiras para receber pagamentos em criptomoedas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| currency | ENUM | BTC, USDT, MATIC, ETH |
| network | VARCHAR(64) | Bitcoin, Ethereum, Polygon |
| address | VARCHAR(256) | Endereço da carteira |
| label | VARCHAR(256) | Rótulo descritivo |
| isActive | BOOLEAN | Se está ativo para receber pagamentos |

**Endereços inseridos automaticamente:**

- **BTC:** bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
- **USDT (Polygon):** 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
- **MATIC (Polygon):** 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
- **ETH (Ethereum):** 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

---

## Fluxo de Autenticação

### Login via Email

```
1. Usuário envia email + senha
   ↓
2. Backend verifica credenciais em `users`
   ↓
3. Se válido, cria sessão no Express
   ↓
4. Retorna dados do usuário
   ↓
5. Frontend armazena sessão e redireciona
```

### Login via Wallet

```
1. Usuário conecta MetaMask
   ↓
2. Frontend gera mensagem para assinar
   ↓
3. Usuário assina mensagem no MetaMask
   ↓
4. Frontend envia walletAddress + message + signature
   ↓
5. Backend verifica assinatura com ethers.js
   ↓
6. Se válida, busca usuário por walletAddress
   ↓
7. Se não existe, cria novo usuário
   ↓
8. Cria registro em `wallet_sessions`
   ↓
9. Cria sessão no Express
   ↓
10. Retorna dados do usuário
   ↓
11. Frontend armazena sessão e redireciona
```

---

## Troubleshooting

### Erro: "Table 'wallet_sessions' doesn't exist"

**Causa:** Script SQL não foi executado.

**Solução:** Execute `create_all_tables.sql` conforme instruções acima.

---

### Erro: "Column 'walletAddress' doesn't exist in 'users'"

**Causa:** Tabela `users` não foi atualizada com novos campos.

**Solução:** Execute a parte 1 do script SQL:

```sql
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS walletAddress VARCHAR(128) UNIQUE AFTER password,
  ADD COLUMN IF NOT EXISTS authMethod ENUM('email', 'wallet', 'both') NOT NULL DEFAULT 'email' AFTER walletAddress,
  MODIFY COLUMN role ENUM('client', 'manager', 'admin') NOT NULL DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS managerId INT AFTER role;
```

---

### Erro: "Duplicate entry for key 'email'"

**Causa:** Tentativa de cadastrar email já existente.

**Solução:** Use outro email ou faça login com o email existente.

---

### Erro: "Assinatura inválida" (wallet login)

**Causa:** Assinatura não corresponde ao endereço da wallet.

**Possíveis causas:**
1. Usuário assinou mensagem diferente da enviada
2. Wallet conectada é diferente da que assinou
3. Problema no MetaMask

**Solução:**
1. Desconecte e reconecte a wallet
2. Limpe cache do navegador
3. Tente com outra wallet

---

### Erro: "Erro ao fazer login via wallet"

**Causa:** Erro genérico no backend.

**Solução:**
1. Verifique logs do Render (https://dashboard.render.com)
2. Verifique se tabela `wallet_sessions` existe
3. Verifique se campo `nonce` está presente na tabela
4. Execute script SQL completo

---

## Logs para Debug

### Backend (Render)

Acesse https://dashboard.render.com e verifique logs:

```
[Wallet Login] Requisição recebida: { walletAddress, message, signature }
[Wallet Login] Verificando assinatura...
[Wallet Login] Assinatura válida: true
[Wallet Login] Obtendo conexão com banco de dados...
[Wallet Login] Conexão obtida
[Wallet Login] Buscando usuário com endereço: 0x...
✅ Cliente 123 atribuído ao gerente 456
```

### Frontend (Console do Navegador)

Abra console (F12) e verifique:

```javascript
// Sucesso
{
  message: "Login realizado com sucesso",
  user: {
    id: 123,
    name: "User 0x1234...",
    walletAddress: "0x1234...",
    role: "client"
  }
}

// Erro
{
  message: "Erro ao fazer login via wallet",
  error: "Table 'wallet_sessions' doesn't exist"
}
```

---

## Checklist de Verificação

- [ ] Script SQL executado com sucesso
- [ ] Todas as 15 tabelas existem no banco
- [ ] Tabela `users` tem campos `walletAddress`, `authMethod`, `managerId`
- [ ] Tabela `wallet_sessions` existe e tem campo `nonce`
- [ ] 3 planos de assinatura inseridos
- [ ] 4 endereços crypto inseridos
- [ ] Deploy do Render concluído (commit 30cb69d)
- [ ] Login via email funciona
- [ ] Cadastro via email funciona
- [ ] Login via wallet funciona
- [ ] Novo usuário via wallet é criado automaticamente
- [ ] Gerente é atribuído automaticamente a novos clientes

---

## Próximos Passos Após Correção

1. **Testar todos os fluxos de autenticação**
   - Login email
   - Cadastro email
   - Login wallet
   - Logout

2. **Testar funcionalidades de assinatura**
   - Visualizar planos
   - Selecionar plano
   - Processo de pagamento

3. **Testar marketplace**
   - Visualizar VPS
   - Visualizar EAs
   - Adicionar ao carrinho
   - Checkout

4. **Testar hierarquia de usuários**
   - Admin pode ver todos os clientes
   - Manager pode ver seus clientes
   - Cliente vê apenas suas próprias contas

5. **Instalar EAs atualizados**
   - Seguir `GUIA_INSTALACAO_EAS.md`
   - Verificar sincronização de trades
   - Verificar analytics

---

**Resumo:** Execute `create_all_tables.sql` no banco de dados e todos os problemas de login/cadastro serão resolvidos.

**Tempo estimado:** 5 minutos para executar o script + 10 minutos para testes.

**Data:** 27 de outubro de 2025  
**Commit atual:** 30cb69d  
**Status:** Aguardando execução do script SQL

