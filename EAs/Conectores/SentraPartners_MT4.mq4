//+------------------------------------------------------------------+
//|                                         SentraPartners_MT4.mq4 |
//|                                  Sentra Partners Trading System |
//|                                      Sistema Multi-Usuário v3.0  |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.00"
#property strict

//====================================================
// PARÂMETROS DE ENTRADA
//====================================================
input string UserEmail = "";                            // ⚠️ SEU EMAIL CADASTRADO NO SISTEMA
input string AccountType = "STANDARD";                  // Tipo de Conta: CENT ou STANDARD
input string MasterServer = "https://sentrapartners.com/api/mt";
input int HeartbeatInterval = 10800;                    // Segundos entre heartbeats (padrão: 3h)
input int ProfitUpdateInterval = 7200;                  // Atualização de lucro (segundos) - Padrão: 2h
input string HistorySendTimes = "03:00,12:00,21:00";    // Horários para enviar histórico (HH:MM)
input int HistoryDays = 90;                             // Dias de histórico (0 = todo histórico)
input bool EnableLogs = true;                           // Habilitar logs detalhados

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
bool historySent = false;
datetime lastHeartbeat = 0;
datetime lastProfitUpdate = 0;
datetime lastHistorySend = 0;
int totalTradesSent = 0;
bool isConnected = false;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Conector MT4 v3.0");
    Print("Sistema Multi-Usuário");
    Print("===========================================");
    Print("User Email: ", UserEmail);
    Print("Tipo de Conta: ", AccountType);
    Print("Servidor: ", MasterServer);
    Print("Heartbeat: ", HeartbeatInterval/3600, "h (posições abertas)");
    Print("Profit Update: ", ProfitUpdateInterval/3600, "h");
    Print("Histórico: ", HistorySendTimes, " (", HistoryDays == 0 ? "Completo" : IntegerToString(HistoryDays) + " dias", ")");
    Print("===========================================");
    
    // Sistema de licenças desativado - apenas email é obrigatório
    
    // Validar email
    if(UserEmail == "") {
        Alert("ERRO: Configure seu email no parâmetro UserEmail!");
        Print("ERRO: Email não configurado. Configure o parâmetro UserEmail com seu email cadastrado.");
        return(INIT_FAILED);
    }
    
    // Validar tipo de conta
    if(AccountType != "CENT" && AccountType != "STANDARD") {
        Alert("ERRO: AccountType deve ser CENT ou STANDARD!");
        Print("ERRO: Tipo de conta inválido. Use CENT ou STANDARD.");
        return(INIT_FAILED);
    }
    
    // Validar URL
    if(StringFind(MasterServer, "http") != 0) {
        Alert("ERRO: URL da API inválida!");
        return(INIT_FAILED);
    }
    
    // Envia primeiro heartbeat
    SendHeartbeat();
    
    // Envia histórico na inicialização
    ExportHistoricalTrades();
    
    Print("✓ EA inicializado com sucesso!");
    
    return(INIT_SUCCEEDED);
}

//====================================================
// LOOP PRINCIPAL (MT4)
//====================================================
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

//====================================================
// FUNÇÃO: ENVIAR HEARTBEAT
//====================================================
void SendHeartbeat() {
    string data = "{";
    data += "\"user_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
    data += "\"broker\":\"" + AccountCompany() + "\",";
    data += "\"server\":\"" + AccountServer() + "\",";
    data += "\"account_name\":\"" + AccountName() + "\",";
    data += "\"balance\":" + DoubleToStr(AccountBalance(), 2) + ",";
    data += "\"equity\":" + DoubleToStr(AccountEquity(), 2) + ",";
    data += "\"currency\":\"" + AccountCurrency() + "\",";
    data += "\"leverage\":" + IntegerToString(AccountLeverage()) + ",";
    data += "\"margin_free\":" + DoubleToStr(AccountFreeMargin(), 2) + ",";
    data += "\"open_positions\":" + IntegerToString(OrdersTotal()) + ",";
    data += "\"platform\":\"MT4\",";
    data += "\"account_type\":\"" + AccountType + "\"";
    data += "}";
    
    bool success = SendToServer("/heartbeat", data);
    
    if(success) {
        isConnected = true;
        lastHeartbeat = TimeCurrent();
        if(EnableLogs) Print("✓ Heartbeat enviado com sucesso");
    } else {
        isConnected = false;
        Print("✗ Erro ao enviar heartbeat");
    }
}

//====================================================
// FUNÇÃO: EXPORTAR POSIÇÕES ABERTAS (FLUTUANTES)
//====================================================
void ExportOpenPositions() {
    int total = OrdersTotal();
    if(total == 0) {
        return;
    }

    if(EnableLogs) Print("Exportando ", total, " posições abertas...");

    // Criar objeto JSON principal
    string jsonData = "{";
    jsonData += "\"user_email\":\"" + UserEmail + "\",";
    jsonData += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
    jsonData += "\"positions\":[";
    
    int count = 0;
    for(int i = 0; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if(OrderType() == OP_BUY || OrderType() == OP_SELL) {
                if(count > 0) jsonData += ",";
                
                jsonData += "{";
                jsonData += "\"ticket\":\"" + IntegerToString(OrderTicket()) + "\",";
                jsonData += "\"symbol\":\"" + OrderSymbol() + "\",";
                jsonData += "\"type\":\"" + (OrderType() == OP_BUY ? "buy" : "sell") + "\",";
                jsonData += "\"volume\":" + DoubleToStr(OrderLots(), 2) + ",";
                jsonData += "\"open_price\":" + DoubleToStr(OrderOpenPrice(), 5) + ",";
                jsonData += "\"current_price\":" + DoubleToStr(OrderClosePrice(), 5) + ",";
                jsonData += "\"profit\":" + DoubleToStr(OrderProfit(), 2) + ",";
                jsonData += "\"swap\":" + DoubleToStr(OrderSwap(), 2) + ",";
                jsonData += "\"commission\":" + DoubleToStr(OrderCommission(), 2) + ",";
                jsonData += "\"open_time\":\"" + TimeToStr(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\"";
                jsonData += "}";
                
                count++;
            }
        }
    }
    
    jsonData += "]}";
    
    if(count > 0) {
        SendToServer("/positions", jsonData);
    }
}

//====================================================
// FUNÇÃO: EXPORTAR HISTÓRICO DE TRADES FECHADOS
//====================================================
void ExportHistoricalTrades() {
    datetime startDate;
    if(HistoryDays == 0) {
        startDate = 0;  // Todo histórico
    } else {
        startDate = TimeCurrent() - (HistoryDays * 86400);
    }

    int historyTotal = OrdersHistoryTotal();
    
    if(historyTotal == 0) {
        if(EnableLogs) Print("Nenhum trade no histórico");
        return;
    }
    
    if(EnableLogs) Print("Exportando ", historyTotal, " trades do histórico...");

    // Criar objeto JSON principal
    string jsonData = "{";
    jsonData += "\"user_email\":\"" + UserEmail + "\",";
    jsonData += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
    jsonData += "\"trades\":[";
    
    int count = 0;
    
    for(int i = 0; i < historyTotal; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            if(OrderType() == OP_BUY || OrderType() == OP_SELL) {
                // Filtrar por data se configurado
                if(HistoryDays > 0 && OrderCloseTime() < startDate) {
                    continue;
                }
                
                if(count > 0) jsonData += ",";
                
                jsonData += "{";
                jsonData += "\"ticket\":\"" + IntegerToString(OrderTicket()) + "\",";
                jsonData += "\"symbol\":\"" + OrderSymbol() + "\",";
                jsonData += "\"type\":\"" + (OrderType() == OP_BUY ? "buy" : "sell") + "\",";
                jsonData += "\"volume\":" + DoubleToStr(OrderLots(), 2) + ",";
                jsonData += "\"open_price\":" + DoubleToStr(OrderOpenPrice(), 5) + ",";
                jsonData += "\"close_price\":" + DoubleToStr(OrderClosePrice(), 5) + ",";
                jsonData += "\"open_time\":\"" + TimeToStr(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
                jsonData += "\"close_time\":\"" + TimeToStr(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\",";
                jsonData += "\"profit\":" + DoubleToStr(OrderProfit(), 2) + ",";
                jsonData += "\"commission\":" + DoubleToStr(OrderCommission(), 2) + ",";
                jsonData += "\"swap\":" + DoubleToStr(OrderSwap(), 2);
                jsonData += "}";
                
                count++;
                
                // Enviar em lotes de 100 para evitar timeout
                if(count >= 100) {
                    jsonData += "]}";
                    SendToServer("/trades", jsonData);
                    totalTradesSent += count;
                    
                    // Reiniciar para próximo lote
                    jsonData = "{";
                    jsonData += "\"user_email\":\"" + UserEmail + "\",";
                    jsonData += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
                    jsonData += "\"trades\":[";
                    count = 0;
                }
            }
        }
    }
    
    // Enviar último lote
    if(count > 0) {
        jsonData += "]}";
        SendToServer("/trades", jsonData);
        totalTradesSent += count;
    }
    
    historySent = true;
    Print("✓ ", totalTradesSent, " trades sincronizados com sucesso");
}

//====================================================
// FUNÇÃO: ENVIAR PARA SERVIDOR
//====================================================
bool SendToServer(string endpoint, string jsonData) {
    string url = MasterServer + endpoint;
    string headers = "Content-Type: application/json\r\n";
    
    char post[], result[];
    ArrayResize(post, StringToCharArray(jsonData, post, 0, WHOLE_ARRAY) - 1);
    
    int timeout = 10000;
    int res = WebRequest("POST", url, headers, timeout, post, result, headers);
    
    if(res == -1) {
        int error = GetLastError();
        Print("✗ Erro ao enviar para ", endpoint, ": ", error);
        if(error == 4060) {
            Print("ERRO: Adicione a URL na lista de URLs permitidas!");
            Print("Ferramentas > Opções > Expert Advisors > Permitir WebRequest");
        }
        return false;
    } else if(res == 200) {
        if(EnableLogs) Print("✓ Enviado para ", endpoint, " (Status: ", res, ")");
        return true;
    } else {
        Print("✗ Erro HTTP ", res, " ao enviar para ", endpoint);
        return false;
    }
}

//====================================================
// FUNÇÃO: VERIFICAR SE DEVE ENVIAR HISTÓRICO
//====================================================
bool ShouldSendHistory() {
    datetime currentTime = TimeCurrent();
    
    // Não enviar se já enviou nos últimos 30 minutos
    if(currentTime - lastHistorySend < 1800) {
        return false;
    }
    
    // Extrair hora e minuto atual
    int currentHour = TimeHour(currentTime);
    int currentMinute = TimeMinute(currentTime);
    string currentTimeStr = StringFormat("%02d:%02d", currentHour, currentMinute);
    
    // Verificar se está em algum dos horários configurados
    string times[];
    int numTimes = StringSplit(HistorySendTimes, ',', times);
    
    for(int i = 0; i < numTimes; i++) {
        string targetTime = times[i];
        StringTrimLeft(targetTime);
        StringTrimRight(targetTime);
        
        // Comparar apenas hora:minuto (permite envio durante 1 minuto)
        if(StringFind(currentTimeStr, targetTime) == 0) {
            if(EnableLogs) Print("⏰ Horário de envio de histórico: ", targetTime);
            return true;
        }
    }
    
    return false;
}

//====================================================
// FUNÇÃO: ENVIAR ATUALIZAÇÃO DE LUCRO
//====================================================
void SendProfitUpdate() {
    string data = "{";
    data += "\"user_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
    data += "\"balance\":" + DoubleToStr(AccountBalance(), 2) + ",";
    data += "\"equity\":" + DoubleToStr(AccountEquity(), 2) + ",";
    data += "\"profit\":" + DoubleToStr(AccountProfit(), 2) + ",";
    data += "\"margin_free\":" + DoubleToStr(AccountFreeMargin(), 2);
    data += "}";
    
    if(SendToServer("/profit", data)) {
        if(EnableLogs) Print("✅ Atualização de lucro enviada");
    }
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    Print("===========================================");
    Print("EA finalizado. Motivo: ", reason);
    Print("Total de trades enviados: ", totalTradesSent);
    Print("===========================================");
}
//+------------------------------------------------------------------+
