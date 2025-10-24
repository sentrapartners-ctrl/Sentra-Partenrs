import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface AccountNotesModalProps {
  accountId: number;
  accountNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountNotesModal({
  accountId,
  accountNumber,
  open,
  onOpenChange,
}: AccountNotesModalProps) {
  const [showPasswords, setShowPasswords] = useState(false);
  const [formData, setFormData] = useState({
    mt5Login: "",
    mt5Password: "",
    mt5Server: "",
    mt5InvestorPassword: "",
    vpsProvider: "",
    vpsIp: "",
    vpsUsername: "",
    vpsPassword: "",
    vpsPort: "",
    notes: "",
  });

  const { data: notes, refetch } = trpc.accounts.getNotes.useQuery(
    { accountId },
    { enabled: open }
  );

  const saveNotes = trpc.accounts.saveNotes.useMutation({
    onSuccess: () => {
      toast.success("Notas salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  useEffect(() => {
    if (notes) {
      setFormData({
        mt5Login: notes.mt5Login || "",
        mt5Password: notes.mt5Password || "",
        mt5Server: notes.mt5Server || "",
        mt5InvestorPassword: notes.mt5InvestorPassword || "",
        vpsProvider: notes.vpsProvider || "",
        vpsIp: notes.vpsIp || "",
        vpsUsername: notes.vpsUsername || "",
        vpsPassword: notes.vpsPassword || "",
        vpsPort: notes.vpsPort?.toString() || "",
        notes: notes.notes || "",
      });
    }
  }, [notes]);

  const handleSave = () => {
    saveNotes.mutate({
      accountId,
      ...formData,
      vpsPort: formData.vpsPort ? parseInt(formData.vpsPort) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notas da Conta {accountNumber}</DialogTitle>
          <DialogDescription>
            Armazene informações sensíveis da conta MT5 e VPS de forma segura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* MT5 Credentials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Credenciais MT5/MT4</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Senhas
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mostrar Senhas
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mt5Login">Login</Label>
                <Input
                  id="mt5Login"
                  value={formData.mt5Login}
                  onChange={(e) =>
                    setFormData({ ...formData, mt5Login: e.target.value })
                  }
                  placeholder="Ex: 12345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mt5Server">Servidor</Label>
                <Input
                  id="mt5Server"
                  value={formData.mt5Server}
                  onChange={(e) =>
                    setFormData({ ...formData, mt5Server: e.target.value })
                  }
                  placeholder="Ex: Exness-MT5Real22"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mt5Password">Senha Principal</Label>
                <Input
                  id="mt5Password"
                  type={showPasswords ? "text" : "password"}
                  value={formData.mt5Password}
                  onChange={(e) =>
                    setFormData({ ...formData, mt5Password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mt5InvestorPassword">Senha Investidor</Label>
                <Input
                  id="mt5InvestorPassword"
                  type={showPasswords ? "text" : "password"}
                  value={formData.mt5InvestorPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mt5InvestorPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* VPS Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Detalhes da VPS/VM</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vpsProvider">Provedor</Label>
                <Input
                  id="vpsProvider"
                  value={formData.vpsProvider}
                  onChange={(e) =>
                    setFormData({ ...formData, vpsProvider: e.target.value })
                  }
                  placeholder="Ex: AWS, Contabo, Vultr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpsIp">IP</Label>
                <Input
                  id="vpsIp"
                  value={formData.vpsIp}
                  onChange={(e) =>
                    setFormData({ ...formData, vpsIp: e.target.value })
                  }
                  placeholder="Ex: 192.168.1.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpsUsername">Usuário</Label>
                <Input
                  id="vpsUsername"
                  value={formData.vpsUsername}
                  onChange={(e) =>
                    setFormData({ ...formData, vpsUsername: e.target.value })
                  }
                  placeholder="Ex: administrator"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpsPassword">Senha</Label>
                <Input
                  id="vpsPassword"
                  type={showPasswords ? "text" : "password"}
                  value={formData.vpsPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, vpsPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpsPort">Porta RDP</Label>
                <Input
                  id="vpsPort"
                  type="number"
                  value={formData.vpsPort}
                  onChange={(e) =>
                    setFormData({ ...formData, vpsPort: e.target.value })
                  }
                  placeholder="Ex: 3389"
                />
              </div>
            </div>
          </div>

          {/* General Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações Gerais</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Anotações adicionais sobre a conta..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveNotes.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveNotes.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

