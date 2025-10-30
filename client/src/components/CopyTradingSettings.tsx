import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Filter,
  Save,
  Info
} from "lucide-react";

interface CopySettings {
  // Configurações de SL/TP
  slTpMode: 'copy_100' | 'multiply' | 'fixed_pips' | 'none';
  slMultiplier: number;
  tpMultiplier: number;
  slFixedPips: number;
  tpFixedPips: number;
  
  // Configurações de Volume
  volumeMode: 'copy_100' | 'multiply' | 'fixed';
  volumeMultiplier: number;
  volumeFixed: number;
  maxVolume: number;
  
  // Filtros
  enableSymbolFilter: boolean;
  allowedSymbols: string[];
  enableDirectionFilter: boolean;
  allowedDirections: ('BUY' | 'SELL')[];
  
  // Gerenciamento de Risco
  maxDailyLoss: number;
  maxDailyTrades: number;
  enableRiskManagement: boolean;
}

const defaultSettings: CopySettings = {
  slTpMode: 'copy_100',
  slMultiplier: 1.0,
  tpMultiplier: 1.0,
  slFixedPips: 20,
  tpFixedPips: 40,
  volumeMode: 'copy_100',
  volumeMultiplier: 1.0,
  volumeFixed: 0.01,
  maxVolume: 1.0,
  enableSymbolFilter: false,
  allowedSymbols: [],
  enableDirectionFilter: false,
  allowedDirections: ['BUY', 'SELL'],
  maxDailyLoss: 100,
  maxDailyTrades: 20,
  enableRiskManagement: false,
};

interface Props {
  masterAccountId: string;
  slaveAccountId: string;
  onSave: (settings: CopySettings) => void;
}

export default function CopyTradingSettings({ masterAccountId, slaveAccountId, onSave }: Props) {
  const [settings, setSettings] = useState<CopySettings>(defaultSettings);
  const [symbolInput, setSymbolInput] = useState('');

  const updateSetting = <K extends keyof CopySettings>(key: K, value: CopySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addSymbol = () => {
    if (symbolInput && !settings.allowedSymbols.includes(symbolInput.toUpperCase())) {
      updateSetting('allowedSymbols', [...settings.allowedSymbols, symbolInput.toUpperCase()]);
      setSymbolInput('');
    }
  };

  const removeSymbol = (symbol: string) => {
    updateSetting('allowedSymbols', settings.allowedSymbols.filter(s => s !== symbol));
  };

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configurando cópia: <strong>Master {masterAccountId}</strong> → <strong>Slave {slaveAccountId}</strong>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="sltp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sltp">
            <TrendingUp className="h-4 w-4 mr-2" />
            SL/TP
          </TabsTrigger>
          <TabsTrigger value="volume">
            <TrendingDown className="h-4 w-4 mr-2" />
            Volume
          </TabsTrigger>
          <TabsTrigger value="filters">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Shield className="h-4 w-4 mr-2" />
            Risco
          </TabsTrigger>
        </TabsList>

        {/* Tab: Stop Loss / Take Profit */}
        <TabsContent value="sltp">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Stop Loss e Take Profit</CardTitle>
              <CardDescription>
                Escolha como copiar os níveis de SL e TP do Master
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Modo de Cópia</Label>
                <Select
                  value={settings.slTpMode}
                  onValueChange={(value) => updateSetting('slTpMode', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="copy_100">
                      Copiar 100% (Idêntico ao Master)
                    </SelectItem>
                    <SelectItem value="multiply">
                      Multiplicador (Ajustar proporcionalmente)
                    </SelectItem>
                    <SelectItem value="fixed_pips">
                      Fixo em Pips (Valores personalizados)
                    </SelectItem>
                    <SelectItem value="none">
                      Sem SL/TP (Não copiar)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.slTpMode === 'multiply' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slMultiplier">
                      Multiplicador de Stop Loss
                    </Label>
                    <Input
                      id="slMultiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      value={settings.slMultiplier}
                      onChange={(e) => updateSetting('slMultiplier', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: 1.5 = SL 50% maior que o Master
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tpMultiplier">
                      Multiplicador de Take Profit
                    </Label>
                    <Input
                      id="tpMultiplier"
                      type="number"
                      step="0.1"
                      min="0"
                      value={settings.tpMultiplier}
                      onChange={(e) => updateSetting('tpMultiplier', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: 0.8 = TP 20% menor que o Master
                    </p>
                  </div>
                </div>
              )}

              {settings.slTpMode === 'fixed_pips' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slFixedPips">
                      Stop Loss Fixo (pips)
                    </Label>
                    <Input
                      id="slFixedPips"
                      type="number"
                      min="0"
                      value={settings.slFixedPips}
                      onChange={(e) => updateSetting('slFixedPips', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      SL sempre a esta distância do preço de entrada
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tpFixedPips">
                      Take Profit Fixo (pips)
                    </Label>
                    <Input
                      id="tpFixedPips"
                      type="number"
                      min="0"
                      value={settings.tpFixedPips}
                      onChange={(e) => updateSetting('tpFixedPips', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      TP sempre a esta distância do preço de entrada
                    </p>
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {settings.slTpMode === 'copy_100' && 'Os níveis de SL e TP serão copiados exatamente como no Master.'}
                  {settings.slTpMode === 'multiply' && 'Os níveis serão ajustados proporcionalmente aos multiplicadores.'}
                  {settings.slTpMode === 'fixed_pips' && 'Todos os trades terão SL/TP fixos, independente do Master.'}
                  {settings.slTpMode === 'none' && 'Trades serão abertos sem SL/TP. Use com cautela!'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Volume */}
        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Volume</CardTitle>
              <CardDescription>
                Ajuste o tamanho dos lotes copiados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Modo de Volume</Label>
                <Select
                  value={settings.volumeMode}
                  onValueChange={(value) => updateSetting('volumeMode', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="copy_100">
                      Copiar 100% (Mesmo volume do Master)
                    </SelectItem>
                    <SelectItem value="multiply">
                      Multiplicador (Proporcional)
                    </SelectItem>
                    <SelectItem value="fixed">
                      Fixo (Sempre o mesmo volume)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.volumeMode === 'multiply' && (
                <div className="space-y-2">
                  <Label htmlFor="volumeMultiplier">
                    Multiplicador de Volume
                  </Label>
                  <Input
                    id="volumeMultiplier"
                    type="number"
                    step="0.1"
                    min="0.01"
                    value={settings.volumeMultiplier}
                    onChange={(e) => updateSetting('volumeMultiplier', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: Master abre 1.0 lote → Slave abre {settings.volumeMultiplier} lote(s)
                  </p>
                </div>
              )}

              {settings.volumeMode === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="volumeFixed">
                    Volume Fixo (lotes)
                  </Label>
                  <Input
                    id="volumeFixed"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={settings.volumeFixed}
                    onChange={(e) => updateSetting('volumeFixed', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Todos os trades serão abertos com este volume
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="maxVolume">
                  Volume Máximo por Trade
                </Label>
                <Input
                  id="maxVolume"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.maxVolume}
                  onChange={(e) => updateSetting('maxVolume', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Limite de segurança - trades acima deste volume não serão copiados
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Filtros */}
        <TabsContent value="filters">
          <div className="space-y-4">
            {/* Filtro de Símbolos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filtro de Símbolos</CardTitle>
                    <CardDescription>
                      Escolha quais pares copiar
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.enableSymbolFilter}
                    onCheckedChange={(checked) => updateSetting('enableSymbolFilter', checked)}
                  />
                </div>
              </CardHeader>
              {settings.enableSymbolFilter && (
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: EURUSD"
                      value={symbolInput}
                      onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
                    />
                    <Button onClick={addSymbol}>Adicionar</Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {settings.allowedSymbols.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum símbolo adicionado. Adicione os pares que deseja copiar.
                      </p>
                    ) : (
                      settings.allowedSymbols.map((symbol) => (
                        <Badge
                          key={symbol}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSymbol(symbol)}
                        >
                          {symbol} ×
                        </Badge>
                      ))
                    )}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Apenas trades destes símbolos serão copiados. Deixe vazio para copiar todos.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>

            {/* Filtro de Direção */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filtro de Direção</CardTitle>
                    <CardDescription>
                      Escolha quais tipos de trade copiar
                    </CardDescription>
                  </div>
                  <Switch
                    checked={settings.enableDirectionFilter}
                    onCheckedChange={(checked) => updateSetting('enableDirectionFilter', checked)}
                  />
                </div>
              </CardHeader>
              {settings.enableDirectionFilter && (
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow-buy"
                        checked={settings.allowedDirections.includes('BUY')}
                        onCheckedChange={(checked) => {
                          const directions = checked
                            ? [...settings.allowedDirections, 'BUY']
                            : settings.allowedDirections.filter(d => d !== 'BUY');
                          updateSetting('allowedDirections', directions as any);
                        }}
                      />
                      <Label htmlFor="allow-buy" className="cursor-pointer">
                        Copiar BUY
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allow-sell"
                        checked={settings.allowedDirections.includes('SELL')}
                        onCheckedChange={(checked) => {
                          const directions = checked
                            ? [...settings.allowedDirections, 'SELL']
                            : settings.allowedDirections.filter(d => d !== 'SELL');
                          updateSetting('allowedDirections', directions as any);
                        }}
                      />
                      <Label htmlFor="allow-sell" className="cursor-pointer">
                        Copiar SELL
                      </Label>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Gerenciamento de Risco */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Risco</CardTitle>
                  <CardDescription>
                    Proteções automáticas para sua conta
                  </CardDescription>
                </div>
                <Switch
                  checked={settings.enableRiskManagement}
                  onCheckedChange={(checked) => updateSetting('enableRiskManagement', checked)}
                />
              </div>
            </CardHeader>
            {settings.enableRiskManagement && (
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="maxDailyLoss">
                    Perda Máxima Diária ($)
                  </Label>
                  <Input
                    id="maxDailyLoss"
                    type="number"
                    min="0"
                    value={settings.maxDailyLoss}
                    onChange={(e) => updateSetting('maxDailyLoss', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Parar de copiar se perder este valor em um dia
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDailyTrades">
                    Máximo de Trades por Dia
                  </Label>
                  <Input
                    id="maxDailyTrades"
                    type="number"
                    min="1"
                    value={settings.maxDailyTrades}
                    onChange={(e) => updateSetting('maxDailyTrades', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Parar de copiar após este número de trades
                  </p>
                </div>

                <Alert variant="destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Quando os limites forem atingidos, a cópia será pausada automaticamente até o próximo dia.
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
