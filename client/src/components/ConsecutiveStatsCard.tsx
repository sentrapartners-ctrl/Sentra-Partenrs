import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "./ui/progress";
import { CurrencyValue } from "./CurrencyValue";

interface ConsecutiveStatsProps {
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxConsecutiveProfit: number;
  maxConsecutiveLoss: number;
  bestTrade: number;
  worstTrade: number;
}

export function ConsecutiveStatsCard({
  maxConsecutiveWins,
  maxConsecutiveLosses,
  maxConsecutiveProfit,
  maxConsecutiveLoss,
  bestTrade,
  worstTrade,
}: ConsecutiveStatsProps) {
  // Normalizar para barras de progresso
  const maxWinsLosses = Math.max(maxConsecutiveWins, maxConsecutiveLosses, 1);
  const winsProgress = (maxConsecutiveWins / maxWinsLosses) * 100;
  const lossesProgress = (maxConsecutiveLosses / maxWinsLosses) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Estatísticas de Extremos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Best Trade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Melhor Trade</span>
              <span className="text-lg font-bold text-green-500">
                <CurrencyValue value={bestTrade} />
              </span>
            </div>
            <div className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
          </div>

          {/* Worst Trade */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pior Trade</span>
              <span className="text-lg font-bold text-red-500">
                <CurrencyValue value={worstTrade} />
              </span>
            </div>
            <div className="h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
          </div>

          {/* Max Consecutive Wins */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Vitórias Consecutivas</span>
              </div>
              <span className="text-2xl font-bold text-green-500">{maxConsecutiveWins}</span>
            </div>
            <Progress value={winsProgress} className="h-2 bg-green-100" />
          </div>

          {/* Max Consecutive Losses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Derrotas Consecutivas</span>
              </div>
              <span className="text-2xl font-bold text-red-500">{maxConsecutiveLosses}</span>
            </div>
            <Progress value={lossesProgress} className="h-2 bg-red-100" />
          </div>

          {/* Max Consecutive Profit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Lucro Consecutivo Máximo</span>
              <span className="text-lg font-bold text-green-500">
                <CurrencyValue value={maxConsecutiveProfit} />
              </span>
            </div>
          </div>

          {/* Max Consecutive Loss */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Prejuízo Consecutivo Máximo</span>
              <span className="text-lg font-bold text-red-500">
                <CurrencyValue value={maxConsecutiveLoss} />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

