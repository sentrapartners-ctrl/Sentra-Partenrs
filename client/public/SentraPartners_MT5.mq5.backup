//+------------------------------------------------------------------+
//|                                         SentraPartners_MT5.mq5 |
//|                                  Sentra Partners Trading System |
//|                                      Sistema Multi-Usuário v3.0  |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.00"
#property strict

//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
#define LICENSE_EXPIRY_DATE D'2025.12.31 23:59:59'  // Data de expiração da licença

//====================================================
// PARÂMETROS DE ENTRADA
//====================================================
input string LicenseKey = "";                           // 🔑 CHAVE DE LICENÇA
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
int profitTimer = 0;
int historyTimer = 0;
bool licenseValid = false;
datetime lastLicenseCheck = 0;
int licenseCheckInterval = 3600; // Verificar licença a cada 1 hora

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Conector MT5 v3.0");
    Print("Sistema Multi-Usuário");
    Print("===========================================");
    Print("User Email: ", UserEmail);
    Print("Tipo de Conta: ", AccountType);
    Print("Servidor: ", MasterServer);
    Print("Heartbeat: ", HeartbeatInterval/3600, "h (posições abertas)");
    Print("Profit Update: ", ProfitUpdateInterval/3600, "h");
    Print("Histórico: ", HistorySendTimes, " (", HistoryDays == 0 ? "Completo" : IntegerToString(HistoryDays) + " dias", ")");
    Print("===========================================");
    
    // Validar licença
    if(!ValidateLicense()) {
        Alert("❌ LICENÇA INVÁLIDA OU EXPIRADA!");
        Print("❌ EA bloqueado: Licença inválida ou expirada.");
        Print("Entre em contato com suporte: https://sentrapartners.com");
        return(INIT_FAILED);
    }
    Print("✅ Licença válida!");
    
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
    
    // Verificar licença antes de enviar dados
    if(licenseValid) {
        // Envia primeiro heartbeat
        SendHeartbeat();
        
        // Envia histórico na inicialização
        ExportHistoricalTrades();
        
        Print("✓ EA inicializado com sucesso!");
    }
    
    // Configura timer para heartbeat
    EventSetTimer(HeartbeatInterval);
    
    return(INIT_SUCCEEDED);
}

//====================================================
// TIMER - EXECUTADO A CADA INTERVALO
//====================================================
void OnTimer() {
    datetime currentTime = TimeCurrent();
    
    // Verificar licença periodicamente
    if(currentTime - lastLicenseCheck >= licenseCheckInterval) {
        if(!ValidateLicense()) {
            Alert("❌ LICENÇA EXPIRADA! EA será desativado.");
            EventKillTimer();
            ExpertRemove();
            return;
        }
        lastLicenseCheck = currentTime;
    }
    
    // Bloquear operações se licença inválida
    if(!licenseValid) {
        return;
    }
    
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

//====================================================
// EVENTO DE TRADE
//====================================================
void OnTrade() {
    // Quando houver novo trade, sincroniza imediatamente
    ExportOpenPositions();
    ExportHistoricalTrades();
}

//====================================================
// FUNÇÃO: ENVIAR HEARTBEAT
//====================================================
void SendHeartbeat() {
    string data = "{";
    data += "\"user_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    data += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
    data += "\"account_name\":\"" + AccountInfoString(ACCOUNT_NAME) + "\",";
    data += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    data += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
    data += "\"currency\":\"" + AccountInfoString(ACCOUNT_CURRENCY) + "\",";
    data += "\"leverage\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE)) + ",";
    data += "\"margin_free\":" + DoubleToString(AccountInfoDouble(ACCOUNT_FREEMARGIN), 2) + ",";
    data += "\"open_positions\":" + IntegerToString(PositionsTotal()) + ",";
    data += "\"platform\":\"MT5\",";
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
    int total = PositionsTotal();
    if(total == 0) {
        return;
    }

    if(EnableLogs) Print("Exportando ", total, " posições abertas...");

    // Criar objeto JSON principal
    string jsonData = "{";
    jsonData += "\"user_email\":\"" + UserEmail + "\",";
    jsonData += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    jsonData += "\"positions\":[";
    
    int count = 0;
    for(int i = 0; i < total; i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0) {
            string symbol = PositionGetString(POSITION_SYMBOL);
            long posType = PositionGetInteger(POSITION_TYPE);
            double volume = PositionGetDouble(POSITION_VOLUME);
            double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
            double profit = PositionGetDouble(POSITION_PROFIT);
            double swap = PositionGetDouble(POSITION_SWAP);
            double commission = PositionGetDouble(POSITION_COMMISSION);
            datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
            
            if(count > 0) jsonData += ",";
            
            jsonData += "{";
            jsonData += "\"ticket\":\"" + IntegerToString(ticket) + "\",";
            jsonData += "\"symbol\":\"" + symbol + "\",";
            jsonData += "\"type\":\"" + (posType == POSITION_TYPE_BUY ? "buy" : "sell") + "\",";
            jsonData += "\"volume\":" + DoubleToString(volume, 2) + ",";
            jsonData += "\"open_price\":" + DoubleToString(openPrice, 5) + ",";
            jsonData += "\"current_price\":" + DoubleToString(currentPrice, 5) + ",";
            jsonData += "\"profit\":" + DoubleToString(profit, 2) + ",";
            jsonData += "\"swap\":" + DoubleToString(swap, 2) + ",";
            jsonData += "\"commission\":" + DoubleToString(commission, 2) + ",";
            jsonData += "\"open_time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\"";
            jsonData += "}";
            
            count++;
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

    if(!HistorySelect(startDate, TimeCurrent())) {
        Print("✗ Erro ao selecionar histórico");
        return;
    }

    int dealsTotal = HistoryDealsTotal();
    
    if(dealsTotal == 0) {
        if(EnableLogs) Print("Nenhum trade no histórico");
        return;
    }
    
    if(EnableLogs) Print("Exportando ", dealsTotal, " deals do histórico...");

    // Criar objeto JSON principal
    string jsonData = "{";
    jsonData += "\"user_email\":\"" + UserEmail + "\",";
    jsonData += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    jsonData += "\"trades\":[";
    
    int count = 0;
    
    for(int i = 0; i < dealsTotal; i++) {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket > 0) {
            long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
            long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
            
            // Apenas deals de entrada ou saída (não swaps, comissões, etc)
            if((dealType == DEAL_TYPE_BUY || dealType == DEAL_TYPE_SELL) && 
               (dealEntry == DEAL_ENTRY_IN || dealEntry == DEAL_ENTRY_OUT)) {
                
                string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
                double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
                double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
                double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
                double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
                double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
                datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
                long positionId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);

                if(count > 0) jsonData += ",";
                
                jsonData += "{";
                jsonData += "\"ticket\":\"" + IntegerToString(positionId) + "\",";
                jsonData += "\"symbol\":\"" + symbol + "\",";
                jsonData += "\"type\":\"" + (dealType == DEAL_TYPE_BUY ? "buy" : "sell") + "\",";
                jsonData += "\"volume\":" + DoubleToString(volume, 2) + ",";
                jsonData += "\"open_price\":" + DoubleToString(price, 5) + ",";
                jsonData += "\"close_price\":" + DoubleToString(price, 5) + ",";
                jsonData += "\"open_time\":\"" + TimeToString(dealTime, TIME_DATE|TIME_SECONDS) + "\",";
                jsonData += "\"close_time\":\"" + TimeToString(dealTime, TIME_DATE|TIME_SECONDS) + "\",";
                jsonData += "\"profit\":" + DoubleToString(profit, 2) + ",";
                jsonData += "\"commission\":" + DoubleToString(commission, 2) + ",";
                jsonData += "\"swap\":" + DoubleToString(swap, 2);
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
                    jsonData += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
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
    
    MqlDateTime dt;
    TimeToStruct(currentTime, dt);
    string currentTimeStr = StringFormat("%02d:%02d", dt.hour, dt.min);
    
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
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    data += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
    data += "\"profit\":" + DoubleToString(AccountInfoDouble(ACCOUNT_PROFIT), 2) + ",";
    data += "\"margin_free\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2);
    data += "}";
    
    if(SendToServer("/profit", data)) {
        if(EnableLogs) Print("✅ Atualização de lucro enviada");
    }
}

//====================================================
// FUNÇÃO: VALIDAR LICENÇA
//====================================================
bool ValidateLicense() {
    // 1. Verificar data de expiração do arquivo
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em: ", TimeToString(LICENSE_EXPIRY_DATE, TIME_DATE));
        Print("Data atual: ", TimeToString(TimeCurrent(), TIME_DATE));
        licenseValid = false;
        return false;
    }
    
    // 2. Validar chave de licença no servidor
    if(LicenseKey == "") {
        Print("❌ Chave de licença não configurada!");
        licenseValid = false;
        return false;
    }
    
    string data = "{";
    data += "\"license_key\":\"" + LicenseKey + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    data += "\"user_email\":\"" + UserEmail + "\"";
    data += "}";
    
    string url = MasterServer + "/validate-license";
    string headers = "Content-Type: application/json\r\n";
    
    char post[], result[];
    ArrayResize(post, StringToCharArray(data, post, 0, WHOLE_ARRAY) - 1);
    
    int timeout = 10000;
    int res = WebRequest("POST", url, headers, timeout, post, result, headers);
    
    if(res == 200) {
        string response = CharArrayToString(result);
        
        // Verificar resposta JSON
        if(StringFind(response, "\"valid\":true") >= 0) {
            if(EnableLogs) Print("✅ Licença validada com sucesso");
            licenseValid = true;
            return true;
        } else {
            Print("❌ Conta não autorizada para esta licença");
            Print("Número da conta: ", AccountInfoInteger(ACCOUNT_LOGIN));
            licenseValid = false;
            return false;
        }
    } else {
        // Se não conseguir validar online, permitir por 24h se já foi validado antes
        if(licenseValid && (TimeCurrent() - lastLicenseCheck < 86400)) {
            Print("⚠️ Erro ao validar licença online, usando cache (24h)");
            return true;
        }
        
        Print("❌ Erro ao validar licença: ", res);
        licenseValid = false;
        return false;
    }
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    EventKillTimer();
    Print("===========================================");
    Print("EA finalizado. Motivo: ", reason);
    Print("Total de trades enviados: ", totalTradesSent);
    Print("===========================================");
}
//+------------------------------------------------------------------+
