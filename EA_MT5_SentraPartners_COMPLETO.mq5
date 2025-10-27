//+------------------------------------------------------------------+
//|                                        EA_MT5_SentraPartners.mq5 |
//|                                   Sentra Partners - MT5 Connector |
//|                                      https://sentrapartners.com   |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.0"

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
    Print("Sentra Partners EA - MT5 Connector v3.0");
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
    // Seleciona TODO o histórico desde 01/01/2000
    datetime from = D'2000.01.01 00:00';
    datetime to = TimeCurrent();
    
    if(!HistorySelect(from, to)) {
        Print("❌ Erro ao selecionar histórico");
        return;
    }
    
    int total = HistoryDealsTotal();
    Print("📊 Total de deals no histórico: ", total);
    
    // Agrupa deals por posição (ticket)
    for(int i = 0; i < total; i++) {
        ulong deal_ticket = HistoryDealGetTicket(i);
        if(deal_ticket > 0) {
            ProcessHistoryDeal(deal_ticket);
        }
        
        // Feedback a cada 100 deals
        if(i % 100 == 0 && i > 0) {
            Print("📤 Processados ", i, " de ", total, " deals...");
        }
    }
    
    Print("✅ Histórico completo sincronizado!");
}

//+------------------------------------------------------------------+
//| Sincroniza histórico recente (últimas 24h)                       |
//+------------------------------------------------------------------+
void SyncRecentHistory()
{
    datetime from = TimeCurrent() - 86400; // Últimas 24 horas
    datetime to = TimeCurrent();
    
    if(!HistorySelect(from, to)) return;
    
    int total = HistoryDealsTotal();
    for(int i = 0; i < total; i++) {
        ulong deal_ticket = HistoryDealGetTicket(i);
        if(deal_ticket > 0) {
            ProcessHistoryDeal(deal_ticket);
        }
    }
}

//+------------------------------------------------------------------+
//| Processa um deal do histórico                                    |
//+------------------------------------------------------------------+
void ProcessHistoryDeal(ulong deal_ticket)
{
    // Pega informações do deal
    long deal_entry = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
    
    // Ignora deals que não são saída de posição
    if(deal_entry != DEAL_ENTRY_OUT) return;
    
    ulong position_id = HistoryDealGetInteger(deal_ticket, DEAL_POSITION_ID);
    string symbol = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);
    long deal_type = HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
    double volume = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
    double close_price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
    double profit = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
    double commission = HistoryDealGetDouble(deal_ticket, DEAL_COMMISSION);
    double swap = HistoryDealGetDouble(deal_ticket, DEAL_SWAP);
    datetime close_time = (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);
    string comment = HistoryDealGetString(deal_ticket, DEAL_COMMENT);
    
    // Busca deal de entrada para pegar preço de abertura e tempo
    double open_price = 0;
    datetime open_time = 0;
    
    if(HistorySelectByPosition(position_id)) {
        for(int i = 0; i < HistoryDealsTotal(); i++) {
            ulong entry_ticket = HistoryDealGetTicket(i);
            if(HistoryDealGetInteger(entry_ticket, DEAL_ENTRY) == DEAL_ENTRY_IN) {
                open_price = HistoryDealGetDouble(entry_ticket, DEAL_PRICE);
                open_time = (datetime)HistoryDealGetInteger(entry_ticket, DEAL_TIME);
                break;
            }
        }
    }
    
    // Determina tipo (BUY/SELL)
    string type = (deal_type == DEAL_TYPE_BUY || deal_type == DEAL_TYPE_SELL) ? 
                  ((deal_type == DEAL_TYPE_BUY) ? "SELL" : "BUY") : "UNKNOWN";
    
    // Envia trade fechado para o servidor
    SendClosedTrade(
        position_id,
        symbol,
        type,
        volume,
        open_price,
        close_price,
        0, // SL não disponível no histórico
        0, // TP não disponível no histórico
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
    ulong ticket,
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
        "&account_number=" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) +
        "&trade_id=" + IntegerToString(ticket) +
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
        "&leverage=" + IntegerToString(leverage) +
        "&account_type=" + AccountType +
        "&platform=MT5" +
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
    for(int i = 0; i < PositionsTotal(); i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0) {
            SendOpenTrade(ticket);
        }
    }
}

//+------------------------------------------------------------------+
//| Envia um trade aberto específico                                 |
//+------------------------------------------------------------------+
void SendOpenTrade(ulong ticket)
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
    double commission = 0;
    double swap = PositionGetDouble(POSITION_SWAP);
    datetime open_time = (datetime)PositionGetInteger(POSITION_TIME);
    string comment = PositionGetString(POSITION_COMMENT);
    
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

