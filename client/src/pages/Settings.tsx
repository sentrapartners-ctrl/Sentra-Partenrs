import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { isAuthenticated, loading } = useAuth();
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [barkKey, setBarkKey] = useState("");
  const [barkDailyEnabled, setBarkDailyEnabled] = useState(true);
  const [barkWeeklyEnabled, setBarkWeeklyEnabled] = useState(true);
  const [barkDailyTime, setBarkDailyTime] = useState("19:00");
  const [barkWeeklyTime, setBarkWeeklyTime] = useState("08:00");

  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const testBark = trpc.settings.testBark.useMutation();

  // Carregar valores salvos quando settings mudar
  useEffect(() => {
    if (settings) {
      if (settings.barkKey) setBarkKey(settings.barkKey);
      if (settings.barkDailyEnabled !== undefined) setBarkDailyEnabled(settings.barkDailyEnabled);
      if (settings.barkWeeklyEnabled !== undefined) setBarkWeeklyEnabled(settings.barkWeeklyEnabled);
      if (settings.barkDailyTime) setBarkDailyTime(settings.barkDailyTime);
      if (settings.barkWeeklyTime) setBarkWeeklyTime(settings.barkWeeklyTime);
      if (settings.telegramChatId) setTelegramChatId(settings.telegramChatId);
      if (settings.telegramEnabled !== undefined) setTelegramEnabled(settings.telegramEnabled);
    }
  }, [settings]);

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
            Faça login para acessar configurações
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e alertas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Alertas e Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de Drawdown</p>
                <p className="text-sm text-muted-foreground">
                  Receba notificações quando o drawdown atingir o limite
                </p>
              </div>
              <Button variant="outline">
                {settings?.alertDrawdown ? "Ativado" : "Desativado"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de Trades</p>
                <p className="text-sm text-muted-foreground">
                  Notificações sobre abertura e fechamento de trades
                </p>
              </div>
              <Button variant="outline">
                {settings?.alertTrades ? "Ativado" : "Desativado"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de Conexão</p>
                <p className="text-sm text-muted-foreground">
                  Avisos quando a conexão com MT4/MT5 for perdida
                </p>
              </div>
              <Button variant="outline">
                {settings?.alertConnection ? "Ativado" : "Desativado"}
              </Button>
            </div>

            {settings?.drawdownThreshold && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Limite de Drawdown</p>
                  <p className="text-sm text-muted-foreground">
                    Percentual máximo de drawdown antes de alerta
                  </p>
                </div>
                <p className="text-lg font-bold">
                  {((settings.drawdownThreshold || 0) / 100).toFixed(2)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notificações Bark (iPhone)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Receba resumos diários (19h) e semanais (sábado 8h) via Bark no iPhone.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bark Key</label>
              <Input
                type="text"
                placeholder="Cole sua Bark Key aqui"
                value={barkKey}
                onChange={(e) => setBarkKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                1. Baixe o app "Bark" na App Store<br />
                2. Abra o app e copie sua chave da URL de teste<br />
                3. Cole aqui e pronto!
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium">Resumo Diário</p>
                <p className="text-sm text-muted-foreground">
                  Lucro, trades e win rate do dia
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={barkDailyTime || "19:00"}
                  onChange={(e) => setBarkDailyTime(e.target.value)}
                  className="w-24"
                  disabled={!barkDailyEnabled}
                />
                <Button
                  variant={barkDailyEnabled ? "default" : "outline"}
                  onClick={() => setBarkDailyEnabled(!barkDailyEnabled)}
                  size="sm"
                >
                  {barkDailyEnabled ? "Ativado" : "Desativado"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resumo Semanal</p>
                <p className="text-sm text-muted-foreground">
                  Sábado: resumo domingo a sexta
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={barkWeeklyTime || "08:00"}
                  onChange={(e) => setBarkWeeklyTime(e.target.value)}
                  className="w-24"
                  disabled={!barkWeeklyEnabled}
                />
                <Button
                  variant={barkWeeklyEnabled ? "default" : "outline"}
                  onClick={() => setBarkWeeklyEnabled(!barkWeeklyEnabled)}
                  size="sm"
                >
                  {barkWeeklyEnabled ? "Ativado" : "Desativado"}
                </Button>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              disabled={testBark.isLoading}
              onClick={async () => {
                const key = barkKey || settings?.barkKey;
                if (!key) {
                  toast.error("Configure sua Bark Key primeiro!");
                  return;
                }
                testBark.mutate(
                  { barkKey: key },
                  {
                    onSuccess: () => {
                      toast.success("🔔 Mensagem de teste enviada! Verifique seu iPhone.");
                    },
                    onError: (error) => {
                      toast.error("Erro ao enviar: " + error.message);
                    },
                  }
                );
              }}
            >
              Enviar Mensagem de Teste
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notificações Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Receba alertas e notificações diretamente no Telegram.
                <a href="/TELEGRAM_SETUP.md" target="_blank" className="text-primary ml-1">
                  Ver guia de configuração
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chat ID do Telegram</label>
              <Input
                type="text"
                placeholder="123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obtenha seu Chat ID iniciando conversa com o bot e acessando:
                <br />
                <code className="text-xs">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ativar Telegram</p>
                <p className="text-sm text-muted-foreground">
                  Enviar notificações via Telegram
                </p>
              </div>
              <Button
                variant={telegramEnabled ? "default" : "outline"}
                onClick={() => setTelegramEnabled(!telegramEnabled)}
              >
                {telegramEnabled ? "Ativado" : "Desativado"}
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => toast.info("Mensagem de teste enviada!")}
            >
              Enviar Mensagem de Teste
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferências Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Idioma</p>
                <p className="text-sm text-muted-foreground">
                  Idioma da interface
                </p>
              </div>
              <Button variant="outline">Português (BR)</Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Fuso Horário</p>
                <p className="text-sm text-muted-foreground">
                  Fuso horário para exibição de datas
                </p>
              </div>
              <Button variant="outline">GMT-3 (Brasília)</Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Moeda</p>
                <p className="text-sm text-muted-foreground">
                  Moeda padrão para exibição
                </p>
              </div>
              <Button variant="outline">USD ($)</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              setBarkKey("");
              setTelegramChatId("");
              setTelegramEnabled(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              updateSettings.mutate({
                barkKey: barkKey || undefined,
                barkDailyEnabled,
                barkWeeklyEnabled,
                barkDailyTime: barkDailyTime || "19:00",
                barkWeeklyTime: barkWeeklyTime || "08:00",
                telegramChatId: telegramChatId || undefined,
                telegramEnabled,
              });
            }}
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

