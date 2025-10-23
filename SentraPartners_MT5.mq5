//+------------------------------------------------------------------+
//|                                          SentraPartners_MT5.mq5  |
//|                                   Sentra Partners Trading System |
//|                                      https://sentrapartners.com   |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "2.00"
#property description "Expert Advisor para sincronização com Sentra Partners SaaS"
#property description "Versão Multi-Usuário com autenticação por email"

//--- Input parameters
input string UserEmail = "seu@email.com";           // Email do usuário (OBRIGATÓRIO)
input string ApiUrl = "https://3005-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/api/mt"; // URL da API
input int HeartbeatInterval = 30;                   // Intervalo de heartbeat (segundos)
input bool SendTrades = true;                       // Enviar trades
input bool SendBalance = true;                      // Enviar histórico de saldo
input bool EnableLogs = true;                       // Habilitar logs detalhados

//--- Global variables
datetime lastHeartbeat = 0;
datetime lastTradeSync = 0;
datetime lastBalanceSync = 0;
int totalTradesSent = 0;
int totalBalancesSent = 0;
bool isConnected = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=================================================");
   Print("Sentra Partners MT5 EA v2.0 - Multi-User");
   Print("=================================================");
   Print("User Email: ", UserEmail);
   Print("API URL: ", ApiUrl);
   Print("Heartbeat Interval: ", HeartbeatInterval, " seconds");
   Print("=================================================");
   
   // Validar email
   if(UserEmail == "seu@email.com" || UserEmail == "")
   {
      Alert("ERRO: Configure seu email no parâmetro UserEmail!");
      Print("ERRO: Email não configurado. Por favor, configure o parâmetro UserEmail com seu email cadastrado no sistema.");
      return(INIT_FAILED);
   }
   
   // Validar URL
   if(StringFind(ApiUrl, "http") != 0)
   {
      Alert("ERRO: URL da API inválida!");
      return(INIT_FAILED);
   }
   
   // Enviar heartbeat inicial
   SendHeartbeat();
   
   // Sincronizar dados iniciais
   if(SendTrades) SyncTrades();
   if(SendBalance) SyncBalanceHistory();
   
   EventSetTimer(HeartbeatInterval);
   
   Print("EA inicializado com sucesso!");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("=================================================");
   Print("EA finalizado. Motivo: ", reason);
   Print("Total de trades enviados: ", totalTradesSent);
   Print("Total de balanços enviados: ", totalBalancesSent);
   Print("=================================================");
}

//+------------------------------------------------------------------+
//| Timer function                                                    |
//+------------------------------------------------------------------+
void OnTimer()
{
   // Heartbeat
   if(TimeCurrent() - lastHeartbeat >= HeartbeatInterval)
   {
      SendHeartbeat();
   }
   
   // Sincronizar trades a cada 5 minutos
   if(SendTrades && TimeCurrent() - lastTradeSync >= 300)
   {
      SyncTrades();
   }
   
   // Sincronizar balanço a cada 10 minutos
   if(SendBalance && TimeCurrent() - lastBalanceSync >= 600)
   {
      SyncBalanceHistory();
   }
}

//+------------------------------------------------------------------+
//| Trade function                                                    |
//+------------------------------------------------------------------+
void OnTrade()
{
   if(SendTrades)
   {
      SyncTrades();
   }
}

//+------------------------------------------------------------------+
//| Send Heartbeat                                                    |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
   string url = ApiUrl + "/heartbeat";
   
   // Coletar informações da conta
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string server = AccountInfoString(ACCOUNT_SERVER);
   string name = AccountInfoString(ACCOUNT_NAME);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   int leverage = (int)AccountInfoInteger(ACCOUNT_LEVERAGE);
   
   // Contar posições abertas
   int openPositions = PositionsTotal();
   
   // Construir JSON
   string json = "{";
   json += "\"user_email\":\"" + UserEmail + "\",";
   json += "\"account_number\":\"" + IntegerToString(login) + "\",";
   json += "\"broker\":\"" + company + "\",";
   json += "\"server\":\"" + server + "\",";
   json += "\"account_name\":\"" + name + "\",";
   json += "\"balance\":" + DoubleToString(balance, 2) + ",";
   json += "\"equity\":" + DoubleToString(equity, 2) + ",";
   json += "\"currency\":\"" + currency + "\",";
   json += "\"leverage\":" + IntegerToString(leverage) + ",";
   json += "\"open_positions\":" + IntegerToString(openPositions) + ",";
   json += "\"platform\":\"MT5\"";
   json += "}";
   
   // Enviar requisição
   char post[];
   char result[];
   string headers = "Content-Type: application/json\r\n";
   
   ArrayResize(post, StringToCharArray(json, post, 0, WHOLE_ARRAY) - 1);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, headers);
   
   if(res == 200)
   {
      isConnected = true;
      lastHeartbeat = TimeCurrent();
      if(EnableLogs) Print("✓ Heartbeat enviado com sucesso");
   }
   else
   {
      isConnected = false;
      Print("✗ Erro ao enviar heartbeat. Código: ", res);
      if(res == -1)
      {
         Print("ERRO: Adicione a URL na lista de URLs permitidas em Ferramentas > Opções > Expert Advisors");
      }
   }
}

//+------------------------------------------------------------------+
//| Sync Trades                                                       |
//+------------------------------------------------------------------+
void SyncTrades()
{
   string url = ApiUrl + "/trades";
   
   // Buscar histórico de deals
   datetime from = TimeCurrent() - (90 * 24 * 60 * 60); // Últimos 90 dias
   datetime to = TimeCurrent();
   
   HistorySelect(from, to);
   
   int totalDeals = HistoryDealsTotal();
   
   if(totalDeals == 0)
   {
      if(EnableLogs) Print("Nenhum trade para sincronizar");
      lastTradeSync = TimeCurrent();
      return;
   }
   
   string json = "{";
   json += "\"user_email\":\"" + UserEmail + "\",";
   json += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   json += "\"trades\":[";
   
   int sentCount = 0;
   
   for(int i = 0; i < totalDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
         
         // Apenas deals de entrada ou saída (não swaps, comissões, etc)
         if(entry == DEAL_ENTRY_IN || entry == DEAL_ENTRY_OUT)
         {
            if(sentCount > 0) json += ",";
            
            string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
            datetime time = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
            long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
            double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
            double price = HistoryDealGetDouble(ticket, DEAL_PRICE);
            double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
            double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
            double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
            
            string typeStr = (type == DEAL_TYPE_BUY) ? "buy" : "sell";
            
            json += "{";
            json += "\"ticket\":\"" + IntegerToString(ticket) + "\",";
            json += "\"symbol\":\"" + symbol + "\",";
            json += "\"type\":\"" + typeStr + "\",";
            json += "\"volume\":" + DoubleToString(volume, 2) + ",";
            json += "\"open_price\":" + DoubleToString(price, 5) + ",";
            json += "\"close_price\":" + DoubleToString(price, 5) + ",";
            json += "\"open_time\":\"" + TimeToString(time, TIME_DATE|TIME_SECONDS) + "\",";
            json += "\"close_time\":\"" + TimeToString(time, TIME_DATE|TIME_SECONDS) + "\",";
            json += "\"profit\":" + DoubleToString(profit, 2) + ",";
            json += "\"commission\":" + DoubleToString(commission, 2) + ",";
            json += "\"swap\":" + DoubleToString(swap, 2);
            json += "}";
            
            sentCount++;
         }
      }
   }
   
   json += "]}";
   
   if(sentCount == 0)
   {
      if(EnableLogs) Print("Nenhum trade válido para enviar");
      lastTradeSync = TimeCurrent();
      return;
   }
   
   // Enviar requisição
   char post[];
   char result[];
   string headers = "Content-Type: application/json\r\n";
   
   ArrayResize(post, StringToCharArray(json, post, 0, WHOLE_ARRAY) - 1);
   
   int res = WebRequest("POST", url, headers, 10000, post, result, headers);
   
   if(res == 200)
   {
      totalTradesSent += sentCount;
      lastTradeSync = TimeCurrent();
      Print("✓ ", sentCount, " trades sincronizados com sucesso");
   }
   else
   {
      Print("✗ Erro ao sincronizar trades. Código: ", res);
   }
}

//+------------------------------------------------------------------+
//| Sync Balance History                                              |
//+------------------------------------------------------------------+
void SyncBalanceHistory()
{
   string url = ApiUrl + "/balance";
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   
   string json = "{";
   json += "\"user_email\":\"" + UserEmail + "\",";
   json += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   json += "\"balance\":" + DoubleToString(balance, 2) + ",";
   json += "\"equity\":" + DoubleToString(equity, 2) + ",";
   json += "\"timestamp\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
   json += "}";
   
   // Enviar requisição
   char post[];
   char result[];
   string headers = "Content-Type: application/json\r\n";
   
   ArrayResize(post, StringToCharArray(json, post, 0, WHOLE_ARRAY) - 1);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, headers);
   
   if(res == 200)
   {
      totalBalancesSent++;
      lastBalanceSync = TimeCurrent();
      if(EnableLogs) Print("✓ Balanço sincronizado: $", DoubleToString(balance, 2));
   }
   else
   {
      Print("✗ Erro ao sincronizar balanço. Código: ", res);
   }
}

//+------------------------------------------------------------------+
//| ChartEvent function                                               |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
   // Pode adicionar eventos personalizados aqui
}
//+------------------------------------------------------------------+

