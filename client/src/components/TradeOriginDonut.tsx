import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Bot, Radio, Hand } from "lucide-react";

interface TradeOriginData {
  origin: string;
  count: number;
  total_profit: number;
  wins: number;
}

interface TradeOriginDonutProps {
  data: TradeOriginData[];
}

const COLORS = {
  robot: "#8b5cf6",
  manual: "#6b7280",
  unknown: "#9ca3af",
};

const ICONS = {
  robot: Bot,
  manual: Hand,
  unknown: Hand,
};

const LABELS = {
  robot: "Trading Robots (EA)",
  manual: "Manual Trading",
  unknown: "Desconhecido",
};

export function TradeOriginDonut({ data }: TradeOriginDonutProps) {
  // Formatar dados para o gráfico
  const chartData = data.map((item) => ({
    name: LABELS[item.origin as keyof typeof LABELS] || item.origin,
    value: item.count,
    origin: item.origin,
    profit: item.total_profit,
    wins: item.wins,
  }));

  const totalTrades = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Distribuição por Tipo de Operação
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.origin as keyof typeof COLORS] || COLORS.unknown} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    const winRate = props.payload.wins / props.payload.value * 100;
                    return [
                      `${value} trades (${winRate.toFixed(1)}% win rate)`,
                      name
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legenda detalhada */}
            <div className="grid grid-cols-1 gap-2">
              {chartData.map((item) => {
                const Icon = ICONS[item.origin as keyof typeof ICONS] || Hand;
                const percentage = (item.value / totalTrades) * 100;
                const winRate = (item.wins / item.value) * 100;

                return (
                  <div
                    key={item.origin}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[item.origin as keyof typeof COLORS] }}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.value} trades</div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% | Win: {winRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados de origem de trades disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}

