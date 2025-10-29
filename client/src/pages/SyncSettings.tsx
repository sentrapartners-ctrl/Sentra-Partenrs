import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings as SettingsIcon, Save, RefreshCw } from "lucide-react";

export default function SyncSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    heartbeat_interval: '3600',
    sync_schedule: '07:00,14:00,21:00',
    auto_sync_enabled: 'true',
    send_full_history: 'false',
    history_limit_days: '90',
  });

  // Carregar configurações
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      // Converter objeto de settings para formato do estado
      const newSettings: any = {};
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        newSettings[key] = value.value;
      });
      
      setSettings(newSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error("Não foi possível carregar as configurações do sistema.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: typeof value === 'boolean' ? String(value) : value,
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              Configurações de Sincronização
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure o comportamento de sincronização e otimize o uso de recursos
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        {/* Sincronização */}
        <Card>
          <CardHeader>
            <CardTitle>Sincronização com MT4/MT5</CardTitle>
            <CardDescription>
              Configure como os EAs enviam dados para o servidor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Intervalo do Heartbeat */}
            <div className="space-y-2">
              <Label htmlFor="heartbeat_interval">
                Intervalo do Heartbeat (segundos)
              </Label>
              <Input
                id="heartbeat_interval"
                type="number"
                value={settings.heartbeat_interval}
                onChange={(e) => updateSetting('heartbeat_interval', e.target.value)}
                min="60"
                step="60"
              />
              <p className="text-sm text-muted-foreground">
                Frequência com que os EAs enviam atualizações de balance e posições.
                <br />
                <strong>Recomendado:</strong> 3600s (1 hora) para reduzir custos.
              </p>
            </div>

            {/* Horários de Sincronização Completa */}
            <div className="space-y-2">
              <Label htmlFor="sync_schedule">
                Horários de Sincronização Completa
              </Label>
              <Input
                id="sync_schedule"
                type="text"
                value={settings.sync_schedule}
                onChange={(e) => updateSetting('sync_schedule', e.target.value)}
                placeholder="07:00,14:00,21:00"
              />
              <p className="text-sm text-muted-foreground">
                Horários em que o histórico completo de trades é enviado (formato: HH:MM, separados por vírgula).
                <br />
                <strong>Exemplo:</strong> 07:00,14:00,21:00 (3x ao dia)
              </p>
            </div>

            {/* Ativar Sincronização Automática */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_sync_enabled">
                  Sincronização Automática
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ativar sincronização completa nos horários configurados
                </p>
              </div>
              <Switch
                id="auto_sync_enabled"
                checked={settings.auto_sync_enabled === 'true'}
                onCheckedChange={(checked) => updateSetting('auto_sync_enabled', checked)}
              />
            </div>

            {/* Enviar Histórico Completo */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="send_full_history">
                  Enviar Histórico no Heartbeat
                </Label>
                <p className="text-sm text-muted-foreground">
                  Incluir histórico de trades em cada heartbeat (aumenta consumo)
                </p>
              </div>
              <Switch
                id="send_full_history"
                checked={settings.send_full_history === 'true'}
                onCheckedChange={(checked) => updateSetting('send_full_history', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Histórico</CardTitle>
            <CardDescription>
              Configure o armazenamento de dados históricos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Limite de Histórico */}
            <div className="space-y-2">
              <Label htmlFor="history_limit_days">
                Limite de Histórico (dias)
              </Label>
              <Input
                id="history_limit_days"
                type="number"
                value={settings.history_limit_days}
                onChange={(e) => updateSetting('history_limit_days', e.target.value)}
                min="0"
                step="1"
              />
              <p className="text-sm text-muted-foreground">
                Número de dias de histórico a manter no banco. Use 0 para ilimitado.
                <br />
                <strong>Recomendado:</strong> 90 dias (reduz tamanho do banco)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Custo */}
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              💰 Estimativa de Custo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Configuração Atual:
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Heartbeat: {parseInt(settings.heartbeat_interval) / 60} minutos
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Sincronização: {settings.sync_schedule.split(',').length}x ao dia
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Custo Estimado (50 contas):
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  {parseInt(settings.heartbeat_interval) >= 3600 ? '$7-12/mês ✅' : '$30-50/mês ⚠️'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
