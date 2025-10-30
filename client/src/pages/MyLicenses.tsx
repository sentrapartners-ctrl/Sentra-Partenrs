import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Key, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface License {
  id: number;
  licenseKey: string;
  eaName: string;
  licenseType: string;
  status: string;
  allowedAccounts: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function MyLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/my-licenses");
      if (response.ok) {
        const data = await response.json();
        setLicenses(data.licenses || []);
      } else {
        toast.error("Erro ao carregar licenças");
      }
    } catch (error) {
      console.error("Erro ao carregar licenças:", error);
      toast.error("Não foi possível carregar suas licenças");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Chave copiada para a área de transferência!");
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      active: { variant: "default", icon: CheckCircle },
      inactive: { variant: "secondary", icon: XCircle },
      expired: { variant: "destructive", icon: Clock },
    };
    const { variant, icon: Icon } = config[status] || config.inactive;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status === "active" ? "Ativa" : status === "inactive" ? "Inativa" : "Expirada"}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      trial: "bg-gray-500",
      monthly: "bg-blue-500",
      yearly: "bg-green-500",
      lifetime: "bg-purple-500",
    };
    const labels: Record<string, string> = {
      trial: "Teste",
      monthly: "Mensal",
      yearly: "Anual",
      lifetime: "Vitalícia",
    };
    return (
      <Badge className={colors[type] || "bg-gray-500"}>
        {labels[type] || type}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="h-8 w-8" />
          Minhas Licenças
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas licenças de Expert Advisors (EAs)
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando licenças...</p>
        </div>
      ) : licenses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Key className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma licença encontrada</h3>
              <p className="text-muted-foreground">
                Você ainda não possui licenças ativas. Entre em contato com o suporte para adquirir.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {licenses.map((license) => (
            <Card key={license.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {license.eaName}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      {getTypeBadge(license.licenseType)}
                      {getStatusBadge(license.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chave da Licença */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Chave de Licença
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded break-all">
                      {license.licenseKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(license.licenseKey)}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Data de Expiração */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Expira em
                  </label>
                  <p className="text-sm mt-1">
                    {license.expiresAt ? (
                      <span className={new Date(license.expiresAt) < new Date() ? "text-destructive font-semibold" : ""}>
                        {formatDate(license.expiresAt)}
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">Nunca (Vitalícia)</span>
                    )}
                  </p>
                </div>

                {/* Contas Permitidas */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Contas Permitidas
                  </label>
                  <p className="text-sm mt-1">
                    {license.allowedAccounts ? (
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {license.allowedAccounts}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">Todas as contas</span>
                    )}
                  </p>
                </div>

                {/* Último Uso */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Último Uso
                  </label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {formatDate(license.lastUsedAt)}
                  </p>
                </div>

                {/* Criada em */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Criada em
                  </label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {formatDate(license.createdAt)}
                  </p>
                </div>

                {/* Instruções */}
                {license.status === "active" && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Como usar:</strong> Copie a chave acima e cole no campo
                      "LicenseKey" ao anexar o EA no MT4/MT5.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
