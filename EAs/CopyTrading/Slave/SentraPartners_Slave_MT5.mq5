//+------------------------------------------------------------------+
//|                                      SentraPartners_Slave_MT5.mq5 |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "4.00"

//====================================================
// SISTEMA DE LICENCIAMENTO
//====================================================
#define LICENSE_EXPIRY_DATE D'2025.12.31'
#define ALLOWED_ACCOUNTS ""

//====================================================
// PARÂMETROS
//====================================================
input string UserEmail = "";                    // Email da conta Slave
input string MasterEmail = "";                  // Email da conta Master
input string MasterAccountNumber = "";          // Número da conta Master
input string SlaveServer = "https://sentrapartners.com/api/mt/copy";
input int CheckInterval = 1;                    // Intervalo de verificação (segundos)
input int HeartbeatInterval = 30;               // Intervalo de heartbeat (segundos)
input double LotMultiplier = 1.0;               // Multiplicador de lote
input int Slippage = 3;                         // Slippage
input int MagicNumber = 888888;                 // Magic Number
input bool EnableLogs = true;                   // Logs

//====================================================
// ESTRUTURAS
//====================================================
struct MasterPosition {
    string ticket;
    string symbol;
    int type;
    double lots;
    double open_price;
    double stop_loss;
    double take_profit;
    datetime open_time;
};

struct SlavePosition {
    ulong ticket;
    string master_ticket;
    string symbol;
};

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastCheckTime = 0;
datetime lastHeartbeatTime = 0;
datetime lastMasterHeartbeat = 0;
SlavePosition slavePositions[];
int slavePositionsCount = 0;
MasterPosition masterPositions[];
int masterPositionsCount = 0;

#include <Trade\Trade.mqh>
CTrade trade;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Slave MT5 v4.0");
    Print("===========================================");
    Print("Slave Email: ", UserEmail);
    Print("Master Email: ", MasterEmail);
    Print("Master Account: ", MasterAccountNumber);
    Print("Servidor: ", SlaveServer);
    Print("Check Interval: ", CheckInterval, "s");
    Print("Heartbeat Interval: ", HeartbeatInterval, "s");
    Print("Lot Multiplier: ", LotMultiplier);
    Print("===========================================");
    
    if(!ValidateLicense()) {
        Alert("❌ LICENÇA INVÁLIDA!");
        return(INIT_FAILED);
    }
    
    if(UserEmail == "" || MasterEmail == "") {
        Alert("❌ Configure UserEmail e MasterEmail!");
        return(INIT_FAILED);
    }
    
    trade.SetDeviationInPoints(Slippage);
    trade.SetExpertMagicNumber(MagicNumber);
    
    EventSetTimer(1);  // Timer de 1 segundo
    
    Print("✅ Slave EA inicializado!");
    Print("Aguardando sinais do Master...");
    return(INIT_SUCCEEDED);
}

//====================================================
// TIMER
//====================================================
void OnTimer() {
    datetime now = TimeCurrent();
    
    // Verificar sinais do Master
    if(now - lastCheckTime >= CheckInterval) {
        CheckMasterSignals();
        lastCheckTime = now;
    }
    
    // Enviar heartbeat do Slave
    if(now - lastHeartbeatTime >= HeartbeatInterval) {
        SendSlaveHeartbeat();
        lastHeartbeatTime = now;
    }
    
    // Verificar se Master está vivo
    if(lastMasterHeartbeat > 0 && now - lastMasterHeartbeat > 60) {
        if(EnableLogs) Print("⚠️ Master sem heartbeat há ", (now - lastMasterHeartbeat), "s");
    }
}

//====================================================
// VERIFICAR SINAIS DO MASTER
//====================================================
void CheckMasterSignals() {
    string url = SlaveServer + "/slave-signals?master_email=" + MasterEmail;
    if(MasterAccountNumber != "") {
        url += "&account_number=" + MasterAccountNumber;
    }
    
    char post[];
    char result[];
    string headers = "Content-Type: application/json\r\n";
    string resultHeaders;
    
    int res = WebRequest(
        "GET",
        url,
        headers,
        5000,
        post,
        result,
        resultHeaders
    );
    
    if(res == -1) {
        if(EnableLogs) Print("❌ Erro WebRequest: ", GetLastError());
        return;
    }
    
    if(res != 200) {
        if(EnableLogs) Print("❌ HTTP Error: ", res);
        return;
    }
    
    string response = CharArrayToString(result);
    
    if(StringFind(response, "\"success\":true") < 0) {
        return;
    }
    
    // Atualizar timestamp do último heartbeat do Master
    lastMasterHeartbeat = TimeCurrent();
    
    // Processar resposta
    ProcessMasterSignals(response);
}

//====================================================
// PROCESSAR SINAIS DO MASTER
//====================================================
void ProcessMasterSignals(string json) {
    // Extrair action
    string action = ExtractValue(json, "action");
    
    if(action == "open") {
        ProcessOpenEvent(json);
    }
    else if(action == "close") {
        ProcessCloseEvent(json);
    }
    else if(action == "modify") {
        ProcessModifyEvent(json);
    }
    else if(action == "heartbeat") {
        ProcessHeartbeat(json);
    }
    else {
        // Formato antigo (compatibilidade)
        ProcessLegacyFormat(json);
    }
}

//====================================================
// PROCESSAR EVENTO DE ABERTURA
//====================================================
void ProcessOpenEvent(string json) {
    string masterTicket = ExtractValue(json, "ticket");
    string symbol = ExtractValue(json, "symbol");
    int type = (int)StringToInteger(ExtractValue(json, "type"));
    double lots = StringToDouble(ExtractValue(json, "lots"));
    double openPrice = StringToDouble(ExtractValue(json, "open_price"));
    double sl = StringToDouble(ExtractValue(json, "stop_loss"));
    double tp = StringToDouble(ExtractValue(json, "take_profit"));
    
    // Verificar se já copiou
    if(FindSlavePosition(masterTicket) >= 0) {
        if(EnableLogs) Print("⚠️ Trade já copiado: ", masterTicket);
        return;
    }
    
    // Ajustar lote
    lots = lots * LotMultiplier;
    lots = NormalizeLot(symbol, lots);
    
    // Abrir ordem
    bool success = false;
    ulong slaveTicket = 0;
    
    if(type == 0) {  // BUY
        success = trade.Buy(lots, symbol, 0, sl, tp, "Copy:" + masterTicket);
        slaveTicket = trade.ResultOrder();
    } else {  // SELL
        success = trade.Sell(lots, symbol, 0, sl, tp, "Copy:" + masterTicket);
        slaveTicket = trade.ResultOrder();
    }
    
    if(success) {
        AddSlavePosition(slaveTicket, masterTicket, symbol);
        Print("✅ OPEN copiado: ", symbol, " ", (type == 0 ? "BUY" : "SELL"), " ", lots, " lotes (Master: ", masterTicket, " → Slave: ", slaveTicket, ")");
    } else {
        Print("❌ Erro ao copiar OPEN: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
    }
}

//====================================================
// PROCESSAR EVENTO DE FECHAMENTO
//====================================================
void ProcessCloseEvent(string json) {
    string masterTicket = ExtractValue(json, "ticket");
    
    int index = FindSlavePosition(masterTicket);
    if(index < 0) {
        if(EnableLogs) Print("⚠️ Trade não encontrado para fechar: ", masterTicket);
        return;
    }
    
    ulong slaveTicket = slavePositions[index].ticket;
    
    // Fechar posição
    if(PositionSelectByTicket(slaveTicket)) {
        bool success = trade.PositionClose(slaveTicket);
        
        if(success) {
            Print("✅ CLOSE executado: Slave ticket ", slaveTicket, " (Master: ", masterTicket, ")");
            RemoveSlavePosition(index);
        } else {
            Print("❌ Erro ao fechar: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
        }
    } else {
        // Posição já não existe, remover do registro
        RemoveSlavePosition(index);
    }
}

//====================================================
// PROCESSAR EVENTO DE MODIFICAÇÃO
//====================================================
void ProcessModifyEvent(string json) {
    string masterTicket = ExtractValue(json, "ticket");
    double sl = StringToDouble(ExtractValue(json, "stop_loss"));
    double tp = StringToDouble(ExtractValue(json, "take_profit"));
    
    int index = FindSlavePosition(masterTicket);
    if(index < 0) {
        if(EnableLogs) Print("⚠️ Trade não encontrado para modificar: ", masterTicket);
        return;
    }
    
    ulong slaveTicket = slavePositions[index].ticket;
    
    if(PositionSelectByTicket(slaveTicket)) {
        bool success = trade.PositionModify(slaveTicket, sl, tp);
        
        if(success) {
            Print("✅ MODIFY executado: Slave ticket ", slaveTicket, " SL:", sl, " TP:", tp);
        } else {
            Print("❌ Erro ao modificar: ", trade.ResultRetcode());
        }
    }
}

//====================================================
// PROCESSAR HEARTBEAT (SINCRONIZAÇÃO)
//====================================================
void ProcessHeartbeat(string json) {
    if(EnableLogs) Print("💓 Heartbeat recebido do Master");
    
    // Extrair array de posições
    int posStart = StringFind(json, "\"positions\":[");
    if(posStart < 0) {
        // Master não tem posições abertas, fechar todas do Slave
        CloseAllSlavePositions();
        return;
    }
    
    int posEnd = StringFind(json, "]", posStart);
    string positionsStr = StringSubstr(json, posStart + 13, posEnd - posStart - 13);
    
    if(positionsStr == "" || positionsStr == " ") {
        // Master não tem posições, fechar todas
        CloseAllSlavePositions();
        return;
    }
    
    // Parse posições do Master
    ParseMasterPositions(positionsStr);
    
    // Sincronizar: fechar posições que não existem mais no Master
    SyncPositions();
}

//====================================================
// PARSE POSIÇÕES DO MASTER
//====================================================
void ParseMasterPositions(string positionsStr) {
    masterPositionsCount = 0;
    ArrayResize(masterPositions, 0);
    
    string items[];
    int count = SplitString(positionsStr, "},{", items);
    
    for(int i = 0; i < count; i++) {
        string item = items[i];
        StringReplace(item, "{", "");
        StringReplace(item, "}", "");
        
        ArrayResize(masterPositions, masterPositionsCount + 1);
        
        masterPositions[masterPositionsCount].ticket = ExtractValue(item, "ticket");
        masterPositions[masterPositionsCount].symbol = ExtractValue(item, "symbol");
        masterPositions[masterPositionsCount].type = (int)StringToInteger(ExtractValue(item, "type"));
        masterPositions[masterPositionsCount].lots = StringToDouble(ExtractValue(item, "lots"));
        masterPositions[masterPositionsCount].stop_loss = StringToDouble(ExtractValue(item, "stop_loss"));
        masterPositions[masterPositionsCount].take_profit = StringToDouble(ExtractValue(item, "take_profit"));
        
        masterPositionsCount++;
    }
    
    if(EnableLogs) Print("📊 Master tem ", masterPositionsCount, " posições");
}

//====================================================
// SINCRONIZAR POSIÇÕES
//====================================================
void SyncPositions() {
    // Fechar posições do Slave que não existem mais no Master
    for(int i = slavePositionsCount - 1; i >= 0; i--) {
        bool found = false;
        
        for(int j = 0; j < masterPositionsCount; j++) {
            if(slavePositions[i].master_ticket == masterPositions[j].ticket) {
                found = true;
                break;
            }
        }
        
        if(!found) {
            // Posição não existe mais no Master, fechar
            ulong slaveTicket = slavePositions[i].ticket;
            
            if(PositionSelectByTicket(slaveTicket)) {
                trade.PositionClose(slaveTicket);
                Print("🔄 Sincronização: Fechando posição órfã ", slaveTicket);
            }
            
            RemoveSlavePosition(i);
        }
    }
}

//====================================================
// ENVIAR HEARTBEAT DO SLAVE
//====================================================
void SendSlaveHeartbeat() {
    string data = "{";
    data += "\"slave_email\":\"" + UserEmail + "\",";
    data += "\"master_email\":\"" + MasterEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
    data += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"positions_count\":" + IntegerToString(slavePositionsCount) + ",";
    data += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
    data += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2);
    data += "}";
    
    string url = SlaveServer + "/slave-heartbeat";
    string headers = "Content-Type: application/json\r\n";
    
    char post[], result[];
    ArrayResize(post, StringToCharArray(data, post, 0, WHOLE_ARRAY, CP_UTF8) - 1);
    
    string resultHeaders;
    int res = WebRequest("POST", url, headers, 5000, post, result, resultHeaders);
    
    if(res == 200) {
        if(EnableLogs) Print("💓 Slave heartbeat enviado");
    }
}

//====================================================
// PROCESSAR FORMATO LEGADO (COMPATIBILIDADE)
//====================================================
void ProcessLegacyFormat(string json) {
    int posStart = StringFind(json, "\"positions\":[");
    if(posStart < 0) return;
    
    int posEnd = StringFind(json, "]", posStart);
    string positions = StringSubstr(json, posStart + 13, posEnd - posStart - 13);
    
    if(positions == "") return;
    
    string items[];
    int count = SplitString(positions, "},{", items);
    
    for(int i = 0; i < count; i++) {
        string item = items[i];
        StringReplace(item, "{", "");
        StringReplace(item, "}", "");
        
        ProcessOpenEvent(item);
    }
}

//====================================================
// FUNÇÕES AUXILIARES - POSIÇÕES
//====================================================
int FindSlavePosition(string masterTicket) {
    for(int i = 0; i < slavePositionsCount; i++) {
        if(slavePositions[i].master_ticket == masterTicket) {
            return i;
        }
    }
    return -1;
}

void AddSlavePosition(ulong ticket, string masterTicket, string symbol) {
    ArrayResize(slavePositions, slavePositionsCount + 1);
    slavePositions[slavePositionsCount].ticket = ticket;
    slavePositions[slavePositionsCount].master_ticket = masterTicket;
    slavePositions[slavePositionsCount].symbol = symbol;
    slavePositionsCount++;
}

void RemoveSlavePosition(int index) {
    for(int i = index; i < slavePositionsCount - 1; i++) {
        slavePositions[i] = slavePositions[i + 1];
    }
    slavePositionsCount--;
    ArrayResize(slavePositions, slavePositionsCount);
}

void CloseAllSlavePositions() {
    for(int i = slavePositionsCount - 1; i >= 0; i--) {
        ulong ticket = slavePositions[i].ticket;
        
        if(PositionSelectByTicket(ticket)) {
            trade.PositionClose(ticket);
            Print("🔄 Fechando posição (Master sem posições): ", ticket);
        }
        
        RemoveSlavePosition(i);
    }
}

//====================================================
// FUNÇÕES AUXILIARES - LOTE
//====================================================
double NormalizeLot(string symbol, double lots) {
    double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
    double stepLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
    
    if(lots < minLot) lots = minLot;
    if(lots > maxLot) lots = maxLot;
    
    lots = MathFloor(lots / stepLot) * stepLot;
    lots = NormalizeDouble(lots, 2);
    
    return lots;
}

//====================================================
// FUNÇÕES AUXILIARES - STRING
//====================================================
string ExtractValue(string json, string key) {
    int start = StringFind(json, "\"" + key + "\":");
    if(start < 0) return "";
    
    start = StringFind(json, ":", start) + 1;
    
    // Pular espaços e aspas
    while(start < StringLen(json) && (StringGetChar(json, start) == ' ' || StringGetChar(json, start) == '\"')) start++;
    
    int end = start;
    bool inQuotes = false;
    
    while(end < StringLen(json)) {
        ushort ch = StringGetChar(json, end);
        if(ch == '\"') inQuotes = !inQuotes;
        if(!inQuotes && (ch == ',' || ch == '}')) break;
        end++;
    }
    
    string value = StringSubstr(json, start, end - start);
    StringReplace(value, "\"", "");
    StringTrimLeft(value);
    StringTrimRight(value);
    return value;
}

int SplitString(string str, string sep, string &result[]) {
    int count = 0;
    int pos = 0;
    int nextPos;
    
    while((nextPos = StringFind(str, sep, pos)) >= 0) {
        ArrayResize(result, count + 1);
        result[count] = StringSubstr(str, pos, nextPos - pos);
        count++;
        pos = nextPos + StringLen(sep);
    }
    
    if(pos < StringLen(str)) {
        ArrayResize(result, count + 1);
        result[count] = StringSubstr(str, pos);
        count++;
    }
    
    return count;
}

//====================================================
// VALIDAÇÃO DE LICENÇA
//====================================================
bool ValidateLicense() {
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em ", TimeToString(LICENSE_EXPIRY_DATE));
        return false;
    }
    
    string allowedAccounts = ALLOWED_ACCOUNTS;
    if(allowedAccounts != "") {
        string currentAccount = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
        if(StringFind(allowedAccounts, currentAccount) < 0) {
            Print("❌ Conta ", currentAccount, " não autorizada");
            return false;
        }
    }
    
    Print("✅ Licença válida até: ", TimeToString(LICENSE_EXPIRY_DATE));
    return true;
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    EventKillTimer();
    Print("Slave EA finalizado. Posições copiadas: ", slavePositionsCount);
}
//+------------------------------------------------------------------+
