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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  features: string[];
  active: boolean;
}

interface EditPlanDialogProps {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (plan: Plan) => void;
}

export function EditPlanDialog({ plan, open, onOpenChange, onSave }: EditPlanDialogProps) {
  const [formData, setFormData] = useState<Plan>(
    plan || { id: 0, name: "", slug: "", price: 0, features: [], active: true }
  );
  const [featuresText, setFeaturesText] = useState(plan?.features.join("\n") || "");

  const handleSave = () => {
    if (!formData.name || !formData.slug || formData.price <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const updatedPlan = {
      ...formData,
      features: featuresText.split("\n").filter((f) => f.trim() !== ""),
    };

    onSave(updatedPlan);
    toast.success("Plano atualizado com sucesso!");
    onOpenChange(false);
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Plano: {plan.name}</DialogTitle>
          <DialogDescription>
            Atualize as informações do plano de assinatura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Premium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Ex: premium"
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
              placeholder="99.00"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Recursos (um por linha)</Label>
            <Textarea
              id="features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Dashboard completo&#10;Copy Trading&#10;VPS Grátis"
              rows={6}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Plano ativo</Label>
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

