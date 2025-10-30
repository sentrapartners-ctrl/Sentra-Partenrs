//+------------------------------------------------------------------+
//|                                      SentraPartners_Master_MT5.mq5|
//|                        Copyright 2025, Sentra Partners            |
//|                                   https://sentrapartners.com      |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.00"
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
input int SendInterval = 2;                         // Intervalo de envio (segundos)
input bool EnableLogs = true;                       // Habilitar logs

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastSendTime = 0;
string lastPositionsHash = "";

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Master MT5 v3.0");
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
    
    // Timer para envio periódico
    EventSetTimer(SendInterval);
    
    Print("✅ Master EA inicializado com sucesso!");
    return(INIT_SUCCEEDED);
}

//====================================================
// TIMER
//====================================================
void OnTimer() {
    SendPositions();
}

//====================================================
// ENVIAR POSIÇÕES
//====================================================
void SendPositions() {
    string data = "{";
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
            data += "\"open_time\":" + IntegerToString(PositionGetInteger(POSITION_TIME)) + ",";
            data += "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
            data += "\"comment\":\"" + PositionGetString(POSITION_COMMENT) + "\"";
            data += "}";
            
            count++;
        }
    }
    
    data += "],";
    data += "\"positions_count\":" + IntegerToString(count);
    data += "}";
    
    // Verificar se mudou
    string currentHash = GetHash(data);
    if(currentHash == lastPositionsHash && count > 0) {
        // Nada mudou, não enviar
        return;
    }
    lastPositionsHash = currentHash;
    
    // Enviar para servidor
    string url = MasterServer + "/master-signal";
    string headers = "Content-Type: application/json\r\n";
    
    char post[], result[];
    ArrayResize(post, StringToCharArray(data, post, 0, WHOLE_ARRAY, CP_UTF8) - 1);
    
    string resultHeaders;
    int timeout = 5000;
    int res = WebRequest("POST", url, headers, timeout, post, result, resultHeaders);
    
    if(res == 200) {
        if(EnableLogs) Print("✅ Posições enviadas: ", count);
    } else {
        if(EnableLogs) Print("❌ Erro ao enviar: ", res);
    }
}

//====================================================
// HASH SIMPLES
//====================================================
string GetHash(string str) {
    long hash = 0;
    for(int i = 0; i < StringLen(str); i++) {
        hash = (hash * 31 + StringGetCharacter(str, i)) & 0x7FFFFFFF;
    }
    return IntegerToString(hash);
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
}
//+------------------------------------------------------------------+
