//+------------------------------------------------------------------+
//| Exemplo de Atualização para Expert Advisors MT5                  |
//| Adicionar campo 'origin' ao enviar trades para Sentra Partners   |
//+------------------------------------------------------------------+

// Exemplo de função para enviar trade com campo origin
bool SendTradeToSentraPartners(int ticket, string origin_type)
{
   // origin_type pode ser: "robot", "signal", "manual"
   
   string url = "https://seu-servidor.com/api/trades";
   string headers = "Content-Type: application/json\r\n";
   
   // Obter informações do trade
   if(!PositionSelectByTicket(ticket))
      return false;
   
   string symbol = PositionGetString(POSITION_SYMBOL);
   double profit = PositionGetDouble(POSITION_PROFIT);
   double volume = PositionGetDouble(POSITION_VOLUME);
   datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
   
   // Construir JSON com campo origin
   string json = StringFormat(
      "{\"ticket\":%d,\"symbol\":\"%s\",\"profit\":%.2f,\"volume\":%.2f,\"openTime\":%d,\"origin\":\"%s\"}",
      ticket,
      symbol,
      profit,
      volume,
      openTime,
      origin_type  // ← NOVO CAMPO
   );
   
   // Enviar requisição HTTP
   char post[];
   char result[];
   string result_headers;
   
   StringToCharArray(json, post, 0, StringLen(json));
   
   int res = WebRequest(
      "POST",
      url,
      headers,
      5000,
      post,
      result,
      result_headers
   );
   
   return (res == 200);
}

// Exemplo de uso em diferentes cenários:

// 1. Para Trading Robot (EA automático)
void OnTick()
{
   // ... lógica do EA ...
   
   int ticket = OrderSend(...);
   if(ticket > 0)
   {
      SendTradeToSentraPartners(ticket, "robot");  // ← Origem: robot
   }
}

// 2. Para Trading Signal (cópia de sinais)
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
   {
      SendTradeToSentraPartners(trans.deal, "signal");  // ← Origem: signal
   }
}

// 3. Para Manual Trading (operações manuais)
// Detectar se a ordem foi aberta manualmente
bool IsManualTrade(int ticket)
{
   // Verificar se não há magic number ou comentário de EA
   if(PositionSelectByTicket(ticket))
   {
      long magic = PositionGetInteger(POSITION_MAGIC);
      string comment = PositionGetString(POSITION_COMMENT);
      
      return (magic == 0 && comment == "");
   }
   return false;
}

void CheckAndSendTrades()
{
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      
      if(IsManualTrade((int)ticket))
      {
         SendTradeToSentraPartners((int)ticket, "manual");  // ← Origem: manual
      }
   }
}

//+------------------------------------------------------------------+
