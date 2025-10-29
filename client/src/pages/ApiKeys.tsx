import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Key, Plus, Copy, Trash2, Power, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ApiKeys() {
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const { data: apiKeys, refetch } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const result = await trpc.apiKeys.list.query();
      return result;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      // Gerar nome automaticamente com timestamp
      const now = new Date();
      const name = `API Key - ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
      return await trpc.apiKeys.create.mutate({ name });
    },
    onSuccess: (data) => {
      setNewlyCreatedKey(data.key);
      setShowKeyDialog(true);
      refetch();
      toast.success("API Key criada com sucesso!");
    },
    onError: () => {
      toast.error("Não foi possível criar a API Key");
    },
  });

  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await trpc.apiKeys.toggle.mutate({ id, isActive });
    },
    onSuccess: () => {
      refetch();
      toast.success("Status da API Key atualizado com sucesso");
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await trpc.apiKeys.delete.mutate({ id });
    },
    onSuccess: () => {
      refetch();
      toast.success("API Key excluída com sucesso");
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copiada para a área de transferência");
  };

  const downloadEA = () => {
    window.open("/SentraPartners_Connector.mq4", "_blank");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Gerencie suas chaves de API para integração com MT4/MT5
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadEA} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Baixar Expert Advisor
          </Button>
          <Button 
            onClick={() => createKeyMutation.mutate()}
            disabled={createKeyMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {createKeyMutation.isPending ? "Gerando..." : "Gerar Nova API Key"}
          </Button>
        </div>
      </div>

      {/* Dialog para exibir a chave criada */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Criada com Sucesso!</DialogTitle>
            <DialogDescription>
              Copie sua chave agora. Ela não será exibida novamente por questões de segurança.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Importante: Copie sua API Key agora!
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Esta chave não será exibida novamente por questões de segurança.
              </p>
            </div>
            <div>
              <Label>Sua API Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newlyCreatedKey || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(newlyCreatedKey || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowKeyDialog(false);
              }}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Como Usar
          </CardTitle>
          <CardDescription>
            Siga os passos abaixo para conectar suas contas MT4/MT5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Gere uma API Key</h3>
            <p className="text-sm text-muted-foreground">
              Clique no botão "Gerar Nova API Key" acima. A chave será criada automaticamente.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">2. Baixe o Expert Advisor</h3>
            <p className="text-sm text-muted-foreground">
              Clique em "Baixar Expert Advisor" e salve o arquivo SentraPartners_Connector.mq4
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">3. Instale no MT4/MT5</h3>
            <p className="text-sm text-muted-foreground">
              Copie o arquivo .mq4 para a pasta MQL4/Experts (ou MQL5/Experts) do seu MetaTrader
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">4. Configure o EA</h3>
            <p className="text-sm text-muted-foreground">
              Arraste o EA para o gráfico, cole sua API Key nas configurações e ative o AutoTrading
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">5. Pronto!</h3>
            <p className="text-sm text-muted-foreground">
              Sua conta será sincronizada automaticamente a cada 30 segundos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Suas API Keys</CardTitle>
          <CardDescription>
            {apiKeys?.length || 0} chave(s) criada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!apiKeys || apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma API Key criada ainda</p>
              <p className="text-sm">Clique em "Gerar Nova API Key" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key: any) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{key.name}</h3>
                      <Badge variant={key.isActive ? "default" : "secondary"}>
                        {key.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Criada em: {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {key.lastUsedAt && (
                      <p className="text-xs text-muted-foreground">
                        Último uso: {new Date(key.lastUsedAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`switch-${key.id}`} className="text-sm">
                        {key.isActive ? "Ativa" : "Inativa"}
                      </Label>
                      <Switch
                        id={`switch-${key.id}`}
                        checked={key.isActive}
                        onCheckedChange={(checked) =>
                          toggleKeyMutation.mutate({ id: key.id, isActive: checked })
                        }
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir esta API Key?")) {
                          deleteKeyMutation.mutate(key.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
