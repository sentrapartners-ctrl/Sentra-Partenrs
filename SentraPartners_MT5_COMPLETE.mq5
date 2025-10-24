//+------------------------------------------------------------------+
//|                                SentraPartners_MT5_COMPLETE.mq5    |
//|                                   Sentra Partners Trading SaaS   |
//|                                                   Version 4.0    |
//+------------------------------------------------------------------+
#property copyright "Sentra Partners"
#property link      "https://sentrapartners.com"
#property version   "4.00"
#property strict

//--- Parâmetros de entrada
input string UserEmail = "seu@email.com";  // ⚠️ SEU EMAIL CADASTRADO NO SISTEMA
input string MasterServer = "https://sentrapartners-u7perjfz.manus.space/api/mt";
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
   Print("Sentra Partners - API Completa MT5 v4.0");
   Print("Sistema Multi-Usuário com TODOS os dados");
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
   
   // Enviar heartbeat inicial com tudo
   if(!SendCompleteHeartbeat())
   {
      Print("✗ Erro ao enviar heartbeat inicial");
      return(INIT_PARAMETERS_INCORRECT);
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
   // Heartbeat periódico com TUDO
   if(TimeCurrent() - lastHeartbeat >= HeartbeatInterval)
   {
      SendCompleteHeartbeat();
      lastHeartbeat = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Trade event                                                      |
//+------------------------------------------------------------------+
void OnTrade()
{
   // Quando há novo trade, sincronizar imediatamente
   SendCompleteHeartbeat();
}

//+------------------------------------------------------------------+
//| Enviar heartbeat COMPLETO com TUDO                              |
//+------------------------------------------------------------------+
bool SendCompleteHeartbeat()
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
   json += "\"timestamp\":" + IntegerToString(TimeCurrent()) + ",";
   json += "\"platform\":\"MT5\",";
   
   // POSIÇÕES ABERTAS com TODOS os dados
   json += "\"positions\":" + BuildPositionsArray() + ",";
   
   // HISTÓRICO COMPLETO
   json += "\"history\":" + BuildHistoryArray();
   
   json += "}";
   
   string url = MasterServer + "/heartbeat";
   int statusCode = SendPostRequest(url, json);
   
   if(statusCode == 200)
   {
      if(EnableDetailedLogs) Print("✓ Heartbeat COMPLETO enviado com sucesso");
      return true;
   }
   else
   {
      Print("✗ Erro ao enviar heartbeat");
      return false;
   }
}

//+------------------------------------------------------------------+
//| Construir array de posições abertas com TODOS os dados          |
//+------------------------------------------------------------------+
string BuildPositionsArray()
{
   int total = PositionsTotal();
   string json = "[";
   
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
         json += "\"stop_loss\":" + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ",";
         json += "\"take_profit\":" + DoubleToString(PositionGetDouble(POSITION_TP), 5) + ",";
         json += "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
         json += "\"swap\":" + DoubleToString(PositionGetDouble(POSITION_SWAP), 2) + ",";
         json += "\"commission\":" + DoubleToString(PositionGetDouble(POSITION_COMMISSION), 2) + ",";
         json += "\"magic_number\":" + IntegerToString(PositionGetInteger(POSITION_MAGIC)) + ",";
         json += "\"comment\":\"" + PositionGetString(POSITION_COMMENT) + "\",";
         json += "\"open_time\":" + IntegerToString(PositionGetInteger(POSITION_TIME));
         json += "}";
      }
   }
   
   json += "]";
   return json;
}

//+------------------------------------------------------------------+
//| Construir array de histórico com TODOS os dados                 |
//+------------------------------------------------------------------+
string BuildHistoryArray()
{
   datetime from = TimeCurrent() - (HistoryDays * 24 * 3600);
   datetime to = TimeCurrent();
   
   if(!HistorySelect(from, to))
   {
      return "[]";
   }
   
   int total = HistoryDealsTotal();
   if(total == 0) return "[]";
   
   // Limitar a 1000 deals para não sobrecarregar
   int maxDeals = MathMin(total, 1000);
   
   string json = "[";
   bool first = true;
   
   for(int i = 0; i < maxDeals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         // Filtrar apenas deals de entrada/saída (não balance operations)
         ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_IN || entry == DEAL_ENTRY_OUT)
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
            json += "\"magic_number\":" + IntegerToString(HistoryDealGetInteger(ticket, DEAL_MAGIC)) + ",";
            json += "\"comment\":\"" + HistoryDealGetString(ticket, DEAL_COMMENT) + "\",";
            json += "\"time\":" + IntegerToString(HistoryDealGetInteger(ticket, DEAL_TIME));
            json += "}";
            
            totalTradesSent++;
         }
      }
   }
   
   json += "]";
   return json;
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
   
   int timeout = 10000; // 10 segundos para enviar tudo
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

