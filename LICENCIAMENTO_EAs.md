# Sistema de Licenciamento dos EAs - Sentra Partners

## 🔐 Visão Geral

Todos os EAs do Sentra Partners agora possuem um sistema de licenciamento robusto que garante:
- ✅ **Controle de expiração** por data hardcoded no arquivo
- ✅ **Validação de chave de licença** via API
- ✅ **Whitelist de contas** permitidas por licença
- ✅ **Verificação periódica** a cada 1 hora
- ✅ **Cache offline** de 24h para continuidade
- ✅ **Bloqueio automático** se licença inválida

## 📋 EAs com Licenciamento

### Conectores (Sincronização)
1. `SentraPartners_MT4.mq4`
2. `SentraPartners_MT5.mq5`

### Copy Trading - Master
3. `SentraPartners_Master_MT4.mq4`
4. `SentraPartners_Master_MT5.mq5`

### Copy Trading - Slave
5. `SentraPartners_Slave_MT4.mq4`
6. `SentraPartners_Slave_MT5.mq5`

## 🔧 Como Funciona

### 1. Data de Expiração Hardcoded

Cada EA possui uma data de expiração definida no código:

```mql4
#define LICENSE_EXPIRY_DATE D'2025.12.31 23:59:59'
```

**Para alterar:**
1. Abra o arquivo `.mq4` ou `.mq5` no MetaEditor
2. Localize a linha `#define LICENSE_EXPIRY_DATE`
3. Altere a data no formato `D'YYYY.MM.DD HH:MM:SS'`
4. Compile novamente (F7)

### 2. Chave de Licença

Cada usuário recebe uma chave de licença única que deve ser configurada no EA:

```
LicenseKey = "ABC123XYZ789..."
```

### 3. Validação no Servidor

O EA envia para o servidor:
- Chave de licença
- Número da conta
- Broker
- Email do usuário

O servidor valida:
- ✅ Licença existe e está ativa
- ✅ Licença não expirou
- ✅ Conta está na whitelist (se configurada)
- ✅ Usuário é o dono da licença

### 4. Verificação Periódica

- **Primeira verificação**: Na inicialização do EA
- **Verificações subsequentes**: A cada 1 hora
- **Cache offline**: Se o servidor estiver offline, usa cache por 24h

### 5. Bloqueio Automático

Se a licença for inválida:
- ❌ EA para de operar imediatamente
- ❌ Alerta visual no MT4/MT5
- ❌ Mensagem nos logs
- ❌ EA é removido do gráfico

## 🗄️ Estrutura do Banco de Dados

### Tabela: `ea_licenses`

```sql
CREATE TABLE ea_licenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  ea_name VARCHAR(100) NOT NULL,
  license_type ENUM('trial', 'monthly', 'yearly', 'lifetime') DEFAULT 'trial',
  status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
  allowed_accounts TEXT,  -- Números de conta separados por vírgula
  expires_at DATETIME,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
);
```

### Campos Importantes

| Campo | Descrição |
|-------|-----------|
| `license_key` | Chave única da licença (ex: `ABC123XYZ789`) |
| `allowed_accounts` | Contas permitidas separadas por vírgula (ex: `12345,67890`) |
| `expires_at` | Data de expiração da licença |
| `status` | Status: `active`, `inactive`, `expired` |
| `license_type` | Tipo: `trial`, `monthly`, `yearly`, `lifetime` |

## 🔑 Gerenciamento de Licenças

### Criar Nova Licença

```sql
INSERT INTO ea_licenses (
  user_id, 
  license_key, 
  ea_name, 
  license_type, 
  allowed_accounts, 
  expires_at
) VALUES (
  1,  -- ID do usuário
  'ABC123XYZ789',  -- Chave única
  'SentraPartners_MT4',  -- Nome do EA
  'monthly',  -- Tipo
  '12345,67890',  -- Contas permitidas
  '2025-12-31 23:59:59'  -- Expiração
);
```

### Adicionar Conta à Whitelist

```sql
UPDATE ea_licenses 
SET allowed_accounts = CONCAT(allowed_accounts, ',99999')
WHERE license_key = 'ABC123XYZ789';
```

### Renovar Licença

```sql
UPDATE ea_licenses 
SET expires_at = '2026-12-31 23:59:59',
    status = 'active'
WHERE license_key = 'ABC123XYZ789';
```

### Desativar Licença

```sql
UPDATE ea_licenses 
SET status = 'inactive'
WHERE license_key = 'ABC123XYZ789';
```

## 📡 Endpoint de Validação

### POST `/api/mt/validate-license`

**Request:**
```json
{
  "license_key": "ABC123XYZ789",
  "account_number": "12345",
  "broker": "XM Global",
  "user_email": "user@example.com"
}
```

**Response (Válida):**
```json
{
  "valid": true,
  "license_type": "monthly",
  "expires_at": "2025-12-31T23:59:59.000Z",
  "ea_name": "SentraPartners_MT4"
}
```

**Response (Inválida):**
```json
{
  "valid": false,
  "error": "Conta não autorizada para esta licença",
  "allowed_accounts": ["12345", "67890"]
}
```

## 🛠️ Configuração para Usuários

### Passo 1: Obter Chave de Licença
1. Acesse o painel web: https://sentrapartners.com
2. Vá em **Configurações > Licenças**
3. Copie sua chave de licença

### Passo 2: Configurar EA
1. Anexe o EA no gráfico
2. Configure os parâmetros:
   - **LicenseKey**: Cole sua chave
   - **UserEmail**: Seu email cadastrado
   - **AccountType**: CENT ou STANDARD

### Passo 3: Verificar Logs
```
✅ Licença válida!
✓ EA inicializado com sucesso!
```

## ⚠️ Mensagens de Erro

| Erro | Causa | Solução |
|------|-------|---------|
| `❌ LICENÇA INVÁLIDA OU EXPIRADA!` | Licença não encontrada ou expirada | Renovar licença no painel |
| `❌ Chave de licença não configurada!` | Campo LicenseKey vazio | Configurar chave no EA |
| `❌ Conta não autorizada` | Número da conta não está na whitelist | Adicionar conta no painel |
| `⚠️ Erro ao validar licença online` | Servidor offline | Aguardar cache de 24h |

## 🔄 Fluxo de Validação

```
┌─────────────────┐
│   EA Inicia     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verifica Data   │
│   Hardcoded     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Valida no       │
│   Servidor      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Válida │ │Inválida│
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Opera │ │Bloqueia│
└───────┘ └───────┘
```

## 📊 Monitoramento

### Logs do Servidor (Render)

```
[License] Validação de licença:
  license_key: ABC123XYZ...
  account_number: 12345
  broker: XM Global
  user_email: user@example.com
[License] ✅ Licença válida!
```

### Logs do MT4/MT5

```
✅ Licença validada com sucesso
✓ EA inicializado com sucesso!
```

## 🎯 Boas Práticas

1. **Nunca compartilhe** chaves de licença
2. **Mantenha atualizado** o campo `allowed_accounts`
3. **Monitore** o `last_used_at` para detectar uso não autorizado
4. **Configure alertas** para licenças próximas do vencimento
5. **Faça backup** da tabela `ea_licenses` regularmente

## 🔐 Segurança

- ✅ Chaves de licença são únicas e não reutilizáveis
- ✅ Validação server-side impede bypass
- ✅ Data hardcoded impede uso após expiração do arquivo
- ✅ Whitelist de contas impede uso não autorizado
- ✅ Logs completos para auditoria
- ✅ Cache limitado a 24h para evitar uso prolongado offline

## 📞 Suporte

Para questões sobre licenciamento:
- 🌐 Website: https://sentrapartners.com
- 📧 Email: suporte@sentrapartners.com
- 💬 Chat: Disponível no painel web
