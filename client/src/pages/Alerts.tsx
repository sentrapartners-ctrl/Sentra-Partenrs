import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, Plus } from "lucide-react";
import { useEffect } from "react";

export default function Alerts() {
  const { isAuthenticated, loading } = useAuth();

  const { data: alerts, refetch } = trpc.alerts.list.useQuery(
    {},
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading, refetch]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Faça login para ver seus alertas</p>
        </div>
      </DashboardLayout>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      drawdown: "Drawdown",
      profit_target: "Meta de Lucro",
      loss_limit: "Limite de Perda",
      connection: "Conexão",
      custom: "Personalizado",
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Alertas</h1>
            <p className="text-muted-foreground">
              Notificações e alertas do sistema
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Alerta
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Histórico de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!alerts || alerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum alerta registrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg ${
                      !alert.isRead ? "bg-muted/50" : ""
                    }`}
                  >
                    <Bell
                      className={`h-5 w-5 mt-0.5 ${
                        alert.severity === "error"
                          ? "text-red-500"
                          : alert.severity === "warning"
                          ? "text-yellow-500"
                          : "text-blue-500"
                      }`}
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity === "error"
                            ? "Erro"
                            : alert.severity === "warning"
                            ? "Aviso"
                            : "Info"}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(alert.type)}
                        </Badge>
                        {!alert.isRead && (
                          <Badge variant="default">Novo</Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(alert.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {!alert.isRead && (
                      <Button variant="outline" size="sm">
                        Marcar como lido
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

