//+------------------------------------------------------------------+
//|                                        EA_MT4_SentraPartners.mq4 |
//|                                   Sentra Partners - MT4 Connector |
//|                                      https://sentrapartners.com   |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.1"
#property strict

//--- Input Parameters
input string UserEmail = "seu@email.com";           // Email cadastrado no Sentra Partners
input string AccountType = "CENT";                   // Tipo de conta: CENT ou STANDARD
input int HeartbeatInterval = 60;                   // Intervalo de heartbeat em segundos
input bool SendTrades = true;                       // Enviar trades para o sistema
input bool DebugMode = false;                       // Modo debug (mais logs)

//--- Global Variables
string API_URL = "https://sentrapartners.com/api/mt";
datetime lastHeartbeat = 0;
bool initialSyncDone = false;  // Flag para sincronização inicial

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("========================================");
    Print("Sentra Partners EA - MT4 Connector v2.1");
    Print("========================================");
    Print("Email: ", UserEmail);
    Print("Conta: ", AccountNumber());
    Print("Tipo: ", AccountType);
    Print("Broker: ", AccountCompany());
    Print("Servidor: ", AccountServer());
    Print("========================================");
    
    // Valida configurações
    if(UserEmail == "seu@email.com" || UserEmail == "") {
        Alert("ERRO: Configure o parâmetro UserEmail com seu email cadastrado!");
        return(INIT_FAILED);
    }
    
    if(AccountType != "CENT" && AccountType != "STANDARD") {
        Alert("ERRO: AccountType deve ser CENT ou STANDARD");
        return(INIT_FAILED);
    }
    
    // Envia heartbeat inicial
    SendHeartbeat();
    
    // IMPORTANTE: Sincroniza histórico logo no início
    if(SendTrades) {
        Print("[SYNC] Iniciando sincronização inicial de trades...");
        SendAllTrades();
        initialSyncDone = true;
        Print("[SYNC] Sincronização inicial concluída!");
    }
    
    // Inicia timer para heartbeat periódico
    EventSetTimer(HeartbeatInterval);
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    EventKillTimer();
    Print("EA Sentra Partners desconectado. Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Timer function (executado a cada HeartbeatInterval segundos)     |
//+------------------------------------------------------------------+
void OnTimer()
{
    SendHeartbeat();
    
    // Envia trades periodicamente
    if(SendTrades) {
        SendAllTrades();
    }
}

//+------------------------------------------------------------------+
//| Envia heartbeat para o servidor                                  |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
    string url = API_URL + "/heartbeat";
    
    // Coleta dados da conta
    string account_number = IntegerToString(AccountNumber());
    string broker = AccountCompany();
    string server = AccountServer();
    double balance = AccountBalance();
    double equity = AccountEquity();
    double margin_free = AccountFreeMargin();
    int open_positions = OrdersTotal();
    int leverage = AccountLeverage();
    
    // Monta parâmetros
    string params = 
        "user_email=" + UserEmail +
        "&account_number=" + account_number +
        "&broker=" + broker +
        "&server=" + server +
        "&balance=" + DoubleToString(balance, 2) +
        "&equity=" + DoubleToString(equity, 2) +
        "&margin_free=" + DoubleToString(margin_free, 2) +
        "&open_positions=" + IntegerToString(open_positions) +
        "&account_type=" + AccountType +
        "&platform=MT4" +
        "&currency=" + AccountCurrency() +
        "&leverage=" + IntegerToString(leverage) +
        "&timestamp=" + IntegerToString(TimeCurrent());
    
    // Envia POST
    char post[], result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    StringToCharArray(params, post, 0, StringLen(params));
    
    int res = WebRequest("POST", url, headers, 5000, post, result, headers);
    
    if(res == 200) {
        if(DebugMode) Print("✅ Heartbeat enviado: Balance=", balance, " Equity=", equity);
    } else {
        Print("❌ Erro no heartbeat: HTTP ", res);
        if(res == -1) {
            Print("ERRO: Adicione ", API_URL, " nas URLs permitidas em Ferramentas > Opções > Expert Advisors");
        }
    }
}

//+------------------------------------------------------------------+
//| Envia TODOS os trades (abertos + histórico)                      |
//+------------------------------------------------------------------+
void SendAllTrades()
{
    // 1. Envia trades abertos
    int open_total = OrdersTotal();
    int open_sent = 0;
    
    for(int i = 0; i < open_total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if(SendTrade(OrderTicket())) {
                open_sent++;
            }
        }
    }
    
    if(open_sent > 0 || DebugMode) {
        Print("[TRADES] Enviados ", open_sent, " trades abertos");
    }
    
    // 2. Envia histórico (últimos 100)
    int history_total = OrdersHistoryTotal();
    int history_sent = 0;
    int start = MathMax(0, history_total - 100);
    
    for(int i = start; i < history_total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            if(SendTrade(OrderTicket())) {
                history_sent++;
            }
        }
    }
    
    if(history_sent > 0 || DebugMode) {
        Print("[HISTORY] Enviados ", history_sent, " trades do histórico (", start, " a ", history_total, ")");
    }
}

//+------------------------------------------------------------------+
//| Envia um trade específico                                        |
//+------------------------------------------------------------------+
bool SendTrade(int ticket)
{
    if(!OrderSelect(ticket, SELECT_BY_TICKET)) return false;
    
    string url = API_URL + "/trade";
    
    string trade_id = IntegerToString(OrderTicket());
    string symbol = OrderSymbol();
    string type = (OrderType() == OP_BUY || OrderType() == OP_BUYLIMIT || OrderType() == OP_BUYSTOP) ? "BUY" : "SELL";
    double volume = OrderLots();
    double open_price = OrderOpenPrice();
    double close_price = OrderClosePrice();
    double stop_loss = OrderStopLoss();
    double take_profit = OrderTakeProfit();
    double profit = OrderProfit();
    double commission = OrderCommission();
    double swap = OrderSwap();
    string status = (OrderCloseTime() == 0) ? "open" : "closed";
    datetime open_time = OrderOpenTime();
    datetime close_time = OrderCloseTime();
    
    string params = 
        "user_email=" + UserEmail +
        "&account_number=" + IntegerToString(AccountNumber()) +
        "&trade_id=" + trade_id +
        "&symbol=" + symbol +
        "&type=" + type +
        "&volume=" + DoubleToString(volume, 2) +
        "&open_price=" + DoubleToString(open_price, 5) +
        "&close_price=" + DoubleToString(close_price, 5) +
        "&stop_loss=" + DoubleToString(stop_loss, 5) +
        "&take_profit=" + DoubleToString(take_profit, 5) +
        "&profit=" + DoubleToString(profit, 2) +
        "&commission=" + DoubleToString(commission, 2) +
        "&swap=" + DoubleToString(swap, 2) +
        "&status=" + status +
        "&open_time=" + IntegerToString(open_time) +
        "&close_time=" + IntegerToString(close_time);
    
    char post[], result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    StringToCharArray(params, post, 0, StringLen(params));
    
    int res = WebRequest("POST", url, headers, 5000, post, result, headers);
    
    if(res == 200) {
        return true;
    } else {
        if(DebugMode) {
            Print("❌ Erro ao enviar trade #", ticket, ": HTTP ", res);
            if(res == -1) {
                Print("ERRO: Adicione ", API_URL, " nas URLs permitidas!");
            }
        }
        return false;
    }
}

//+------------------------------------------------------------------+

