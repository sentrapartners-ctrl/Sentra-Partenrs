# Manual do Programador - Slave MT5

**Versão:** 4.0
**Plataforma:** MetaTrader 5
**Autor:** Sentra Partners
**Data:** Outubro 2025

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Código](#estrutura-do-código)
4. [Ciclo de Vida da Cópia](#ciclo-de-vida-da-cópia)
5. [Comunicação com a API](#comunicação-com-a-api)
6. [Gerenciamento de Posições](#gerenciamento-de-posições)
7. [Lógica de Sincronização (Heartbeat)](#lógica-de-sincronização-heartbeat)
8. [Gerenciamento de Lote e Risco](#gerenciamento-de-lote-e-risco)
9. [Normalização de Símbolos](#normalização-de-símbolos)
10. [Configurações do Servidor](#configurações-do-servidor)

---

## Visão Geral

O **Slave MT5** é o Expert Advisor (EA) seguidor no sistema de copy trading. Sua principal responsabilidade é consultar a API da Sentra Partners para obter os sinais da conta Master e replicar essas operações na conta local (Slave).

A versão 4.0 introduz um sistema robusto que lida com diferentes formatos de sinal (eventos específicos e heartbeats de estado completo), configurações remotas via servidor e gerenciamento de risco avançado.

### Características Técnicas

- **Linguagem:** MQL5
- **Arquitetura:** Baseada em timer (`OnTimer`), realizando consultas periódicas (polling).
- **Comunicação:** REST API via `WebRequest` (GET requests).
- **Formato de Dados:** JSON.
- **Gerenciamento de Trade:** Utiliza a biblioteca padrão `CTrade` (`Trade.mqh`).
- **Flexibilidade:** Suporta múltiplos modos de gerenciamento de lote, filtros de trade e configurações de SL/TP que podem ser definidas remotamente.

---

## Arquitetura do Sistema

O Slave opera em um ciclo contínuo de consulta e ação, gerenciado pelo `OnTimer()`.

### Diagrama de Fluxo

```mermaid
graph TD
    A[OnTimer (1s)] --> B{É hora de checar sinais?};
    A --> C{É hora de enviar heartbeat do Slave?};

    B -- Sim --> D[CheckMasterSignals];
    D --> E{GET /slave-signals};
    E -- Sucesso --> F[ProcessMasterSignals];
    F --> G{Analisar "action" no JSON};
    G -- heartbeat --> H[ProcessHeartbeat];
    G -- open --> I[ProcessOpenEvent];
    G -- close --> J[ProcessCloseEvent];
    G -- modify --> K[ProcessModifyEvent];

    H --> L[Sincronizar Posições];
    I --> M[Abrir Nova Posição];
    J --> N[Fechar Posição Existente];
    K --> O[Modificar SL/TP];
    
    C -- Sim --> P[SendSlaveHeartbeat];
    P --> Q{POST /slave-heartbeat};
```

### Componentes Principais

-   **`OnInit()`**: Valida a licença, os parâmetros, carrega as configurações do servidor (`LoadServerSettings`) e inicializa o timer.
-   **`OnTimer()`**: O motor do EA. A cada segundo, ele verifica se é hora de consultar a API por novos sinais (`CheckMasterSignals`) ou de enviar seu próprio status para a plataforma (`SendSlaveHeartbeat`).
-   **`CheckMasterSignals()`**: Monta e executa a requisição `GET` para o endpoint `/slave-signals`, passando o ID da conta master e o email do slave como parâmetros.
-   **`ProcessMasterSignals(string json)`**: Atua como um roteador. Ele extrai o campo `action` do JSON recebido e chama a função de processamento apropriada (`ProcessHeartbeat`, `ProcessOpenEvent`, etc.).
-   **Funções de Processamento de Evento**: Cada uma (`ProcessOpenEvent`, `ProcessCloseEvent`, `ProcessModifyEvent`) é responsável por extrair os dados do JSON e executar a ação de trading correspondente.
-   **`ProcessHeartbeat(string json)`**: A função mais complexa. Ela recebe um snapshot completo das posições do master e o sincroniza com as posições abertas na conta slave, abrindo o que falta e fechando o que sobra.
-   **`SendSlaveHeartbeat()`**: Envia um sinal de vida para a plataforma web, informando que o EA está online e funcionando.

---

## Estrutura do Código

### Organização do Arquivo

```mql5
// Propriedades e Licenciamento

// Parâmetros de Entrada
input string UserEmail = "";
input string MasterAccountNumber = "";
input double LotMultiplier = 1.0;

// Estruturas (MasterPosition, SlavePosition, CopySettings)
struct MasterPosition { ... };

// Variáveis Globais
datetime lastCheckTime = 0;
SlavePosition slavePositions[];
CopySettings serverSettings;

// Includes
#include <Trade\Trade.mqh>
CTrade trade;

// Funções de Evento MQL5
int OnInit() { ... }
void OnTimer() { ... }

// Funções de Comunicação e Processamento
void CheckMasterSignals() { ... }
void ProcessMasterSignals(string json) { ... }
void ProcessHeartbeat(string json) { ... }
void ProcessOpenEvent(string json) { ... }
// ...outras

// Funções de Gerenciamento de Trade
bool OpenPosition(...) { ... }
bool ClosePosition(...) { ... }

// Funções Auxiliares
double AdjustLotForAccountType(double lots) { ... }
string NormalizeSymbol(string symbol) { ... }
bool LoadServerSettings() { ... }
```

### Estruturas de Dados

-   **`MasterPosition`**: Armazena os dados de uma posição conforme recebido da API.
-   **`SlavePosition`**: Mapeia um `ticket` da conta slave ao `master_ticket` correspondente, essencial para saber qual posição fechar ou modificar.
-   **`CopySettings`**: Uma `struct` abrangente que armazena todas as configurações de cópia que podem ser carregadas do servidor (modos de lote, filtros, gerenciamento de risco, etc.).

---

## Ciclo de Vida da Cópia

1.  **Consulta (`CheckMasterSignals`)**: A cada `CheckInterval` (1s por padrão), o EA faz uma chamada `GET` à API.
2.  **Roteamento (`ProcessMasterSignals`)**: A API retorna um JSON. O EA verifica o campo `action`.
3.  **Ação:**
    -   Se `action` for `open`, `close`, ou `modify`, o EA executa essa ação específica.
    -   Se `action` for `heartbeat`, o EA entra no modo de sincronização total.
4.  **Validação (`ValidateTrade`)**: Antes de abrir qualquer trade, a função `ValidateTrade` verifica se a operação é permitida com base nas configurações de `CopySettings` (filtros de símbolo, direção, limites diários de perda/trades).
5.  **Ajuste de Lote**: O lote é calculado com base em `LotMultiplier` (parâmetro de entrada) e `serverSettings.volumeMultiplier` (configuração do servidor), além de levar em conta se as contas são `CENT` ou `STANDARD` (`AdjustLotForAccountType`).
6.  **Normalização**: O símbolo do master (`EURUSD`) é normalizado para o formato da corretora do slave (`EURUSD.pro`, `EURUSDc`, etc.) pela função `NormalizeSymbol`.
7.  **Execução**: A biblioteca `CTrade` é usada para executar a ordem (`trade.Buy()`, `trade.Sell()`, `trade.PositionClose()`).
8.  **Mapeamento**: Se uma posição é aberta com sucesso, `AddSlavePosition()` é chamada para criar o vínculo entre o ticket do master e o novo ticket do slave.

---

## Comunicação com a API

-   **`CheckMasterSignals()`**: Faz a requisição principal para obter os sinais.
    -   **URL:** `/slave-signals?master_account_id={...}&slave_email={...}`
    -   **Método:** `GET`
    -   A resposta é um JSON contendo o último evento ou o estado do heartbeat do master.
-   **`SendSlaveHeartbeat()`**: Envia o status do slave para a plataforma.
    -   **URL:** `/slave-heartbeat`
    -   **Método:** `POST`
    -   **Payload:** Informações da conta slave (email, número da conta, saldo, etc.). Isso permite que a plataforma mostre o slave como "Online".
-   **`LoadServerSettings()`**: Carrega as configurações de cópia personalizadas.
    -   **URL:** `/copy-settings?master_account_id={...}&slave_email={...}`
    -   **Método:** `GET`
    -   A resposta é um JSON com todas as regras de cópia que são armazenadas na `struct serverSettings`.

### Extração de Dados do JSON

O EA usa uma função auxiliar `ExtractValue(string json, string key)` para parsear o JSON. É uma implementação simples que busca a chave no texto e extrai o valor entre aspas ou vírgulas. Embora não seja um parser JSON completo, é suficiente para a estrutura de dados utilizada.

---

## Gerenciamento de Posições

O mapeamento entre as posições do master e do slave é o núcleo do sistema de fechamento e modificação.

-   **`slavePositions[]`**: Um array global da `struct SlavePosition`.
-   **`AddSlavePosition(ulong slaveTicket, string masterTicket, string symbol)`**: Adiciona uma nova entrada ao array `slavePositions` após uma cópia bem-sucedida.
-   **`FindSlavePosition(string masterTicket)`**: Itera pelo array `slavePositions` para encontrar o índice de uma posição baseada no `masterTicket`.
-   **`FindSlaveTicket(string masterTicket)`**: Similar à anterior, mas retorna diretamente o `ulong` do ticket do slave, que é usado para fechar ou modificar a posição com `CTrade`.

## Lógica de Sincronização (Heartbeat)

O processamento do `heartbeat` é o mecanismo de segurança que garante a consistência do sistema.

1.  **`ProcessHeartbeat(string json)`**: É chamado quando a API retorna um `action: "heartbeat"`.
2.  **Parse das Posições Master**: O EA extrai o array `positions` do JSON e preenche o array global `masterPositions[]`.
3.  **Parse das Posições Slave**: O EA varre as posições abertas na conta local (`PositionsTotal()`) que foram abertas por ele (verificando o `MagicNumber`) e preenche o array `slavePositions[]`.
4.  **Sincronização - Abrir Faltantes**: O EA itera por todas as `masterPositions`. Para cada uma, ele verifica se já existe uma `slavePosition` correspondente. Se **não existir**, ele chama `OpenPosition()` para copiar o trade.
5.  **Sincronização - Fechar Sobrantes**: O EA itera por todas as `slavePositions`. Para cada uma, ele verifica se ainda existe uma `masterPosition` correspondente. Se **não existir**, significa que o master fechou essa posição, e o EA chama `ClosePosition()` para fechar o trade na conta slave.

Este processo de duas vias garante que, em no máximo `CheckInterval` segundos, a conta slave se torne um espelho exato da conta master.

---

## Gerenciamento de Lote e Risco

O cálculo do lote a ser aberto é uma das partes mais importantes.

1.  **Lote Base**: O lote recebido do master.
2.  **Ajuste de Conta Cent (`AdjustLotForAccountType`)**: Se o tipo de conta (Cent/Standard) for diferente entre master e slave, o lote é ajustado. Por exemplo, se o Master (Standard) abre 0.10 e o Slave é Cent, o lote é multiplicado por 100, tornando-se 10.0. Se o Master (Cent) abre 1.0 e o Slave é Standard, o lote é dividido por 100, tornando-se 0.01.
3.  **Multiplicador de Lote**: O lote é então multiplicado pelo `LotMultiplier` (definido no input) ou `serverSettings.volumeMultiplier` (definido no servidor, se disponível).
4.  **Lote Fixo**: Se `serverSettings.volumeMode` for `fixed`, o lote calculado é ignorado e `serverSettings.volumeFixed` é usado.
5.  **Limite Máximo**: Se `serverSettings.maxVolume` for definido, o lote final é limitado a este valor.
6.  **Normalização de Lote (`NormalizeLot`)**: Finalmente, o lote é ajustado para estar de acordo com os requisitos do símbolo na corretora do slave (passo de lote, lote mínimo/máximo).

## Normalização de Símbolos

Corretoras diferentes usam sufixos diferentes para os mesmos ativos (ex: `EURUSD`, `EURUSD.m`, `EURUSD.pro`).

-   **`NormalizeSymbol(string symbol)`**: Esta função tenta encontrar o símbolo correto na Market Watch do slave.
-   **Lógica:**
    1.  Tenta encontrar o símbolo exato (`EURUSD`).
    2.  Se não encontrar, tenta adicionar/remover sufixos comuns (`.m`, `c`, etc.).
    3.  Se ainda não encontrar, itera por todos os símbolos na Market Watch (`SymbolsTotal()`) e verifica se o nome de um deles **contém** o símbolo base (ex: `EURUSD` está contido em `EURUSD.pro`).
    4.  Antes de qualquer tentativa, a função garante que o símbolo esteja visível na Market Watch usando `SymbolSelect(symbol_name, true)`.

## Configurações do Servidor

-   **`LoadServerSettings()`**: Chamada no `OnInit()`, esta função faz um `GET` para o endpoint `/copy-settings`.
-   Se a chamada for bem-sucedida, o JSON de resposta é parseado e a `struct serverSettings` global é preenchida.
-   Isso permite que o administrador da plataforma Sentra Partners altere as regras de cópia (filtros, multiplicadores, etc.) para qualquer slave remotamente, sem que o usuário precise alterar os parâmetros do EA.
-   Se a chamada falhar, o EA continua funcionando com as configurações padrão definidas nos parâmetros de entrada.

---

**Documento criado por:** Manus AI
**Última atualização:** 31 de Outubro de 2025
