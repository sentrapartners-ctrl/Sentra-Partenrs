import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DollarSign } from "lucide-react";
import { CurrencyValue } from "./CurrencyValue";

interface ProfitLossDonutProps {
  grossProfit: number;
  grossLoss: number;
}

export function ProfitLossDonut({ grossProfit, grossLoss }: ProfitLossDonutProps) {
  const netProfit = grossProfit + grossLoss; // grossLoss já é negativo

  const chartData = [
    { name: "Gross Profit", value: grossProfit, color: "#10b981" },
    { name: "Gross Loss", value: Math.abs(grossLoss), color: "#ef4444" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Profit & Loss Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gráfico Donut */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Valor total no centro */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${netProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Gross Profit</span>
              </div>
              <div className="text-lg font-bold text-green-500">
                ${grossProfit.toFixed(2)}
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-muted-foreground">Gross Loss</span>
              </div>
              <div className="text-lg font-bold text-red-500">
                ${Math.abs(grossLoss).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

