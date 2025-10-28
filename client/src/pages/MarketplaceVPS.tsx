import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Network, Zap, Gift } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

interface VPSProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    bandwidth: string;
    uptime: string;
  };
  maxInstances: {
    mt4: number;
    mt5: number;
  };
  location: string;
  isFree?: boolean;
  recommended?: boolean;
}

const vpsProducts: VPSProduct[] = [
  {
    id: "1",
    name: "VPS Starter",
    slug: "vps-starter",
    price: 29.00,
    description: "VPS básica para 1-2 EAs",
    specs: {
      cpu: "1 vCore",
      ram: "1GB",
      storage: "20GB SSD",
      bandwidth: "1TB",
      uptime: "99.9%"
    },
    maxInstances: {
      mt4: 2,
      mt5: 2
    },
    location: "São Paulo, Brasil"
  },
  {
    id: "2",
    name: "VPS Professional",
    slug: "vps-professional",
    price: 49.00,
    description: "VPS intermediária para 3-5 EAs",
    specs: {
      cpu: "2 vCores",
      ram: "2GB",
      storage: "40GB SSD",
      bandwidth: "2TB",
      uptime: "99.9%"
    },
    maxInstances: {
      mt4: 5,
      mt5: 5
    },
    location: "São Paulo, Brasil",
    recommended: true
  },
  {
    id: "3",
    name: "VPS Premium",
    slug: "vps-premium-free",
    price: 0,
    description: "VPS avançada - INCLUÍDA no plano Premium",
    specs: {
      cpu: "2 vCores",
      ram: "2GB",
      storage: "60GB SSD",
      bandwidth: "3TB",
      uptime: "99.99%"
    },
    maxInstances: {
      mt4: 10,
      mt5: 10
    },
    location: "São Paulo, Brasil",
    isFree: true
  },
  {
    id: "4",
    name: "VPS Enterprise",
    slug: "vps-enterprise",
    price: 99.00,
    description: "VPS de alto desempenho para traders profissionais",
    specs: {
      cpu: "4 vCores",
      ram: "4GB",
      storage: "100GB SSD",
      bandwidth: "5TB",
      uptime: "99.99%"
    },
    maxInstances: {
      mt4: 20,
      mt5: 20
    },
    location: "São Paulo, Brasil"
  }
];

export default function MarketplaceVPS() {
  const [selectedVPS, setSelectedVPS] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async (vps: VPSProduct) => {
    if (vps.isFree) {
      toast.info("Esta VPS está incluída no plano Premium. Assine o plano Premium para ter acesso!");
      return;
    }

    setIsLoading(true);
    setSelectedVPS(vps.id);

    try {
      const response = await fetch("/api/checkout/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: vps.price,
          price_currency: "usd",
          order_description: `Sentra Partners - ${vps.name}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.payment_url) {
          window.location.href = data.payment_url;
        }
      } else {
        throw new Error("Erro ao criar pagamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar. Tente novamente.");
      setIsLoading(false);
      setSelectedVPS(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Marketplace VPS</h1>
          <p className="text-xl text-muted-foreground">
            Servidores VPS otimizados para trading. Baixa latência, alta disponibilidade e suporte 24/7.
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="flex items-center gap-4 py-4">
            <Gift className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="font-semibold">VPS Grátis no Plano Premium!</h3>
              <p className="text-sm text-muted-foreground">
                Assinantes do plano Premium recebem uma VPS de 2GB RAM gratuitamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VPS Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vpsProducts.map((vps) => (
            <Card 
              key={vps.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                vps.recommended ? 'border-2 border-primary' : ''
              } ${vps.isFree ? 'border-2 border-purple-500' : ''}`}
            >
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {vps.recommended && (
                  <Badge className="bg-primary">Recomendado</Badge>
                )}
                {vps.isFree && (
                  <Badge className="bg-purple-500">Grátis Premium</Badge>
                )}
              </div>

              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-4">
                  <Server className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{vps.name}</CardTitle>
                <CardDescription>{vps.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className="mb-4">
                  {vps.isFree ? (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-purple-500">GRÁTIS</span>
                      <span className="text-sm text-muted-foreground ml-2">com Premium</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">R$ {vps.price.toFixed(2)}</span>
                      <span className="text-muted-foreground ml-2">/mês</span>
                    </div>
                  )}
                </div>

                {/* Specs */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span>{vps.specs.cpu}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span>{vps.specs.ram} RAM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>{vps.specs.storage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span>{vps.specs.bandwidth}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>Uptime {vps.specs.uptime}</span>
                  </div>
                </div>

                {/* Max Instances */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Instâncias simultâneas:</p>
                  <div className="flex gap-4 text-sm">
                    <span>MT4: <strong>{vps.maxInstances.mt4}</strong></span>
                    <span>MT5: <strong>{vps.maxInstances.mt5}</strong></span>
                  </div>
                </div>

                {/* Location */}
                <div className="text-xs text-muted-foreground">
                  📍 {vps.location}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full"
                  variant={vps.recommended ? "default" : "outline"}
                  onClick={() => handlePurchase(vps)}
                  disabled={isLoading || vps.isFree}
                >
                  {vps.isFree ? "Requer Plano Premium" : isLoading && selectedVPS === vps.id ? "Processando..." : "Comprar Agora"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Alta Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Servidores otimizados com SSDs NVMe e conexões de baixa latência para execução rápida de trades.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Disponibilidade 24/7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Garantia de uptime de até 99.99% com monitoramento constante e backups automáticos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                Suporte Técnico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Equipe especializada disponível 24/7 para ajudar com configuração e troubleshooting.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

