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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface EA {
  id: number;
  name: string;
  price: number;
  platform: string;
  downloads: number;
  active: boolean;
}

interface EditEADialogProps {
  ea: EA | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ea: EA) => void;
}

export function EditEADialog({ ea, open, onOpenChange, onSave }: EditEADialogProps) {
  const [formData, setFormData] = useState<EA>(
    ea || { id: 0, name: "", price: 0, platform: "MT4/MT5", downloads: 0, active: true }
  );

  const handleSave = () => {
    if (!formData.name || formData.price <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    onSave(formData);
    toast.success("Expert Advisor atualizado com sucesso!");
    onOpenChange(false);
  };

  if (!ea) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar EA: {ea.name}</DialogTitle>
          <DialogDescription>
            Atualize as informações do Expert Advisor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do EA</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Scalper Pro EA"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="299.00"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MT4">MT4</SelectItem>
                  <SelectItem value="MT5">MT5</SelectItem>
                  <SelectItem value="MT4/MT5">MT4/MT5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="downloads">Total de Downloads</Label>
            <Input
              id="downloads"
              type="number"
              value={formData.downloads}
              onChange={(e) => setFormData({ ...formData, downloads: parseInt(e.target.value) })}
              placeholder="0"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Este valor é atualizado automaticamente
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">EA ativo</Label>
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

