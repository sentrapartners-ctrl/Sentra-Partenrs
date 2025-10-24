//+------------------------------------------------------------------+
//|                                        EA_MT5_SentraPartners.mq5 |
//|                                   Sentra Partners - MT5 Connector |
//|                                      https://sentrapartners.com   |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.0"

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
    Print("Sentra Partners EA - MT5 Connector v2.0");
    Print("========================================");
    Print("Email: ", UserEmail);
    Print("Conta: ", AccountInfoInteger(ACCOUNT_LOGIN));
    Print("Tipo: ", AccountType);
    Print("Broker: ", AccountInfoString(ACCOUNT_COMPANY));
    Print("Servidor: ", AccountInfoString(ACCOUNT_SERVER));
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
            SendOpenTrades();      // Posições abertas
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
    string account_number = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
    string broker = AccountInfoString(ACCOUNT_COMPANY);
    string server = AccountInfoString(ACCOUNT_SERVER);
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double equity = AccountInfoDouble(ACCOUNT_EQUITY);
    double margin_free = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
    int open_positions = PositionsTotal();
    int leverage = (int)AccountInfoInteger(ACCOUNT_LEVERAGE);
    
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
        "&platform=MT5" +
        "&currency=" + AccountInfoString(ACCOUNT_CURRENCY) +
        "&leverage=" + IntegerToString(leverage) +
        "&timestamp=" + IntegerToString(TimeCurrent());
    
    // Envia POST
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
//| Envia posições abertas para o servidor                           |
//+------------------------------------------------------------------+
void SendOpenTrades()
{
    int sent = 0;
    for(int i = 0; i < PositionsTotal(); i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0) {
            SendTrade(ticket);
            sent++;
        }
    }
    if(DebugMode && sent > 0) Print("✅ Enviados ", sent, " trades abertos");
}

//+------------------------------------------------------------------+
//| Envia histórico de trades para o servidor                        |
//+------------------------------------------------------------------+
void SendHistoryTrades()
{
    int sent = 0;
    datetime from = TimeCurrent() - (90 * 24 * 3600); // Últimos 90 dias
    datetime to = TimeCurrent();
    
    HistorySelect(from, to);
    int total = HistoryDealsTotal();
    
    // Envia últimos 100 deals para não sobrecarregar
    int start = MathMax(0, total - 100);
    
    for(int i = start; i < total; i++) {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket > 0) {
            if(HistoryDealGetInteger(ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT) {
                // Apenas deals de saída (trades fechados)
                SendHistoryDeal(ticket);
                sent++;
            }
        }
    }
    
    if(DebugMode && sent > 0) Print("✅ Enviados ", sent, " trades do histórico");
}

//+------------------------------------------------------------------+
//| Envia um trade específico                                        |
//+------------------------------------------------------------------+
void SendTrade(ulong ticket)
{
    if(!PositionSelectByTicket(ticket)) return;
    
    string url = API_URL + "/trade";
    
    string trade_id = IntegerToString(ticket);
    string symbol = PositionGetString(POSITION_SYMBOL);
    string type = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "BUY" : "SELL";
    double volume = PositionGetDouble(POSITION_VOLUME);
    double open_price = PositionGetDouble(POSITION_PRICE_OPEN);
    double current_price = PositionGetDouble(POSITION_PRICE_CURRENT);
    double stop_loss = PositionGetDouble(POSITION_SL);
    double take_profit = PositionGetDouble(POSITION_TP);
    double profit = PositionGetDouble(POSITION_PROFIT);
    double commission = 0; // MT5 não tem comissão direta na posição
    double swap = PositionGetDouble(POSITION_SWAP);
    datetime open_time = (datetime)PositionGetInteger(POSITION_TIME);
    
    string params = 
        "user_email=" + UserEmail +
        "&account_number=" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) +
        "&trade_id=" + trade_id +
        "&symbol=" + symbol +
        "&type=" + type +
        "&volume=" + DoubleToString(volume, 2) +
        "&open_price=" + DoubleToString(open_price, 5) +
        "&close_price=" + DoubleToString(current_price, 5) +
        "&stop_loss=" + DoubleToString(stop_loss, 5) +
        "&take_profit=" + DoubleToString(take_profit, 5) +
        "&profit=" + DoubleToString(profit, 2) +
        "&commission=" + DoubleToString(commission, 2) +
        "&swap=" + DoubleToString(swap, 2) +
        "&status=open" +
        "&open_time=" + IntegerToString(open_time) +
        "&close_time=0";
    
    char post[], result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    StringToCharArray(params, post, 0, StringLen(params));
    ArrayResize(result, 0);
    
    int res = WebRequest("POST", url, headers, 5000, post, result, headers);
    
    if(res == 200) {
        if(DebugMode) Print("✅ Trade enviado: #", ticket, " ", symbol, " ", type);
    } else if(res != -1) {
        Print("❌ Erro ao enviar trade #", ticket, ": HTTP ", res);
    }
}

//+------------------------------------------------------------------+




//+------------------------------------------------------------------+
//| Envia um deal do histórico                                       |
//+------------------------------------------------------------------+
void SendHistoryDeal(ulong ticket)
{
    string url = API_URL + "/trade";
    
    string trade_id = IntegerToString(ticket);
    string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
    string type = (HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY) ? "BUY" : "SELL";
    double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
    double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
    double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
    double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
    double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
    datetime time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
    
    string params = 
        "user_email=" + UserEmail +
        "&account_number=" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) +
        "&trade_id=" + trade_id +
        "&symbol=" + symbol +
        "&type=" + type +
        "&volume=" + DoubleToString(volume, 2) +
        "&open_price=" + DoubleToString(price, 5) +
        "&close_price=" + DoubleToString(price, 5) +
        "&stop_loss=0" +
        "&take_profit=0" +
        "&profit=" + DoubleToString(profit, 2) +
        "&commission=" + DoubleToString(commission, 2) +
        "&swap=" + DoubleToString(swap, 2) +
        "&status=closed" +
        "&open_time=" + IntegerToString(time) +
        "&close_time=" + IntegerToString(time);
    
    char post[], result[];
    string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
    
    StringToCharArray(params, post, 0, StringLen(params));
    ArrayResize(result, 0);
    
    int res = WebRequest("POST", url, headers, 5000, post, result, headers);
    
    if(res == 200) {
        if(DebugMode) Print("✅ Deal histórico enviado: #", ticket, " ", symbol);
    } else if(res != -1) {
        Print("❌ Erro ao enviar deal #", ticket, ": HTTP ", res);
    }
}
//+------------------------------------------------------------------+

