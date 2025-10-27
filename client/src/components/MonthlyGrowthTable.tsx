import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyData {
  month: string;
  start_balance: number;
  end_balance: number;
  growth_percent: number;
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
  const monthlyGrowth: Record<number, number> = {};
  let yearTotal = 0;

  data.forEach((item) => {
    const monthIndex = parseInt(item.month.split('-')[1]) - 1;
    monthlyGrowth[monthIndex] = item.growth_percent;
    yearTotal += item.growth_percent;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Crescimento Mensal - {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tabela de meses */}
          <div className="grid grid-cols-12 gap-2">
            {MONTH_NAMES.map((month, index) => (
              <div
                key={month}
                className="text-center p-2 rounded-lg border bg-card"
              >
                <div className="text-xs text-muted-foreground mb-1">{month}</div>
                <div
                  className={`text-sm font-semibold ${
                    monthlyGrowth[index] !== undefined
                      ? monthlyGrowth[index] >= 0
                        ? "text-green-500"
                        : "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {monthlyGrowth[index] !== undefined
                    ? `${monthlyGrowth[index] >= 0 ? "+" : ""}${monthlyGrowth[index].toFixed(2)}%`
                    : "-"}
                </div>
              </div>
            ))}
          </div>

          {/* Total do ano */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2">
              {yearTotal >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className="font-semibold">Total do Ano {year}</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                yearTotal >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {yearTotal >= 0 ? "+" : ""}
              {yearTotal.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

