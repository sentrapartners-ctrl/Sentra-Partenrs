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

interface VPS {
  id: number;
  name: string;
  price: number;
  ram: string;
  cpu: string;
  active: boolean;
  free?: boolean;
}

interface EditVPSDialogProps {
  vps: VPS | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vps: VPS) => void;
}

export function EditVPSDialog({ vps, open, onOpenChange, onSave }: EditVPSDialogProps) {
  const [formData, setFormData] = useState<VPS>(
    vps || { id: 0, name: "", price: 0, ram: "", cpu: "", active: true, free: false }
  );

  const handleSave = () => {
    if (!formData.name || !formData.ram || !formData.cpu) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    onSave(formData);
    toast.success("VPS atualizada com sucesso!");
    onOpenChange(false);
  };

  if (!vps) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar VPS: {vps.name}</DialogTitle>
          <DialogDescription>
            Atualize as especificações do servidor VPS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da VPS</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: VPS Premium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ram">Memória RAM</Label>
              <Input
                id="ram"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                placeholder="Ex: 2GB"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpu">CPU</Label>
              <Input
                id="cpu"
                value={formData.cpu}
                onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                placeholder="Ex: 2 vCores"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço Mensal (R$)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              placeholder="49.00"
              step="0.01"
              disabled={formData.free}
            />
            <p className="text-xs text-muted-foreground">
              {formData.free && "VPS gratuita - preço definido como R$ 0,00"}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="free"
                checked={formData.free}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, free: checked, price: checked ? 0 : formData.price })
                }
              />
              <Label htmlFor="free">VPS Gratuita (incluída no Premium)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">VPS ativa</Label>
            </div>
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

