# Guia de Integração - EAs Master e Slave para Copy Trading

## Visão Geral

O sistema de Copy Trading da Sentra Partners permite que contas Master enviem sinais de trading que são automaticamente copiados por contas Slave. A integração usa os endpoints HTTP existentes + WebSocket para tempo real.

---

## 📡 EA MASTER - Enviar Sinais

### 1. Registrar como Master (Opcional)

**Endpoint:** `POST /api/mt/copy/register-master`

```http
POST https://sentrapartners.com/api/mt/copy/register-master
Content-Type: application/x-www-form-urlencoded

user_email=seu@email.com&account_number=12345678&account_name=Minha Conta Master
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conta Master registrada",
  "account_id": "12345678",
  "user_id": 123
}
```

### 2. Enviar Heartbeat (A cada 10-15 segundos)

**Endpoint:** `POST /api/mt/heartbeat`

```http
POST https://sentrapartners.com/api/mt/heartbeat
Content-Type: application/x-www-form-urlencoded

user_email=seu@email.com
&account_number=12345678
&broker=IC Markets
&server=ICMarkets-Demo01
&account_name=Minha Conta Master
&balance=10000.50
&equity=10250.75
&currency=USD
&leverage=500
&margin_free=9500.00
&open_positions=2
&platform=MT4
&account_type=REAL
```

**Resposta:**
```json
{
  "success": true,
  "message": "Heartbeat recebido"
}
```

### 3. Enviar Novo Trade (Quando abrir posição)

**Endpoint:** `POST /api/mt/copy/new-trade`

```http
POST https://sentrapartners.com/api/mt/copy/new-trade
Content-Type: application/x-www-form-urlencoded

user_email=seu@email.com
&account_number=12345678
&symbol=EURUSD
&type=BUY
&volume=0.10
&open_price=1.08550
&stop_loss=1.08450
&take_profit=1.08750
&ticket=123456789
```

**Resposta:**
```json
{
  "success": true,
  "message": "Trade enviado para Slaves"
}
```

**Parâmetros:**
- `type`: `BUY` ou `SELL`
- `volume`: Tamanho do lote (ex: 0.10)
- `open_price`: Preço de abertura
- `stop_loss`: Stop Loss (opcional)
- `take_profit`: Take Profit (opcional)
- `ticket`: Número do ticket MT4/MT5

### 4. Atualizar Posições (A cada 30 segundos)

**Endpoint:** `POST /api/mt/copy/master-signal`

```http
POST https://sentrapartners.com/api/mt/copy/master-signal
Content-Type: application/x-www-form-urlencoded

user_email=seu@email.com
&account_number=12345678
&broker=IC Markets
&positions=[{"ticket":"123456789","symbol":"EURUSD","type":"buy","volume":0.10,"open_price":1.08550,"profit":25.50}]
&positions_count=1
```

**Formato do array `positions`:**
```json
[
  {
    "ticket": "123456789",
    "symbol": "EURUSD",
    "type": "buy",
    "volume": 0.10,
    "open_price": 1.08550,
    "stop_loss": 1.08450,
    "take_profit": 1.08750,
    "profit": 25.50,
    "commission": -0.70,
    "swap": 0.00
  }
]
```

---

## 📥 EA SLAVE - Copiar Sinais

### 1. Registrar como Slave

**Endpoint:** `POST /api/mt/copy/register-slave`

```http
POST https://sentrapartners.com/api/mt/copy/register-slave
Content-Type: application/x-www-form-urlencoded

user_email=seu@email.com&account_number=87654321&master_account_id=12345678
```

**Resposta:**
```json
{
  "success": true,
  "message": "Conta Slave registrada",
  "account_id": "87654321",
  "master_account_id": "12345678",
  "user_id": 123
}
```

**Importante:** O `master_account_id` é o ID da conta Master que você quer copiar. Você pode ver este ID no dashboard em `/copy-trading`.

### 2. Enviar Heartbeat (A cada 10-15 segundos)

**Endpoint:** `POST /api/mt/heartbeat`

```http
POST https://sentrapartners.com/api/mt/heartbeat
Content-Type: application/x-www-form-urlencoded

user_email=seu@email.com
&account_number=87654321
&broker=IC Markets
&server=ICMarkets-Demo02
&account_name=Minha Conta Slave
&balance=5000.00
&equity=5125.30
&currency=USD
&leverage=500
&margin_free=4800.00
&open_positions=1
&platform=MT4
&account_type=REAL
```

### 3. Buscar Sinais do Master (A cada 2-5 segundos)

**Endpoint:** `GET /api/mt/copy/slave-signals`

```http
GET https://sentrapartners.com/api/mt/copy/slave-signals?master_account_id=12345678&user_email=seu@email.com
```

**Resposta:**
```json
{
  "success": true,
  "positions": [
    {
      "ticket": "123456789",
      "symbol": "EURUSD",
      "type": "buy",
      "volume": 0.10,
      "open_price": 1.08550,
      "stop_loss": 1.08450,
      "take_profit": 1.08750,
      "profit": 25.50
    }
  ],
  "positions_count": 1,
  "broker": "IC Markets",
  "updated_at": "2025-10-30T15:30:00.000Z"
}
```

**Lógica do Slave:**
1. Buscar sinais a cada 2-5 segundos
2. Comparar com posições locais
3. Se houver nova posição no Master → Abrir no Slave
4. Se posição foi fechada no Master → Fechar no Slave

### 4. Enviar Resultado da Cópia

**Endpoint:** `POST /api/mt/copy/slave-copy-result`

```http
POST https://sentrapartners.com/api/mt/copy/slave-copy-result
Content-Type: application/x-www-form-urlencoded

user_email=seu@email.com
&slave_account_id=87654321
&master_account_id=12345678
&symbol=EURUSD
&status=success
&execution_time=245
&slippage=0.5
```

**Parâmetros:**
- `status`: `success`, `failed`, ou `pending`
- `execution_time`: Tempo de execução em milissegundos
- `slippage`: Diferença de preço em pips
- `error_message`: Mensagem de erro (se `status=failed`)

**Resposta:**
```json
{
  "success": true,
  "message": "Resultado recebido"
}
```

---

## 🔄 Fluxo Completo

```
┌─────────────┐                    ┌──────────────┐
│  EA MASTER  │                    │  SERVIDOR    │
└─────────────┘                    └──────────────┘
      │                                    │
      │ 1. Heartbeat (10-15s)             │
      ├───────────────────────────────────>│
      │                                    │
      │ 2. Novo Trade (ao abrir)          │
      ├───────────────────────────────────>│
      │                                    │ Broadcast
      │                                    │ WebSocket
      │                                    ├────────────┐
      │                                    │            │
      │ 3. Atualizar Posições (30s)       │            ▼
      ├───────────────────────────────────>│    ┌──────────────┐
      │                                    │    │  DASHBOARD   │
      │                                    │    │  (Tempo Real)│
      │                                    │    └──────────────┘
      │                                    │
                                           │
                                           │
┌─────────────┐                           │
│  EA SLAVE   │                           │
└─────────────┘                           │
      │                                    │
      │ 1. Heartbeat (10-15s)             │
      ├───────────────────────────────────>│
      │                                    │
      │ 2. Buscar Sinais (2-5s)           │
      │<───────────────────────────────────┤
      │                                    │
      │ 3. Copiar Trade Localmente        │
      │                                    │
      │ 4. Enviar Resultado               │
      ├───────────────────────────────────>│
      │                                    │
```

---

## 📊 Dashboard em Tempo Real

Os usuários podem acompanhar em tempo real:

1. **Contas Conectadas**
   - Lista de Master e Slave online
   - ID da conta (para configurar no EA)
   - Equity e balance

2. **Trades ao Vivo**
   - Trades do Master aparecendo instantaneamente
   - Status de cópia por Slave (sucesso/falha/pendente)
   - Latência de execução
   - Slippage

3. **Analytics**
   - Gráfico de pizza (status de cópias)
   - Gráfico de barras (performance por Master)
   - Métricas detalhadas por conta

**URL:** `https://sentrapartners.com/copy-trading`

---

## 🔐 Segurança

- Cada usuário vê apenas suas próprias contas
- Slaves só podem copiar Masters do mesmo usuário
- Validação de `userId` em todas as operações
- Autenticação por email

---

## 🐛 Troubleshooting

### Conta não aparece no dashboard

1. Verificar se heartbeat está sendo enviado
2. Verificar se `user_email` está correto
3. Verificar se usuário está cadastrado na plataforma

### Slave não recebe sinais

1. Verificar se `master_account_id` está correto
2. Verificar se Master e Slave pertencem ao mesmo usuário
3. Verificar se Master enviou sinais nos últimos 5 minutos

### Teste de Conexão

Use a página de teste: `https://sentrapartners.com/websocket-test`

---

## 📝 Exemplo MQL4 - Master

```mql4
// Enviar novo trade quando abrir posição
void OnTradeOpen(int ticket) {
   string url = "https://sentrapartners.com/api/mt/copy/new-trade";
   string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
   
   string data = "user_email=" + UserEmail +
                 "&account_number=" + IntegerToString(AccountNumber()) +
                 "&symbol=" + OrderSymbol() +
                 "&type=" + (OrderType() == OP_BUY ? "BUY" : "SELL") +
                 "&volume=" + DoubleToString(OrderLots(), 2) +
                 "&open_price=" + DoubleToString(OrderOpenPrice(), 5) +
                 "&stop_loss=" + DoubleToString(OrderStopLoss(), 5) +
                 "&take_profit=" + DoubleToString(OrderTakeProfit(), 5) +
                 "&ticket=" + IntegerToString(ticket);
   
   char post[], result[];
   StringToCharArray(data, post);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, headers);
   
   if(res == 200) {
      Print("✅ Trade enviado para Slaves");
   } else {
      Print("❌ Erro ao enviar trade: ", res);
   }
}
```

## 📝 Exemplo MQL4 - Slave

```mql4
// Buscar sinais do Master
void CheckMasterSignals() {
   string url = "https://sentrapartners.com/api/mt/copy/slave-signals";
   url += "?master_account_id=" + MasterAccountId;
   url += "&user_email=" + UserEmail;
   
   string headers = "";
   char result[];
   string resultHeaders;
   
   int res = WebRequest("GET", url, headers, 5000, NULL, result, resultHeaders);
   
   if(res == 200) {
      string json = CharArrayToString(result);
      // Parse JSON e copiar trades
      ProcessMasterSignals(json);
   }
}

// Enviar resultado da cópia
void SendCopyResult(string symbol, string status, int executionTime, double slippage) {
   string url = "https://sentrapartners.com/api/mt/copy/slave-copy-result";
   string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
   
   string data = "user_email=" + UserEmail +
                 "&slave_account_id=" + IntegerToString(AccountNumber()) +
                 "&master_account_id=" + MasterAccountId +
                 "&symbol=" + symbol +
                 "&status=" + status +
                 "&execution_time=" + IntegerToString(executionTime) +
                 "&slippage=" + DoubleToString(slippage, 1);
   
   char post[], result[];
   StringToCharArray(data, post);
   
   WebRequest("POST", url, headers, 5000, post, result, headers);
}
```

---

## 🚀 Próximos Passos

1. Implementar lógica nos EAs Master e Slave
2. Testar com contas demo
3. Monitorar no dashboard em tempo real
4. Ajustar intervalo de polling conforme necessário
5. Implementar filtros (símbolos, volume, etc.)

---

**Suporte:** https://help.manus.im  
**Dashboard:** https://sentrapartners.com/copy-trading  
**Teste:** https://sentrapartners.com/websocket-test
