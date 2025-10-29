# 🔄 Atualização dos EAs para Sincronização Otimizada

## 📋 Objetivo

Fazer com que os EAs MT4/MT5 consultem as configurações do servidor antes de enviar dados, reduzindo requisições e custos.

---

## 🎯 Lógica Atual vs Nova

### **Antes (❌ Ineficiente):**
- EA envia dados a cada 5 segundos (fixo)
- Envia histórico completo sempre
- Não respeita horários configurados

### **Depois (✅ Otimizado):**
- EA consulta configurações do servidor
- Envia apenas balance/equity no heartbeat
- Envia histórico completo apenas nos horários configurados

---

## 🔧 Implementação

### **1. Adicionar função para buscar configurações:**

```mql4
//+------------------------------------------------------------------+
//| Buscar configurações do servidor                                  |
//+------------------------------------------------------------------+
int GetServerSettings() {
   string url = ServerURL + "/settings/heartbeat_interval";
   string headers = "Content-Type: application/json\r\n";
   
   char post[], result[];
   string resultHeaders;
   
   int res = WebRequest("GET", url, headers, 5000, post, result, resultHeaders);
   
   if(res == 200) {
      string response = CharArrayToString(result);
      // Parse JSON: {"value":"3600"}
      int start = StringFind(response, "\"value\":\"") + 9;
      int end = StringFind(response, "\"", start);
      string value = StringSubstr(response, start, end - start);
      return (int)StringToInteger(value);
   }
   
   return 5; // Padrão: 5 segundos (se falhar)
}

//+------------------------------------------------------------------+
//| Verificar se é horário de sincronização completa                 |
//+------------------------------------------------------------------+
bool IsSyncTime() {
   string url = ServerURL + "/settings/sync_schedule";
   string headers = "Content-Type: application/json\r\n";
   
   char post[], result[];
   string resultHeaders;
   
   int res = WebRequest("GET", url, headers, 5000, post, result, resultHeaders);
   
   if(res == 200) {
      string response = CharArrayToString(result);
      // Parse JSON: {"value":"07:00,14:00,21:00"}
      int start = StringFind(response, "\"value\":\"") + 9;
      int end = StringFind(response, "\"", start);
      string schedule = StringSubstr(response, start, end - start);
      
      // Verificar se hora atual está na lista
      MqlDateTime now;
      TimeToStruct(TimeCurrent(), now);
      string currentTime = StringFormat("%02d:%02d", now.hour, now.min);
      
      return (StringFind(schedule, currentTime) >= 0);
   }
   
   return false;
}
```

### **2. Modificar OnTimer() para usar configurações:**

```mql4
//+------------------------------------------------------------------+
//| Timer function                                                    |
//+------------------------------------------------------------------+
void OnTimer() {
   static int heartbeatInterval = 5;
   static datetime lastConfigUpdate = 0;
   static datetime lastHeartbeat = 0;
   
   // Atualizar configurações a cada 1 hora
   if(TimeCurrent() - lastConfigUpdate > 3600) {
      heartbeatInterval = GetServerSettings();
      lastConfigUpdate = TimeCurrent();
      Print("Heartbeat interval updated: ", heartbeatInterval, " seconds");
   }
   
   // Verificar se é hora de enviar heartbeat
   if(TimeCurrent() - lastHeartbeat < heartbeatInterval) {
      return;
   }
   
   lastHeartbeat = TimeCurrent();
   
   // Verificar se é horário de sincronização completa
   bool sendFullHistory = IsSyncTime();
   
   if(sendFullHistory) {
      Print("Full sync time - sending complete history");
      SendAccountData(true);  // true = enviar histórico completo
   } else {
      Print("Heartbeat - sending balance/equity only");
      SendAccountData(false); // false = apenas balance/equity
   }
}
```

### **3. Modificar SendAccountData() para suportar modo leve:**

```mql4
//+------------------------------------------------------------------+
//| Enviar dados da conta                                             |
//+------------------------------------------------------------------+
void SendAccountData(bool includeHistory) {
   string jsonData = "{";
   jsonData += "\"account\":" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + ",";
   jsonData += "\"balance\":" + DoubleToStr(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   jsonData += "\"equity\":" + DoubleToStr(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   jsonData += "\"margin_free\":" + DoubleToStr(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2) + ",";
   jsonData += "\"margin_used\":" + DoubleToStr(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ",";
   
   // Adicionar posições abertas (sempre)
   jsonData += "\"open_positions\":[";
   for(int i = 0; i < OrdersTotal(); i++) {
      if(OrderSelect(i, SELECT_BY_POS)) {
         if(i > 0) jsonData += ",";
         jsonData += "{";
         jsonData += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
         jsonData += "\"symbol\":\"" + OrderSymbol() + "\",";
         jsonData += "\"type\":" + IntegerToString(OrderType()) + ",";
         jsonData += "\"volume\":" + DoubleToStr(OrderLots(), 2) + ",";
         jsonData += "\"open_price\":" + DoubleToStr(OrderOpenPrice(), 5) + ",";
         jsonData += "\"profit\":" + DoubleToStr(OrderProfit(), 2);
         jsonData += "}";
      }
   }
   jsonData += "],";
   
   // Adicionar histórico apenas se solicitado
   if(includeHistory) {
      jsonData += "\"closed_trades\":[";
      int historyTotal = OrdersHistoryTotal();
      for(int i = 0; i < historyTotal; i++) {
         if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
            if(i > 0) jsonData += ",";
            jsonData += "{";
            jsonData += "\"ticket\":" + IntegerToString(OrderTicket()) + ",";
            jsonData += "\"symbol\":\"" + OrderSymbol() + "\",";
            jsonData += "\"type\":" + IntegerToString(OrderType()) + ",";
            jsonData += "\"volume\":" + DoubleToStr(OrderLots(), 2) + ",";
            jsonData += "\"open_price\":" + DoubleToStr(OrderOpenPrice(), 5) + ",";
            jsonData += "\"close_price\":" + DoubleToStr(OrderClosePrice(), 5) + ",";
            jsonData += "\"profit\":" + DoubleToStr(OrderProfit(), 2) + ",";
            jsonData += "\"open_time\":\"" + TimeToString(OrderOpenTime()) + "\",";
            jsonData += "\"close_time\":\"" + TimeToString(OrderCloseTime()) + "\"";
            jsonData += "}";
         }
      }
      jsonData += "]";
   } else {
      jsonData += "\"closed_trades\":[]"; // Array vazio
   }
   
   jsonData += "}";
   
   // Enviar para servidor
   SendToServer(jsonData);
}
```

---

## ⚙️ Configuração no Painel Admin

1. Acesse: **`/sync-settings`**
2. Configure:
   - **Heartbeat:** 3600s (1 hora)
   - **Sincronização:** 07:00,14:00,21:00
   - **Histórico no heartbeat:** Desativado
3. Salve

---

## 📊 Resultado Esperado

### **Requisições Reduzidas:**
- **Antes:** 25.920.000 req/mês
- **Depois:** ~36.000 req/mês
- **Redução:** 99.8% ✅

### **Custo Reduzido:**
- **Antes:** $30-50/mês
- **Depois:** $7-12/mês
- **Economia:** ~$20-40/mês ✅

---

## 🚀 Deploy

1. **Atualizar EAs** com novo código
2. **Recompilar** no MetaEditor
3. **Remover EAs** dos gráficos
4. **Adicionar novamente** (para recarregar)
5. **Verificar logs** no Expert Advisor

---

## ✅ Validação

Após deploy, verifique:
- [ ] Dashboard atualiza a cada 1 hora
- [ ] Histórico sincroniza às 7h, 14h, 21h
- [ ] Logs do EA mostram "Heartbeat interval updated"
- [ ] Consumo do servidor reduzido

---

**Precisa de ajuda? Me avise! 🚀**
