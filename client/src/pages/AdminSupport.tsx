import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar } from '../components/ui/avatar';
import { 
  MessageCircle, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function AdminSupport() {
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: allTickets } = trpc.admin.getAllTickets.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: messages, refetch: refetchMessages } = trpc.support.messages.useQuery(
    { ticketId: selectedTicket || 0 },
    {
      enabled: !!selectedTicket,
      refetchInterval: 3000,
    }
  );

  const sendMessage = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
    },
  });

  const updateTicketStatus = trpc.admin.updateTicketStatus.useMutation({
    onSuccess: () => {
      // Refetch tickets
    },
  });

  const filteredTickets = allTickets?.filter(ticket => {
    const matchesSearch = 
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toString().includes(searchQuery);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      waiting_user: 'Aguardando Usuário',
      waiting_support: 'Aguardando Suporte',
      resolved: 'Resolvido',
      closed: 'Fechado',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500',
      normal: 'bg-blue-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat de Suporte</h1>
          <p className="text-muted-foreground">
            Gerencie tickets e converse com clientes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Tickets */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tickets</span>
              <Badge variant="secondary">{filteredTickets?.length || 0}</Badge>
            </CardTitle>
            
            {/* Filtros */}
            <div className="space-y-2 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('open')}
                >
                  Abertos
                </Button>
                <Button
                  variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('in_progress')}
                >
                  Em Andamento
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {filteredTickets?.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket.id)}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTicket === ticket.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="font-semibold">#{ticket.id}</span>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1 line-clamp-1">
                      {ticket.subject || 'Sem assunto'}
                    </h4>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(ticket.status)}
                      </Badge>
                      <span>
                        {format(new Date(ticket.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedTicket ? `Ticket #${selectedTicket}` : 'Selecione um ticket'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {selectedTicket ? (
              <div className="space-y-4">
                {/* Mensagens */}
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {messages?.map((msg) => {
                      const isSupport = msg.senderType === 'support';
                      const isSystem = msg.senderType === 'system';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center">
                            <Badge variant="secondary" className="text-xs">
                              {msg.message}
                            </Badge>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isSupport
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {!isSupport && (
                              <p className="text-xs font-semibold mb-1">
                                Cliente
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            
                            {/* Attachments */}
                            {msg.attachments && (
                              <div className="mt-2 space-y-1">
                                {JSON.parse(msg.attachments).map((url: string, i: number) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs underline block ${
                                      isSupport ? 'text-primary-foreground/80' : 'text-primary'
                                    }`}
                                  >
                                    📎 Arquivo {i + 1}
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className={`text-xs mt-1 ${
                              isSupport ? 'text-primary-foreground/60' : 'text-muted-foreground'
                            }`}>
                              {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua resposta..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          sendMessage.mutate({
                            ticketId: selectedTicket,
                            message: input.value.trim(),
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      updateTicketStatus.mutate({
                        ticketId: selectedTicket,
                        status: 'resolved',
                      });
                    }}
                  >
                    Resolver
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                <p>Selecione um ticket para começar a conversar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminSupport;

