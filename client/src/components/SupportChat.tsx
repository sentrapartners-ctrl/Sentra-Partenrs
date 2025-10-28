import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Minimize2, Paperclip, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function SupportChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets } = trpc.support.myTickets.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  const { data: messages, refetch: refetchMessages } = trpc.support.messages.useQuery(
    { ticketId: tickets?.[0]?.id || 0 },
    {
      enabled: !!tickets?.[0]?.id,
      refetchInterval: 3000, // Atualizar mensagens a cada 3 segundos
    }
  );

  const createTicketMutation = trpc.support.createTicket.useMutation();
  const sendMessageMutation = trpc.support.sendMessage.useMutation();

  const activeTicket = tickets?.[0];
  const unreadCount = messages?.filter(m => !m.isRead && m.senderType === 'support').length || 0;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    try {
      // Upload de arquivos
      let attachmentUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const { uploadFiles } = await import('../lib/uploadFile');
        attachmentUrls = await uploadFiles(selectedFiles);
      }

      const messageText = message.trim() || (selectedFiles.length > 0 ? '📎 Arquivo(s) enviado(s)' : '');

      if (!activeTicket) {
        // Criar novo ticket
        const result = await createTicketMutation.mutateAsync({
          subject: "Suporte",
          message: messageText,
          attachments: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : undefined,
        });
        toast.success("Conversa iniciada!");
      } else {
        // Enviar mensagem no ticket existente
        await sendMessageMutation.mutateAsync({
          ticketId: activeTicket.id,
          message: messageText,
          attachments: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : undefined,
        });
      }
      
      setMessage("");
      setSelectedFiles([]);
      refetchMessages();
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error(error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Janela de Chat */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <CardTitle className="text-lg">Suporte</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {!activeTicket && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Olá! Como podemos ajudar você hoje?
                    </p>
                  </div>
                )}

                {messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.senderType === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.senderType === 'support'
                          ? 'bg-muted'
                          : 'bg-yellow-100 text-yellow-900'
                      }`}
                    >
                      {msg.senderType === 'support' && (
                        <div className="text-xs font-semibold mb-1">Suporte</div>
                      )}
                      {msg.senderType === 'system' && (
                        <div className="text-xs font-semibold mb-1">Sistema</div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(prev => [...prev, ...files]);
                  }}
                />
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
                      >
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {activeTicket && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Status: <Badge variant="outline">{activeTicket.status}</Badge>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}

