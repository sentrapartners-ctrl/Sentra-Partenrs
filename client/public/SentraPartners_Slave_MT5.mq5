//+------------------------------------------------------------------+
//|                                      SentraPartners_Slave_MT5.mq5 |
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
datetime LICENSE_EXPIRY_DATE = D'2025.12.31';
#define ALLOWED_ACCOUNTS ""

//====================================================
// PARÂMETROS
//====================================================
input string UserEmail = "";
input string MasterEmail = "";
input string SlaveServer = "https://sentrapartners.com/api/mt/copy";
input int CheckInterval = 2;
input double LotMultiplier = 1.0;
input int Slippage = 3;
input bool EnableLogs = true;

//====================================================
// VARIÁVEIS GLOBAIS
//====================================================
datetime lastCheckTime = 0;

//====================================================
// INICIALIZAÇÃO
//====================================================
int OnInit() {
    Print("Sentra Partners - Slave MT5 v3.0");
    
    if(!ValidateLicense()) {
        Alert("LICENÇA INVÁLIDA!");
        return(INIT_FAILED);
    }
    
    if(UserEmail == "" || MasterEmail == "") {
        Alert("Configure os emails!");
        return(INIT_FAILED);
    }
    
    EventSetTimer(CheckInterval);
    Print("Slave EA inicializado!");
    return(INIT_SUCCEEDED);
}

//====================================================
// TIMER
//====================================================
void OnTimer() {
    // Aqui seria a lógica de copiar trades
    // Por enquanto apenas placeholder
}

//====================================================
// VALIDAÇÃO DE LICENÇA
//====================================================
bool ValidateLicense() {
    if(TimeCurrent() > LICENSE_EXPIRY_DATE) {
        Print("Licença expirada");
        return false;
    }
    
    string allowedAccounts = ALLOWED_ACCOUNTS;
    if(allowedAccounts != "") {
        string currentAccount = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
        if(StringFind(allowedAccounts, currentAccount) < 0) {
            Print("Conta não autorizada");
            return false;
        }
    }
    
    return true;
}

//====================================================
// FINALIZAÇÃO
//====================================================
void OnDeinit(const int reason) {
    EventKillTimer();
    Print("Slave EA finalizado");
}
//+------------------------------------------------------------------+
