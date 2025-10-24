import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Save } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { InlineCurrencyValue } from "@/components/CurrencyValue";

export default function Strategies() {
  const { isAuthenticated, loading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [journalContent, setJournalContent] = useState("");
  const [emotion, setEmotion] = useState<string>("");
  const [marketCondition, setMarketCondition] = useState<string>("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Fetch daily profits for calendar
  const { data: dailyProfits } = trpc.journal.getDailyProfits.useQuery(
    { year, month },
    { enabled: isAuthenticated }
  );

  // Fetch journal entry for selected date
  const { data: journalEntry, refetch: refetchJournal } = trpc.journal.getByDate.useQuery(
    { date: selectedDate || "" },
    { enabled: isAuthenticated && !!selectedDate }
  );

  // Fetch trades for selected date
  const { data: allTrades } = trpc.trades.list.useQuery(
    { limit: 10000 },
    { enabled: isAuthenticated && !!selectedDate }
  );

  const tradesForSelectedDate = useMemo(() => {
    if (!allTrades || !selectedDate) return [];
    return allTrades.filter((trade) => {
      if (!trade.closeTime) return false;
      const tradeDate = new Date(trade.closeTime).toISOString().split('T')[0];
      return tradeDate === selectedDate;
    });
  }, [allTrades, selectedDate]);

  const createJournal = trpc.journal.create.useMutation({
    onSuccess: () => refetchJournal(),
  });

  const updateJournal = trpc.journal.update.useMutation({
    onSuccess: () => refetchJournal(),
  });

  // Update form when journal entry loads
  useEffect(() => {
    if (journalEntry) {
      setJournalContent(journalEntry.content || "");
      setEmotion(journalEntry.emotion || "");
      setMarketCondition(journalEntry.marketCondition || "");
    } else {
      setJournalContent("");
      setEmotion("");
      setMarketCondition("");
    }
  }, [journalEntry]);

  const handleSaveJournal = async () => {
    if (!selectedDate) return;

    const data = {
      content: journalContent,
      emotion: emotion as any,
      marketCondition: marketCondition as any,
    };

    if (journalEntry) {
      await updateJournal.mutateAsync({ id: journalEntry.id, ...data });
    } else {
      await createJournal.mutateAsync({ date: selectedDate, ...data });
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const profit = dailyProfits?.[dateStr] || 0;
      const hasProfit = profit !== 0;
      const isPositive = profit > 0;
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            p-2 border rounded-lg cursor-pointer transition-all hover:shadow-md min-h-[60px]
            ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            ${isToday ? 'border-blue-500 border-2' : 'border-border'}
            ${hasProfit ? (isPositive ? 'bg-green-50' : 'bg-red-50') : 'bg-background'}
          `}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
            {hasProfit && (
              <InlineCurrencyValue
                value={profit}
                className={`text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
              />
            )}
          </div>
        </div>
      );
    }

    return days;
  };

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
          <p className="text-muted-foreground">Faça login para acessar o diário de trading</p>
        </div>
      </DashboardLayout>
    );
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Diário de Trading</h1>
          <p className="text-muted-foreground">
            Calendário com lucro diário e anotações de estratégias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {monthNames[month - 1]} {year}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={previousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Journal Entry */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate ? `Notas - ${selectedDate}` : 'Selecione um dia'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-4">
                    {/* Emotion */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Emoção</label>
                      <select
                        value={emotion}
                        onChange={(e) => setEmotion(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Selecione...</option>
                        <option value="confident">Confiante ✅</option>
                        <option value="nervous">Nervoso 😰</option>
                        <option value="greedy">Ganancioso 🤑</option>
                        <option value="fearful">Com medo 😨</option>
                        <option value="neutral">Neutro 😐</option>
                        <option value="disciplined">Disciplinado 💪</option>
                      </select>
                    </div>

                    {/* Market Condition */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Condição do Mercado</label>
                      <select
                        value={marketCondition}
                        onChange={(e) => setMarketCondition(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="">Selecione...</option>
                        <option value="trending">Tendência 📈</option>
                        <option value="ranging">Lateral 〰️</option>
                        <option value="volatile">Volátil ⚡</option>
                        <option value="quiet">Calmo 😴</option>
                      </select>
                    </div>

                    {/* Journal Content */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Anotações</label>
                      <Textarea
                        value={journalContent}
                        onChange={(e) => setJournalContent(e.target.value)}
                        placeholder="Escreva suas observações, estratégias, razões dos trades..."
                        className="min-h-[200px]"
                      />
                    </div>

                    {/* Trades Summary */}
                    {tradesForSelectedDate.length > 0 && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Trades do dia:</p>
                        <p className="text-xs text-muted-foreground">
                          {tradesForSelectedDate.length} operações realizadas
                        </p>
                      </div>
                    )}

                    {/* Save Button */}
                    <Button
                      onClick={handleSaveJournal}
                      className="w-full"
                      disabled={createJournal.isPending || updateJournal.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Anotações
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Clique em um dia no calendário para adicionar anotações</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Week Summary */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Trades</p>
                  <p className="text-2xl font-bold">{tradesForSelectedDate.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro do Dia</p>
                  <InlineCurrencyValue
                    value={dailyProfits?.[selectedDate] || 0}
                    className="text-2xl font-bold"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">
                    {tradesForSelectedDate.length > 0
                      ? Math.round(
                          (tradesForSelectedDate.filter((t) => (t.profit || 0) > 0).length /
                            tradesForSelectedDate.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trades Vencedores</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tradesForSelectedDate.filter((t) => (t.profit || 0) > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

