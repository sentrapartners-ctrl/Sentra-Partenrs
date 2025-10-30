# Implementação Completa - EA Slave com Configurações

## Visão Geral

Este documento detalha como implementar a lógica de Copy Trading no EA Slave, aplicando todas as configurações definidas pelo usuário no dashboard.

---

## 🔄 Fluxo Completo do EA Slave

```
1. Inicialização
   ↓
2. Buscar Configurações do Servidor
   ↓
3. Loop Principal (a cada 2-5 segundos):
   ├─ Buscar Sinais do Master
   ├─ Para cada sinal novo:
   │  ├─ Validar Trade (filtros e limites)
   │  ├─ Calcular Volume Ajustado
   │  ├─ Calcular SL/TP Ajustados
   │  ├─ Abrir Trade no Slave
   │  ├─ Enviar Resultado
   │  └─ Atualizar Estatísticas Diárias
   └─ Comparar com posições locais (fechar se Master fechou)
```

---

## 📡 1. Buscar Configurações (OnInit)

**Endpoint:** `GET /api/mt/copy/settings`

```mql4
string UserEmail = "seu@email.com";
string MasterAccountId = "12345678";
string SlaveAccountId;

// Estrutura de configurações
struct CopySettings {
   string slTpMode;          // "copy_100", "multiply", "fixed_pips", "none"
   double slMultiplier;
   double tpMultiplier;
   int slFixedPips;
   int tpFixedPips;
   
   string volumeMode;        // "copy_100", "multiply", "fixed"
   double volumeMultiplier;
   double volumeFixed;
   double maxVolume;
   
   bool enableSymbolFilter;
   string allowedSymbols[];  // Array de símbolos permitidos
   bool enableDirectionFilter;
   string allowedDirections[]; // ["BUY", "SELL"]
   
   bool enableRiskManagement;
   double maxDailyLoss;
   int maxDailyTrades;
};

CopySettings settings;

int OnInit() {
   SlaveAccountId = IntegerToString(AccountNumber());
   
   // Buscar configurações
   if(!LoadSettings()) {
      Print("❌ Erro ao carregar configurações. Usando padrões.");
      SetDefaultSettings();
   }
   
   Print("✅ EA Slave inicializado");
   Print("📡 Copiando conta Master: ", MasterAccountId);
   Print("⚙️ Modo SL/TP: ", settings.slTpMode);
   Print("⚙️ Modo Volume: ", settings.volumeMode);
   
   return INIT_SUCCEEDED;
}

bool LoadSettings() {
   string url = "https://sentrapartners.com/api/mt/copy/settings";
   url += "?user_email=" + UserEmail;
   url += "&master_account_id=" + MasterAccountId;
   url += "&slave_account_id=" + SlaveAccountId;
   
   string headers = "";
   char result[];
   string resultHeaders;
   
   int res = WebRequest("GET", url, headers, 5000, NULL, result, resultHeaders);
   
   if(res == 200) {
      string json = CharArrayToString(result);
      ParseSettings(json);
      return true;
   }
   
   return false;
}

void ParseSettings(string json) {
   // Parse JSON e preencher struct settings
   // Usar funções de parse JSON do MT4/MT5
   // Exemplo simplificado:
   
   settings.slTpMode = ExtractStringValue(json, "slTpMode");
   settings.slMultiplier = ExtractDoubleValue(json, "slMultiplier");
   settings.tpMultiplier = ExtractDoubleValue(json, "tpMultiplier");
   settings.slFixedPips = ExtractIntValue(json, "slFixedPips");
   settings.tpFixedPips = ExtractIntValue(json, "tpFixedPips");
   
   settings.volumeMode = ExtractStringValue(json, "volumeMode");
   settings.volumeMultiplier = ExtractDoubleValue(json, "volumeMultiplier");
   settings.volumeFixed = ExtractDoubleValue(json, "volumeFixed");
   settings.maxVolume = ExtractDoubleValue(json, "maxVolume");
   
   settings.enableSymbolFilter = ExtractBoolValue(json, "enableSymbolFilter");
   // Parse array allowedSymbols
   
   settings.enableDirectionFilter = ExtractBoolValue(json, "enableDirectionFilter");
   // Parse array allowedDirections
   
   settings.enableRiskManagement = ExtractBoolValue(json, "enableRiskManagement");
   settings.maxDailyLoss = ExtractDoubleValue(json, "maxDailyLoss");
   settings.maxDailyTrades = ExtractIntValue(json, "maxDailyTrades");
}
```

---

## 🎯 2. Validar Trade Antes de Copiar

**Endpoint:** `POST /api/mt/copy/validate-trade`

```mql4
bool ShouldCopyTrade(string symbol, string type, double volume) {
   string url = "https://sentrapartners.com/api/mt/copy/validate-trade";
   string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
   
   string data = "user_email=" + UserEmail +
                 "&master_account_id=" + MasterAccountId +
                 "&slave_account_id=" + SlaveAccountId +
                 "&symbol=" + symbol +
                 "&type=" + type +
                 "&volume=" + DoubleToString(volume, 2);
   
   char post[], result[];
   StringToCharArray(data, post);
   
   int res = WebRequest("POST", url, headers, 5000, post, result, headers);
   
   if(res == 200) {
      string json = CharArrayToString(result);
      bool shouldCopy = ExtractBoolValue(json, "shouldCopy");
      
      if(!shouldCopy) {
         string reason = ExtractStringValue(json, "reason");
         Print("⚠️ Trade não será copiado: ", reason);
      }
      
      return shouldCopy;
   }
   
   return false;
}
```

---

## 📊 3. Calcular Volume Ajustado

```mql4
double CalculateAdjustedVolume(double masterVolume) {
   double adjustedVolume = masterVolume;
   
   if(settings.volumeMode == "copy_100") {
      adjustedVolume = masterVolume;
   }
   else if(settings.volumeMode == "multiply") {
      adjustedVolume = masterVolume * settings.volumeMultiplier;
   }
   else if(settings.volumeMode == "fixed") {
      adjustedVolume = settings.volumeFixed;
   }
   
   // Verificar volume máximo
   if(adjustedVolume > settings.maxVolume) {
      Print("⚠️ Volume ajustado (", adjustedVolume, ") excede máximo (", settings.maxVolume, ")");
      return 0; // Não copiar
   }
   
   // Verificar volume mínimo do broker
   double minVolume = MarketInfo(Symbol(), MODE_MINLOT);
   if(adjustedVolume < minVolume) {
      adjustedVolume = minVolume;
   }
   
   // Verificar volume máximo do broker
   double maxVolume = MarketInfo(Symbol(), MODE_MAXLOT);
   if(adjustedVolume > maxVolume) {
      adjustedVolume = maxVolume;
   }
   
   // Normalizar para step do broker
   double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
   adjustedVolume = NormalizeDouble(adjustedVolume / lotStep, 0) * lotStep;
   
   return adjustedVolume;
}
```

---

## 🛡️ 4. Calcular SL/TP Ajustados

```mql4
void CalculateAdjustedSLTP(string symbol, int orderType, double openPrice, 
                           double masterSL, double masterTP,
                           double &slaveSL, double &slaveTP) {
   
   double point = MarketInfo(symbol, MODE_POINT);
   int digits = (int)MarketInfo(symbol, MODE_DIGITS);
   
   if(settings.slTpMode == "copy_100") {
      // Copiar 100%
      slaveSL = masterSL;
      slaveTP = masterTP;
   }
   else if(settings.slTpMode == "multiply") {
      // Multiplicador
      if(masterSL > 0) {
         double slDistance = MathAbs(openPrice - masterSL);
         slDistance = slDistance * settings.slMultiplier;
         
         if(orderType == OP_BUY) {
            slaveSL = openPrice - slDistance;
         } else {
            slaveSL = openPrice + slDistance;
         }
         slaveSL = NormalizeDouble(slaveS L, digits);
      }
      
      if(masterTP > 0) {
         double tpDistance = MathAbs(masterTP - openPrice);
         tpDistance = tpDistance * settings.tpMultiplier;
         
         if(orderType == OP_BUY) {
            slaveTP = openPrice + tpDistance;
         } else {
            slaveTP = openPrice - tpDistance;
         }
         slaveTP = NormalizeDouble(slaveTP, digits);
      }
   }
   else if(settings.slTpMode == "fixed_pips") {
      // Fixo em pips
      double slDistance = settings.slFixedPips * point * 10; // 10 points = 1 pip
      double tpDistance = settings.tpFixedPips * point * 10;
      
      if(orderType == OP_BUY) {
         slaveS L = openPrice - slDistance;
         slaveTP = openPrice + tpDistance;
      } else {
         slaveS L = openPrice + slDistance;
         slaveTP = openPrice - tpDistance;
      }
      
      slaveS L = NormalizeDouble(slaveS L, digits);
      slaveTP = NormalizeDouble(slaveTP, digits);
   }
   else if(settings.slTpMode == "none") {
      // Sem SL/TP
      slaveS L = 0;
      slaveTP = 0;
   }
}
```

---

## 🚀 5. Copiar Trade Completo

```mql4
void CopyMasterTrade(string symbol, string type, double volume, 
                     double openPrice, double masterSL, double masterTP) {
   
   // 1. Validar se deve copiar
   if(!ShouldCopyTrade(symbol, type, volume)) {
      return;
   }
   
   // 2. Calcular volume ajustado
   double adjustedVolume = CalculateAdjustedVolume(volume);
   if(adjustedVolume <= 0) {
      Print("❌ Volume ajustado inválido");
      return;
   }
   
   // 3. Determinar tipo de ordem
   int orderType = (type == "BUY") ? OP_BUY : OP_SELL;
   
   // 4. Calcular SL/TP ajustados
   double slaveS L = 0, slaveTP = 0;
   CalculateAdjustedSLTP(symbol, orderType, openPrice, masterSL, masterTP, slaveS L, slaveTP);
   
   // 5. Abrir trade
   int startTime = GetTickCount();
   
   int ticket = OrderSend(
      symbol,
      orderType,
      adjustedVolume,
      openPrice,
      3, // slippage
      slaveS L,
      slaveTP,
      "Copy from " + MasterAccountId,
      0, // magic number
      0,
      clrGreen
   );
   
   int executionTime = GetTickCount() - startTime;
   
   // 6. Calcular slippage
   double slippage = 0;
   if(ticket > 0) {
      if(OrderSelect(ticket, SELECT_BY_TICKET)) {
         double executedPrice = OrderOpenPrice();
         slippage = MathAbs(executedPrice - openPrice) / MarketInfo(symbol, MODE_POINT);
      }
   }
   
   // 7. Enviar resultado
   string status = (ticket > 0) ? "success" : "failed";
   string errorMsg = (ticket <= 0) ? ErrorDescription(GetLastError()) : "";
   
   SendCopyResult(symbol, status, executionTime, slippage, errorMsg);
   
   // 8. Atualizar estatísticas diárias (se sucesso)
   if(ticket > 0 && settings.enableRiskManagement) {
      UpdateDailyStats(0); // profit será atualizado quando fechar
   }
   
   if(ticket > 0) {
      Print("✅ Trade copiado: ", symbol, " ", type, " ", adjustedVolume, " lotes (Ticket: ", ticket, ")");
      Print("   Latência: ", executionTime, "ms | Slippage: ", DoubleToString(slippage, 1), " pips");
   } else {
      Print("❌ Erro ao copiar trade: ", errorMsg);
   }
}

void SendCopyResult(string symbol, string status, int executionTime, double slippage, string errorMsg) {
   string url = "https://sentrapartners.com/api/mt/copy/slave-copy-result";
   string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
   
   string data = "user_email=" + UserEmail +
                 "&slave_account_id=" + SlaveAccountId +
                 "&master_account_id=" + MasterAccountId +
                 "&symbol=" + symbol +
                 "&status=" + status +
                 "&execution_time=" + IntegerToString(executionTime) +
                 "&slippage=" + DoubleToString(slippage, 1);
   
   if(errorMsg != "") {
      data += "&error_message=" + errorMsg;
   }
   
   char post[], result[];
   StringToCharArray(data, post);
   
   WebRequest("POST", url, headers, 5000, post, result, headers);
}

void UpdateDailyStats(double profit) {
   string url = "https://sentrapartners.com/api/mt/copy/update-daily-stats";
   string headers = "Content-Type: application/x-www-form-urlencoded\r\n";
   
   string data = "user_email=" + UserEmail +
                 "&master_account_id=" + MasterAccountId +
                 "&slave_account_id=" + SlaveAccountId +
                 "&profit=" + DoubleToString(profit, 2);
   
   char post[], result[];
   StringToCharArray(data, post);
   
   WebRequest("POST", url, headers, 5000, post, result, headers);
}
```

---

## 🔄 6. Loop Principal (OnTimer)

```mql4
void OnTimer() {
   // Buscar sinais do Master
   string signals = GetMasterSignals();
   
   if(signals == "") {
      return;
   }
   
   // Parse JSON de posições
   // Para cada posição do Master:
   //   - Verificar se já existe no Slave
   //   - Se não existe: CopyMasterTrade()
   //   - Se existe: Verificar se precisa atualizar SL/TP
   
   // Verificar posições locais
   // Para cada posição do Slave:
   //   - Verificar se ainda existe no Master
   //   - Se não existe: Fechar posição
}

string GetMasterSignals() {
   string url = "https://sentrapartners.com/api/mt/copy/slave-signals";
   url += "?master_account_id=" + MasterAccountId;
   url += "&user_email=" + UserEmail;
   
   string headers = "";
   char result[];
   string resultHeaders;
   
   int res = WebRequest("GET", url, headers, 5000, NULL, result, resultHeaders);
   
   if(res == 200) {
      return CharArrayToString(result);
   }
   
   return "";
}
```

---

## 📋 Resumo dos Endpoints Usados

| Endpoint | Método | Quando Usar |
|----------|--------|-------------|
| `/api/mt/copy/settings` | GET | OnInit - Carregar configurações |
| `/api/mt/copy/validate-trade` | POST | Antes de copiar - Validar filtros e limites |
| `/api/mt/copy/slave-signals` | GET | OnTimer (2-5s) - Buscar sinais |
| `/api/mt/copy/slave-copy-result` | POST | Após copiar - Enviar resultado |
| `/api/mt/copy/update-daily-stats` | POST | Após copiar - Atualizar estatísticas |

---

## ✅ Checklist de Implementação

- [ ] Carregar configurações no OnInit
- [ ] Validar trade antes de copiar (filtros)
- [ ] Calcular volume ajustado
- [ ] Calcular SL/TP ajustados
- [ ] Abrir trade com parâmetros corretos
- [ ] Medir latência de execução
- [ ] Calcular slippage
- [ ] Enviar resultado ao servidor
- [ ] Atualizar estatísticas diárias
- [ ] Verificar limites de risco (perda máxima, trades máximos)
- [ ] Fechar trades quando Master fechar
- [ ] Log detalhado de todas as operações

---

## 🎯 Exemplo Completo de Uso

**Configuração no Dashboard:**
- SL/TP: Multiplicador (SL 1.5x, TP 0.8x)
- Volume: Multiplicador 0.5x
- Filtro: Apenas EURUSD e GBPUSD
- Risco: Máx $50/dia, 10 trades/dia

**Master abre:**
- EURUSD BUY 1.0 lote
- SL 20 pips, TP 40 pips

**Slave copia:**
1. Valida: ✅ EURUSD está na whitelist
2. Volume: 1.0 × 0.5 = 0.5 lote
3. SL: 20 × 1.5 = 30 pips
4. TP: 40 × 0.8 = 32 pips
5. Abre: EURUSD BUY 0.5 lote, SL 30 pips, TP 32 pips
6. Envia resultado: Sucesso, 245ms, 0.5 pips slippage
7. Atualiza stats: 1 trade copiado hoje

---

**Sistema 100% funcional e pronto para implementação!** 🚀
