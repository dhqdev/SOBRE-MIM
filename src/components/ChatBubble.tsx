import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface ChatState {
  isOpen: boolean;
  isConnected: boolean;
  isInitialized: boolean;
  userInfo: {
    name: string;
    whatsapp: string;
  } | null;
}

export const ChatBubble = () => {
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    isConnected: false,
    isInitialized: false,
    userInfo: null
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start polling for messages when chat is initialized
    if (chatState.isInitialized && chatState.userInfo) {
      startPolling();
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [chatState.isInitialized]);

  const startPolling = () => {
    // Poll for new messages every 3 seconds
    pollingRef.current = setInterval(async () => {
      await checkForNewMessages();
    }, 3000);
  };

  const checkForNewMessages = async () => {
    // This would be implemented based on your Tekvo API for receiving messages
    // For now, we'll simulate occasional responses
    if (Math.random() < 0.1 && messages.length > 0) {
      const responses = [
        "Obrigado por entrar em contato! Como posso ajudá-lo?",
        "Recebi sua mensagem. Vou analisar e responder em breve.",
        "Está tudo bem por aí? Aguardo sua resposta.",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const newMsg: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMsg]);
    }
  };

  const initializeChat = async () => {
    if (!userName.trim() || !userWhatsapp.trim() || !webhookUrl.trim() || !token.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para iniciar o chat",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Send initial message to start the conversation
      const initialMessage = `Olá! Sou ${userName} e gostaria de iniciar uma conversa. Meu WhatsApp: ${userWhatsapp}`;
      
      const success = await sendMessage(initialMessage, true);
      
      if (success) {
        setChatState(prev => ({
          ...prev,
          isInitialized: true,
          isConnected: true,
          userInfo: { name: userName, whatsapp: userWhatsapp }
        }));
        
        const welcomeMsg: Message = {
          id: 'welcome',
          text: `Conversa iniciada! Agora você pode trocar mensagens diretamente com o WhatsApp.`,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages([welcomeMsg]);
        
        toast({
          title: "Chat conectado!",
          description: "Sua conversa foi iniciada com sucesso"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao conectar",
        description: "Verifique suas configurações e tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string, isInitial = false): Promise<boolean> => {
    if (!text.trim() || !chatState.userInfo) return false;

    const messageId = Date.now().toString();
    
    if (!isInitial) {
      const userMsg: Message = {
        id: messageId,
        text: text.trim(),
        isUser: true,
        timestamp: new Date(),
        status: 'sending'
      };
      
      setMessages(prev => [...prev, userMsg]);
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: chatState.userInfo.whatsapp,
          body: text.trim(),
          saveOnTicket: true,
          linkPreview: true,
          startChatbot: false
        })
      });

      if (response.ok) {
        if (!isInitial) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, status: 'sent' }
                : msg
            )
          );
        }
        return true;
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      if (!isInitial) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'error' }
              : msg
          )
        );
      }
      return false;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageText = newMessage;
    setNewMessage('');
    
    await sendMessage(messageText);
  };

  const toggleChat = () => {
    setChatState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const closeChat = () => {
    setChatState(prev => ({ ...prev, isOpen: false }));
  };

  const resetChat = () => {
    setChatState({
      isOpen: true,
      isConnected: false,
      isInitialized: false,
      userInfo: null
    });
    setMessages([]);
    setUserName('');
    setUserWhatsapp('');
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      <div 
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full shadow-elegant cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-glow z-50 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {chatState.isConnected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      {/* Chat Window */}
      {chatState.isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-background border border-border rounded-lg shadow-elegant z-40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <h3 className="font-semibold">
                {chatState.isConnected ? 'Chat WhatsApp' : 'Conectar ao WhatsApp'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {chatState.isConnected && (
                <Button variant="ghost" size="sm" onClick={resetChat} className="text-primary-foreground hover:bg-primary-foreground/20">
                  <User className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={closeChat} className="text-primary-foreground hover:bg-primary-foreground/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Connection Form */}
          {!chatState.isInitialized && (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure sua conexão para iniciar o chat:
              </p>
              
              <Input
                placeholder="Seu nome"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              
              <Input
                placeholder="Seu WhatsApp (Ex: 5511999999999)"
                value={userWhatsapp}
                onChange={(e) => setUserWhatsapp(e.target.value)}
              />
              
              <Input
                placeholder="URL do Webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              
              <Input
                placeholder="Token de Autorização"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              
              <Button 
                onClick={initializeChat} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Iniciar Chat'
                )}
              </Button>
            </div>
          )}

          {/* Chat Messages */}
          {chatState.isInitialized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-3 py-2 ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.isUser && message.status && (
                          <span className="text-xs">
                            {message.status === 'sending' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {message.status === 'sent' && '✓'}
                            {message.status === 'error' && '✗'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};