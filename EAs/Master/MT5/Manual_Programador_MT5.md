# Manual do Programador - Master MT5

**Versão:** 4.0
**Plataforma:** MetaTrader 5
**Autor:** Sentra Partners
**Data:** Outubro 2025

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Código](#estrutura-do-código)
4. [Funções Principais](#funções-principais)
5. [Sistema de Eventos](#sistema-de-eventos)
6. [Comunicação com API](#comunicação-com-api)
7. [Fila de Retentativas (Retry Queue)](#fila-de-retentativas-retry-queue)
8. [Licenciamento](#licenciamento)
9. [Performance e Otimização](#performance-e-otimização)

---

## Visão Geral

O **Master MT5** é um Expert Advisor (EA) de alta performance projetado para capturar e transmitir eventos de trading de uma conta master para a API da Sentra Partners em tempo real. Ele serve como a fonte de sinais para o sistema de copy trading.

### Características Técnicas

- **Linguagem:** MQL5
- **Versão do EA:** 4.0
- **Arquitetura:** Orientada a eventos e baseada em timer.
- **Comunicação:** REST API via HTTP/HTTPS (POST requests)
- **Formato de dados:** JSON
- **Performance:** Otimizado para baixa latência (heartbeat de 1 segundo).
- **Confiabilidade:** Inclui um sistema de fila de retentativas para garantir a entrega de mensagens.

### Funcionalidades Principais

1.  **Captura de Eventos em Tempo Real:** Utiliza `OnTradeTransaction` para detectar instantaneamente aberturas, fechamentos e modificações de posições.
2.  **Transmissão de Sinais:** Envia eventos formatados em JSON para um endpoint específico da API (`/master-signal`).
3.  **Heartbeat e Sincronização:** Envia um "sinal de vida" a cada segundo, contendo um snapshot completo de todas as posições abertas, garantindo que o sistema slave esteja sempre sincronizado.
4.  **Fila de Retentativas:** Armazena mensagens que falharam ao serem enviadas e tenta reenviá-las periodicamente.

---

## Arquitetura do Sistema

### Diagrama de Fluxo de Eventos

```mermaid
graph TD
    A[Evento de Trade no MT5] -- OnTradeTransaction --> B{Detecta Tipo de Evento};
    B -- Abertura --> C[SendOpenEvent];
    B -- Fechamento --> D[SendCloseEvent];
    B -- Modificação --> E[SendModifyEvent];
    
    subgraph Timer Loop (1s)
        F[OnTimer] --> G{Processar Fila de Retentativas};
        F --> H{Enviar Heartbeat};
    end

    C --> I[SendToServer];
    D --> I[SendToServer];
    E --> I[SendToServer];
    H --> I[SendToServer];
    G --> I[SendToServer];

    I -- Falha --> J[Adicionar à Fila de Retentativas];
    I -- Sucesso --> K[Log Sucesso];
    J --> G;
```

### Componentes Principais

-   **`OnInit()`**: Valida a licença, os parâmetros de entrada e inicializa o timer e o snapshot inicial das posições.
-   **`OnTradeTransaction()`**: O coração do sistema de captura de eventos. É acionado pelo terminal MT5 para cada transação de trade, permitindo uma reação imediata.
-   **`OnTimer()`**: Acionado a cada segundo. É responsável por duas tarefas cruciais: enviar o heartbeat de sincronização e processar a fila de mensagens pendentes.
-   **`SendToServer()`**: Função central que formata e envia a requisição POST para a API.
-   **Fila de Retentativas (`messageQueue`)**: Um array da struct `PendingMessage` que armazena temporariamente os pacotes de dados que não puderam ser enviados, para reenvio posterior.

---

## Estrutura do Código

### Organização do Arquivo

O código é segmentado em seções lógicas para clareza e manutenção.

```mql5
// Includes e Propriedades
#property version   "4.00"

// Sistema de Licenciamento
#define LICENSE_EXPIRY_DATE D'2025.12.31'

// Parâmetros de Entrada
input string UserEmail = "";
input int HeartbeatInterval = 1;

// Estruturas (PendingMessage, PositionSnapshot)
struct PendingMessage { ... };

// Variáveis Globais
datetime lastHeartbeatTime = 0;
PendingMessage messageQueue[];

// Funções de Evento MQL5
int OnInit() { ... }
void OnTradeTransaction(...) { ... }
void OnTimer() { ... }

// Funções de Envio de Eventos
void SendOpenEvent(ulong ticket) { ... }
void SendCloseEvent(ulong ticket) { ... }
void SendModifyEvent(ulong ticket) { ... }
void SendHeartbeat() { ... }

// Funções de Comunicação e Fila
void SendToServer(string data) { ... }
void AddToRetryQueue(string data) { ... }
void ProcessRetryQueue() { ... }

// Funções Auxiliares
bool ValidateLicense() { ... }
void UpdatePositionSnapshot() { ... }
```

### Estruturas de Dados

-   **`PendingMessage`**: Armazena os dados de uma mensagem que falhou, o número de tentativas e o timestamp.
    ```mql5
    struct PendingMessage {
        string data;       // O payload JSON
        int retryCount;    // Contador de tentativas
        datetime timestamp;  // Quando foi adicionado
    };
    ```
-   **`PositionSnapshot`**: Usada para manter um estado anterior das posições e detectar mudanças (embora a v4.0 dependa mais de `OnTradeTransaction`).

### Parâmetros de Entrada

| Parâmetro | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `UserEmail` | `string` | "" | Email do usuário cadastrado na plataforma. **Obrigatório**. |
| `MasterServer` | `string` | `https://sentrapartners.com/api/mt/copy` | URL base da API de copy trading. |
| `HeartbeatInterval` | `int` | 1 | Intervalo em segundos para o envio do heartbeat de sincronização. **1 segundo é o ideal para cópia rápida**. |
| `MaxRetries` | `int` | 3 | Número máximo de tentativas de reenvio para uma mensagem na fila. |
| `EnableLogs` | `bool` | `true` | Ativa/desativa logs detalhados no terminal. |

---

## Funções Principais

### `OnInit()`

1.  **Validação:** Verifica a licença e os parâmetros de entrada (`UserEmail`, `MasterServer`).
2.  **Timer:** Inicia um timer de 1 segundo com `EventSetTimer(1)`. Este timer é o motor para o `OnTimer()`.
3.  **Snapshot Inicial:** Chama `UpdatePositionSnapshot()` para ter um registro do estado das posições no momento da inicialização.

### `OnTradeTransaction()`

Esta é a função mais crítica para a captura de eventos em tempo real. Ela analisa o tipo de transação (`trans.type`) para determinar a ação a ser tomada.

-   **`TRADE_TRANSACTION_DEAL_ADD`**: Indica que uma nova negociação (deal) foi adicionada. Se for do tipo `DEAL_TYPE_BUY` ou `DEAL_TYPE_SELL`, significa que uma **posição foi aberta**. O EA então chama `SendOpenEvent()`.
-   **`TRADE_TRANSACTION_HISTORY_ADD`**: Indica que uma negociação foi movida para o histórico. Isso sinaliza o **fechamento de uma posição**. O EA chama `SendCloseEvent()`.
-   **`TRADE_TRANSACTION_ORDER_UPDATE`**: Indica uma modificação em uma ordem existente, como a alteração de Stop Loss ou Take Profit. O EA chama `SendModifyEvent()`.

### `OnTimer()`

Executada a cada segundo, esta função tem duas responsabilidades:

1.  **Heartbeat:** Verifica se o tempo decorrido desde o último heartbeat (`lastHeartbeatTime`) é maior ou igual ao `HeartbeatInterval`. Se for, chama `SendHeartbeat()`.
2.  **Fila de Retentativas:** Chama `ProcessRetryQueue()` para tentar reenviar mensagens que falharam anteriormente.

---

## Sistema de Eventos

O EA formata cada evento em um payload JSON específico antes de enviá-lo.

### `SendOpenEvent(ulong ticket)`

-   **Ação:** `open`
-   **Dados Enviados:** Coleta todos os detalhes da nova posição usando `PositionSelectByTicket()` e `PositionGet*` (símbolo, tipo, volume, preço de abertura, SL, TP, etc.).
-   **Payload JSON:**
    ```json
    {
      "action": "open",
      "master_email": "...",
      "ticket": 12345,
      "symbol": "EURUSD",
      "type": 0, // 0 para Buy, 1 para Sell
      "lots": 0.10,
      "open_price": 1.07500,
      "stop_loss": 1.07000,
      "take_profit": 1.08000
    }
    ```

### `SendCloseEvent(ulong ticket)`

-   **Ação:** `close`
-   **Dados Enviados:** O desafio aqui é obter o lucro e o preço de fechamento, pois a posição não existe mais. O EA faz isso pesquisando no histórico de negociações (`HistorySelectByPosition`, `HistoryDealsTotal`) pelo deal de saída (`DEAL_ENTRY_OUT`) correspondente ao ticket da posição.
-   **Payload JSON:**
    ```json
    {
      "action": "close",
      "master_email": "...",
      "ticket": 12345,
      "profit": 50.25,
      "close_price": 1.08000
    }
    ```

### `SendModifyEvent(ulong ticket)`

-   **Ação:** `modify`
-   **Dados Enviados:** Envia apenas o ticket da posição e os novos valores de `stop_loss` e `take_profit`.
-   **Payload JSON:**
    ```json
    {
      "action": "modify",
      "master_email": "...",
      "ticket": 12345,
      "stop_loss": 1.07200,
      "take_profit": 1.08200
    }
    ```

### `SendHeartbeat()`

-   **Ação:** `heartbeat`
-   **Dados Enviados:** Itera por todas as posições abertas (`PositionsTotal()`) e cria um array JSON com os detalhes essenciais de cada uma. Isso serve como um mecanismo de sincronização forçada para garantir que nenhum estado tenha sido perdido.
-   **Payload JSON:**
    ```json
    {
      "action": "heartbeat",
      "master_email": "...",
      "positions": [
        { "ticket": 12345, "symbol": "EURUSD", ... },
        { "ticket": 12346, "symbol": "GBPUSD", ... }
      ],
      "positions_count": 2
    }
    ```

---

## Comunicação com API

### `SendToServer(string data)`

Esta função encapsula a lógica de `WebRequest`.

1.  **Monta a URL:** Concatena `MasterServer` com o endpoint fixo `/master-signal`.
2.  **Prepara a Requisição:** Define o header `Content-Type: application/json`.
3.  **Executa `WebRequest`:** Envia a requisição POST com um timeout de 5 segundos.
4.  **Trata a Resposta:**
    -   Se o código de status for `200`, a mensagem foi enviada com sucesso.
    -   Se for qualquer outro código, a função chama `AddToRetryQueue(data)` para que a mensagem não seja perdida.

---

## Fila de Retentativas (Retry Queue)

Este é um mecanismo de resiliência crucial para garantir a entrega das mensagens mesmo em caso de falhas de rede ou instabilidade da API.

### `AddToRetryQueue(string data)`

-   Verifica se a mensagem já está na fila para evitar duplicatas.
-   Se não estiver, redimensiona o array `messageQueue` e adiciona uma nova `PendingMessage` com `retryCount = 0`.

### `ProcessRetryQueue()`

-   É chamada a cada segundo pelo `OnTimer()`.
-   Itera pela `messageQueue`.
-   Para cada mensagem, tenta reenviá-la usando `SendToServer()`.
-   **Lógica de Sucesso/Falha:**
    -   Se o reenvio for bem-sucedido, a mensagem é removida da fila.
    -   Se falhar, o `retryCount` é incrementado.
    -   Se `retryCount` exceder `MaxRetries`, a mensagem é descartada e um erro é logado, prevenindo um loop infinito.

---

## Licenciamento

O sistema de licenciamento é simples e definido no topo do arquivo:

```mql5
datetime LICENSE_EXPIRY_DATE = D'2025.12.31';
#define ALLOWED_ACCOUNTS "" // Vazio = todas as contas
```

A função `ValidateLicense()` é chamada no `OnInit()` e verifica:
1.  Se a data atual (`TimeCurrent()`) ultrapassou `LICENSE_EXPIRY_DATE`.
2.  Se `ALLOWED_ACCOUNTS` não está vazio, verifica se o número da conta atual está contido na string.

---

## Performance e Otimização

-   **`OnTradeTransaction` vs. `OnTick`**: A mudança para `OnTradeTransaction` (disponível apenas no MT5) é a maior otimização, pois o código só é executado quando há atividade de trade real, em vez de a cada tick de preço.
-   **Timer de 1 Segundo:** O intervalo de 1 segundo no `EventSetTimer` oferece um bom equilíbrio entre a capacidade de resposta da fila de retentativas e o consumo de CPU.
-   **Heartbeat de Sincronização:** Embora o `OnTradeTransaction` seja confiável, o heartbeat periódico garante que, mesmo que um evento seja perdido por qualquer motivo extremo, o sistema se autocorrigirá em no máximo 1 segundo.
-   **Logs Opcionais:** A variável `EnableLogs` permite desativar as chamadas `Print()`, que podem consumir recursos em um ambiente de alta frequência.

---

**Documento criado por:** Manus AI
**Última atualização:** 31 de Outubro de 2025
