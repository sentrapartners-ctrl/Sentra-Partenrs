# Sistema de Rastreamento de Profit - Guia Completo

## 🎯 Objetivo

Implementar rastreamento completo de lucro/prejuízo nos trades para calcular automaticamente:
- **Win Rate** (Taxa de Assertividade)
- **Lucro Total**
- **Lucro Médio**
- **Trades Ganhos vs Perdidos**

---

## ✅ O Que Foi Implementado

### 1. **Migration 007: Campos de Profit**

Adicionados à tabela `copy_trades`:
- `profit DECIMAL(15,2)` - Lucro/Prejuízo do trade em USD
- `close_price DECIMAL(20,5)` - Preço de fechamento do trade
- Índices para performance: `idx_profit`, `idx_status_profit`

### 2. **EA Master v4.0 Atualizado**

Função `SendCloseEvent()` agora:
- Busca profit do histórico de deals usando `HistorySelectByPosition()`
- Identifica deal de saída com `DEAL_ENTRY_OUT`
- Extrai `DEAL_PROFIT` e `DEAL_PRICE`
- Envia profit e close_price para o servidor

**Código:**
```mql5
void SendCloseEvent(ulong ticket) {
    double profit = 0.0;
    double close_price = 0.0;
    
    if(HistorySelectByPosition(ticket)) {
        int total = HistoryDealsTotal();
        for(int i = total - 1; i >= 0; i--) {
            ulong deal_ticket = HistoryDealGetTicket(i);
            if(deal_ticket > 0) {
                if(HistoryDealGetInteger(deal_ticket, DEAL_ENTRY) == DEAL_ENTRY_OUT) {
                    profit = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
                    close_price = HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
                    break;
                }
            }
        }
    }
    
    // Enviar para servidor com profit e close_price
    // ...
}
```

### 3. **Backend Atualizado**

`processCloseEvent()` agora:
- Recebe `profit` e `close_price` do EA
- Salva no banco de dados ao fechar trade
- Chama `updateProviderStatistics()` automaticamente

### 4. **Cálculo de Estatísticas com Dados Reais**

`updateProviderStatistics()` calcula:

```sql
SELECT 
  COUNT(*) as total_trades,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_trades,
  COUNT(CASE WHEN status = 'closed' AND profit > 0 THEN 1 END) as winning_trades,
  COUNT(CASE WHEN status = 'closed' AND profit <= 0 THEN 1 END) as losing_trades,
  SUM(CASE WHEN status = 'closed' THEN profit ELSE 0 END) as total_profit,
  AVG(CASE WHEN status = 'closed' THEN profit END) as avg_profit,
  MAX(closed_at) as last_trade_at
FROM copy_trades
WHERE account_number = ?
```

**Fórmulas:**
- **Win Rate** = (Winning Trades / Total Closed Trades) × 100
- **Winning Trade** = profit > 0
- **Losing Trade** = profit ≤ 0
- **Total Profit** = SUM(profit) WHERE status='closed'
- **Avg Profit** = AVG(profit) WHERE status='closed'

---

## 🚀 Como Testar

### **Passo 1: Executar Migration 007**

Após o deploy, execute:

```bash
curl -X POST https://sentrapartners.com/api/migrations/007
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Migration 007 executada",
  "stats": {
    "total": 4,
    "success": 4,
    "skipped": 0
  }
}
```

### **Passo 2: Atualizar EA Master no MT5**

1. Baixe o novo EA Master v4.0:
   - Acesse: https://sentrapartners.com/SentraPartners_Master_MT5.mq5
   
2. Substitua o EA antigo:
   - Copie para: `C:\Users\[Seu Usuário]\AppData\Roaming\MetaQuotes\Terminal\[ID]\MQL5\Experts\`
   
3. Compile o EA no MetaEditor (F7)

4. Anexe ao gráfico e configure:
   - UserEmail: seu email cadastrado
   - MasterServer: https://sentrapartners.com/api/mt/copy
   - HeartbeatInterval: 30
   - EnableLogs: true

### **Passo 3: Testar com Trades Reais**

1. **Abrir Trade:**
   - Abra uma posição no MT5 (BUY ou SELL)
   - Verifique no log do EA: `✅ OPEN: ticket=...`

2. **Fechar Trade:**
   - Feche a posição
   - Verifique no log: `✅ CLOSE: ticket=... profit=... close_price=...`

3. **Verificar no Dashboard:**
   - Acesse: Copy Trading → Compartilhar Sinais
   - Aguarde alguns segundos (estatísticas atualizam automaticamente)
   - Verifique:
     - **Win Rate** - Deve mostrar % real
     - **Lucro Total** - Deve mostrar valor em USD
     - **Último Trade** - Deve mostrar data de hoje

### **Passo 4: Verificar Banco de Dados (Opcional)**

```sql
-- Ver trades com profit
SELECT ticket, symbol, profit, close_price, status, closed_at
FROM copy_trades
WHERE account_number = 'SEU_NUMERO_CONTA'
ORDER BY closed_at DESC
LIMIT 10;

-- Ver estatísticas do provedor
SELECT sp.provider_name, ps.*
FROM signal_providers sp
JOIN provider_statistics ps ON sp.id = ps.provider_id
WHERE sp.master_account_number = 'SEU_NUMERO_CONTA';
```

---

## 📊 Exemplo de Dados

### **Trades na Tabela copy_trades:**

| ticket | symbol  | profit | close_price | status | closed_at           |
|--------|---------|--------|-------------|--------|---------------------|
| 12345  | EURUSD  | 15.50  | 1.08450     | closed | 2025-10-30 20:15:00 |
| 12346  | GBPUSD  | -8.20  | 1.26320     | closed | 2025-10-30 20:30:00 |
| 12347  | USDJPY  | 22.30  | 149.850     | closed | 2025-10-30 21:00:00 |

### **Estatísticas Calculadas:**

| Métrica           | Valor  | Cálculo                        |
|-------------------|--------|--------------------------------|
| Total Trades      | 3      | COUNT(*)                       |
| Winning Trades    | 2      | COUNT(profit > 0)              |
| Losing Trades     | 1      | COUNT(profit <= 0)             |
| **Win Rate**      | **66.7%** | (2 / 3) × 100                 |
| **Total Profit**  | **$29.60** | 15.50 + (-8.20) + 22.30       |
| **Avg Profit**    | **$9.87** | 29.60 / 3                     |

---

## 🐛 Troubleshooting

### **Problema: Win Rate ainda mostra 0%**

**Causa:** Migration 007 não foi executada ou EA antigo ainda está em uso.

**Solução:**
1. Execute: `POST /api/migrations/007`
2. Verifique se campos existem:
   ```sql
   DESCRIBE copy_trades;
   ```
3. Atualize o EA Master para v4.0
4. Recompile e anexe ao gráfico

### **Problema: Profit sempre 0.00**

**Causa:** EA não está enviando profit ou deal não foi encontrado no histórico.

**Solução:**
1. Verifique logs do EA: `✅ CLOSE: profit=...`
2. Se profit=0.00 no log, o EA não conseguiu buscar do histórico
3. Certifique-se que `HistorySelectByPosition()` está funcionando
4. Teste com trade manual (não de EA externo)

### **Problema: Estatísticas não atualizam**

**Causa:** `updateProviderStatistics()` não está sendo chamado.

**Solução:**
1. Verifique logs do servidor: `[Provider Stats] ✅ Estatísticas atualizadas`
2. Execute manualmente:
   ```bash
   curl -X POST https://sentrapartners.com/api/signal-providers/admin/update-all-stats
   ```
3. Recarregue a página do dashboard

---

## 📝 Logs Esperados

### **EA Master (MT5):**
```
✅ CLOSE: ticket=12345 profit=15.50 close_price=1.08450
```

### **Backend (Server):**
```
[Copy Trading] ✅ CLOSE: ticket 12345, profit 15.5, close_price 1.0845
[Provider Stats] ✅ Estatísticas atualizadas para provedor 1 (conta 163032743)
```

### **Frontend (Dashboard):**
```
Win Rate: 66.7%
Lucro Total: $29.60
Último Trade: 30/10/2025
```

---

## 🎯 Próximos Passos (Futuro)

1. **Gráfico de Performance**
   - Exibir evolução do lucro ao longo do tempo
   - Usar Chart.js ou Recharts

2. **Drawdown Máximo**
   - Calcular maior sequência de perdas
   - Exibir em % do capital

3. **Sharpe Ratio**
   - Calcular retorno ajustado ao risco
   - Fórmula: (Retorno Médio - Taxa Livre de Risco) / Desvio Padrão

4. **Filtros de Período**
   - Win Rate dos últimos 7 dias, 30 dias, 90 dias
   - Comparar performance entre períodos

---

## ✅ Checklist de Implementação

- [x] Criar migration 007 com campos profit e close_price
- [x] Adicionar endpoint POST /api/migrations/007
- [x] Atualizar EA Master SendCloseEvent() para buscar profit
- [x] EA Master enviar profit e close_price ao servidor
- [x] Backend receber e salvar profit/close_price
- [x] Atualizar cálculo de estatísticas com dados reais
- [x] Calcular win_rate = (winning_trades / closed_trades) × 100
- [x] Calcular total_profit = SUM(profit)
- [x] Calcular avg_profit = AVG(profit)
- [x] Copiar EA atualizado para client/public e dist/public
- [x] Commit e push para repositório
- [ ] Executar migration 007 em produção
- [ ] Testar com trades reais
- [ ] Verificar estatísticas no dashboard

---

**Data:** 30/10/2025  
**Versão:** 1.0  
**Status:** ✅ Implementado - Aguardando Deploy e Testes
