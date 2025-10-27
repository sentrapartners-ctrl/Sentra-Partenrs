import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

interface WeeklyData {
  day_of_week: number;
  day_name: string;
  total_trades: number;
  wins: number;
  total_profit: number;
}

interface WeeklyPerformanceChartProps {
  data: WeeklyData[];
}

const DAY_ABBR: Record<string, string> = {
  "Sunday": "Dom",
  "Monday": "Seg",
  "Tuesday": "Ter",
  "Wednesday": "Qua",
  "Thursday": "Qui",
  "Friday": "Sex",
  "Saturday": "Sáb",
};

export function WeeklyPerformanceChart({ data }: WeeklyPerformanceChartProps) {
  // Formatar dados para o gráfico
  const chartData = data.map((item) => ({
    day: DAY_ABBR[item.day_name] || item.day_name.substring(0, 3),
    trades: item.total_trades,
    wins: item.wins,
    losses: item.total_trades - item.wins,
    profit: item.total_profit / 100, // Converter de cents
    winRate: (item.wins / item.total_trades) * 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Performance por Dia da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'profit') return `$${value.toFixed(2)}`;
                    return value;
                  }}
                  labelFormatter={(label) => `Dia: ${label}`}
                />
                <Legend />
                <Bar dataKey="wins" fill="#10b981" name="Vitórias" stackId="a" />
                <Bar dataKey="losses" fill="#ef4444" name="Derrotas" stackId="a" />
              </BarChart>
            </ResponsiveContainer>

            {/* Tabela de resumo */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {chartData.map((item) => (
                <div key={item.day} className="p-2 rounded-lg border bg-card">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{item.day}</div>
                  <div className="text-sm font-semibold">{item.trades}</div>
                  <div className={`text-xs ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {item.winRate.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados de performance semanal disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}

