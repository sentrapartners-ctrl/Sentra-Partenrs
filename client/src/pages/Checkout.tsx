import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import axios from "axios";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const productId = searchParams.get("product");
  const category = searchParams.get("category");
  const price = searchParams.get("price");
  const name = searchParams.get("name");

  const [loading, setLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [eaType, setEAType] = useState("copy_master");
  const [platform, setPlatform] = useState("MT5");
  const [duration, setDuration] = useState("30");

  const handleCheckout = async () => {
    if (!customerEmail) {
      toast.error("Por favor, insira seu email");
      return;
    }

    if ((category === "copy_trading" || category === "connector") && !accountNumber) {
      toast.error("Por favor, insira o número da conta");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/checkout/create", {
        productId: parseInt(productId || "0"),
        customerEmail,
        customerData: {
          accountNumber,
          eaType,
          platform,
          duration: parseInt(duration),
        },
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      });

      if (response.data.success) {
        // Redirect to NOWPayments invoice
        window.location.href = response.data.invoiceUrl;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.error || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Finalizar Compra</CardTitle>
          <CardDescription>
            Complete as informações para processar seu pagamento em criptomoeda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">Categoria: {category}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${price}</p>
                <p className="text-sm text-muted-foreground">USD</p>
              </div>
            </div>
          </div>

          {/* Customer Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              Enviaremos o EA compilado para este email
            </p>
          </div>

          {/* EA-specific fields */}
          {(category === "copy_trading" || category === "connector") && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Número da Conta MT4/MT5 *</Label>
                <Input
                  id="accountNumber"
                  placeholder="12345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  O EA será vinculado a esta conta
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma *</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MT4">MetaTrader 4</SelectItem>
                    <SelectItem value="MT5">MetaTrader 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category === "copy_trading" && (
                <div className="space-y-2">
                  <Label htmlFor="eaType">Tipo de EA *</Label>
                  <Select value={eaType} onValueChange={setEAType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="copy_master">Copy Trading Master</SelectItem>
                      <SelectItem value="copy_slave">Copy Trading Slave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="duration">Duração da Licença *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dias - $29.99</SelectItem>
                    <SelectItem value="90">90 dias - $79.99</SelectItem>
                    <SelectItem value="365">365 dias - $249.99</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Payment Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              💰 Pagamento em Criptomoeda
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Aceitamos Bitcoin, Ethereum, USDT, USDC e mais de 300 criptomoedas.
              Você será redirecionado para completar o pagamento.
            </p>
          </div>

          {/* Checkout Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Prosseguir para Pagamento
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

