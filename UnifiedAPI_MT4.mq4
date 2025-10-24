//====================================================
// UNIFIED API - MetaTrader 4
// Arquivo: UnifiedAPI_MT4.mq4
// Compilar em: MT4 MetaEditor
//====================================================

#property strict
#property description "API Unificada MT4 - Envia dados para servidor Python centralizado"

// ===== CONFIGURAÇÃO =====
input string MasterServer = "https://sentrapartners.com/api/mt";  // URL do servidor Sentra Partners
input string TerminalID = "MT4_CONTA_01";             // Identifica este terminal
input int HeartbeatInterval = 60;                     // Envia heartbeat a cada 60 segundos

// ===== VARIÁVEIS GLOBAIS =====
int lastHeartbeat = 0;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("\n===== API UNIFICADA - MT4 INICIADA =====");
    Print("Terminal ID: " + TerminalID);
    Print("Servidor: " + MasterServer);
    Print("Intervalo Heartbeat: " + IntegerToString(HeartbeatInterval) + " segundos");
    Print("========================================\n");

    // Envia primeira posição
    SendHeartbeat();
    ExportHistoricalTrades();

    return INIT_SUCCEEDED;
}

//====================================================
// LOOP PRINCIPAL (MT4)
//====================================================
void OnTick() {
    // Envia heartbeat periodicamente
    if (TimeCurrent() - lastHeartbeat >= HeartbeatInterval) {
        SendHeartbeat();
        lastHeartbeat = TimeCurrent();
    }

    // Em MT4, verificamos mudanças manualmente
    CheckPositionChanges();
}

//====================================================
// VERIFICA MUDANÇAS DE POSIÇÕES (MT4)
//====================================================
void CheckPositionChanges() {
    static int lastOrderCount = -1;
    int currentOrderCount = OrdersTotal();

    if (currentOrderCount != lastOrderCount) {
        ExportCurrentPositions();
        lastOrderCount = currentOrderCount;
    }
}

//====================================================
// FUNÇÃO: ENVIAR HEARTBEAT
//====================================================
void SendHeartbeat() {
    string data = "{";
    data += "\"terminal_id\":\"" + TerminalID + "\",";
    data += "\"account\":";
    data += IntegerToString(AccountNumber()) + ",";
    data += "\"broker\":\"" + AccountCompany() + "\",";
    data += "\"balance\":";
    data += DoubleToString(AccountBalance(), 2) + ",";
    data += "\"equity\":";
    data += DoubleToString(AccountEquity(), 2) + ",";
    data += "\"margin_free\":";
    data += DoubleToString(AccountFreeMargin(), 2) + ",";
    data += "\"open_positions\":";
    data += IntegerToString(CountOpenPositions()) + ",";
    data += "\"timestamp\":";
    data += IntegerToString(TimeCurrent());
    data += "}";

    SendToServer("/heartbeat", data);
}

//====================================================
// FUNÇÃO: EXPORTAR POSIÇÕES ABERTAS (MT4)
//====================================================
void ExportCurrentPositions() {
    string positions = "[";
    int count = 0;

    for (int i = 0; i < OrdersTotal(); i++) {
        if (OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if (count > 0) positions += ",";
            positions += FormatOrder();
            count++;
        }
    }

    positions += "]";

    if (count > 0) {
        SendToServer("/positions", positions);
    }
}

//====================================================
// FUNÇÃO: EXPORTAR HISTÓRICO DE TRADES (MT4)
//====================================================
void ExportHistoricalTrades() {
    string history = "[";
    int count = 0;
    int limit = 50;  // Últimos 50 trades
    int start = MathMax(0, OrdersHistoryTotal() - limit);

    for (int i = start; i < OrdersHistoryTotal(); i++) {
        if (OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            if (count > 0) history += ",";
            history += FormatOrder();
            count++;
        }
    }

    history += "]";

    if (count > 0) {
        SendToServer("/history", history);
    }
}

//====================================================
// FUNÇÃO: FORMATAR ORDEM EM JSON
//====================================================
string FormatOrder() {
    string type_name;

    if (OrderType() == OP_BUY) {
        type_name = "BUY";
    } else if (OrderType() == OP_SELL) {
        type_name = "SELL";
    } else {
        type_name = "PENDING";
    }

    string json = "{";
    json += "\"ticket\":";
    json += IntegerToString(OrderTicket()) + ",";
    json += "\"type\":\"" + type_name + "\",";
    json += "\"symbol\":\"" + OrderSymbol() + "\",";
    json += "\"volume\":";
    json += DoubleToString(OrderLots(), 2) + ",";
    json += "\"open_price\":";
    json += DoubleToString(OrderOpenPrice(), 5) + ",";
    json += "\"close_price\":";
    json += DoubleToString(OrderClosePrice(), 5) + ",";
    json += "\"profit\":";
    json += DoubleToString(OrderProfit(), 2) + ",";
    json += "\"open_time\":";
    json += IntegerToString(OrderOpenTime()) + ",";
    json += "\"close_time\":";
    json += IntegerToString(OrderCloseTime());
    json += "}";

    return json;
}

//====================================================
// FUNÇÃO: CONTAR POSIÇÕES ABERTAS
//====================================================
int CountOpenPositions() {
    int count = 0;

    for (int i = 0; i < OrdersTotal(); i++) {
        if (OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            count++;
        }
    }

    return count;
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
        3000,  // timeout 3 segundos
        postData,
        resultData,
        resultHeaders
    );

    if (result == 200) {
        Print("✓ Enviado para: " + endpoint);
    } else {
        Print("✗ Erro ao enviar para " + endpoint + ": " + IntegerToString(result));
        if (ArraySize(resultData) > 0) {
            string response = CharArrayToString(resultData);
            Print("Resposta: " + response);
        }
    }
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    Print("\nEA MT4 Finalizado");
}

//====================================================
// FIM DO ARQUIVO
//====================================================
