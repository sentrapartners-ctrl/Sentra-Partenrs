import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Server, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ClientVM {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  productName: string;
  hostname: string;
  ipAddress: string;
  username: string;
  password: string;
  status: 'active' | 'suspended' | 'terminated';
  cpu: string;
  ram: string;
  storage: string;
  os: string;
  createdAt: string;
  expiresAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export function ClientVMsSection() {
  const [vms, setVMs] = useState<ClientVM[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVM, setEditingVM] = useState<Partial<ClientVM> | null>(null);

  useEffect(() => {
    loadVMs();
    loadUsers();
  }, []);

  const loadVMs = async () => {
    try {
      const response = await fetch('/api/admin/vms');
      if (response.ok) {
        const data = await response.json();
        setVMs(data.vms || []);
      }
    } catch (error) {
      console.error('Erro ao carregar VMs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSave = async () => {
    if (!editingVM) return;

    try {
      const method = editingVM.id ? 'PUT' : 'POST';
      const url = editingVM.id 
        ? `/api/admin/vms/${editingVM.id}` 
        : '/api/admin/vms';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVM),
      });

      if (response.ok) {
        toast.success(editingVM.id ? 'VM atualizada!' : 'VM criada!');
        setIsDialogOpen(false);
        setEditingVM(null);
        loadVMs();
      } else {
        throw new Error('Erro ao salvar VM');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar VM');
    }
  };

  const handleDelete = async (vmId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta VM?')) return;

    try {
      const response = await fetch(`/api/admin/vms/${vmId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('VM excluída!');
        loadVMs();
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir VM');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {vms.length} VM(s) cadastrada(s)
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditingVM({
              status: 'active',
              os: 'Windows Server 2022',
            });
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar VM
        </Button>
      </div>

      {vms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma VM cadastrada
        </div>
      ) : (
        <div className="space-y-2">
          {vms.map((vm) => (
            <div
              key={vm.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{vm.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {vm.userEmail} • {vm.ipAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={vm.status === 'active' ? 'default' : 'secondary'}>
                  {vm.status === 'active' ? 'Ativa' : vm.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingVM(vm);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(vm.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVM?.id ? 'Editar VM' : 'Adicionar Nova VM'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da VM do cliente
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select
                value={editingVM?.userId?.toString()}
                onValueChange={(value) =>
                  setEditingVM({ ...editingVM, userId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nome do Produto</Label>
                <Input
                  value={editingVM?.productName || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, productName: e.target.value })
                  }
                  placeholder="VPS Premium"
                />
              </div>
              <div className="grid gap-2">
                <Label>Hostname</Label>
                <Input
                  value={editingVM?.hostname || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, hostname: e.target.value })
                  }
                  placeholder="vps-001.sentra.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Endereço IP</Label>
                <Input
                  value={editingVM?.ipAddress || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, ipAddress: e.target.value })
                  }
                  placeholder="192.168.1.100"
                />
              </div>
              <div className="grid gap-2">
                <Label>Sistema Operacional</Label>
                <Select
                  value={editingVM?.os}
                  onValueChange={(value) =>
                    setEditingVM({ ...editingVM, os: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Windows Server 2022">Windows Server 2022</SelectItem>
                    <SelectItem value="Windows Server 2019">Windows Server 2019</SelectItem>
                    <SelectItem value="Ubuntu 22.04">Ubuntu 22.04</SelectItem>
                    <SelectItem value="Ubuntu 20.04">Ubuntu 20.04</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Usuário</Label>
                <Input
                  value={editingVM?.username || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, username: e.target.value })
                  }
                  placeholder="administrator"
                />
              </div>
              <div className="grid gap-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={editingVM?.password || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>CPU</Label>
                <Input
                  value={editingVM?.cpu || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, cpu: e.target.value })
                  }
                  placeholder="4 vCPUs"
                />
              </div>
              <div className="grid gap-2">
                <Label>RAM</Label>
                <Input
                  value={editingVM?.ram || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, ram: e.target.value })
                  }
                  placeholder="8 GB"
                />
              </div>
              <div className="grid gap-2">
                <Label>Storage</Label>
                <Input
                  value={editingVM?.storage || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, storage: e.target.value })
                  }
                  placeholder="100 GB SSD"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={editingVM?.status}
                  onValueChange={(value: any) =>
                    setEditingVM({ ...editingVM, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="suspended">Suspensa</SelectItem>
                    <SelectItem value="terminated">Terminada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data de Expiração</Label>
                <Input
                  type="date"
                  value={editingVM?.expiresAt?.split('T')[0] || ''}
                  onChange={(e) =>
                    setEditingVM({ ...editingVM, expiresAt: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingVM?.id ? 'Salvar' : 'Criar VM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
