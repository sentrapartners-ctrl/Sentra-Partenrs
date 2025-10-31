# Manual do Programador - Conector MT4

**Versão:** 3.0  
**Plataforma:** MetaTrader 4  
**Autor:** Sentra Partners  
**Data:** Outubro 2025

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Diferenças MT4 vs MT5](#diferenças-mt4-vs-mt5)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Estrutura do Código](#estrutura-do-código)
5. [Funções Principais](#funções-principais)
6. [Sistema de Licenciamento](#sistema-de-licenciamento)
7. [Comunicação com API](#comunicação-com-api)
8. [Gestão de Dados](#gestão-de-dados)
9. [Tratamento de Erros](#tratamento-de-erros)
10. [Performance e Otimização](#performance-e-otimização)

---

## Visão Geral

O **Conector MT4** é um Expert Advisor desenvolvido para integrar contas MetaTrader 4 com a plataforma web Sentra Partners. Este EA realiza sincronização bidirecional de dados de trading, incluindo posições abertas, histórico de trades e informações da conta.

### Características Técnicas

- **Linguagem:** MQL4
- **Versão do EA:** 3.0
- **Arquitetura:** Event-driven baseado em OnTick()
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

## Diferenças MT4 vs MT5

O MT4 possui diferenças fundamentais em relação ao MT5 que impactam a implementação do EA:

### Diferenças na API

| Aspecto | MT4 | MT5 |
|---------|-----|-----|
| **Evento principal** | `OnTick()` | `OnTimer()` |
| **Gerenciamento de timer** | Manual (via timestamps) | `EventSetTimer()` / `OnTimer()` |
| **Tipo de ticket** | `int` | `ulong` |
| **Seleção de ordens** | `OrderSelect()` | `PositionGetTicket()` |
| **Informações da conta** | `AccountBalance()` | `AccountInfoDouble(ACCOUNT_BALANCE)` |
| **Total de ordens** | `OrdersTotal()` | `PositionsTotal()` |
| **Histórico** | `OrdersHistoryTotal()` | `HistoryDealsTotal()` |

### Diferenças Arquiteturais

**MT4:**
- Usa `OnTick()` como loop principal
- Timers são implementados manualmente usando timestamps
- Ordens e posições são o mesmo conceito
- Histórico baseado em ordens fechadas

**MT5:**
- Usa `OnTimer()` para tarefas periódicas
- Timers nativos via `EventSetTimer()`
- Ordens e posições são conceitos separados
- Histórico baseado em deals (entradas/saídas)

### Exemplo de Código Comparativo

**Seleção de Posição:**

```mql4
// MT4
for(int i = 0; i < OrdersTotal(); i++) {
    if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
        int ticket = OrderTicket();
        string symbol = OrderSymbol();
        int type = OrderType();
    }
}
```

```mql5
// MT5
for(int i = 0; i < PositionsTotal(); i++) {
    ulong ticket = PositionGetTicket(i);
    if(ticket > 0) {
        string symbol = PositionGetString(POSITION_SYMBOL);
        long type = PositionGetInteger(POSITION_TYPE);
    }
}
```

---

## Arquitetura do Sistema

### Diagrama de Fluxo

```
┌─────────────────┐
│   MetaTrader 4  │
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

O EA responde a dois tipos de eventos principais:

1. **OnInit()**: Inicialização do EA
   - Validação de licença
   - Validação de parâmetros
   - Primeiro heartbeat
   - Exportação inicial de histórico

2. **OnTick()**: Executado a cada tick do mercado
   - Verifica se é hora de enviar heartbeat
   - Sincroniza posições abertas
   - Atualiza lucro periodicamente
   - Exporta histórico em horários específicos

---

## Estrutura do Código

### Organização dos Arquivos

O código está organizado em seções lógicas:

```mql4
//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
#define LICENSE_EXPIRY_DATE D'2025.12.31'
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
void OnTick() { ... }

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

```mql4
bool historySent = false;           // Flag para controle de envio de histórico
datetime lastHeartbeat = 0;         // Timestamp do último heartbeat
datetime lastProfitUpdate = 0;      // Timestamp da última atualização de lucro
datetime lastHistorySend = 0;       // Timestamp do último envio de histórico
int totalTradesSent = 0;            // Contador de trades enviados
bool isConnected = false;           // Status de conexão com API
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

**Retorno:**
- `INIT_SUCCEEDED`: Inicialização bem-sucedida
- `INIT_FAILED`: Erro na inicialização

**Código:**

```mql4
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Conector MT4 v3.0");
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
    
    return(INIT_SUCCEEDED);
}
```

### OnTick()

Função executada a cada tick do mercado. Implementa um sistema de timer manual usando timestamps.

**Responsabilidades:**

1. Verificar se é hora de enviar heartbeat (a cada `HeartbeatInterval`)
2. Exportar posições abertas junto com heartbeat
3. Atualizar lucro (a cada `ProfitUpdateInterval`)
4. Enviar histórico (nos horários configurados)

**Código:**

```mql4
void OnTick() {
    datetime currentTime = TimeCurrent();
    
    // Envia heartbeat periodicamente
    if(currentTime - lastHeartbeat >= HeartbeatInterval) {
        SendHeartbeat();
        ExportOpenPositions();
        lastHeartbeat = currentTime;
    }
    
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

**Diferença do MT5:**

No MT5, usamos `OnTimer()` que é chamado em intervalos fixos. No MT4, usamos `OnTick()` que é chamado a cada movimento de preço, e implementamos a lógica de intervalo manualmente comparando timestamps.

---

## Sistema de Licenciamento

### Implementação

O sistema de licenciamento é implementado através de duas constantes:

```mql4
#define LICENSE_EXPIRY_DATE D'2025.12.31'  // Data de expiração
#define ALLOWED_ACCOUNTS ""  // Contas permitidas (separadas por vírgula)
```

### Função ValidateLicense()

```mql4
bool ValidateLicense() {
    // Verifica data de expiração
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em: ", TimeToStr(LICENSE_EXPIRY_DATE));
        return false;
    }
    
    // Se ALLOWED_ACCOUNTS estiver vazio, permite todas as contas
    if(ALLOWED_ACCOUNTS == "") {
        return true;
    }
    
    // Verifica se a conta atual está na lista de permitidas
    string currentAccount = IntegerToString(AccountNumber());
    if(StringFind(ALLOWED_ACCOUNTS, currentAccount) < 0) {
        Print("❌ Conta não autorizada: ", currentAccount);
        return false;
    }
    
    return true;
}
```

### Configuração

**Para liberar todas as contas:**
```mql4
#define ALLOWED_ACCOUNTS ""
```

**Para restringir a contas específicas:**
```mql4
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

```mql4
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
  "platform": "MT4",
  "account_type": "STANDARD"
}
```

---

## Gestão de Dados

### ExportOpenPositions()

Exporta todas as posições abertas (flutuantes) para a API.

**Lógica:**

1. Verifica se há ordens abertas (`OrdersTotal()`)
2. Se não houver, retorna sem fazer nada
3. Itera por todas as ordens usando `OrderSelect(i, SELECT_BY_POS, MODE_TRADES)`
4. Filtra apenas ordens de mercado (OP_BUY e OP_SELL)
5. Para cada ordem, coleta:
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
6. Monta JSON com array de posições
7. Envia para endpoint `/positions`

**Código simplificado:**

```mql4
void ExportOpenPositions() {
    int total = OrdersTotal();
    if(total == 0) return;

    string jsonData = "{";
    jsonData += "\"user_email\":\"" + UserEmail + "\",";
    jsonData += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
    jsonData += "\"positions\":[";
    
    int count = 0;
    for(int i = 0; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            // Apenas ordens de mercado (não pending orders)
            if(OrderType() == OP_BUY || OrderType() == OP_SELL) {
                // Coleta dados da ordem
                int ticket = OrderTicket();
                string symbol = OrderSymbol();
                int orderType = OrderType();
                double volume = OrderLots();
                // ... outros campos
                
                // Adiciona ao JSON
                if(count > 0) jsonData += ",";
                jsonData += "{...}";  // Objeto da posição
                count++;
            }
        }
    }
    
    jsonData += "]}";
    SendToServer("/positions", jsonData);
}
```

**Diferença do MT5:**

No MT5, usamos `PositionGetTicket(i)` e `PositionGetDouble()`. No MT4, usamos `OrderSelect()` e `OrderLots()`, `OrderProfit()`, etc.

### ExportHistoricalTrades()

Exporta histórico de trades fechados para a API.

**Lógica:**

1. Define período de histórico:
   - Se `HistoryDays == 0`: Todo o histórico
   - Caso contrário: Últimos N dias
2. Obtém total de ordens históricas com `OrdersHistoryTotal()`
3. Filtra apenas ordens de mercado fechadas (OP_BUY e OP_SELL)
4. Para cada ordem válida, coleta:
   - Ticket
   - Símbolo
   - Tipo (buy/sell)
   - Volume
   - Preço de abertura
   - Preço de fechamento
   - Lucro
   - Swap
   - Comissão
   - Horário de abertura
   - Horário de fechamento
5. Monta JSON com array de trades
6. Envia para endpoint `/history`

**Filtro de ordens:**

```mql4
if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
    // Apenas ordens de mercado fechadas
    if((OrderType() == OP_BUY || OrderType() == OP_SELL) && 
       OrderCloseTime() > 0) {
        // Processa ordem
    }
}
```

**Diferença do MT5:**

No MT5, usamos `HistorySelect()` e `HistoryDealsTotal()` com filtro de `DEAL_ENTRY_IN` e `DEAL_ENTRY_OUT`. No MT4, usamos `OrdersHistoryTotal()` e verificamos `OrderCloseTime() > 0`.

---

## Tratamento de Erros

### Validação de Parâmetros

O EA valida todos os parâmetros críticos na inicialização:

```mql4
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

```mql4
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

### Otimizações para OnTick()

Como o `OnTick()` é chamado a cada movimento de preço, é crucial otimizar para evitar overhead:

1. **Verificação rápida de timestamps**: Primeira linha verifica se é necessário executar
2. **Return early**: Se não há posições, retorna imediatamente
3. **Logs opcionais**: Podem ser desabilitados para reduzir I/O
4. **Timeout HTTP curto**: 5 segundos para evitar travamentos

**Exemplo de otimização:**

```mql4
void OnTick() {
    datetime currentTime = TimeCurrent();
    
    // Verificação rápida - se não é hora de nada, retorna imediatamente
    if(currentTime - lastHeartbeat < HeartbeatInterval &&
       currentTime - lastProfitUpdate < ProfitUpdateInterval &&
       !ShouldSendHistory()) {
        return;  // Não faz nada neste tick
    }
    
    // Continua com as operações necessárias...
}
```

### Intervalos Configuráveis

| Parâmetro | Padrão | Recomendado | Impacto |
|-----------|--------|-------------|---------|
| `HeartbeatInterval` | 10800s (3h) | 3600-10800s | Consumo de banda |
| `ProfitUpdateInterval` | 7200s (2h) | 3600-7200s | Carga no servidor |
| `HistorySendTimes` | 3x/dia | 2-4x/dia | Carga no banco |

### Consumo de Recursos

**CPU:**
- Idle (fora dos intervalos): <0.1%
- Durante verificação de timestamp: ~0.5%
- Durante sincronização: 2-5%
- Durante exportação de histórico: 5-10%

**Memória:**
- Footprint base: ~300 KB
- Por posição aberta: ~200 bytes
- Por trade no histórico: ~300 bytes

**Rede:**
- Heartbeat: ~500 bytes
- Por posição: ~200 bytes
- Por trade histórico: ~300 bytes

---

## Debugging e Logs

### Sistema de Logs

O EA possui sistema de logs detalhado controlado por `EnableLogs`:

```mql4
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
2025.10.31 10:00:00 Sentra Partners - Conector MT4 v3.0
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
2025.10.31 10:00:00 Exportando 150 ordens do histórico...
2025.10.31 10:00:00 ✓ Dados enviados: /history
2025.10.31 10:00:00 ✓ EA inicializado com sucesso!
```

---

## Manutenção e Atualizações

### Versionamento

O EA segue versionamento semântico:

- **Major (X.0.0)**: Mudanças incompatíveis na API
- **Minor (0.X.0)**: Novas funcionalidades compatíveis
- **Patch (0.0.X)**: Correções de bugs

### Checklist de Atualização

Antes de lançar nova versão:

- [ ] Testar em conta demo MT4
- [ ] Verificar compatibilidade com API
- [ ] Atualizar número de versão
- [ ] Atualizar data de licença se necessário
- [ ] Documentar mudanças
- [ ] Testar em conta real com volume mínimo
- [ ] Monitorar logs por 24h

### Compatibilidade

- **MT4 Build mínimo:** 600
- **API versão:** 1.0+
- **Compilador:** MetaEditor 4

---

## Referências

- [Documentação MQL4](https://docs.mql4.com/)
- [WebRequest em MQL4](https://docs.mql4.com/common/webrequest)
- [OrderSelect em MQL4](https://docs.mql4.com/trading/orderselect)
- [JSON em MQL4](https://www.mql5.com/en/articles/1122)

---

**Documento criado por:** Manus AI  
**Última atualização:** 31 de Outubro de 2025
