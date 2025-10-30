import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useState, useMemo } from "react";
import { InlineCurrencyValue } from "@/components/CurrencyValue";

export default function Strategies() {
  const { isAuthenticated, loading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  
  // Form state
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<string>("");
  const [marketConditions, setMarketConditions] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  const { data: accounts } = trpc.accounts.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: allTrades } = trpc.trades.list.useQuery(
    { 
      limit: 10000,
      accountId: selectedAccount === "all" ? undefined : parseInt(selectedAccount),
    },
    { enabled: isAuthenticated }
  );

  const { data: journalEntries, refetch: refetchJournal } = trpc.journal.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const saveJournalMutation = trpc.journal.save.useMutation({
    onSuccess: () => {
      refetchJournal();
      setIsDialogOpen(false);
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
      // Aplicar conversão baseada no tipo de conta
      const profit = (trade as any).isCentAccount 
        ? ((trade.profit || 0) / 100) 
        : (trade.profit || 0);
      
      profitsByDate.set(dateStr, (profitsByDate.get(dateStr) || 0) + profit);
    });
    
    return profitsByDate;
  }, [allTrades]);

  // Calcular lucro total do mês atual
  const monthlyProfit = useMemo(() => {
    if (!allTrades) return 0;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return allTrades.reduce((total, trade) => {
      if (trade.status !== 'closed' || !trade.closeTime) return total;
      
      const tradeDate = new Date(trade.closeTime);
      if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month) {
        const profit = (trade as any).isCentAccount 
          ? ((trade.profit || 0) / 100) 
          : (trade.profit || 0);
        return total + profit;
      }
      return total;
    }, 0);
  }, [allTrades, currentDate]);

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
    
    setIsDialogOpen(true);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Diário de Trading</h1>
            <p className="text-muted-foreground">
              Calendário com lucro diário e anotações de estratégias
            </p>
          </div>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts?.map((account: any) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.broker} - {account.accountNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2">
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
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center font-semibold text-xs text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Dias do mês */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="h-12 sm:h-16 md:h-20" />;
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
                          h-12 sm:h-16 md:h-20 p-0.5 sm:p-1 md:p-2 rounded border transition-all hover:bg-accent cursor-pointer
                          ${isToday ? 'border-blue-500 ring-1 md:ring-2 ring-blue-500 ring-offset-1 md:ring-offset-2' : 'border-border'}
                          ${day.getMonth() !== currentDate.getMonth() ? 'opacity-40' : ''}
                          ${hasProfit && profit > 0 ? 'bg-green-50 dark:bg-green-950/20' : ''}
                          ${hasProfit && profit < 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}
                        `}
                      >
                        <div className="flex flex-col h-full justify-between">
                          <span className={`text-[9px] sm:text-xs md:text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {day.getDate()}
                          </span>
                          {hasProfit && (
                            <div className={`font-semibold leading-tight ${profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              <InlineCurrencyValue value={profit} compact={true} />
                            </div>
                          )}
                          {hasJournal && (
                            <div className="flex justify-center">
                              <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-blue-500" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
              
              {/* Lucro Total do Mês */}
              <div className="mt-6 flex justify-center items-center">
                <div className="text-center px-6 py-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-2">Lucro Total do Mês</p>
                  <div className={`text-3xl font-bold ${
                    monthlyProfit > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : monthlyProfit < 0 
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground'
                  }`}>
                    <InlineCurrencyValue value={monthlyProfit} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Painel lateral de instruções */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selecione um dia</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-sm text-muted-foreground">
                  Clique em um dia no calendário para adicionar anotações
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog para adicionar/editar anotações */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDate?.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </DialogTitle>
              <DialogDescription>
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
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="mood">Como você se sentiu?</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger id="mood" className="border-border">
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
                  className="border-border resize-none"
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
                  className="border-border resize-none"
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
                  className="border-border resize-none"
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
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

