import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Download, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatPrice";

interface EAProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  platform: string;
  file_url: string;
  downloads: number;
  active: boolean;
}

export default function MarketplaceEAs() {
  const [eaProducts, setEaProducts] = useState<EAProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEA, setSelectedEA] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchEAProducts();
  }, []);

  const fetchEAProducts = async () => {
    try {
      const response = await fetch("/api/expert-advisors");
      if (response.ok) {
        const data = await response.json();
        setEaProducts(data.eas.filter((ea: EAProduct) => ea.active));
      }
    } catch (error) {
      console.error("Erro ao carregar Expert Advisors:", error);
      toast.error("Erro ao carregar Expert Advisors");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (ea: EAProduct) => {
    setIsProcessing(true);
    setSelectedEA(ea.id);

    try {
      const response = await fetch("/api/checkout/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: ea.price,
          price_currency: "usd",
          order_description: `Sentra Partners - ${ea.name}`,
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
    } finally {
      setIsProcessing(false);
      setSelectedEA(null);
    }
  };

  const handleDownload = async (ea: EAProduct) => {
    if (!ea.file_url) {
      toast.error("Arquivo não disponível");
      return;
    }

    try {
      // Registrar download
      await fetch(`/api/expert-advisors/${ea.id}/download`, {
        method: "POST",
      });

      // Abrir URL de download
      window.open(ea.file_url, "_blank");
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast.error("Erro ao fazer download");
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
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Expert Advisors</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Robôs de trading profissionais com estratégias comprovadas. Todos os EAs incluem suporte técnico.
          </p>
        </div>

        {/* EAs Grid */}
        {eaProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum Expert Advisor disponível no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eaProducts.map((ea) => (
              <Card key={ea.id} className="relative overflow-hidden hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <Bot className="h-6 w-6" />
                    </div>
                    <Badge variant="outline">{ea.platform}</Badge>
                  </div>
                  <CardTitle className="text-xl">{ea.name}</CardTitle>
                  <CardDescription className="text-sm mt-2">
                    {ea.description || "Expert Advisor profissional para trading automatizado"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="pt-2 border-t">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Preço</div>
                        <div className="text-2xl font-bold">R$ {formatPrice(ea.price)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Downloads</div>
                        <div className="text-lg font-bold">{ea.downloads}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handlePurchase(ea)}
                    disabled={isProcessing && selectedEA === ea.id}
                  >
                    {isProcessing && selectedEA === ea.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Comprar Agora"
                    )}
                  </Button>
                  {ea.file_url && (
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(ea)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
