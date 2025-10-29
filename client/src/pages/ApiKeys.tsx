import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { Key, Plus, Copy, Trash2, Power, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function ApiKeys() {
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const { data: apiKeys, refetch } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const result = await trpc.apiKeys.list.query();
      return result;
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return await trpc.apiKeys.create.mutate({ name });
    },
    onSuccess: (data) => {
      setNewlyCreatedKey(data.key);
      setNewKeyName("");
      refetch();
      toast({
        title: "API Key criada!",
        description: "Copie e guarde sua chave em local seguro. Ela não será exibida novamente.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a API Key",
        variant: "destructive",
      });
    },
  });

  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await trpc.apiKeys.toggle.mutate({ id, isActive });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Status atualizado",
        description: "O status da API Key foi alterado com sucesso",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await trpc.apiKeys.delete.mutate({ id });
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "API Key excluída",
        description: "A API Key foi removida com sucesso",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "API Key copiada para a área de transferência",
    });
  };

  const downloadEA = () => {
    // Link para download do EA
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova API Key</DialogTitle>
                <DialogDescription>
                  Crie uma nova chave de API para conectar suas contas MT4/MT5
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {newlyCreatedKey ? (
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
                          value={newlyCreatedKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(newlyCreatedKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setNewlyCreatedKey(null);
                        setIsDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      Fechar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="keyName">Nome da API Key</Label>
                      <Input
                        id="keyName"
                        placeholder="Ex: Minha Conta MT4"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={() => createKeyMutation.mutate(newKeyName)}
                      disabled={!newKeyName || createKeyMutation.isPending}
                      className="w-full"
                    >
                      Criar API Key
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Minhas API Keys
          </CardTitle>
          <CardDescription>
            Use estas chaves para conectar o Expert Advisor ao seu MT4/MT5
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!apiKeys || apiKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma API Key criada ainda</p>
              <p className="text-sm mt-2">
                Crie uma API Key para começar a integrar suas contas MT4/MT5
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{key.name}</h3>
                      <Badge variant={key.isActive ? "default" : "secondary"}>
                        {key.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Criada em: {new Date(key.createdAt).toLocaleDateString("pt-BR")}</span>
                      {key.lastUsedAt && (
                        <span>
                          Último uso: {new Date(key.lastUsedAt).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(key.lastUsedAt).toLocaleTimeString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.key.substring(0, 20)}...{key.key.substring(key.key.length - 10)}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(key.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={key.isActive}
                        onCheckedChange={(checked) =>
                          toggleKeyMutation.mutate({ id: key.id, isActive: checked })
                        }
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Tem certeza que deseja excluir esta API Key?")) {
                          deleteKeyMutation.mutate(key.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Baixe o Expert Advisor</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Clique no botão "Baixar Expert Advisor" acima para obter o arquivo .mq4
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Instale no MT4/MT5</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Copie o arquivo para a pasta: <code className="bg-muted px-1 py-0.5 rounded">MQL4/Experts/</code>
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Configure a API Key</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Arraste o EA para o gráfico e insira sua API Key nas configurações
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Ative o AutoTrading</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Certifique-se de que o botão "AutoTrading" está ativado no MT4/MT5
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
