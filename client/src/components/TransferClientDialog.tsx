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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TransferClientDialogProps {
  client: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferClientDialog({
  client,
  open,
  onOpenChange,
  onSuccess,
}: TransferClientDialogProps) {
  const [toManagerId, setToManagerId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const { data: allUsers } = trpc.admin.listUsers.useQuery();
  const transferMutation = trpc.admin.transferClient.useMutation();

  const managers = allUsers?.filter(u => u.role === 'manager' || u.role === 'admin') || [];
  const currentManager = allUsers?.find(u => u.id === client?.managerId);

  const handleTransfer = async () => {
    if (!toManagerId) {
      toast.error("Selecione um gerente");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        clientId: client.id,
        toManagerId: parseInt(toManagerId),
        reason: reason || undefined,
        notes: notes || undefined,
      });

      toast.success("Cliente transferido com sucesso!");
      onSuccess();
      onOpenChange(false);
      
      // Limpar form
      setToManagerId("");
      setReason("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao transferir cliente");
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir Cliente</DialogTitle>
          <DialogDescription>
            Transferir <strong>{client.name || client.email}</strong> para outro gerente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Gerente Atual</Label>
            <div className="p-3 bg-muted rounded-md">
              {currentManager ? (
                <div>
                  <div className="font-medium">{currentManager.name || "Sem nome"}</div>
                  <div className="text-sm text-muted-foreground">{currentManager.email}</div>
                </div>
              ) : (
                <div className="text-muted-foreground">Nenhum gerente atribuído</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Novo Gerente *</Label>
            <Select value={toManagerId} onValueChange={setToManagerId}>
              <SelectTrigger id="manager">
                <SelectValue placeholder="Selecione um gerente" />
              </SelectTrigger>
              <SelectContent>
                {managers
                  .filter(m => m.id !== client.managerId)
                  .map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.name || "Sem nome"} ({manager.email}) - {manager.role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Redistribuição de carteira, especialização..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre a transferência..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transferMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!toManagerId || transferMutation.isPending}
          >
            {transferMutation.isPending ? "Transferindo..." : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

