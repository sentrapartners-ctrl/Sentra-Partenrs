import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface MonthlyData {
  month: string;
  monthly_profit: number;
  trade_count: number;
}

interface MonthlyGrowthTableProps {
  data: MonthlyData[];
  year: number;
}

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export function MonthlyGrowthTable({ data, year }: MonthlyGrowthTableProps) {
  // Organizar dados por mês
  const monthlyData: Record<number, { growth: number; profit: number }> = {};
  let yearTotal = 0;
  let yearProfit = 0;

  data.forEach((item) => {
    const monthIndex = parseInt(item.month.split('-')[1]) - 1;
    const profit = parseFloat(item.monthly_profit as any) / 100; // Converter de cents para dollars
    monthlyData[monthIndex] = {
      growth: 0, // Será calculado no frontend se necessário
      profit: profit
    };
    yearProfit += profit;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Crescimento Mensal - {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Grid de meses estilo calendário */}
          <div className="grid grid-cols-12 gap-2">
            {MONTH_NAMES.map((month, index) => {
              const hasData = monthlyData[index] !== undefined;
              const growth = hasData ? monthlyData[index].growth : 0;
              const profit = hasData ? monthlyData[index].profit : 0;
              const isPositive = growth >= 0;

              return (
                <div
                  key={month}
                  className={`relative text-center p-3 rounded-lg border transition-all hover:shadow-md ${
                    hasData
                      ? isPositive
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      : "bg-muted/30 border-muted"
                  }`}
                >
                  {/* Nome do mês */}
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {month}
                  </div>

                  {hasData ? (
                    <>
                      {/* Valor em dinheiro (principal) */}
                      <div
                        className={`text-sm font-bold mb-1 ${
                          isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        ${Math.abs(profit).toFixed(2)}
                      </div>



                      {/* Ícone */}
                      <div className="absolute top-1 right-1">
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">-</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total do ano */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-gradient-to-r from-background to-muted/30">
            <div className="flex items-center gap-3">
              {yearTotal >= 0 ? (
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Total do Ano {year}</div>
                <div className="text-xs text-muted-foreground">
                  Lucro: ${yearProfit.toFixed(2)}
                </div>
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${
                yearTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {yearProfit >= 0 ? "+" : ""}
              ${yearProfit.toFixed(2)}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-800" />
              <span>Crescimento Positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-800" />
              <span>Crescimento Negativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>Sem Dados</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

