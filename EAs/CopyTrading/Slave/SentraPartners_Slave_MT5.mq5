//+------------------------------------------------------------------+
//|                                      SentraPartners_Slave_MT5.mq5 |
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.10"

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
input string SlaveServer = "https://sentrapartners.com/api/mt/copy";
input int CheckInterval = 5;                    // Intervalo de verificação (segundos)
input double LotMultiplier = 1.0;               // Multiplicador de lote
input int Slippage = 3;                         // Slippage
input int MagicNumber = 888888;                 // Magic Number
input bool EnableLogs = true;                   // Logs

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastCheckTime = 0;
string copiedTickets[];  // Tickets já copiados

#include <Trade\Trade.mqh>
CTrade trade;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Slave MT5 v3.10");
    Print("===========================================");
    Print("Slave Email: ", UserEmail);
    Print("Master Email: ", MasterEmail);
    Print("Servidor: ", SlaveServer);
    Print("Check Interval: ", CheckInterval, "s");
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
    
    Print("✅ Slave EA inicializado!");
    Print("Aguardando sinais do Master...");
    return(INIT_SUCCEEDED);
}

//====================================================
// TICK
//====================================================
void OnTick() {
    if(TimeCurrent() - lastCheckTime >= CheckInterval) {
        CheckMasterSignals();
        lastCheckTime = TimeCurrent();
    }
}

//====================================================
// VERIFICAR SINAIS DO MASTER
//====================================================
void CheckMasterSignals() {
    string url = SlaveServer + "/slave-signals";
    string params = "slave_email=" + UserEmail + "&master_email=" + MasterEmail;
    
    char post[];
    char result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    int res = WebRequest(
        "GET",
        url + "?" + params,
        headers,
        5000,
        post,
        result,
        headers
    );
    
    if(res == -1) {
        if(EnableLogs) Print("❌ Erro WebRequest: ", GetLastError());
        return;
    }
    
    string response = CharArrayToString(result);
    
    if(EnableLogs) Print("📡 Response: ", response);
    
    // Parse JSON simples
    if(StringFind(response, "\"success\":true") >= 0) {
        ProcessSignals(response);
    }
}

//====================================================
// PROCESSAR SINAIS
//====================================================
void ProcessSignals(string json) {
    // Parse simples do JSON
    int posStart = StringFind(json, "\"positions\":[");
    if(posStart < 0) {
        if(EnableLogs) Print("✅ Nenhuma posição do Master");
        return;
    }
    
    // Extrair array de posições
    int posEnd = StringFind(json, "]", posStart);
    string positions = StringSubstr(json, posStart + 13, posEnd - posStart - 13);
    
    if(positions == "") {
        if(EnableLogs) Print("✅ Nenhuma posição do Master");
        return;
    }
    
    if(EnableLogs) Print("📊 Posições do Master encontradas");
    
    // Parse cada posição (JSON simples)
    string items[];
    int count = SplitString(positions, "},", items);
    
    for(int i = 0; i < count; i++) {
        string item = items[i] + "}";
        CopyTrade(item);
    }
}

//====================================================
// COPIAR TRADE
//====================================================
void CopyTrade(string tradeJson) {
    // Extrair dados do JSON
    string ticket = ExtractValue(tradeJson, "ticket");
    string symbol = ExtractValue(tradeJson, "symbol");
    string type = ExtractValue(tradeJson, "type");
    double lots = StringToDouble(ExtractValue(tradeJson, "lots"));
    double openPrice = StringToDouble(ExtractValue(tradeJson, "open_price"));
    double sl = StringToDouble(ExtractValue(tradeJson, "sl"));
    double tp = StringToDouble(ExtractValue(tradeJson, "tp"));
    
    // Verificar se já copiou
    if(IsTicketCopied(ticket)) {
        return;
    }
    
    // Ajustar lote
    lots = lots * LotMultiplier;
    lots = NormalizeDouble(lots, 2);
    
    // Validar lote
    double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
    if(lots < minLot) lots = minLot;
    if(lots > maxLot) lots = maxLot;
    
    // Determinar tipo de ordem
    ENUM_ORDER_TYPE orderType = (type == "buy") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
    
    // Abrir ordem
    bool success = false;
    if(orderType == ORDER_TYPE_BUY) {
        success = trade.Buy(lots, symbol, 0, sl, tp, "Copy from " + ticket);
    } else {
        success = trade.Sell(lots, symbol, 0, sl, tp, "Copy from " + ticket);
    }
    
    if(success) {
        AddCopiedTicket(ticket);
        Print("✅ Trade copiado: ", symbol, " ", type, " ", lots, " lotes (Master ticket: ", ticket, ")");
    } else {
        Print("❌ Erro ao copiar trade: ", trade.ResultRetcode());
    }
}

//====================================================
// FUNÇÕES AUXILIARES
//====================================================
string ExtractValue(string json, string key) {
    int start = StringFind(json, "\"" + key + "\":");
    if(start < 0) return "";
    
    start = StringFind(json, ":", start) + 1;
    
    // Pular espaços e aspas
    while(StringGetChar(json, start) == ' ' || StringGetChar(json, start) == '\"') start++;
    
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
    return value;
}

bool IsTicketCopied(string ticket) {
    for(int i = 0; i < ArraySize(copiedTickets); i++) {
        if(copiedTickets[i] == ticket) return true;
    }
    return false;
}

void AddCopiedTicket(string ticket) {
    int size = ArraySize(copiedTickets);
    ArrayResize(copiedTickets, size + 1);
    copiedTickets[size] = ticket;
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
    if(allowedAccounts == "") {
        Print("✅ Todas as contas permitidas");
    } else {
        Print("✅ Contas permitidas: ", allowedAccounts);
    }
    
    return true;
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    Print("Slave EA finalizado");
}
//+------------------------------------------------------------------+
