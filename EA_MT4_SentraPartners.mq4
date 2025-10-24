//+------------------------------------------------------------------+
//|                                        EA_MT4_SentraPartners.mq4 |
//|                                   Sentra Partners - MT4 Connector |
//|                                      https://sentrapartners.com   |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.0"
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

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("========================================");
    Print("Sentra Partners EA - MT4 Connector v2.0");
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
        
        // Envia trades se habilitado (junto com heartbeat para não sobrecarregar)
        if(SendTrades) {
            SendOpenTrades();      // Trades abertos
            SendHistoryTrades();   // Histórico (fechados)
        }
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
//| Envia trades abertos para o servidor                             |
//+------------------------------------------------------------------+
void SendOpenTrades()
{
    int total = OrdersTotal();
    Print("[DEBUG] Total de trades abertos: ", total);
    
    int sent = 0;
    for(int i = 0; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            Print("[DEBUG] Enviando trade #", OrderTicket(), " ", OrderSymbol());
            SendTrade(OrderTicket());
            sent++;
        }
    }
    Print("✅ Enviados ", sent, " trades abertos");
}

//+------------------------------------------------------------------+
//| Envia histórico de trades para o servidor                        |
//+------------------------------------------------------------------+
void SendHistoryTrades()
{
    int total = OrdersHistoryTotal();
    Print("[DEBUG] Total de trades no histórico: ", total);
    
    // Envia últimos 100 trades do histórico para não sobrecarregar
    int start = MathMax(0, total - 100);
    int sent = 0;
    
    for(int i = start; i < total; i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            if(sent < 5 || DebugMode) {
                Print("[DEBUG] Enviando histórico #", OrderTicket(), " ", OrderSymbol(), " P/L=", OrderProfit());
            }
            SendTrade(OrderTicket());
            sent++;
        }
    }
    
    Print("✅ Enviados ", sent, " trades do histórico (de ", start, " a ", total, ")");
}

//+------------------------------------------------------------------+
//| Envia um trade específico                                        |
//+------------------------------------------------------------------+
void SendTrade(int ticket)
{
    if(!OrderSelect(ticket, SELECT_BY_TICKET)) return;
    
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
        // Sucesso - não loga para não poluir
    } else {
        Print("❌ Erro ao enviar trade #", ticket, ": HTTP ", res);
        if(res == -1) {
            Print("ERRO: Adicione ", API_URL, " nas URLs permitidas!");
        }
    }
}

//+------------------------------------------------------------------+

