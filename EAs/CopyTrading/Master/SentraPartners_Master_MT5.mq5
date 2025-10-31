//+------------------------------------------------------------------+
//|                                      SentraPartners_Master_MT5.mq5|
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "4.00"
#property strict

//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
datetime LICENSE_EXPIRY_DATE = D'2025.12.31';  // 31/12/2025 23:59:59
#define ALLOWED_ACCOUNTS ""  // Contas permitidas (separadas por vírgula) - vazio = todas

//====================================================
// PARÂMETROS DE ENTRADA
//====================================================
input string UserEmail = "";                        // ⚠️ SEU EMAIL CADASTRADO
input string MasterServer = "https://sentrapartners.com/api/mt/copy";
input int HeartbeatInterval = 1;                    // Intervalo de heartbeat (segundos)
input int MaxRetries = 3;                           // Máximo de tentativas de retry
input bool EnableLogs = true;                       // Habilitar logs

//====================================================
// ESTRUTURAS
//====================================================
struct PendingMessage {
    string data;
    int retryCount;
    datetime timestamp;
};

struct PositionSnapshot {
    ulong ticket;
    string symbol;
    int type;
    double lots;
    double open_price;
    double stop_loss;
    double take_profit;
    datetime open_time;
};

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastHeartbeatTime = 0;
PendingMessage messageQueue[];
PositionSnapshot previousPositions[];
int queueSize = 0;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Master MT5 v4.0");
    Print("Conta: ", AccountInfoInteger(ACCOUNT_LOGIN));
    Print("Email: ", UserEmail);
    Print("===========================================");
    
    // Validar licença
    if(!ValidateLicense()) {
        Alert("❌ LICENÇA INVÁLIDA!");
        Print("❌ EA bloqueado: Licença inválida ou expirada.");
        return(INIT_FAILED);
    }
    Print("✅ Licença válida!");
    
    // Validar email
    if(UserEmail == "") {
        Alert("ERRO: Configure seu email!");
        return(INIT_FAILED);
    }
    
    // Validar URL
    if(StringFind(MasterServer, "http") != 0) {
        Alert("ERRO: URL inválida!");
        return(INIT_FAILED);
    }
    
    // Timer para heartbeat e retry queue
    EventSetTimer(1);  // 1 segundo para processar fila
    
    // Snapshot inicial das posições
    UpdatePositionSnapshot();
    
    Print("✅ Master EA inicializado com sucesso!");
    Print("📡 Heartbeat: ", HeartbeatInterval, "s");
    Print("🔄 Max Retries: ", MaxRetries);
    return(INIT_SUCCEEDED);
}

//====================================================
// TRADE TRANSACTION (EVENTOS IMEDIATOS)
//====================================================
void OnTradeTransaction(
    const MqlTradeTransaction& trans,
    const MqlTradeRequest& request,
    const MqlTradeResult& result
) {
    // Detectar abertura de posição
    if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
        if(trans.deal_type == DEAL_TYPE_BUY || trans.deal_type == DEAL_TYPE_SELL) {
            if(EnableLogs) Print("🔔 Nova posição detectada: ", trans.position);
            SendOpenEvent(trans.position);
        }
    }
    
    // Detectar fechamento de posição
    if(trans.type == TRADE_TRANSACTION_HISTORY_ADD) {
        if(EnableLogs) Print("🔔 Posição fechada detectada: ", trans.position);
        SendCloseEvent(trans.position);
    }
    
    // Detectar modificação de S/L ou T/P
    if(trans.type == TRADE_TRANSACTION_ORDER_UPDATE) {
        if(EnableLogs) Print("🔔 Modificação detectada: ", trans.position);
        SendModifyEvent(trans.position);
    }
}

//====================================================
// TIMER (HEARTBEAT + RETRY QUEUE)
//====================================================
void OnTimer() {
    datetime now = TimeCurrent();
    
    // Enviar heartbeat a cada X segundos
    if(now - lastHeartbeatTime >= HeartbeatInterval) {
        SendHeartbeat();
        lastHeartbeatTime = now;
    }
    
    // Processar fila de retry
    ProcessRetryQueue();
}

//====================================================
// ENVIAR EVENTO DE ABERTURA
//====================================================
void SendOpenEvent(ulong ticket) {
    if(!PositionSelectByTicket(ticket)) return;
    
    string data = "{";
    data += "\"action\":\"open\",";
    data += "\"master_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"ticket\":" + IntegerToString(ticket) + ",";
    data += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
    data += "\"type\":" + IntegerToString(PositionGetInteger(POSITION_TYPE)) + ",";
    data += "\"lots\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
    data += "\"open_price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
    data += "\"stop_loss\":" + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ",";
    data += "\"take_profit\":" + DoubleToString(PositionGetDouble(POSITION_TP), 5) + ",";
    data += "\"open_time\":" + IntegerToString(PositionGetInteger(POSITION_TIME)) + ",";
    data += "\"comment\":\"" + PositionGetString(POSITION_COMMENT) + "\"";
    data += "}";
    
    SendToServer(data);
}

//====================================================
// ENVIAR EVENTO DE FECHAMENTO
//====================================================
void SendCloseEvent(ulong ticket) {
    // Buscar deal no histórico para obter profit e preço de fechamento
    double profit = 0.0;
    double close_price = 0.0;
    
    // Selecionar histórico de deals
    if(HistorySelectByPosition(ticket)) {
        int total = HistoryDealsTotal();
        for(int i = total - 1; i >= 0; i--) {
            ulong deal_ticket = HistoryDealGetTicket(i);
            if(deal_ticket > 0) {
                // Verificar se é deal de saída (fechamento)
                if(HistoryDealGetInteger(deal_ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT) {
                    profit = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
                    close_price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
                    break;
                }
            }
        }
    }
    
    string data = "{";
    data += "\"action\":\"close\",";
    data += "\"master_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"ticket\":" + IntegerToString(ticket) + ",";
    data += "\"profit\":" + DoubleToString(profit, 2) + ",";
    data += "\"close_price\":" + DoubleToString(close_price, 5);
    data += "}";
    
    if(EnableLogs) Print("✅ CLOSE: ticket=", ticket, " profit=", profit, " close_price=", close_price);
    
    SendToServer(data);
}

//====================================================
// ENVIAR EVENTO DE MODIFICAÇÃO
//====================================================
void SendModifyEvent(ulong ticket) {
    if(!PositionSelectByTicket(ticket)) return;
    
    string data = "{";
    data += "\"action\":\"modify\",";
    data += "\"master_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"ticket\":" + IntegerToString(ticket) + ",";
    data += "\"stop_loss\":" + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ",";
    data += "\"take_profit\":" + DoubleToString(PositionGetDouble(POSITION_TP), 5);
    data += "}";
    
    SendToServer(data);
}

//====================================================
// ENVIAR HEARTBEAT (SINCRONIZAÇÃO)
//====================================================
void SendHeartbeat() {
    string data = "{";
    data += "\"action\":\"heartbeat\",";
    data += "\"master_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"positions\":[";
    
    int total = PositionsTotal();
    int count = 0;
    
    for(int i = 0; i < total; i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            if(count > 0) data += ",";
            
            data += "{";
            data += "\"ticket\":" + IntegerToString(ticket) + ",";
            data += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
            data += "\"type\":" + IntegerToString(PositionGetInteger(POSITION_TYPE)) + ",";
            data += "\"lots\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
            data += "\"open_price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
            data += "\"stop_loss\":" + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ",";
            data += "\"take_profit\":" + DoubleToString(PositionGetDouble(POSITION_TP), 5) + ",";
            data += "\"open_time\":" + IntegerToString(PositionGetInteger(POSITION_TIME));
            data += "}";
            
            count++;
        }
    }
    
    data += "],";
    data += "\"positions_count\":" + IntegerToString(count);
    data += "}";
    
    if(EnableLogs) Print("💓 Heartbeat enviado: ", count, " posições");
    SendToServer(data);
}

//====================================================
// ENVIAR PARA SERVIDOR (COM RETRY)
//====================================================
void SendToServer(string data) {
    string url = MasterServer + "/master-signal";
    string headers = "Content-Type: application/json\r\n";
    
    char post[], result[];
    ArrayResize(post, StringToCharArray(data, post, 0, WHOLE_ARRAY, CP_UTF8) - 1);
    
    string resultHeaders;
    int timeout = 5000;
    int res = WebRequest("POST", url, headers, timeout, post, result, resultHeaders);
    
    if(res == 200) {
        if(EnableLogs) Print("✅ Mensagem enviada com sucesso");
    } else {
        if(EnableLogs) Print("❌ Erro ao enviar (", res, "), adicionando à fila de retry");
        AddToRetryQueue(data);
    }
}

//====================================================
// ADICIONAR À FILA DE RETRY
//====================================================
void AddToRetryQueue(string data) {
    ArrayResize(messageQueue, queueSize + 1);
    messageQueue[queueSize].data = data;
    messageQueue[queueSize].retryCount = 0;
    messageQueue[queueSize].timestamp = TimeCurrent();
    queueSize++;
    
    if(EnableLogs) Print("📥 Mensagem adicionada à fila. Total: ", queueSize);
}

//====================================================
// PROCESSAR FILA DE RETRY
//====================================================
void ProcessRetryQueue() {
    if(queueSize == 0) return;
    
    for(int i = queueSize - 1; i >= 0; i--) {
        // Verificar se já passou tempo suficiente (2 segundos entre retries)
        if(TimeCurrent() - messageQueue[i].timestamp < 2) continue;
        
        // Tentar reenviar
        string url = MasterServer + "/master-signal";
        string headers = "Content-Type: application/json\r\n";
        
        char post[], result[];
        ArrayResize(post, StringToCharArray(messageQueue[i].data, post, 0, WHOLE_ARRAY, CP_UTF8) - 1);
        
        string resultHeaders;
        int timeout = 5000;
        int res = WebRequest("POST", url, headers, timeout, post, result, resultHeaders);
        
        if(res == 200) {
            // Sucesso! Remover da fila
            if(EnableLogs) Print("✅ Retry bem-sucedido! Removendo da fila");
            RemoveFromQueue(i);
        } else {
            // Falhou, incrementar contador
            messageQueue[i].retryCount++;
            messageQueue[i].timestamp = TimeCurrent();
            
            if(messageQueue[i].retryCount >= MaxRetries) {
                // Excedeu máximo de tentativas, descartar
                if(EnableLogs) Print("❌ Mensagem descartada após ", MaxRetries, " tentativas");
                RemoveFromQueue(i);
            } else {
                if(EnableLogs) Print("🔄 Retry ", messageQueue[i].retryCount, "/", MaxRetries);
            }
        }
    }
}

//====================================================
// REMOVER DA FILA
//====================================================
void RemoveFromQueue(int index) {
    for(int i = index; i < queueSize - 1; i++) {
        messageQueue[i] = messageQueue[i + 1];
    }
    queueSize--;
    ArrayResize(messageQueue, queueSize);
}

//====================================================
// ATUALIZAR SNAPSHOT DE POSIÇÕES
//====================================================
void UpdatePositionSnapshot() {
    int total = PositionsTotal();
    ArrayResize(previousPositions, total);
    
    for(int i = 0; i < total; i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0 && PositionSelectByTicket(ticket)) {
            previousPositions[i].ticket = ticket;
            previousPositions[i].symbol = PositionGetString(POSITION_SYMBOL);
            previousPositions[i].type = (int)PositionGetInteger(POSITION_TYPE);
            previousPositions[i].lots = PositionGetDouble(POSITION_VOLUME);
            previousPositions[i].open_price = PositionGetDouble(POSITION_PRICE_OPEN);
            previousPositions[i].stop_loss = PositionGetDouble(POSITION_SL);
            previousPositions[i].take_profit = PositionGetDouble(POSITION_TP);
            previousPositions[i].open_time = (datetime)PositionGetInteger(POSITION_TIME);
        }
    }
}

//====================================================
// VALIDAÇÃO DE LICENÇA
//====================================================
bool ValidateLicense() {
    // 1. Verificar data de expiração
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em: ", TimeToString(LICENSE_EXPIRY_DATE, TIME_DATE));
        return false;
    }
    
    // 2. Verificar contas permitidas
    string allowedAccounts = ALLOWED_ACCOUNTS;
    if(allowedAccounts != "") {
        string currentAccount = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
        bool accountAllowed = false;
        
        string accounts[];
        int count = StringSplit(allowedAccounts, ',', accounts);
        
        for(int i = 0; i < count; i++) {
            StringTrimLeft(accounts[i]);
            StringTrimRight(accounts[i]);
            
            if(accounts[i] == currentAccount) {
                accountAllowed = true;
                break;
            }
        }
        
        if(!accountAllowed) {
            Print("❌ Conta não autorizada: ", currentAccount);
            return false;
        }
    }
    
    Print("✅ Licença válida até: ", TimeToString(LICENSE_EXPIRY_DATE, TIME_DATE));
    return true;
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    EventKillTimer();
    Print("Master EA finalizado. Motivo: ", reason);
    Print("📊 Mensagens pendentes na fila: ", queueSize);
}
//+------------------------------------------------------------------+
