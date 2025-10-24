//+------------------------------------------------------------------+
//|                                      SentraPartners_MT5_FINAL.mq5 |
//|                                   Sentra Partners Trading SaaS   |
//|                                                   Version 3.0    |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "3.00"
#property strict

//--- Parâmetros de entrada
input string UserEmail = "seu@email.com";  // ⚠️ SEU EMAIL CADASTRADO NO SISTEMA
input string MasterServer = "https://3000-ifwc82p1opsn7k50rvu6f-137bd2b3.manusvm.computer/api/mt";
input int HeartbeatInterval = 60;  // Segundos entre heartbeats
input int HistoryDays = 90;        // Dias de histórico para sincronizar
input bool EnableDetailedLogs = true;  // Habilitar logs detalhados

//--- Variáveis globais
datetime lastHeartbeat = 0;
datetime lastHistorySync = 0;
int totalTradesSent = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("===========================================");
   Print("Sentra Partners - API Unificada MT5 v3.0");
   Print("Sistema Multi-Usuário");
   Print("===========================================");
   Print("User Email: ", UserEmail);
   Print("Servidor: ", MasterServer);
   Print("Heartbeat: ", HeartbeatInterval, " segundos");
   Print("Histórico: ", HistoryDays, " dias");
   Print("===========================================");
   
   // Validar email
   if(UserEmail == "seu@email.com" || UserEmail == "")
   {
      Alert("⚠️ ERRO: Configure o parâmetro UserEmail com seu email cadastrado!");
      Print("✗ ERRO: Email não configurado");
      return(INIT_FAILED);
   }
   
   // Enviar heartbeat inicial
   if(!SendHeartbeat())
   {
      Print("✗ Erro ao enviar heartbeat inicial");
      return(INIT_PARAMETERS_INCORRECT);
   }
   
   // Sincronizar histórico
   if(!SyncHistory())
   {
      Print("⚠️ Aviso: Falha ao sincronizar histórico completo");
   }
   
   Print("✓ EA inicializado com sucesso!");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("===========================================");
   Print("EA finalizado. Motivo: ", reason);
   Print("Total de trades enviados: ", totalTradesSent);
   Print("===========================================");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Heartbeat periódico
   if(TimeCurrent() - lastHeartbeat >= HeartbeatInterval)
   {
      SendHeartbeat();
      lastHeartbeat = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Trade event                                                      |
//+------------------------------------------------------------------+
void OnTrade()
{
   // Quando há novo trade, sincronizar imediatamente
   SendHeartbeat();
   SyncRecentTrades(10);
}

//+------------------------------------------------------------------+
//| Enviar heartbeat                                                 |
//+------------------------------------------------------------------+
bool SendHeartbeat()
{
   string json = "{";
   json += "\"user_email\":\"" + UserEmail + "\",";
   json += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   json += "\"broker\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\",";
   json += "\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\",";
   json += "\"account_name\":\"" + AccountInfoString(ACCOUNT_NAME) + "\",";
   json += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   json += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   json += "\"currency\":\"" + AccountInfoString(ACCOUNT_CURRENCY) + "\",";
   json += "\"leverage\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LEVERAGE)) + ",";
   json += "\"margin_free\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2) + ",";
   json += "\"open_positions\":" + IntegerToString(PositionsTotal()) + ",";
   json += "\"platform\":\"MT5\"";
   json += "}";
   
   string url = MasterServer + "/heartbeat";
   int statusCode = SendPostRequest(url, json);
   
   if(statusCode == 200)
   {
      if(EnableDetailedLogs) Print("✓ Heartbeat enviado com sucesso");
      
      // Enviar posições abertas
      SendOpenPositions();
      
      return true;
   }
   else
   {
      Print("✗ Erro ao enviar heartbeat");
      return false;
   }
}

//+------------------------------------------------------------------+
//| Enviar posições abertas                                         |
//+------------------------------------------------------------------+
void SendOpenPositions()
{
   int total = PositionsTotal();
   if(total == 0) return;
   
   if(EnableDetailedLogs) Print("Exportando ", total, " posições abertas...");
   
   string json = "{";
   json += "\"user_email\":\"" + UserEmail + "\",";
   json += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
   json += "\"positions\":[";
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(i > 0) json += ",";
         json += "{";
         json += "\"ticket\":" + IntegerToString(ticket) + ",";
         json += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
         json += "\"type\":\"" + (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? "BUY" : "SELL") + "\",";
         json += "\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
         json += "\"open_price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
         json += "\"current_price\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_CURRENT), 5) + ",";
         json += "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
         json += "\"swap\":" + DoubleToString(PositionGetDouble(POSITION_SWAP), 2) + ",";
         json += "\"open_time\":\"" + TimeToString(PositionGetInteger(POSITION_TIME), TIME_DATE|TIME_MINUTES) + "\"";
         json += "}";
      }
   }
   
   json += "]}";
   
   string url = MasterServer + "/positions";
   int statusCode = SendPostRequest(url, json);
   
   if(statusCode == 200 && EnableDetailedLogs)
   {
      Print("✓ Posições enviadas com sucesso");
   }
}

//+------------------------------------------------------------------+
//| Sincronizar histórico                                           |
//+------------------------------------------------------------------+
bool SyncHistory()
{
   datetime from = TimeCurrent() - (HistoryDays * 24 * 3600);
   datetime to = TimeCurrent();
   
   if(!HistorySelect(from, to))
   {
      Print("✗ Erro ao selecionar histórico");
      return false;
   }
   
   int total = HistoryDealsTotal();
   if(total == 0)
   {
      Print("ℹ Nenhum deal no histórico");
      return true;
   }
   
   Print("Exportando ", total, " deals do histórico...");
   
   return SendTradesInBatches(total);
}

//+------------------------------------------------------------------+
//| Sincronizar trades recentes                                     |
//+------------------------------------------------------------------+
void SyncRecentTrades(int count)
{
   datetime from = TimeCurrent() - (7 * 24 * 3600); // Última semana
   datetime to = TimeCurrent();
   
   if(!HistorySelect(from, to)) return;
   
   int total = HistoryDealsTotal();
   if(total == 0) return;
   
   int toSend = MathMin(count, total);
   SendTradesInBatches(toSend);
}

//+------------------------------------------------------------------+
//| Enviar trades em lotes                                          |
//+------------------------------------------------------------------+
bool SendTradesInBatches(int totalTrades)
{
   int batchSize = 100;
   int batches = (int)MathCeil((double)totalTrades / batchSize);
   int sent = 0;
   
   for(int batch = 0; batch < batches; batch++)
   {
      int start = batch * batchSize;
      int end = MathMin(start + batchSize, totalTrades);
      
      string json = "{";
      json += "\"user_email\":\"" + UserEmail + "\",";
      json += "\"account_number\":\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\",";
      json += "\"trades\":[";
      
      bool first = true;
      for(int i = start; i < end; i++)
      {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket > 0)
         {
            if(!first) json += ",";
            first = false;
            
            json += "{";
            json += "\"ticket\":" + IntegerToString(ticket) + ",";
            json += "\"symbol\":\"" + HistoryDealGetString(ticket, DEAL_SYMBOL) + "\",";
            json += "\"type\":\"" + (HistoryDealGetInteger(ticket, DEAL_TYPE) == DEAL_TYPE_BUY ? "BUY" : "SELL") + "\",";
            json += "\"volume\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_VOLUME), 2) + ",";
            json += "\"price\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
            json += "\"profit\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) + ",";
            json += "\"commission\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_COMMISSION), 2) + ",";
            json += "\"swap\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_SWAP), 2) + ",";
            json += "\"time\":\"" + TimeToString(HistoryDealGetInteger(ticket, DEAL_TIME), TIME_DATE|TIME_MINUTES) + "\"";
            json += "}";
            sent++;
         }
      }
      
      json += "]}";
      
      string url = MasterServer + "/trades";
      int statusCode = SendPostRequest(url, json);
      
      if(statusCode != 200)
      {
         Print("✗ Erro ao enviar batch ", batch + 1, "/", batches);
      }
   }
   
   totalTradesSent += sent;
   Print("✓ ", sent, " trades sincronizados com sucesso");
   return true;
}

//+------------------------------------------------------------------+
//| Enviar requisição POST                                          |
//+------------------------------------------------------------------+
int SendPostRequest(string url, string json)
{
   char data[];
   char result[];
   string headers = "Content-Type: application/json\r\n";
   
   StringToCharArray(json, data, 0, StringLen(json));
   
   int timeout = 5000;
   int statusCode = WebRequest("POST", url, headers, timeout, data, result, headers);
   
   if(statusCode == -1)
   {
      int error = GetLastError();
      if(error == 4014)
      {
         Print("✗ Erro 4014: URL não está na lista de URLs permitidas!");
         Print("ℹ Adicione a URL nas configurações: Ferramentas → Opções → Expert Advisors");
         Print("ℹ URL a adicionar: ", StringSubstr(url, 0, StringFind(url, "/api")));
      }
      else
      {
         Print("✗ Erro ao enviar para ", url, ": ", error);
      }
   }
   else if(EnableDetailedLogs)
   {
      Print("✓ Enviado para ", StringSubstr(url, StringFind(url, "/api")), " (Status: ", statusCode, ")");
   }
   
   return statusCode;
}

