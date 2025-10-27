import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CryptoAddress {
  id: number;
  crypto: string;
  symbol: string;
  address: string;
  active: boolean;
}

interface EditCryptoAddressDialogProps {
  cryptoAddress: CryptoAddress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (address: CryptoAddress) => void;
}

export function EditCryptoAddressDialog({
  cryptoAddress,
  open,
  onOpenChange,
  onSave,
}: EditCryptoAddressDialogProps) {
  const [formData, setFormData] = useState<CryptoAddress>(
    cryptoAddress || { id: 0, crypto: "", symbol: "", address: "", active: true }
  );

  const handleSave = () => {
    if (!formData.crypto || !formData.symbol || !formData.address) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validação básica de endereço
    if (formData.address.length < 20) {
      toast.error("Endereço de carteira inválido");
      return;
    }

    onSave(formData);
    toast.success("Endereço atualizado com sucesso!");
    onOpenChange(false);
  };

  if (!cryptoAddress) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Endereço: {cryptoAddress.crypto}</DialogTitle>
          <DialogDescription>
            Atualize o endereço da carteira de criptomoeda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crypto">Nome da Criptomoeda</Label>
              <Input
                id="crypto"
                value={formData.crypto}
                onChange={(e) => setFormData({ ...formData, crypto: e.target.value })}
                placeholder="Ex: Bitcoin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Símbolo</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="Ex: BTC"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço da Carteira</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Verifique cuidadosamente o endereço antes de salvar
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Endereço ativo</Label>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Certifique-se de que o endereço está correto. Pagamentos
              enviados para endereços incorretos não podem ser recuperados.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

