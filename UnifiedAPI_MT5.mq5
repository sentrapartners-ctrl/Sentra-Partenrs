//====================================================
// UNIFIED API - MetaTrader 5
// Arquivo: UnifiedAPI_MT5.mq5
// Compilar em: MT5 MetaEditor
//====================================================

#property strict
#property description "API Unificada MT5 - Envia dados para servidor Python centralizado"

// ===== CONFIGURAÇÃO =====
input string MasterServer = "https://sentrapartners.com/api/mt";  // URL do servidor Sentra Partners
input string TerminalID = "MT5_CONTA_01";             // Identifica este terminal
input int HeartbeatInterval = 60;                     // Envia heartbeat a cada 60 segundos

// ===== VARIÁVEIS GLOBAIS =====
int lastHeartbeat = 0;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("\n===== API UNIFICADA - MT5 INICIADA =====");
    Print("Terminal ID: " + TerminalID);
    Print("Servidor: " + MasterServer);
    Print("Intervalo Heartbeat: " + IntegerToString(HeartbeatInterval) + " segundos");
    Print("=========================================\n");

    // Envia primeira posição
    SendHeartbeat();
    ExportHistoricalTrades();

    // Inicia Timer para heartbeat periódico
    EventSetTimer(HeartbeatInterval);
    
    return INIT_SUCCEEDED;
}

//====================================================
// TIMER (MT5 - Para heartbeat periódico)
//====================================================
void OnTimer() {
    if (TimeCurrent() - lastHeartbeat >= HeartbeatInterval) {
        SendHeartbeat();
        lastHeartbeat = TimeCurrent();
    }
}

//====================================================
// EVENTO DE TRADE (MT5 - Automático)
//====================================================
void OnTrade() {
    // MT5 chama esta função automaticamente quando há mudança nas posições
    ExportCurrentPositions();
    SendHeartbeat();
}

//====================================================
// EVENTOS DE TRANSAÇÃO (MT5 - Mais detalhado)
//====================================================
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result) {
    if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
        Print("Novo deal executado: " + IntegerToString(trans.deal));
        ExportHistoricalTrades();
    }
}

//====================================================
// FUNÇÃO: ENVIAR HEARTBEAT
//====================================================
void SendHeartbeat() {
    string data = "{";
    data += "\"terminal_id\":\"" + TerminalID + "\",";
    data += "\"account\":";
    data += IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ",";
    data += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    data += "\"balance\":";
    data += DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    data += "\"equity\":";
    data += DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
    data += "\"margin_free\":";
    data += DoubleToString(AccountInfoDouble(ACCOUNT_FREEMARGIN), 2) + ",";
    data += "\"open_positions\":";
    data += IntegerToString(PositionsTotal()) + ",";
    data += "\"timestamp\":";
    data += IntegerToString(TimeCurrent());
    data += "}";

    SendToServer("/heartbeat", data);
}

//====================================================
// FUNÇÃO: EXPORTAR POSIÇÕES ABERTAS (MT5)
//====================================================
void ExportCurrentPositions() {
    string positions = "[";
    int count = 0;

    for(int i = 0; i < PositionsTotal(); i++) {
        ulong ticket = PositionGetTicket(i);

        if(ticket > 0) {
            if(count > 0) positions += ",";
            positions += FormatPosition(ticket);
            count++;
        }
    }

    positions += "]";

    if(count > 0) {
        SendToServer("/positions", positions);
    }
}

//====================================================
// FUNÇÃO: EXPORTAR HISTÓRICO DE TRADES (MT5)
//====================================================
void ExportHistoricalTrades() {
    string history = "[";
    int count = 0;
    int limit = 50;

    HistorySelect(0, TimeCurrent());
    int dealsTotal = HistoryDealsTotal();
    int start = MathMax(0, dealsTotal - limit);

    for(int i = start; i < dealsTotal; i++) {
        ulong ticket = HistoryDealGetTicket(i);

        if(ticket > 0) {
            if(count > 0) history += ",";
            history += FormatDeal(ticket);
            count++;
        }
    }

    history += "]";

    if(count > 0) {
        SendToServer("/history", history);
    }
}

//====================================================
// FORMATA POSIÇÃO EM JSON (MT5)
//====================================================
string FormatPosition(ulong ticket) {
    PositionSelectByTicket(ticket);

    string type_name;
    if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) {
        type_name = "BUY";
    } else {
        type_name = "SELL";
    }

    string json = "{";
    json += "\"ticket\":";
    json += IntegerToString((int)ticket) + ",";
    json += "\"type\":\"" + type_name + "\",";
    json += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
    json += "\"volume\":";
    json += DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
    json += "\"open_price\":";
    json += DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
    json += "\"current_price\":";
    json += DoubleToString(PositionGetDouble(POSITION_PRICE_CURRENT), 5) + ",";
    json += "\"profit\":";
    json += DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
    json += "\"open_time\":";
    json += IntegerToString((int)PositionGetInteger(POSITION_TIME));
    json += "}";

    return json;
}

//====================================================
// FORMATA DEAL EM JSON (MT5)
//====================================================
string FormatDeal(ulong ticket) {
    string type_name;
    ENUM_DEAL_TYPE deal_type = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);

    if(deal_type == DEAL_TYPE_BUY) {
        type_name = "BUY";
    } else if(deal_type == DEAL_TYPE_SELL) {
        type_name = "SELL";
    } else {
        type_name = "OTHER";
    }

    string json = "{";
    json += "\"ticket\":";
    json += IntegerToString((int)ticket) + ",";
    json += "\"type\":\"" + type_name + "\",";
    json += "\"symbol\":\"" + HistoryDealGetString(ticket, DEAL_SYMBOL) + "\",";
    json += "\"volume\":";
    json += DoubleToString(HistoryDealGetDouble(ticket, DEAL_VOLUME), 2) + ",";
    json += "\"price\":";
    json += DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
    json += "\"profit\":";
    json += DoubleToString(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) + ",";
    json += "\"time\":";
    json += IntegerToString((int)HistoryDealGetInteger(ticket, DEAL_TIME));
    json += "}";

    return json;
}

//====================================================
// FUNÇÃO: ENVIAR PARA SERVIDOR
//====================================================
void SendToServer(string endpoint, string jsonData) {
    char postData[];
    char resultData[];
    string resultHeaders;

    // StringToCharArray adiciona um terminador nulo, precisamos remover
    int len = StringToCharArray(jsonData, postData, 0, WHOLE_ARRAY) - 1;
    ArrayResize(postData, len);

    string url = MasterServer + endpoint;
    string headers = "Content-Type: application/json\r\n";
    headers += "X-Terminal-ID: " + TerminalID + "\r\n";

    int result = WebRequest(
        "POST",
        url,
        headers,
        3000,
        postData,
        resultData,
        resultHeaders
    );

    if(result == 200) {
        Print("✓ Enviado para: " + endpoint);
    } else {
        Print("✗ Erro ao enviar para " + endpoint + ": " + IntegerToString(result));
        if(ArraySize(resultData) > 0) {
            string response = CharArrayToString(resultData);
            Print("Resposta: " + response);
        }
    }
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    EventKillTimer();
    Print("\nEA MT5 Finalizado");
}

//====================================================
// FIM DO ARQUIVO
//====================================================
