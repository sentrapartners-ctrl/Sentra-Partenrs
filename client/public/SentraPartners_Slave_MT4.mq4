//+------------------------------------------------------------------+
//|                                      SentraPartners_Slave_MT4.mq4 |
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
#define LICENSE_EXPIRY_DATE D'2025.12.31'
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
    Print("Sentra Partners - Slave MT4 v3.0");
    
    if(!ValidateLicense()) {
        Alert("LICENÇA INVÁLIDA!");
        return(INIT_FAILED);
    }
    
    if(UserEmail == "" || MasterEmail == "") {
        Alert("Configure os emails!");
        return(INIT_FAILED);
    }
    
    Print("Slave EA inicializado!");
    return(INIT_SUCCEEDED);
}

//====================================================
// TICK
//====================================================
void OnTick() {
    if(TimeCurrent() - lastCheckTime >= CheckInterval) {
        // Aqui seria a lógica de copiar trades
        // Por enquanto apenas placeholder
        lastCheckTime = TimeCurrent();
    }
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
        string currentAccount = IntegerToString(AccountNumber());
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
    Print("Slave EA finalizado");
}
//+------------------------------------------------------------------+
