import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Network, Zap, Gift, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatPrice";
import { trpc } from "@/lib/trpc";

interface VPSProduct {
  id: number;
  name: string;
  price: number;
  ram: string;
  cpu: string;
  storage: string;
  bandwidth: string;
  max_mt4_instances: number;
  max_mt5_instances: number;
  is_free: boolean;
  is_recommended: boolean;
  active: boolean;
}

export default function MarketplaceVPS() {
  const [vpsProducts, setVpsProducts] = useState<VPSProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVPS, setSelectedVPS] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verificar assinatura do usuário
  const { data: subscriptionData } = trpc.subscriptions.current.useQuery();
  const hasFreeVPS = subscriptionData?.plan?.freeVpsEnabled || false;

  useEffect(() => {
    fetchVPSProducts();
  }, []);

  const fetchVPSProducts = async () => {
    try {
      const response = await fetch("/api/vps-products");
      if (response.ok) {
        const data = await response.json();
        setVpsProducts(data.products.filter((p: VPSProduct) => p.active));
      }
    } catch (error) {
      console.error("Erro ao carregar produtos VPS:", error);
      toast.error("Erro ao carregar produtos VPS");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (vps: VPSProduct) => {
    setIsProcessing(true);
    setSelectedVPS(vps.id);

    try {
      // Se o usuário tem VPS grátis no plano, criar purchase com preço 0
      if (hasFreeVPS && vps.is_free) {
        const response = await fetch("/api/vps-management/claim-free", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vpsProductId: vps.id,
          }),
        });

        if (response.ok) {
          toast.success("VPS grátis ativada com sucesso!");
          // Redirecionar para página de VPS
          window.location.href = "/vps";
        } else {
          const error = await response.json();
          throw new Error(error.error || "Erro ao ativar VPS grátis");
        }
      } else {
        // Compra normal com pagamento
        const response = await fetch("/api/checkout/create-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            price_amount: vps.price,
            price_currency: "usd",
            order_description: `Sentra Partners - ${vps.name}`,
            product_type: "vps",
            product_id: vps.id,
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
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao processar. Tente novamente.");
    } finally {
      setIsProcessing(false);
      setSelectedVPS(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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

        {/* Info Banner - Mostrar se tem VPS grátis */}
        {hasFreeVPS && (
          <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="flex items-center gap-4 py-4">
              <Gift className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold">Você tem VPS Grátis!</h3>
                <p className="text-sm text-muted-foreground">
                  Seu plano inclui uma VPS gratuitamente. Ative agora sem custo adicional.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VPS Grid */}
        {vpsProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto VPS disponível no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vpsProducts.map((vps) => {
              // Determinar se este VPS é grátis para o usuário
              const isFreeForUser = hasFreeVPS && vps.is_free;
              const displayPrice = isFreeForUser ? 0 : vps.price;

              return (
                <Card 
                  key={vps.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    vps.is_recommended ? 'border-2 border-primary' : ''
                  } ${isFreeForUser ? 'border-2 border-purple-500' : ''}`}
                >
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {vps.is_recommended && (
                      <Badge className="bg-primary">Recomendado</Badge>
                    )}
                    {isFreeForUser && (
                      <Badge className="bg-purple-500">Grátis no seu plano</Badge>
                    )}
                  </div>

                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-4">
                      <Server className="h-6 w-6" />
                    </div>
                    <CardTitle>{vps.name}</CardTitle>
                    <CardDescription>
                      {isFreeForUser ? (
                        <span className="text-2xl font-bold text-purple-600">GRÁTIS</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-foreground">
                            R$ {formatPrice(displayPrice)}
                          </span>
                          <span className="text-muted-foreground">/mês</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {vps.cpu && (
                      <div className="flex items-center gap-2 text-sm">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span>{vps.cpu}</span>
                      </div>
                    )}
                    {vps.ram && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>{vps.ram} RAM</span>
                      </div>
                    )}
                    {vps.storage && (
                      <div className="flex items-center gap-2 text-sm">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span>{vps.storage}</span>
                      </div>
                    )}
                    {vps.bandwidth && (
                      <div className="flex items-center gap-2 text-sm">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span>{vps.bandwidth}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Até {vps.max_mt4_instances} instâncias MT4/MT5
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handlePurchase(vps)}
                      disabled={isProcessing && selectedVPS === vps.id}
                      variant={vps.is_recommended || isFreeForUser ? "default" : "outline"}
                    >
                      {isProcessing && selectedVPS === vps.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : isFreeForUser ? (
                        "Ativar Grátis"
                      ) : (
                        "Contratar Agora"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
