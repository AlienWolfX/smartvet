import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    Bot,
    Send,
    X,
    Copy,
    User,
    Minimize2,
    Maximize2,
    Loader2,
    Wifi,
    WifiOff,
    Plus,
    History,
    ChevronLeft,
    Trash2,
    MessageSquare,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: string;
}

interface Conversation {
    id: number;
    title: string;
    model: string;
    message_count: number;
    last_message_at: string | null;
    created_at: string;
}

interface ChatbotSliderProps {
    isOpen: boolean;
    onClose: () => void;
}

const quickPrompts = [
    'Check inventory levels',
    'Find pet records',
    'Monthly sales report',
    'Upcoming vaccinations'
];

const defaultGreeting: ChatMessage = {
    id: 'greeting',
    type: 'assistant',
    content: `Hello! I'm your SmartVet AI Assistant with real-time database access. I can help you with:

• Inventory tracking and stock alerts
• Pet records search and history
• Financial reports and revenue
• Vaccination schedules
• Client communication drafts

What would you like me to help you with?`,
    timestamp: new Date(),
    context: 'greeting'
};

export function ChatbotSlider({ isOpen, onClose }: ChatbotSliderProps) {
    // Conversation state
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // Messages state
    const [messages, setMessages] = useState<ChatMessage[]>([defaultGreeting]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // UI state
    const [isMinimized, setIsMinimized] = useState(false);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            checkConnection();
            fetchConversations();
        }
    }, [isOpen]);

    const getCSRFToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    };

    const fetchConversations = async () => {
        setIsLoadingConversations(true);
        try {
            const response = await fetch('/ai/conversations');
            const data = await response.json();
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
        setIsLoadingConversations(false);
    };

    const checkConnection = async () => {
        try {
            const response = await fetch('/ai/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCSRFToken(),
                },
                body: JSON.stringify({ model: 'qwen3:4b' }),
            });
            const data = await response.json();
            setIsConnected(data.success);
        } catch (err) {
            console.error('Connection check failed:', err);
            setIsConnected(false);
        }
    };

    const loadConversation = async (conversationId: number) => {
        try {
            const response = await fetch(`/ai/conversations/${conversationId}`);
            const data = await response.json();
            if (data.success) {
                setCurrentConversationId(conversationId);
                setMessages(data.conversation.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })));
                setShowHistory(false);
            }
        } catch (err) {
            console.error('Failed to load conversation:', err);
        }
    };

    const createNewConversation = async (): Promise<number | null> => {
        try {
            const response = await fetch('/ai/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCSRFToken(),
                },
                body: JSON.stringify({ model: 'qwen3:4b' }),
            });
            const data = await response.json();
            if (data.success) {
                setCurrentConversationId(data.conversation.id);
                setMessages(data.conversation.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })));
                await fetchConversations();
                return data.conversation.id;
            }
        } catch (err) {
            console.error('Failed to create conversation:', err);
        }
        return null;
    };

    const deleteConversation = async (conversationId: number) => {
        try {
            const response = await fetch(`/ai/conversations/${conversationId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCSRFToken(),
                },
            });
            const data = await response.json();
            if (data.success) {
                setConversations(prev => prev.filter(c => c.id !== conversationId));
                if (currentConversationId === conversationId) {
                    startNewChat();
                }
            }
        } catch (err) {
            console.error('Failed to delete conversation:', err);
        }
    };

    const startNewChat = () => {
        setCurrentConversationId(null);
        setMessages([{ ...defaultGreeting, id: Date.now().toString(), timestamp: new Date() }]);
        setShowHistory(false);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        // Create conversation if not exists
        let conversationId = currentConversationId;
        if (!conversationId) {
            conversationId = await createNewConversation();
            if (!conversationId) {
                // Fallback to non-persisted chat if creation fails
                const userMessage: ChatMessage = {
                    id: Date.now().toString(),
                    type: 'user',
                    content: inputMessage,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, userMessage]);
                setInputMessage('');
                return;
            }
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputMessage;
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(`/ai/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCSRFToken(),
                },
                body: JSON.stringify({ message: currentInput }),
            });

            const data = await response.json();

            if (data.success) {
                // Update user message with real ID
                setMessages(prev => prev.map(m => 
                    m.id === userMessage.id 
                        ? { ...m, id: data.user_message.id }
                        : m
                ));

                // Add assistant message
                const assistantMessage: ChatMessage = {
                    id: data.assistant_message.id,
                    type: 'assistant',
                    content: data.assistant_message.content,
                    timestamp: new Date(data.assistant_message.timestamp),
                    context: 'response'
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Refresh conversations list
                await fetchConversations();
                setIsConnected(true);
            } else {
                const errorMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant',
                    content: `⚠️ Error: ${data.message || 'Failed to get response'}. Please ensure Ollama is running.`,
                    timestamp: new Date(),
                    context: 'error'
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsConnected(false);
            }
        } catch (err) {
            console.error('Chat error:', err);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: '⚠️ Connection error. Please ensure Ollama is running with `ollama serve`.',
                timestamp: new Date(),
                context: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsConnected(false);
        }
        
        setIsLoading(false);
    };

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-PH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const handleQuickPrompt = (prompt: string) => {
        setInputMessage(prompt);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={onClose}
            />
            
            {/* Slider Panel */}
            <div className={cn(
                "fixed top-0 right-0 h-full w-96 bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-800 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-center gap-2">
                        {showHistory ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowHistory(false)}
                                className="h-7 w-7 p-0 text-white hover:bg-white/20"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                                <Bot className="h-4 w-4" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                {showHistory ? 'Conversations' : 'AI Assistant'}
                                {!showHistory && isConnected !== null && (
                                    isConnected 
                                        ? <Wifi className="h-3 w-3 text-green-300" />
                                        : <WifiOff className="h-3 w-3 text-red-300" />
                                )}
                            </h3>
                            <p className="text-[10px] text-blue-100">
                                {showHistory ? `${conversations.length} saved` : 'SmartVet Database'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {!showHistory && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowHistory(true)}
                                    className="h-7 w-7 p-0 text-white hover:bg-white/20"
                                    title="History"
                                >
                                    <History className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={startNewChat}
                                    className="h-7 w-7 p-0 text-white hover:bg-white/20"
                                    title="New Chat"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="h-7 w-7 p-0 text-white hover:bg-white/20"
                            title={isMinimized ? "Expand" : "Minimize"}
                        >
                            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-7 w-7 p-0 text-white hover:bg-white/20"
                            title="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {showHistory ? (
                            /* Conversation History View */
                            <div className="flex-1 flex flex-col">
                                <div className="p-2 border-b border-gray-200 dark:border-neutral-800">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => { startNewChat(); }}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        New Conversation
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1">
                                    {isLoadingConversations ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : conversations.length === 0 ? (
                                        <div className="text-center py-8 px-4">
                                            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                            <p className="text-xs text-muted-foreground">No conversations yet</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Start chatting to save conversations</p>
                                        </div>
                                    ) : (
                                        <div className="p-2 space-y-1">
                                            {conversations.map((conv) => (
                                                <div
                                                    key={conv.id}
                                                    className={cn(
                                                        "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                                                        currentConversationId === conv.id && "bg-blue-50 dark:bg-blue-900/20"
                                                    )}
                                                    onClick={() => loadConversation(conv.id)}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">{conv.title}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {conv.message_count} msgs • {conv.last_message_at || conv.created_at}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteConversation(conv.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        ) : (
                            /* Chat View */
                            <>
                                {/* Quick Actions */}
                                <div className="p-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
                                    <div className="flex flex-wrap gap-1">
                                        {quickPrompts.map((prompt, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                className="h-5 text-[10px] px-2 py-0"
                                                onClick={() => handleQuickPrompt(prompt)}
                                            >
                                                {prompt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "flex gap-2",
                                                message.type === 'user' ? 'justify-end' : 'justify-start'
                                            )}
                                        >
                                            {message.type === 'assistant' && (
                                                <div className="flex items-start justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0 mt-1">
                                                    <Bot className="h-3 w-3 text-blue-600 mt-1.5" />
                                                </div>
                                            )}
                                            
                                            <div className={cn(
                                                "max-w-[85%] rounded-lg p-2.5 text-xs space-y-1",
                                                message.type === 'user' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : message.context === 'error'
                                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                        : 'bg-gray-100 dark:bg-gray-800'
                                            )}>
                                                <div className="whitespace-pre-line leading-relaxed">
                                                    {message.content}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "text-[10px]",
                                                        message.type === 'user' 
                                                            ? 'text-blue-100' 
                                                            : 'text-gray-500 dark:text-gray-400'
                                                    )}>
                                                        {formatTime(message.timestamp)}
                                                    </span>
                                                    {message.type === 'assistant' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-4 w-4 p-0 ml-1 opacity-50 hover:opacity-100"
                                                            onClick={() => copyMessage(message.content)}
                                                        >
                                                            <Copy className="h-2.5 w-2.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {message.type === 'user' && (
                                                <div className="flex items-start justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex-shrink-0 mt-1">
                                                    <User className="h-3 w-3 text-green-600 mt-1.5" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {isLoading && (
                                        <div className="flex gap-2">
                                            <div className="flex items-start justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0 mt-1">
                                                <Bot className="h-3 w-3 text-blue-600 mt-1.5" />
                                            </div>
                                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2.5">
                                                <div className="flex items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                                    <span className="text-[10px] text-gray-500 ml-1">AI is thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                                    <div className="flex gap-2">
                                        <Input
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Ask about inventory, pets, finances..."
                                            className="flex-1 text-xs h-8"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            disabled={isLoading}
                                        />
                                        <Button 
                                            onClick={handleSendMessage}
                                            disabled={!inputMessage.trim() || isLoading}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Send className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 text-center">
                                        {isConnected === null 
                                            ? 'Checking connection...' 
                                            : isConnected 
                                                ? '✓ Connected • Conversations saved' 
                                                : 'Run `ollama serve` to connect'}
                                    </p>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
