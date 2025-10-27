import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface DrawdownData {
  timestamp: string;
  balance: number;
  equity: number;
  drawdown_percent: number;
}

interface DrawdownChartProps {
  data: DrawdownData[];
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  // Formatar dados para o gráfico
  const chartData = data.map((item) => ({
    timestamp: format(new Date(item.timestamp), "dd/MM"),
    balance: item.balance / 100, // Converter de cents
    equity: item.equity / 100,
    drawdown: item.drawdown_percent,
  }));

  // Calcular max drawdown
  const maxDrawdown = Math.max(...data.map(d => d.drawdown_percent || 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Drawdown vs Balance
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            Max Drawdown: <span className="text-red-500 font-semibold">{maxDrawdown.toFixed(2)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Balance', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{ value: 'Drawdown %', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'drawdown') return `${value.toFixed(2)}%`;
                  return `$${value.toFixed(2)}`;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Balance"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="drawdown"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Drawdown %"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Sem dados de drawdown disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}

