import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, CheckCircle2 } from "lucide-react";

interface ManualPermissionsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ManualPermissionsDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ManualPermissionsDialogProps) {
  const updatePermissionsMutation = trpc.admin.updateManualPermissions.useMutation();

  const [permissions, setPermissions] = useState({
    dashboard: false,
    copy_trading: false,
    signal_provider: false,
    vps: false,
    expert_advisors: false,
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user?.manual_permissions) {
      try {
        const parsed = typeof user.manual_permissions === 'string' 
          ? JSON.parse(user.manual_permissions) 
          : user.manual_permissions;
        setPermissions({
          dashboard: parsed.dashboard || false,
          copy_trading: parsed.copy_trading || false,
          signal_provider: parsed.signal_provider || false,
          vps: parsed.vps || false,
          expert_advisors: parsed.expert_advisors || false,
        });
        setNotes(parsed.notes || "");
      } catch (e) {
        console.error("Erro ao parsear permissões:", e);
      }
    } else {
      setPermissions({
        dashboard: false,
        copy_trading: false,
        signal_provider: false,
        vps: false,
        expert_advisors: false,
      });
      setNotes("");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updatePermissionsMutation.mutateAsync({
        userId: user.id,
        permissions: {
          ...permissions,
          notes,
        },
      });
      toast.success("Permissões atualizadas com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao atualizar permissões");
      console.error(error);
    }
  };

  const handleToggle = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hasAnyPermission = Object.values(permissions).some(p => p);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permissões Manuais
          </DialogTitle>
          <DialogDescription>
            Autorize {user?.name || user?.email} a usar funcionalidades mesmo sem assinatura ativa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dashboard */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="dashboard"
              checked={permissions.dashboard}
              onCheckedChange={() => handleToggle("dashboard")}
            />
            <div className="space-y-1">
              <Label
                htmlFor="dashboard"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Dashboard
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite visualizar dados do Dashboard (balanço, equity, trades)
              </p>
            </div>
          </div>

          {/* Copy Trading */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="copy_trading"
              checked={permissions.copy_trading}
              onCheckedChange={() => handleToggle("copy_trading")}
            />
            <div className="space-y-1">
              <Label
                htmlFor="copy_trading"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Copy Trading
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite seguir traders e copiar sinais
              </p>
            </div>
          </div>

          {/* Signal Provider */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="signal_provider"
              checked={permissions.signal_provider}
              onCheckedChange={() => handleToggle("signal_provider")}
            />
            <div className="space-y-1">
              <Label
                htmlFor="signal_provider"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Provedor de Sinais
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite criar contas Master e fornecer sinais
              </p>
            </div>
          </div>

          {/* VPS */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="vps"
              checked={permissions.vps}
              onCheckedChange={() => handleToggle("vps")}
            />
            <div className="space-y-1">
              <Label
                htmlFor="vps"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                VPS
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite contratar e gerenciar servidores VPS
              </p>
            </div>
          </div>

          {/* Expert Advisors */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="expert_advisors"
              checked={permissions.expert_advisors}
              onCheckedChange={() => handleToggle("expert_advisors")}
            />
            <div className="space-y-1">
              <Label
                htmlFor="expert_advisors"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Expert Advisors
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite baixar e usar EAs personalizados
              </p>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Cliente VIP - acesso total até 31/12/2025"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status */}
          {hasAnyPermission && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Este usuário tem permissões manuais ativas
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updatePermissionsMutation.isLoading}>
            {updatePermissionsMutation.isLoading ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
