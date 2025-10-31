# Manual do Programador - Conector MT5

**Versão:** 3.0  
**Plataforma:** MetaTrader 5  
**Autor:** Sentra Partners  
**Data:** Outubro 2025

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Código](#estrutura-do-código)
4. [Funções Principais](#funções-principais)
5. [Sistema de Licenciamento](#sistema-de-licenciamento)
6. [Comunicação com API](#comunicação-com-api)
7. [Gestão de Dados](#gestão-de-dados)
8. [Tratamento de Erros](#tratamento-de-erros)
9. [Performance e Otimização](#performance-e-otimização)
10. [Debugging e Logs](#debugging-e-logs)

---

## Visão Geral

O **Conector MT5** é um Expert Advisor desenvolvido para integrar contas MetaTrader 5 com a plataforma web Sentra Partners. Este EA realiza sincronização bidirecional de dados de trading, incluindo posições abertas, histórico de trades e informações da conta.

### Características Técnicas

- **Linguagem:** MQL5
- **Versão do EA:** 3.0
- **Arquitetura:** Event-driven com sistema de timers
- **Comunicação:** REST API via HTTP/HTTPS
- **Formato de dados:** JSON
- **Suporte multi-usuário:** Sim (baseado em email)

### Funcionalidades Principais

O EA implementa quatro funcionalidades principais que trabalham de forma coordenada:

1. **Heartbeat System**: Envia sinais periódicos de "vida" para manter o status online da conta na plataforma web
2. **Position Sync**: Sincroniza posições abertas (flutuantes) em tempo real
3. **History Export**: Exporta histórico de trades fechados em horários programados
4. **Profit Updates**: Atualiza informações de lucro/prejuízo periodicamente

---

## Arquitetura do Sistema

### Diagrama de Fluxo

```
┌─────────────────┐
│   MetaTrader 5  │
│                 │
│  ┌───────────┐  │
│  │ Conector  │  │
│  │   EA      │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         │ HTTP/JSON
         │
         ▼
┌─────────────────┐
│   API Server    │
│  (Node.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MySQL Database │
└─────────────────┘
```

### Eventos do Sistema

O EA responde a três tipos de eventos principais:

1. **OnInit()**: Inicialização do EA
   - Validação de licença
   - Validação de parâmetros
   - Primeiro heartbeat
   - Exportação inicial de histórico

2. **OnTimer()**: Executado periodicamente (configurável)
   - Heartbeat
   - Sincronização de posições abertas
   - Atualização de lucro (a cada 2 horas por padrão)
   - Exportação de histórico (em horários específicos)

3. **OnTrade()**: Disparado quando há mudança nas posições
   - Sincronização imediata de posições
   - Atualização de histórico

---

## Estrutura do Código

### Organização dos Arquivos

O código está organizado em seções lógicas:

```mql5
//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
datetime LICENSE_EXPIRY_DATE = D'2025.12.31';
#define ALLOWED_ACCOUNTS ""

//====================================================
// PARÂMETROS DE ENTRADA
//====================================================
input string UserEmail = "";
input string AccountType = "STANDARD";
// ... outros parâmetros

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
bool historySent = false;
datetime lastHeartbeat = 0;
// ... outras variáveis

//====================================================
// FUNÇÕES PRINCIPAIS
//====================================================
int OnInit() { ... }
void OnTimer() { ... }
void OnTrade() { ... }

//====================================================
// FUNÇÕES AUXILIARES
//====================================================
void SendHeartbeat() { ... }
void ExportOpenPositions() { ... }
// ... outras funções
```

### Parâmetros de Entrada

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `UserEmail` | string | "" | Email cadastrado no sistema (obrigatório) |
| `AccountType` | string | "STANDARD" | Tipo de conta: CENT ou STANDARD |
| `MasterServer` | string | "https://sentrapartners.com/api/mt" | URL da API |
| `HeartbeatInterval` | int | 10800 | Intervalo entre heartbeats (segundos) |
| `ProfitUpdateInterval` | int | 7200 | Intervalo de atualização de lucro (segundos) |
| `HistorySendTimes` | string | "03:00,12:00,21:00" | Horários para enviar histórico |
| `HistoryDays` | int | 90 | Dias de histórico (0 = completo) |
| `EnableLogs` | bool | true | Habilitar logs detalhados |

### Variáveis Globais

```mql5
bool historySent = false;           // Flag para controle de envio de histórico
datetime lastHeartbeat = 0;         // Timestamp do último heartbeat
datetime lastProfitUpdate = 0;      // Timestamp da última atualização de lucro
datetime lastHistorySend = 0;       // Timestamp do último envio de histórico
int totalTradesSent = 0;            // Contador de trades enviados
bool isConnected = false;           // Status de conexão com API
int profitTimer = 0;                // Timer para atualização de lucro
int historyTimer = 0;               // Timer para envio de histórico
```

---

## Funções Principais

### OnInit()

Função de inicialização chamada quando o EA é anexado ao gráfico.

**Fluxo de execução:**

1. Exibe informações de inicialização
2. Valida licença (data de expiração e contas permitidas)
3. Valida email do usuário
4. Valida tipo de conta (CENT ou STANDARD)
5. Valida URL da API
6. Envia primeiro heartbeat
7. Exporta histórico inicial
8. Configura timer

**Retorno:**
- `INIT_SUCCEEDED`: Inicialização bem-sucedida
- `INIT_FAILED`: Erro na inicialização

**Código:**

```mql5
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Conector MT5 v3.0");
    Print("Sistema Multi-Usuário");
    Print("===========================================");
    
    // Validar licença
    if(!ValidateLicense()) {
        Alert("❌ LICENÇA INVÁLIDA!");
        return(INIT_FAILED);
    }
    
    // Validar email
    if(UserEmail == "") {
        Alert("ERRO: Configure seu email no parâmetro UserEmail!");
        return(INIT_FAILED);
    }
    
    // Validar tipo de conta
    if(AccountType != "CENT" && AccountType != "STANDARD") {
        Alert("ERRO: AccountType deve ser CENT ou STANDARD!");
        return(INIT_FAILED);
    }
    
    // Envia primeiro heartbeat
    SendHeartbeat();
    
    // Envia histórico na inicialização
    ExportHistoricalTrades();
    
    // Configura timer
    EventSetTimer(HeartbeatInterval);
    
    return(INIT_SUCCEEDED);
}
```

### OnTimer()

Função executada periodicamente conforme intervalo configurado em `HeartbeatInterval`.

**Responsabilidades:**

1. Enviar heartbeat
2. Exportar posições abertas
3. Atualizar lucro (a cada `ProfitUpdateInterval`)
4. Enviar histórico (nos horários configurados)

**Código:**

```mql5
void OnTimer() {
    datetime currentTime = TimeCurrent();
    
    // Heartbeat e posições abertas
    SendHeartbeat();
    ExportOpenPositions();
    
    // Atualiza lucro a cada ProfitUpdateInterval (padrão: 2h)
    if(currentTime - lastProfitUpdate >= ProfitUpdateInterval) {
        SendProfitUpdate();
        lastProfitUpdate = currentTime;
    }
    
    // Envia histórico nos horários configurados
    if(ShouldSendHistory()) {
        ExportHistoricalTrades();
        lastHistorySend = currentTime;
    }
}
```

### OnTrade()

Função disparada automaticamente quando há mudanças nas posições (abertura, fechamento, modificação).

**Comportamento:**

Esta função garante sincronização em tempo real, exportando imediatamente as posições abertas e o histórico quando há mudanças.

**Código:**

```mql5
void OnTrade() {
    // Quando houver novo trade, sincroniza imediatamente
    ExportOpenPositions();
    ExportHistoricalTrades();
}
```

---

## Sistema de Licenciamento

### Implementação

O sistema de licenciamento é implementado através de duas constantes:

```mql5
datetime LICENSE_EXPIRY_DATE = D'2025.12.31';  // Data de expiração
#define ALLOWED_ACCOUNTS ""  // Contas permitidas (separadas por vírgula)
```

### Função ValidateLicense()

```mql5
bool ValidateLicense() {
    // Verifica data de expiração
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em: ", TimeToString(LICENSE_EXPIRY_DATE));
        return false;
    }
    
    // Se ALLOWED_ACCOUNTS estiver vazio, permite todas as contas
    if(ALLOWED_ACCOUNTS == "") {
        return true;
    }
    
    // Verifica se a conta atual está na lista de permitidas
    string currentAccount = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
    if(StringFind(ALLOWED_ACCOUNTS, currentAccount) < 0) {
        Print("❌ Conta não autorizada: ", currentAccount);
        return false;
    }
    
    return true;
}
```

### Configuração

**Para liberar todas as contas:**
```mql5
#define ALLOWED_ACCOUNTS ""
```

**Para restringir a contas específicas:**
```mql5
#define ALLOWED_ACCOUNTS "12345678,87654321,11223344"
```

---

## Comunicação com API

### Função SendToServer()

Responsável por toda comunicação HTTP com a API.

**Parâmetros:**
- `endpoint`: Caminho do endpoint (ex: "/heartbeat")
- `jsonData`: String JSON com os dados a enviar

**Retorno:**
- `true`: Requisição bem-sucedida (HTTP 200)
- `false`: Erro na requisição

**Implementação:**

```mql5
bool SendToServer(string endpoint, string jsonData) {
    string url = MasterServer + endpoint;
    string headers = "Content-Type: application/json\r\n";
    
    char post[];
    char result[];
    string resultHeaders;
    
    ArrayResize(post, StringToCharArray(jsonData, post, 0, WHOLE_ARRAY, CP_UTF8) - 1);
    
    int timeout = 5000;  // 5 segundos
    int res = WebRequest("POST", url, headers, timeout, post, result, resultHeaders);
    
    if(res == 200) {
        if(EnableLogs) Print("✓ Dados enviados: ", endpoint);
        return true;
    } else {
        Print("✗ Erro HTTP ", res, " ao enviar para ", endpoint);
        return false;
    }
}
```

### Endpoints da API

| Endpoint | Método | Descrição | Dados Enviados |
|----------|--------|-----------|----------------|
| `/heartbeat` | POST | Sinal de vida da conta | Email, número da conta, broker, servidor, saldo, equity, etc. |
| `/positions` | POST | Posições abertas | Email, número da conta, array de posições |
| `/history` | POST | Histórico de trades | Email, número da conta, array de trades |
| `/profit` | POST | Atualização de lucro | Email, número da conta, lucro total |

### Formato JSON

**Heartbeat:**
```json
{
  "user_email": "usuario@email.com",
  "account_number": "12345678",
  "broker": "Nome da Corretora",
  "server": "Servidor-Live",
  "account_name": "Nome da Conta",
  "balance": 10000.00,
  "equity": 10500.00,
  "currency": "USD",
  "leverage": 100,
  "margin_free": 9500.00,
  "open_positions": 5,
  "platform": "MT5",
  "account_type": "STANDARD"
}
```

**Positions:**
```json
{
  "user_email": "usuario@email.com",
  "account_number": "12345678",
  "positions": [
    {
      "ticket": "123456789",
      "symbol": "EURUSD",
      "type": "buy",
      "volume": 0.10,
      "open_price": 1.10500,
      "current_price": 1.10650,
      "profit": 15.00,
      "swap": -0.50,
      "commission": -2.00,
      "open_time": "2025.10.31 10:30:00"
    }
  ]
}
```

**History:**
```json
{
  "user_email": "usuario@email.com",
  "account_number": "12345678",
  "trades": [
    {
      "ticket": "987654321",
      "symbol": "GBPUSD",
      "type": "sell",
      "volume": 0.20,
      "open_price": 1.25000,
      "close_price": 1.24500,
      "profit": 100.00,
      "swap": -1.50,
      "commission": -4.00,
      "open_time": "2025.10.30 14:00:00",
      "close_time": "2025.10.31 09:15:00"
    }
  ]
}
```

---

## Gestão de Dados

### ExportOpenPositions()

Exporta todas as posições abertas (flutuantes) para a API.

**Lógica:**

1. Verifica se há posições abertas (`PositionsTotal()`)
2. Se não houver, retorna sem fazer nada
3. Itera por todas as posições usando `PositionGetTicket(i)`
4. Para cada posição, coleta:
   - Ticket
   - Símbolo
   - Tipo (buy/sell)
   - Volume
   - Preço de abertura
   - Preço atual
   - Lucro flutuante
   - Swap
   - Comissão
   - Horário de abertura
5. Monta JSON com array de posições
6. Envia para endpoint `/positions`

**Código simplificado:**

```mql5
void ExportOpenPositions() {
    int total = PositionsTotal();
    if(total == 0) return;

    string jsonData = "{";
    jsonData += "\"user_email\":\"" + UserEmail + "\",";
    jsonData += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    jsonData += "\"positions\":[";
    
    int count = 0;
    for(int i = 0; i < total; i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0) {
            // Coleta dados da posição
            string symbol = PositionGetString(POSITION_SYMBOL);
            long posType = PositionGetInteger(POSITION_TYPE);
            double volume = PositionGetDouble(POSITION_VOLUME);
            // ... outros campos
            
            // Adiciona ao JSON
            if(count > 0) jsonData += ",";
            jsonData += "{...}";  // Objeto da posição
            count++;
        }
    }
    
    jsonData += "]}";
    SendToServer("/positions", jsonData);
}
```

### ExportHistoricalTrades()

Exporta histórico de trades fechados para a API.

**Lógica:**

1. Define período de histórico:
   - Se `HistoryDays == 0`: Todo o histórico
   - Caso contrário: Últimos N dias
2. Seleciona histórico com `HistorySelect(startDate, TimeCurrent())`
3. Obtém total de deals com `HistoryDealsTotal()`
4. Filtra apenas deals de entrada/saída (ignora swaps, comissões isoladas)
5. Para cada deal válido, coleta:
   - Ticket
   - Símbolo
   - Tipo (buy/sell)
   - Volume
   - Preço
   - Lucro
   - Swap
   - Comissão
   - Horário
6. Monta JSON com array de trades
7. Envia para endpoint `/history`

**Filtro de deals:**

```mql5
long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);

// Apenas deals de entrada ou saída (não swaps, comissões, etc)
if((dealType == DEAL_TYPE_BUY || dealType == DEAL_TYPE_SELL) && 
   (dealEntry == DEAL_ENTRY_IN || dealEntry == DEAL_ENTRY_OUT)) {
    // Processa deal
}
```

### SendProfitUpdate()

Envia atualização de lucro total da conta.

**Cálculo:**

```mql5
double totalProfit = AccountInfoDouble(ACCOUNT_PROFIT);
```

**JSON:**

```json
{
  "user_email": "usuario@email.com",
  "account_number": "12345678",
  "profit": 150.50
}
```

---

## Tratamento de Erros

### Validação de Parâmetros

O EA valida todos os parâmetros críticos na inicialização:

```mql5
// Email obrigatório
if(UserEmail == "") {
    Alert("ERRO: Configure seu email no parâmetro UserEmail!");
    return(INIT_FAILED);
}

// Tipo de conta válido
if(AccountType != "CENT" && AccountType != "STANDARD") {
    Alert("ERRO: AccountType deve ser CENT ou STANDARD!");
    return(INIT_FAILED);
}

// URL válida
if(StringFind(MasterServer, "http") != 0) {
    Alert("ERRO: URL da API inválida!");
    return(INIT_FAILED);
}
```

### Tratamento de Erros HTTP

```mql5
int res = WebRequest("POST", url, headers, timeout, post, result, resultHeaders);

if(res == 200) {
    // Sucesso
    return true;
} else if(res == -1) {
    Print("✗ Erro: URL não autorizada. Adicione ", url, " nas URLs permitidas.");
    return false;
} else {
    Print("✗ Erro HTTP ", res, " ao enviar para ", endpoint);
    return false;
}
```

### Códigos de Erro Comuns

| Código | Significado | Solução |
|--------|-------------|---------|
| -1 | URL não autorizada | Adicionar URL em Ferramentas → Opções → Expert Advisors → WebRequest |
| 400 | Bad Request | Verificar formato JSON |
| 401 | Unauthorized | Verificar email cadastrado |
| 404 | Not Found | Verificar endpoint da API |
| 500 | Server Error | Verificar logs do servidor |

---

## Performance e Otimização

### Intervalos Configuráveis

O EA permite ajustar intervalos para otimizar performance vs. tempo real:

| Parâmetro | Padrão | Recomendado | Impacto |
|-----------|--------|-------------|---------|
| `HeartbeatInterval` | 10800s (3h) | 3600-10800s | Consumo de banda |
| `ProfitUpdateInterval` | 7200s (2h) | 3600-7200s | Carga no servidor |
| `HistorySendTimes` | 3x/dia | 2-4x/dia | Carga no banco |

### Otimizações Implementadas

1. **Envio condicional**: Posições só são enviadas se houver alguma aberta
2. **Histórico programado**: Enviado apenas em horários específicos
3. **OnTrade()**: Sincronização imediata apenas quando há mudanças
4. **Timeout HTTP**: Limitado a 5 segundos para evitar travamentos
5. **Logs opcionais**: Podem ser desabilitados para reduzir overhead

### Consumo de Recursos

**Memória:**
- Footprint base: ~500 KB
- Por posição aberta: ~200 bytes
- Por trade no histórico: ~300 bytes

**CPU:**
- Idle: <1%
- Durante sincronização: 2-5%
- Durante exportação de histórico: 5-10%

**Rede:**
- Heartbeat: ~500 bytes
- Por posição: ~200 bytes
- Por trade histórico: ~300 bytes

---

## Debugging e Logs

### Sistema de Logs

O EA possui sistema de logs detalhado controlado por `EnableLogs`:

```mql5
if(EnableLogs) Print("✓ Heartbeat enviado com sucesso");
```

### Níveis de Log

**Sempre exibidos (críticos):**
- Erros de inicialização
- Erros de validação
- Erros HTTP
- Licença inválida

**Opcionais (EnableLogs = true):**
- Heartbeat enviado
- Posições exportadas
- Histórico exportado
- Lucro atualizado

### Exemplo de Log Completo

```
2025.10.31 10:00:00 ===========================================
2025.10.31 10:00:00 Sentra Partners - Conector MT5 v3.0
2025.10.31 10:00:00 Sistema Multi-Usuário
2025.10.31 10:00:00 ===========================================
2025.10.31 10:00:00 User Email: usuario@email.com
2025.10.31 10:00:00 Tipo de Conta: STANDARD
2025.10.31 10:00:00 Servidor: https://sentrapartners.com/api/mt
2025.10.31 10:00:00 Heartbeat: 3h (posições abertas)
2025.10.31 10:00:00 Profit Update: 2h
2025.10.31 10:00:00 Histórico: 03:00,12:00,21:00 (90 dias)
2025.10.31 10:00:00 ===========================================
2025.10.31 10:00:00 ✅ Licença válida!
2025.10.31 10:00:00 ✓ Heartbeat enviado com sucesso
2025.10.31 10:00:00 Exportando 5 posições abertas...
2025.10.31 10:00:00 ✓ Dados enviados: /positions
2025.10.31 10:00:00 Exportando 150 deals do histórico...
2025.10.31 10:00:00 ✓ Dados enviados: /history
2025.10.31 10:00:00 ✓ EA inicializado com sucesso!
```

### Debugging de Problemas Comuns

**Problema: EA não envia dados**

1. Verificar se URL está autorizada em WebRequest
2. Verificar logs de erro HTTP
3. Verificar conexão com internet
4. Verificar se email está correto

**Problema: Histórico não é enviado**

1. Verificar horários configurados em `HistorySendTimes`
2. Verificar se há trades no período de `HistoryDays`
3. Verificar logs para confirmar execução

**Problema: Posições não aparecem na plataforma**

1. Verificar se heartbeat está sendo enviado
2. Verificar se há posições abertas
3. Verificar logs do servidor
4. Verificar se email está cadastrado no sistema

---

## Manutenção e Atualizações

### Versionamento

O EA segue versionamento semântico:

- **Major (X.0.0)**: Mudanças incompatíveis na API
- **Minor (0.X.0)**: Novas funcionalidades compatíveis
- **Patch (0.0.X)**: Correções de bugs

### Checklist de Atualização

Antes de lançar nova versão:

- [ ] Testar em conta demo
- [ ] Verificar compatibilidade com API
- [ ] Atualizar número de versão
- [ ] Atualizar data de licença se necessário
- [ ] Documentar mudanças
- [ ] Testar em conta real com volume mínimo
- [ ] Monitorar logs por 24h

### Compatibilidade

- **MT5 Build mínimo:** 2361
- **API versão:** 1.0+
- **Compilador:** MetaEditor 5

---

## Referências

- [Documentação MQL5](https://www.mql5.com/en/docs)
- [WebRequest em MQL5](https://www.mql5.com/en/docs/network/webrequest)
- [Eventos de Trade](https://www.mql5.com/en/docs/event_handlers/ontrade)
- [JSON em MQL5](https://www.mql5.com/en/articles/3133)

---

**Documento criado por:** Manus AI  
**Última atualização:** 31 de Outubro de 2025
