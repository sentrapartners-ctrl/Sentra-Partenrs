//+------------------------------------------------------------------+
//|                                      SentraPartners_Master_MT4.mq4|
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
#define LICENSE_EXPIRY_DATE D'2025.12.31 23:59:59'  // Data de expiração
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
    Print("Sentra Partners - Master MT4 v3.0");
    Print("Conta: ", AccountNumber());
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
    
    Print("✅ Master EA inicializado com sucesso!");
    return(INIT_SUCCEEDED);
}

//====================================================
// TICK
//====================================================
void OnTick() {
    // Enviar posições periodicamente
    if(TimeCurrent() - lastSendTime >= SendInterval) {
        SendPositions();
        lastSendTime = TimeCurrent();
    }
}

//====================================================
// ENVIAR POSIÇÕES
//====================================================
void SendPositions() {
    string data = "{";
    data += "\"master_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
    data += "\"broker\":\"" + AccountCompany() + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"positions\":[";
    
    int total = OrdersTotal();
    int count = 0;
    
    for(int i = 0; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if(count > 0) data += ",";
            
            data += "{";
            data += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
            data += "\"symbol\":\"" + OrderSymbol() + "\",";
            data += "\"type\":" + IntegerToString(OrderType()) + ",";
            data += "\"lots\":" + DoubleToString(OrderLots(), 2) + ",";
            data += "\"open_price\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
            data += "\"stop_loss\":" + DoubleToString(OrderStopLoss(), 5) + ",";
            data += "\"take_profit\":" + DoubleToString(OrderTakeProfit(), 5) + ",";
            data += "\"open_time\":" + IntegerToString(OrderOpenTime()) + ",";
            data += "\"profit\":" + DoubleToString(OrderProfit(), 2) + ",";
            data += "\"comment\":\"" + OrderComment() + "\"";
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
    ArrayResize(post, StringToCharArray(data, post, 0, WHOLE_ARRAY) - 1);
    
    int timeout = 5000;
    int res = WebRequest("POST", url, headers, timeout, post, result, headers);
    
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
    int hash = 0;
    for(int i = 0; i < StringLen(str); i++) {
        hash = (hash * 31 + StringGetChar(str, i)) & 0x7FFFFFFF;
    }
    return IntegerToString(hash);
}

//====================================================
// VALIDAÇÃO DE LICENÇA
//====================================================
bool ValidateLicense() {
    // 1. Verificar data de expiração
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em: ", TimeToStr(LICENSE_EXPIRY_DATE, TIME_DATE));
        return false;
    }
    
    // 2. Verificar contas permitidas
    string allowedAccounts = ALLOWED_ACCOUNTS;
    if(allowedAccounts != "") {
        string currentAccount = IntegerToString(AccountNumber());
        bool accountAllowed = false;
        
        int start = 0;
        int pos = StringFind(allowedAccounts, ",", start);
        
        while(pos >= 0 || start < StringLen(allowedAccounts)) {
            string account;
            if(pos >= 0) {
                account = StringSubstr(allowedAccounts, start, pos - start);
                start = pos + 1;
                pos = StringFind(allowedAccounts, ",", start);
            } else {
                account = StringSubstr(allowedAccounts, start);
                start = StringLen(allowedAccounts);
            }
            
            StringTrimLeft(account);
            StringTrimRight(account);
            
            if(account == currentAccount) {
                accountAllowed = true;
                break;
            }
        }
        
        if(!accountAllowed) {
            Print("❌ Conta não autorizada: ", currentAccount);
            return false;
        }
    }
    
    Print("✅ Licença válida até: ", TimeToStr(LICENSE_EXPIRY_DATE, TIME_DATE));
    return true;
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    Print("Master EA finalizado. Motivo: ", reason);
}
//+------------------------------------------------------------------+
