//+------------------------------------------------------------------+
//|                                        EA_MT4_SentraPartners.mq4 |
//|                                   Sentra Partners - MT4 Connector |
//|                                      https://sentrapartners.com   |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.0"
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
datetime lastHistorySync = 0;
bool initialSyncDone = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("========================================");
    Print("Sentra Partners EA - MT4 Connector v3.0");
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
    
    // Sincroniza TODO o histórico na primeira execução
    Print("🔄 Iniciando sincronização completa do histórico...");
    SyncCompleteHistory();
    initialSyncDone = true;
    Print("✅ Sincronização completa finalizada!");
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    Print("EA Sentra Partners desconectado. Motivo: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    // Envia heartbeat a cada X segundos
    if(TimeCurrent() - lastHeartbeat >= HeartbeatInterval) {
        SendHeartbeat();
        lastHeartbeat = TimeCurrent();
    }
    
    // Envia trades abertos se habilitado
    if(SendTrades) {
        SendOpenTrades();
    }
    
    // Sincroniza histórico a cada 5 minutos (trades recém-fechados)
    if(TimeCurrent() - lastHistorySync >= 300) {
        SyncRecentHistory();
        lastHistorySync = TimeCurrent();
    }
}

//+------------------------------------------------------------------+
//| Sincroniza TODO o histórico desde o início da conta              |
//+------------------------------------------------------------------+
void SyncCompleteHistory()
{
    int total = OrdersHistoryTotal();
    Print("📊 Total de ordens no histórico: ", total);
    
    for(int i = 0; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            ProcessHistoryOrder();
        }
        
        // Feedback a cada 100 ordens
        if(i % 100 == 0 && i > 0) {
            Print("📤 Processadas ", i, " de ", total, " ordens...");
        }
    }
    
    Print("✅ Histórico completo sincronizado!");
}

//+------------------------------------------------------------------+
//| Sincroniza histórico recente                                      |
//+------------------------------------------------------------------+
void SyncRecentHistory()
{
    int total = OrdersHistoryTotal();
    
    for(int i = MathMax(0, total - 100); i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            // Apenas ordens das últimas 24h
            if(OrderCloseTime() > TimeCurrent() - 86400) {
                ProcessHistoryOrder();
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Processa uma ordem do histórico                                  |
//+------------------------------------------------------------------+
void ProcessHistoryOrder()
{
    // Apenas ordens fechadas (não pending)
    if(OrderType() > 1) return;
    
    int ticket = OrderTicket();
    string symbol = OrderSymbol();
    string type = (OrderType() == OP_BUY) ? "BUY" : "SELL";
    double volume = OrderLots();
    double open_price = OrderOpenPrice();
    double close_price = OrderClosePrice();
    double stop_loss = OrderStopLoss();
    double take_profit = OrderTakeProfit();
    double profit = OrderProfit();
    double commission = OrderCommission();
    double swap = OrderSwap();
    datetime open_time = OrderOpenTime();
    datetime close_time = OrderCloseTime();
    string comment = OrderComment();
    
    SendClosedTrade(
        ticket,
        symbol,
        type,
        volume,
        open_price,
        close_price,
        stop_loss,
        take_profit,
        profit,
        commission,
        swap,
        open_time,
        close_time,
        comment
    );
}

//+------------------------------------------------------------------+
//| Envia trade fechado para o servidor                              |
//+------------------------------------------------------------------+
void SendClosedTrade(
    int ticket,
    string symbol,
    string type,
    double volume,
    double open_price,
    double close_price,
    double stop_loss,
    double take_profit,
    double profit,
    double commission,
    double swap,
    datetime open_time,
    datetime close_time,
    string comment
)
{
    string url = API_URL + "/trade";
    
    string params = 
        "user_email=" + UserEmail +
        "&account_number=" + IntegerToString(AccountNumber()) +
        "&trade_id=" + IntegerToString(ticket) +
        "&symbol=" + symbol +
        "&type=" + type +
        "&volume=" + DoubleToStr(volume, 2) +
        "&open_price=" + DoubleToStr(open_price, 5) +
        "&close_price=" + DoubleToStr(close_price, 5) +
        "&stop_loss=" + DoubleToStr(stop_loss, 5) +
        "&take_profit=" + DoubleToStr(take_profit, 5) +
        "&profit=" + DoubleToStr(profit, 2) +
        "&commission=" + DoubleToStr(commission, 2) +
        "&swap=" + DoubleToStr(swap, 2) +
        "&status=closed" +
        "&open_time=" + IntegerToString(open_time) +
        "&close_time=" + IntegerToString(close_time) +
        "&comment=" + comment;
    
    char post[], result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    StringToCharArray(params, post, 0, StringLen(params));
    ArrayResize(result, 0);
    
    int res = WebRequest("POST", url, headers, 5000, post, result, headers);
    
    if(res == 200) {
        if(DebugMode) Print("✅ Trade fechado enviado: #", ticket, " ", symbol, " Profit: ", profit);
    } else if(res != -1 && res != 0) {
        Print("❌ Erro ao enviar trade fechado #", ticket, ": HTTP ", res);
    }
}

//+------------------------------------------------------------------+
//| Envia heartbeat para o servidor                                  |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
    string url = API_URL + "/heartbeat";
    
    string account_number = IntegerToString(AccountNumber());
    string broker = AccountCompany();
    string server = AccountServer();
    double balance = AccountBalance();
    double equity = AccountEquity();
    double margin_free = AccountFreeMargin();
    int open_positions = OrdersTotal();
    int leverage = AccountLeverage();
    
    string params = 
        "user_email=" + UserEmail +
        "&account_number=" + account_number +
        "&broker=" + broker +
        "&server=" + server +
        "&balance=" + DoubleToStr(balance, 2) +
        "&equity=" + DoubleToStr(equity, 2) +
        "&margin_free=" + DoubleToStr(margin_free, 2) +
        "&open_positions=" + IntegerToString(open_positions) +
        "&leverage=" + IntegerToString(leverage) +
        "&account_type=" + AccountType +
        "&platform=MT4" +
        "&timestamp=" + IntegerToString(TimeCurrent());
    
    char post[], result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    StringToCharArray(params, post, 0, StringLen(params));
    ArrayResize(result, 0);
    
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
//| Envia trades abertos para o servidor                             |
//+------------------------------------------------------------------+
void SendOpenTrades()
{
    for(int i = 0; i < OrdersTotal(); i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if(OrderType() <= 1) { // Apenas BUY e SELL
                SendOpenTrade();
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Envia um trade aberto específico                                 |
//+------------------------------------------------------------------+
void SendOpenTrade()
{
    string url = API_URL + "/trade";
    
    int ticket = OrderTicket();
    string symbol = OrderSymbol();
    string type = (OrderType() == OP_BUY) ? "BUY" : "SELL";
    double volume = OrderLots();
    double open_price = OrderOpenPrice();
    double current_price = (OrderType() == OP_BUY) ? MarketInfo(symbol, MODE_BID) : MarketInfo(symbol, MODE_ASK);
    double stop_loss = OrderStopLoss();
    double take_profit = OrderTakeProfit();
    double profit = OrderProfit();
    double commission = OrderCommission();
    double swap = OrderSwap();
    datetime open_time = OrderOpenTime();
    string comment = OrderComment();
    
    string params = 
        "user_email=" + UserEmail +
        "&account_number=" + IntegerToString(AccountNumber()) +
        "&trade_id=" + IntegerToString(ticket) +
        "&symbol=" + symbol +
        "&type=" + type +
        "&volume=" + DoubleToStr(volume, 2) +
        "&open_price=" + DoubleToStr(open_price, 5) +
        "&close_price=" + DoubleToStr(current_price, 5) +
        "&stop_loss=" + DoubleToStr(stop_loss, 5) +
        "&take_profit=" + DoubleToStr(take_profit, 5) +
        "&profit=" + DoubleToStr(profit, 2) +
        "&commission=" + DoubleToStr(commission, 2) +
        "&swap=" + DoubleToStr(swap, 2) +
        "&status=open" +
        "&open_time=" + IntegerToString(open_time) +
        "&close_time=0" +
        "&comment=" + comment;
    
    char post[], result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    StringToCharArray(params, post, 0, StringLen(params));
    ArrayResize(result, 0);
    
    int res = WebRequest("POST", url, headers, 5000, post, result, headers);
    
    if(res == 200) {
        if(DebugMode) Print("✅ Trade aberto enviado: #", ticket, " ", symbol, " ", type);
    } else if(res != -1 && res != 0) {
        Print("❌ Erro ao enviar trade aberto #", ticket, ": HTTP ", res);
    }
}

//+------------------------------------------------------------------+

