//+------------------------------------------------------------------+
//|                                      SentraPartners_Master_MT4.mq4|
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
#define LICENSE_EXPIRY_DATE D'2025.12.31'  // Data de expiração
#define ALLOWED_ACCOUNTS ""  // Contas permitidas (separadas por vírgula) - vazio = todas

//====================================================
// PARÂMETROS DE ENTRADA
//====================================================
input string UserEmail = "";                        // ⚠️ SEU EMAIL CADASTRADO
input string MasterServer = "https://sentrapartners.com/api/mt/copy";
input int HeartbeatInterval = 1;                    // Intervalo de heartbeat (segundos)
input bool EnableLogs = true;                       // Habilitar logs

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastHeartbeatTime = 0;
int previousOrdersCount = 0;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("===========================================");
    Print("Sentra Partners - Master MT4 v4.0");
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
    
    // Inicializar contador
    previousOrdersCount = OrdersTotal();
    
    Print("✅ Master EA inicializado com sucesso!");
    Print("📡 Heartbeat: ", HeartbeatInterval, "s");
    return(INIT_SUCCEEDED);
}

//====================================================
// TICK (DETECTAR MUDANÇAS + HEARTBEAT)
//====================================================
void OnTick() {
    datetime now = TimeCurrent();
    int currentOrdersCount = OrdersTotal();
    
    // Detectar mudança no número de ordens (abertura/fechamento)
    if(currentOrdersCount != previousOrdersCount) {
        if(EnableLogs) Print("🔔 Mudança detectada: ", previousOrdersCount, " → ", currentOrdersCount);
        SendHeartbeat();  // Enviar imediatamente
        previousOrdersCount = currentOrdersCount;
        lastHeartbeatTime = now;  // Resetar timer
    }
    
    // Enviar heartbeat periódico
    if(now - lastHeartbeatTime >= HeartbeatInterval) {
        SendHeartbeat();
        lastHeartbeatTime = now;
    }
}

//====================================================
// ENVIAR HEARTBEAT (SINCRONIZAÇÃO)
//====================================================
void SendHeartbeat() {
    string data = "{";
    data += "\"action\":\"heartbeat\",";
    data += "\"master_email\":\"" + UserEmail + "\",";
    data += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\",";
    data += "\"broker\":\"" + AccountCompany() + "\",";
    data += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
    data += "\"positions\":[";
    
    int total = OrdersTotal();
    int count = 0;
    
    for(int i = 0; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            // Apenas ordens de mercado (BUY/SELL)
            if(OrderType() <= 1) {
                if(count > 0) data += ",";
                
                data += "{";
                data += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
                data += "\"symbol\":\"" + OrderSymbol() + "\",";
                data += "\"type\":" + IntegerToString(OrderType()) + ",";
                data += "\"lots\":" + DoubleToString(OrderLots(), 2) + ",";
                data += "\"open_price\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
                data += "\"stop_loss\":" + DoubleToString(OrderStopLoss(), 5) + ",";
                data += "\"take_profit\":" + DoubleToString(OrderTakeProfit(), 5) + ",";
                data += "\"open_time\":" + IntegerToString(OrderOpenTime());
                data += "}";
                
                count++;
            }
        }
    }
    
    data += "],";
    data += "\"positions_count\":" + IntegerToString(count);
    data += "}";
    
    if(EnableLogs) Print("💓 Heartbeat enviado: ", count, " posições");
    SendToServer(data);
}

//====================================================
// ENVIAR PARA SERVIDOR
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
        if(EnableLogs) Print("✅ Sinal enviado com sucesso");
    } else if(res == -1) {
        int error = GetLastError();
        Print("❌ Erro WebRequest: ", error);
        
        if(error == 4060) {
            Print("⚠️ URL não autorizada! Adicione em Ferramentas → Opções → Expert Advisors:");
            Print("   https://sentrapartners.com");
        }
    } else {
        Print("❌ Erro HTTP: ", res);
    }
}

//====================================================
// VALIDAR LICENÇA
//====================================================
bool ValidateLicense() {
    // Verificar data de expiração
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("❌ Licença expirada em ", TimeToString(LICENSE_EXPIRY_DATE));
        return false;
    }
    
    // Verificar contas permitidas (se especificado)
    if(ALLOWED_ACCOUNTS != "") {
        string accounts[];
        int count = StringSplit(ALLOWED_ACCOUNTS, ',', accounts);
        bool found = false;
        
        for(int i = 0; i < count; i++) {
            if(IntegerToString(AccountNumber()) == accounts[i]) {
                found = true;
                break;
            }
        }
        
        if(!found) {
            Print("❌ Conta não autorizada: ", AccountNumber());
            return false;
        }
    }
    
    return true;
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    Print("Master EA finalizado. Motivo: ", reason);
}
//+------------------------------------------------------------------+
