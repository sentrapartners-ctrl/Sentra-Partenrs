# Especificações de Implementação - Módulo de Análise Avançada

## Resumo Executivo

Baseado nos documentos técnicos fornecidos e nas imagens de referência, este documento consolida as especificações para implementação do **Módulo de Análise Avançada** na plataforma Sentra Partners.

## Funcionalidades Prioritárias

### 1. Tabela de Crescimento Mensal (ALTA PRIORIDADE)
- Exibir percentual de crescimento individual por mês
- Cálculo: `((Balance Final - Balance Inicial) / Balance Inicial) * 100`
- Exibir total anual
- Interface similar às imagens fornecidas

### 2. Métricas de Risco Avançadas (ALTA PRIORIDADE)
- **Sharp Ratio**: Retorno Médio / Desvio Padrão dos Retornos
- **Profit Factor**: Gross Profit / Gross Loss
- **Recovery Factor**: Net Profit / Max Drawdown
- **Max Drawdown**: Maior queda percentual do pico ao vale
- **Max Deposit Load**: (Margem Utilizada / Balance) * 100
- **Average Hold Time**: Tempo médio de duração das operações
- **Trades per Week**: Média de operações por semana

### 3. Gráfico de Drawdown vs Balance (ALTA PRIORIDADE)
- Gráfico de linha dupla com dois eixos Y
- Balance (eixo esquerdo)
- Drawdown % (eixo direito)
- Período configurável

### 4. Estatísticas de Consecutivos (ALTA PRIORIDADE)
- Max consecutive wins
- Max consecutive losses
- Max consecutive profit (valor monetário)
- Max consecutive loss (valor monetário)

### 5. Análise por Tipo de Operação (MÉDIA PRIORIDADE)
- Gráfico Donut: Trading Robots vs Trading Signals vs Manual Trading
- Requer novo campo na tabela `trades`: `origin ENUM('robot', 'signal', 'manual', 'unknown')`

### 6. Análise Semanal (MÉDIA PRIORIDADE)
- Performance por dia da semana (M-S)
- Gráfico de barras mostrando lucro/prejuízo por dia

## Alterações no Banco de Dados

```sql
-- Adicionar coluna 'origin' à tabela 'trades'
ALTER TABLE trades
ADD COLUMN origin ENUM('robot', 'signal', 'manual', 'unknown') NOT NULL DEFAULT 'unknown';
```

## Estrutura Backend

### Novo Router: `analyticsRouter`

```typescript
// server/analytics-router.ts
import { protectedProcedure, router } from "./_core/trpc";
import * as analyticsDb from "./analytics-db";
import { z } from "zod";

export const analyticsRouter = router({
  getMonthlyGrowth: protectedProcedure
    .input(z.object({ accountId: z.number(), year: z.number() }))
    .query(({ input }) => analyticsDb.getMonthlyGrowth(input.accountId, input.year)),
  
  getRiskMetrics: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(({ input }) => analyticsDb.getRiskMetrics(input.accountId)),
  
  getRiskStats: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(({ input }) => analyticsDb.getRiskStats(input.accountId)),
  
  getConsecutiveStats: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(({ input }) => analyticsDb.getConsecutiveStats(input.accountId)),
  
  getWeeklyPerformance: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(({ input }) => analyticsDb.getWeeklyPerformance(input.accountId)),
});
```

### Funções de Banco de Dados (server/analytics-db.ts)

Principais funções a serem implementadas:
- `getMonthlyGrowth(accountId, year)`
- `getRiskMetrics(accountId)` - Sharp Ratio, Profit Factor, Recovery Factor
- `getRiskStats(accountId)` - Drawdown, Deposit Load, Hold Time, Trades/Week
- `getConsecutiveStats(accountId)` - Wins/Losses consecutivos
- `getWeeklyPerformance(accountId)` - Performance por dia da semana

## Estrutura Frontend

### Novos Componentes

1. **MonthlyGrowthTable.tsx** - Tabela de crescimento mensal
2. **DualAxisLineChart.tsx** - Gráfico Balance vs Drawdown
3. **RiskMetricsCard.tsx** - Card com Sharp Ratio, Profit Factor, Recovery Factor
4. **ConsecutiveStatsCard.tsx** - Card com estatísticas de consecutivos
5. **DonutChart.tsx** - Gráfico donut reutilizável
6. **WeeklyBarChart.tsx** - Gráfico de barras por dia da semana
7. **ProgressBar.tsx** - Barra de progresso horizontal

### Atualização da Página Analytics

Adicionar novas abas:
- **Summary**: Visão geral com métricas principais
- **Profit & Loss**: Análise de lucros e perdas
- **Long & Short**: Análise por tipo de operação
- **Risks**: Análise de risco detalhada

## Plano de Implementação

### Fase 1: Backend (Estimativa: 2-3 dias)
1. Modificar schema do banco de dados (adicionar campo `origin`)
2. Implementar funções de cálculo em `server/analytics-db.ts`
3. Criar e testar `analyticsRouter`
4. Validar queries SQL com dados reais

### Fase 2: Frontend (Estimativa: 3-4 dias)
1. Desenvolver componentes de UI reutilizáveis
2. Criar estrutura de abas na página Analytics
3. Integrar componentes com backend via tRPC
4. Implementar gráficos com Recharts

### Fase 3: Testes e Refinamento (Estimativa: 1-2 dias)
1. Testar precisão dos cálculos
2. Verificar performance com grande volume de dados
3. Ajustes de layout e responsividade
4. Testes de integração

## Métricas Visualizadas nas Imagens

### Aba "Risks"
- Balance: 100,039.32
- Drawdown: 1.23%
- Best trade: 4.35
- Worst trade: -0.56
- Max consecutive wins: 15
- Max consecutive losses: 3
- Max consecutive profit: 3.33
- Max consecutive loss: -0.64

### Aba "Summary"
- Sharp Ratio: 0.38
- Profit Factor: 5.85
- Recovery Factor: 51.74
- Max Drawdown: 1.79%
- Max Deposit Load: 1.37%
- Trades per Week: 198
- Average Hold Time: 3m

### Aba "Profit & Loss"
- Gross Profit: +47.42
- Gross Loss: -8.10
- Total: +39.32
- Win Trades: 156 (78.79%)
- Total Trades: 198

### Aba "Long & Short"
- Trading Robots: 198
- Trading Signals: 0
- Manual Trading: 0

## Observações Importantes

1. **Crescimento Mensal** é a funcionalidade CRÍTICA solicitada
2. Todos os cálculos devem ser feitos no backend
3. Frontend apenas exibe dados pré-calculados
4. Usar Recharts para todos os gráficos
5. Manter consistência visual com o design atual
6. Garantir performance com grandes volumes de dados
7. Implementar cache quando apropriado

## Próximos Passos

1. Revisar e aprovar especificações
2. Iniciar Fase 1 (Backend)
3. Testes unitários para funções de cálculo
4. Implementação incremental com testes contínuos

