import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Shield, TrendingUp, Activity } from "lucide-react";
import { Progress } from "./ui/progress";

interface RiskMetricsProps {
  sharpRatio: number;
  profitFactor: number;
  recoveryFactor: number;
}

export function RiskMetricsCard({ sharpRatio, profitFactor, recoveryFactor }: RiskMetricsProps) {
  // Normalizar valores para barras de progresso (0-100)
  const normalizeSharp = Math.min((sharpRatio / 5) * 100, 100);
  const normalizeProfitFactor = Math.min((profitFactor / 7) * 100, 100);
  const normalizeRecovery = Math.min((recoveryFactor / 57) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Métricas de Risco Avançadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Sharp Ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sharp Ratio</span>
              </div>
              <span className="text-2xl font-bold">{sharpRatio.toFixed(2)}</span>
            </div>
            <Progress value={normalizeSharp} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Retorno ajustado ao risco (0-5 scale)
            </p>
          </div>

          {/* Profit Factor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Profit Factor</span>
              </div>
              <span className="text-2xl font-bold text-green-500">{profitFactor.toFixed(2)}</span>
            </div>
            <Progress value={normalizeProfitFactor} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Razão entre lucro bruto e prejuízo bruto (0-7 scale)
            </p>
          </div>

          {/* Recovery Factor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recovery Factor</span>
              </div>
              <span className="text-2xl font-bold text-blue-500">{recoveryFactor.toFixed(2)}</span>
            </div>
            <Progress value={normalizeRecovery} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Lucro líquido dividido pelo drawdown máximo (0-57 scale)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

