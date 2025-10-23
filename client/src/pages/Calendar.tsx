import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { useEffect } from "react";

export default function Calendar() {
  const { isAuthenticated, loading } = useAuth();

  const { data: events, refetch } = trpc.calendar.getEvents.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    // Atualiza a cada 5 minutos
    const interval = setInterval(() => refetch(), 300000);
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
          <p className="text-muted-foreground">
            Faça login para ver o calendário econômico
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high":
        return "Alto Impacto";
      case "medium":
        return "Médio Impacto";
      case "low":
        return "Baixo Impacto";
      default:
        return impact;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendário Econômico</h1>
          <p className="text-muted-foreground">
            Próximos eventos econômicos do Forex Factory
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Próximos 200 Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!events || events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando eventos do calendário...
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center min-w-[80px]">
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <span className="text-lg font-bold">
                        {new Date(event.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.country}</Badge>
                        <Badge variant={getImpactColor(event.impact)}>
                          {getImpactLabel(event.impact)}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg">{event.title}</h3>

                      {event.forecast && (
                        <div className="flex gap-4 text-sm">
                          {event.previous && (
                            <div>
                              <span className="text-muted-foreground">
                                Anterior:{" "}
                              </span>
                              <span className="font-medium">
                                {event.previous}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">
                              Previsão:{" "}
                            </span>
                            <span className="font-medium">{event.forecast}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {event.impact.toLowerCase() === "high" && (
                      <TrendingUp className="h-5 w-5 text-red-500" />
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

