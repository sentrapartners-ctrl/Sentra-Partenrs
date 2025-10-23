import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";

interface ForexEvent {
  date: string;
  time: string;
  country: string;
  impact: string;
  title: string;
  forecast?: string;
  previous?: string;
}

export default function Calendar() {
  const { isAuthenticated, loading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { data: events, isLoading } = trpc.calendar.getEvents.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15 * 60 * 1000, // 15 minutos
  });

  // Funções de navegação do calendário
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obter dias do mês
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Adicionar dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Contar eventos por dia
  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  // Converter horário para BR e US
  const convertToBRTime = (date: string, time: string): string => {
    try {
      const eventDate = new Date(date + ' ' + time);
      return eventDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch {
      return time;
    }
  };

  const convertToUSTime = (date: string, time: string): string => {
    try {
      const eventDate = new Date(date + ' ' + time);
      return eventDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
    } catch {
      return time;
    }
  };

  // Verificar se notícia já ocorreu
  const hasOccurred = (date: string, time: string): boolean => {
    try {
      const eventDate = new Date(date + ' ' + time);
      return eventDate < new Date();
    } catch {
      return false;
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Calendário Econômico</h1>
            <p className="text-muted-foreground">
              Eventos econômicos importantes do Forex Factory
            </p>
          </div>
          <Button onClick={goToToday} variant="outline">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Hoje
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button onClick={goToPreviousMonth} variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl capitalize">{monthName}</CardTitle>
              <Button onClick={goToNextMonth} variant="ghost" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando eventos...</p>
              </div>
            ) : (
              <>
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dias do mês */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dayEvents = getEventsForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const hasEvents = dayEvents.length > 0;
                    const highImpactCount = dayEvents.filter(e => e.impact === 'High').length;

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-2 rounded-lg border transition-all
                          ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-border'}
                          ${hasEvents ? 'hover:bg-accent cursor-pointer' : 'cursor-default'}
                          ${day.getMonth() !== currentDate.getMonth() ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex flex-col h-full">
                          <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {day.getDate()}
                          </span>
                          {hasEvents && (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="text-xs font-semibold">{dayEvents.length}</div>
                                {highImpactCount > 0 && (
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legenda */}
                <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Alto Impacto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500" />
                    <span>Hoje</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog de eventos do dia */}
        <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Eventos de {selectedDate?.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </DialogTitle>
            </DialogHeader>
            
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum evento econômico neste dia
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event, index) => {
                  const occurred = hasOccurred(event.date, event.time);
                  const brTime = convertToBRTime(event.date, event.time);
                  const usTime = convertToUSTime(event.date, event.time);

                  return (
                    <Card key={index} className={occurred ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={occurred ? "secondary" : "default"}>
                                {occurred ? '✓ Ocorreu' : '⏰ Pendente'}
                              </Badge>
                              <Badge
                                variant={
                                  event.impact === 'High' ? 'destructive' :
                                  event.impact === 'Medium' ? 'default' : 'secondary'
                                }
                              >
                                {event.impact}
                              </Badge>
                              <span className="text-lg font-semibold">{event.country}</span>
                            </div>
                            
                            <h3 className="font-semibold text-base">{event.title}</h3>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">BR:</span> {brTime}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">US:</span> {usTime}
                              </div>
                            </div>

                            {(event.forecast || event.previous) && (
                              <div className="flex gap-4 text-sm">
                                {event.forecast && (
                                  <div>
                                    <span className="text-muted-foreground">Previsão:</span>{' '}
                                    <span className="font-medium">{event.forecast}</span>
                                  </div>
                                )}
                                {event.previous && (
                                  <div>
                                    <span className="text-muted-foreground">Anterior:</span>{' '}
                                    <span className="font-medium">{event.previous}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

