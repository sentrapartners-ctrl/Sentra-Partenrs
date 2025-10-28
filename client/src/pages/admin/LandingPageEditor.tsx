import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";

interface VPSPlan {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface ExpertAdvisor {
  name: string;
  price: number;
  winRate: string;
  timeframe: string;
  description: string;
}

interface SubscriptionPlan {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface LandingConfig {
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroDescription: string;
  heroMetricProfit: string;
  heroMetricTrades: string;
  heroMetricWinRate: string;
  heroMetricProfitFactor: string;
  statTradesJournaled: string;
  statBacktestedSessions: string;
  statTradesShared: string;
  statTradersOnBoard: string;
  vpsPlans: VPSPlan[];
  expertAdvisors: ExpertAdvisor[];
  subscriptionPlans: SubscriptionPlan[];
  copyTradingTitle: string;
  copyTradingDescription: string;
  analyticsTitle: string;
  analyticsDescription: string;
  footerCtaTitle: string;
  footerCtaDescription: string;
}

export default function LandingPageEditor() {
  const [config, setConfig] = useState<LandingConfig>({
    heroTitle: "Tudo que você sempre",
    heroHighlight: "quis saber",
    heroSubtitle: "...mas suas planilhas nunca te contaram.",
    heroDescription: "A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.",
    heroMetricProfit: "+$127K",
    heroMetricTrades: "2,847",
    heroMetricWinRate: "73%",
    heroMetricProfitFactor: "1.8",
    statTradesJournaled: "1.2B+",
    statBacktestedSessions: "50K+",
    statTradesShared: "2.5M+",
    statTradersOnBoard: "12K+",
    vpsPlans: [
      { name: "VPS Starter", price: 15, features: ["2 GB RAM", "1 vCPU", "30 GB SSD", "Uptime 99.9%", "Windows Server"], popular: false },
      { name: "VPS Pro", price: 35, features: ["4 GB RAM", "2 vCPU", "60 GB SSD", "Uptime 99.9%", "Windows Server"], popular: true },
      { name: "VPS Enterprise", price: 75, features: ["8 GB RAM", "4 vCPU", "120 GB SSD", "Uptime 99.99%", "Windows Server"], popular: false },
    ],
    expertAdvisors: [
      { name: "Scalper Pro", price: 199, winRate: "78%", timeframe: "M1, M5", description: "EA de scalping para operações rápidas" },
      { name: "Trend Master", price: 249, winRate: "72%", timeframe: "H1, H4, D1", description: "Segue tendências de médio prazo" },
      { name: "Grid Trader", price: 179, winRate: "68%", timeframe: "H1, H4", description: "Estratégia de grid avançada" },
      { name: "News Trader", price: 299, winRate: "75%", timeframe: "M5, M15", description: "Opera em eventos de notícias" },
    ],
    subscriptionPlans: [
      { name: "Básico", price: 47, features: ["Copy Trading (1 conta master)", "Dashboard básico", "Suporte por email", "Atualizações mensais"], popular: false },
      { name: "Profissional", price: 97, features: ["Copy Trading (ilimitado)", "Dashboard avançado", "Todos os EAs inclusos", "Suporte prioritário 24/7", "Análise de risco avançada"], popular: true },
      { name: "Enterprise", price: 197, features: ["Tudo do Profissional", "VPS Starter incluído", "Consultoria mensal 1h", "EA customizado", "API access"], popular: false },
    ],
    copyTradingTitle: "Copy Trading Poderoso e Automatizado",
    copyTradingDescription: "Você foca em operar enquanto nós focamos em te ajudar a melhorar. Com copy trading automatizado, fazemos o trabalho pesado por você.",
    analyticsTitle: "Analise suas estatísticas de trading",
    analyticsDescription: "Entenda quais erros você cometeu, se arriscou mais do que planejado e muito mais estatísticas específicas de cada trade.",
    footerCtaTitle: "Pronto para Transformar Seu Trading?",
    footerCtaDescription: "Junte-se a milhares de traders profissionais que já estão usando nossa plataforma",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/landing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const addVPSPlan = () => {
    setConfig({
      ...config,
      vpsPlans: [...config.vpsPlans, { name: "Novo Plano", price: 0, features: [], popular: false }],
    });
  };

  const removeVPSPlan = (index: number) => {
    setConfig({
      ...config,
      vpsPlans: config.vpsPlans.filter((_, i) => i !== index),
    });
  };

  const updateVPSPlan = (index: number, field: keyof VPSPlan, value: any) => {
    const updated = [...config.vpsPlans];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, vpsPlans: updated });
  };

  const addVPSFeature = (planIndex: number) => {
    const updated = [...config.vpsPlans];
    updated[planIndex].features.push("Nova feature");
    setConfig({ ...config, vpsPlans: updated });
  };

  const removeVPSFeature = (planIndex: number, featureIndex: number) => {
    const updated = [...config.vpsPlans];
    updated[planIndex].features = updated[planIndex].features.filter((_, i) => i !== featureIndex);
    setConfig({ ...config, vpsPlans: updated });
  };

  const updateVPSFeature = (planIndex: number, featureIndex: number, value: string) => {
    const updated = [...config.vpsPlans];
    updated[planIndex].features[featureIndex] = value;
    setConfig({ ...config, vpsPlans: updated });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Editor da Landing Page</h1>
          <p className="text-gray-600">Edite todas as informações da página inicial</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="vps">VPS</TabsTrigger>
          <TabsTrigger value="eas">EAs</TabsTrigger>
          <TabsTrigger value="pricing">Preços</TabsTrigger>
          <TabsTrigger value="sections">Seções</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Seção Hero</CardTitle>
              <CardDescription>Edite o título, subtítulo e métricas da seção principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Título (parte 1)</Label>
                  <Input
                    value={config.heroTitle}
                    onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                    placeholder="Tudo que você sempre"
                  />
                </div>
                <div>
                  <Label>Título Destacado</Label>
                  <Input
                    value={config.heroHighlight}
                    onChange={(e) => setConfig({ ...config, heroHighlight: e.target.value })}
                    placeholder="quis saber"
                  />
                </div>
              </div>

              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={config.heroSubtitle}
                  onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                  placeholder="...mas suas planilhas nunca te contaram."
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={config.heroDescription}
                  onChange={(e) => setConfig({ ...config, heroDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Métricas do Dashboard</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label>Lucro Total</Label>
                    <Input
                      value={config.heroMetricProfit}
                      onChange={(e) => setConfig({ ...config, heroMetricProfit: e.target.value })}
                      placeholder="+$127K"
                    />
                  </div>
                  <div>
                    <Label>Trades</Label>
                    <Input
                      value={config.heroMetricTrades}
                      onChange={(e) => setConfig({ ...config, heroMetricTrades: e.target.value })}
                      placeholder="2,847"
                    />
                  </div>
                  <div>
                    <Label>Win Rate</Label>
                    <Input
                      value={config.heroMetricWinRate}
                      onChange={(e) => setConfig({ ...config, heroMetricWinRate: e.target.value })}
                      placeholder="73%"
                    />
                  </div>
                  <div>
                    <Label>Profit Factor</Label>
                    <Input
                      value={config.heroMetricProfitFactor}
                      onChange={(e) => setConfig({ ...config, heroMetricProfitFactor: e.target.value })}
                      placeholder="1.8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Section */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>Edite os números da seção de estatísticas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Trades Registrados</Label>
                  <Input
                    value={config.statTradesJournaled}
                    onChange={(e) => setConfig({ ...config, statTradesJournaled: e.target.value })}
                    placeholder="1.2B+"
                  />
                </div>
                <div>
                  <Label>Sessões Backtestadas</Label>
                  <Input
                    value={config.statBacktestedSessions}
                    onChange={(e) => setConfig({ ...config, statBacktestedSessions: e.target.value })}
                    placeholder="50K+"
                  />
                </div>
                <div>
                  <Label>Trades Compartilhados</Label>
                  <Input
                    value={config.statTradesShared}
                    onChange={(e) => setConfig({ ...config, statTradesShared: e.target.value })}
                    placeholder="2.5M+"
                  />
                </div>
                <div>
                  <Label>Traders Ativos</Label>
                  <Input
                    value={config.statTradersOnBoard}
                    onChange={(e) => setConfig({ ...config, statTradersOnBoard: e.target.value })}
                    placeholder="12K+"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VPS Plans */}
        <TabsContent value="vps">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Planos VPS</h2>
                <p className="text-gray-600">Gerencie os planos de VPS</p>
              </div>
              <Button onClick={addVPSPlan} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Plano
              </Button>
            </div>

            {config.vpsPlans.map((plan, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Plano {index + 1}</CardTitle>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVPSPlan(index)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nome do Plano</Label>
                      <Input
                        value={plan.name}
                        onChange={(e) => updateVPSPlan(index, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Preço (USD)</Label>
                      <Input
                        type="number"
                        value={plan.price}
                        onChange={(e) => updateVPSPlan(index, "price", Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plan.popular || false}
                          onChange={(e) => updateVPSPlan(index, "popular", e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span>Mais Popular</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Features</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addVPSFeature(index)}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar Feature
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {plan.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateVPSFeature(index, fIndex, e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVPSFeature(index, fIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs would follow similar pattern */}
        <TabsContent value="eas">
          <Card>
            <CardHeader>
              <CardTitle>Expert Advisors</CardTitle>
              <CardDescription>Em desenvolvimento...</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Assinatura</CardTitle>
              <CardDescription>Em desenvolvimento...</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Textos das Seções</CardTitle>
              <CardDescription>Edite os textos das seções Copy Trading, Analytics, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Título Copy Trading</Label>
                <Input
                  value={config.copyTradingTitle}
                  onChange={(e) => setConfig({ ...config, copyTradingTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição Copy Trading</Label>
                <Textarea
                  value={config.copyTradingDescription}
                  onChange={(e) => setConfig({ ...config, copyTradingDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Título Analytics</Label>
                <Input
                  value={config.analyticsTitle}
                  onChange={(e) => setConfig({ ...config, analyticsTitle: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição Analytics</Label>
                <Textarea
                  value={config.analyticsDescription}
                  onChange={(e) => setConfig({ ...config, analyticsDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Footer CTA</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={config.footerCtaTitle}
                      onChange={(e) => setConfig({ ...config, footerCtaTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={config.footerCtaDescription}
                      onChange={(e) => setConfig({ ...config, footerCtaDescription: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2 shadow-2xl">
          <Save className="h-5 w-5" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

