import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Save } from "lucide-react";
import { useState, useMemo } from "react";
import { InlineCurrencyValue } from "@/components/CurrencyValue";

export default function Strategies() {
  const { isAuthenticated, loading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Form state
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<string>("");
  const [marketConditions, setMarketConditions] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  const { data: allTrades } = trpc.trades.list.useQuery(
    { limit: 10000 },
    { enabled: isAuthenticated }
  );

  const { data: journalEntries, refetch: refetchJournal } = trpc.journal.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const saveJournalMutation = trpc.journal.save.useMutation({
    onSuccess: () => {
      refetchJournal();
      setIsSheetOpen(false);
    },
  });

  // Funções de navegação do calendário
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
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

  // Calcular lucro por dia
  const dailyProfits = useMemo(() => {
    if (!allTrades) return new Map<string, number>();
    
    const profitsByDate = new Map<string, number>();
    
    allTrades.forEach((trade) => {
      if (trade.status !== 'closed' || !trade.closeTime) return;
      
      const dateStr = new Date(trade.closeTime).toISOString().split('T')[0];
      const profit = (trade.profit || 0) / (trade.isCentAccount ? 10000 : 100);
      
      profitsByDate.set(dateStr, (profitsByDate.get(dateStr) || 0) + profit);
    });
    
    return profitsByDate;
  }, [allTrades]);

  // Obter entrada do journal para uma data
  const getJournalForDate = (date: Date) => {
    if (!journalEntries) return null;
    const dateStr = date.toISOString().split('T')[0];
    return journalEntries.find(j => j.date === dateStr);
  };

  // Abrir sheet para adicionar/editar anotação
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const journal = getJournalForDate(date);
    
    if (journal) {
      setNotes(journal.notes || "");
      setMood(journal.mood || "");
      setMarketConditions(journal.marketConditions || "");
      setLessonsLearned(journal.lessonsLearned || "");
    } else {
      setNotes("");
      setMood("");
      setMarketConditions("");
      setLessonsLearned("");
    }
    
    setIsSheetOpen(true);
  };

  // Salvar anotação
  const handleSave = () => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    saveJournalMutation.mutate({
      date: dateStr,
      notes,
      mood: mood || undefined,
      marketConditions,
      lessonsLearned,
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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
            Faça login para ver seu diário de trading
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Diário de Trading</h1>
          <p className="text-muted-foreground">
            Calendário com lucro diário e anotações de estratégias
          </p>
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

                const dateStr = day.toISOString().split('T')[0];
                const profit = dailyProfits.get(dateStr) || 0;
                const isToday = day.toDateString() === new Date().toDateString();
                const hasJournal = !!getJournalForDate(day);
                const hasProfit = profit !== 0;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                      aspect-square p-2 rounded-lg border transition-all hover:bg-accent cursor-pointer
                      ${isToday ? 'border-blue-500 ring-2 ring-blue-500' : 'border-border'}
                      ${day.getMonth() !== currentDate.getMonth() ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {day.getDate()}
                      </span>
                      {hasProfit && (
                        <div className={`text-xs font-semibold mt-1 ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profit > 0 ? '+' : ''}<InlineCurrencyValue value={profit} />
                        </div>
                      )}
                      {hasJournal && (
                        <div className="mt-auto">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto" />
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
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Com anotações</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-blue-500" />
                <span>Hoje</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sheet para adicionar/editar anotações */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {selectedDate?.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </SheetTitle>
              <SheetDescription>
                {selectedDate && dailyProfits.get(selectedDate.toISOString().split('T')[0]) !== undefined && (
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Lucro do dia: </span>
                    <span className={`text-lg font-semibold ${
                      (dailyProfits.get(selectedDate.toISOString().split('T')[0]) || 0) > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      <InlineCurrencyValue value={dailyProfits.get(selectedDate.toISOString().split('T')[0]) || 0} />
                    </span>
                  </div>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="mood">Como você se sentiu?</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger id="mood">
                    <SelectValue placeholder="Selecione seu humor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">😄 Excelente</SelectItem>
                    <SelectItem value="good">🙂 Bom</SelectItem>
                    <SelectItem value="neutral">😐 Neutro</SelectItem>
                    <SelectItem value="bad">😟 Ruim</SelectItem>
                    <SelectItem value="terrible">😢 Péssimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Anotações do Dia</Label>
                <Textarea
                  id="notes"
                  placeholder="O que aconteceu hoje? Como foram seus trades?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketConditions">Condições do Mercado</Label>
                <Textarea
                  id="marketConditions"
                  placeholder="Como estava o mercado? Tendência, volatilidade, notícias..."
                  value={marketConditions}
                  onChange={(e) => setMarketConditions(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonsLearned">Lições Aprendidas</Label>
                <Textarea
                  id="lessonsLearned"
                  placeholder="O que você aprendeu hoje? O que faria diferente?"
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full"
                disabled={saveJournalMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveJournalMutation.isPending ? 'Salvando...' : 'Salvar Anotações'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}

