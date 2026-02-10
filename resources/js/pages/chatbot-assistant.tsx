import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import AdminLayout from '@/layouts/admin-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Bot,
    Send,
    Copy,
    Trash2,
    MessageSquare,
    User,
    Stethoscope,
    PawPrint,
    Pill,
    FileText,
    Lightbulb,
    CheckCircle,
    RefreshCw,
    Database,
    Package,
    Loader2,
    Wifi,
    WifiOff,
    Plus,
    History,
    MoreVertical,
    Pencil,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

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

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    prompt: string;
    category: 'medical' | 'administrative' | 'inventory' | 'emergency';
}

interface OllamaModel {
    name: string;
    size: string;
    modified: string | null;
}

const quickActions: QuickAction[] = [
    {
        id: 'inventory-check',
        title: 'Check Inventory',
        description: 'View current stock levels and low stock alerts',
        icon: Package,
        prompt: 'Show me the current inventory status. What items are low on stock or out of stock?',
        category: 'inventory'
    },
    {
        id: 'pet-search',
        title: 'Search Pet Records',
        description: 'Find pet information by name or owner',
        icon: PawPrint,
        prompt: 'Search for pet records for:',
        category: 'administrative'
    },
    {
        id: 'vaccinations-due',
        title: 'Vaccination Schedule',
        description: 'View upcoming and overdue vaccinations',
        icon: Stethoscope,
        prompt: 'Show me all pets with vaccinations due soon or overdue.',
        category: 'medical'
    },
    {
        id: 'financial-summary',
        title: 'Financial Summary',
        description: 'Get revenue and payment statistics',
        icon: FileText,
        prompt: 'Give me a summary of today\'s revenue, monthly revenue, and pending payments.',
        category: 'administrative'
    },
    {
        id: 'medication-guide',
        title: 'Medication Guidance',
        description: 'Get dosage and administration information',
        icon: Pill,
        prompt: 'Provide medication guidance including dosage, frequency, and precautions for:',
        category: 'medical'
    },
    {
        id: 'emergency-protocol',
        title: 'Emergency Protocol',
        description: 'Quick guidance for emergency situations',
        icon: CheckCircle,
        prompt: 'What is the emergency protocol for this situation:',
        category: 'emergency'
    },
    {
        id: 'client-communication',
        title: 'Client Communication',
        description: 'Draft professional communications to pet owners',
        icon: MessageSquare,
        prompt: 'Help me draft a professional message to a client about:',
        category: 'administrative'
    },
    {
        id: 'database-summary',
        title: 'Database Overview',
        description: 'Get comprehensive clinic statistics',
        icon: Database,
        prompt: 'Give me a complete overview of the clinic database including total pets, owners, inventory value, and recent activity.',
        category: 'administrative'
    }
];

const sampleQuestions = [
    'How many pets are registered in the system?',
    'What vaccines are available in inventory?',
    'Show me pets that need vaccinations this week',
    'What is the total inventory value?',
    'List all low stock items that need restocking'
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Chatbot Assistant',
        href: '/chatbot-assistant',
    },
];

const defaultGreeting: ChatMessage = {
    id: 'greeting',
    type: 'assistant',
    content: `Hello! I'm your SmartVet AI Assistant powered by local AI models. I have direct access to your clinic's database and can help you with:

• **Inventory Management** - Check stock levels, low stock alerts, item searches
• **Pet Records** - Find pets, view consultations, vaccination history
• **Financial Reports** - Revenue tracking, pending payments, billing info
• **Vaccination Schedules** - Due dates, overdue reminders, scheduling
• **Administrative Tasks** - Client communications, report generation

I can access your **real clinic data** to provide accurate, up-to-date information.

What would you like to know?`,
    timestamp: new Date(),
    context: 'greeting'
};

export default function ChatbotAssistant() {
    const { success, error } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Conversation state
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    
    // Messages state
    const [messages, setMessages] = useState<ChatMessage[]>([defaultGreeting]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // UI state
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('qwen3:4b');
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);
    
    // Edit title dialog
    const [editTitleDialog, setEditTitleDialog] = useState(false);
    const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
    const [newTitle, setNewTitle] = useState('');
    
    // Delete dialog
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deletingConversation, setDeletingConversation] = useState<Conversation | null>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch data on mount
    useEffect(() => {
        fetchModels();
        checkConnection();
        fetchConversations();
    }, []);

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

    const fetchModels = async () => {
        try {
            const response = await fetch('/ai/models');
            const data = await response.json();
            if (data.success && data.models.length > 0) {
                setAvailableModels(data.models);
                if (data.models.length > 0 && !selectedModel) {
                    setSelectedModel(data.models[0].name);
                }
            }
        } catch (err) {
            console.error('Failed to fetch models:', err);
        }
    };

    const checkConnection = async () => {
        setIsCheckingConnection(true);
        try {
            const response = await fetch('/ai/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ model: selectedModel }),
            });
            const data = await response.json();
            setIsConnected(data.success);
            if (data.success) {
                success('Connected to Ollama AI');
            }
        } catch (err) {
            setIsConnected(false);
            error('Cannot connect to Ollama. Please ensure it is running.');
        }
        setIsCheckingConnection(false);
    };

    const loadConversation = async (conversationId: number) => {
        try {
            const response = await fetch(`/ai/conversations/${conversationId}`);
            const data = await response.json();
            if (data.success) {
                setCurrentConversationId(conversationId);
                setSelectedModel(data.conversation.model);
                setMessages(data.conversation.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })));
            }
        } catch (err) {
            error('Failed to load conversation');
        }
    };

    const createNewConversation = async () => {
        try {
            const response = await fetch('/ai/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ model: selectedModel }),
            });
            const data = await response.json();
            if (data.success) {
                setCurrentConversationId(data.conversation.id);
                setMessages(data.conversation.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })));
                await fetchConversations();
                success('New conversation created');
            }
        } catch (err) {
            error('Failed to create conversation');
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        // Create conversation if not exists
        let conversationId = currentConversationId;
        if (!conversationId) {
            try {
                const response = await fetch('/ai/conversations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ model: selectedModel }),
                });
                const data = await response.json();
                if (data.success) {
                    conversationId = data.conversation.id;
                    setCurrentConversationId(conversationId);
                }
            } catch (err) {
                error('Failed to create conversation');
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
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
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

                // Update conversation title in list
                if (data.conversation_title) {
                    setConversations(prev => prev.map(c => 
                        c.id === conversationId 
                            ? { ...c, title: data.conversation_title }
                            : c
                    ));
                }

                // Refresh conversations list
                await fetchConversations();
            } else {
                const errorMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant',
                    content: `⚠️ **Error:** ${data.message || 'Failed to get response from AI.'}\n\nPlease ensure Ollama is running on your machine with the command:\n\`\`\`\nollama serve\n\`\`\``,
                    timestamp: new Date(),
                    context: 'error'
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsConnected(false);
            }
        } catch (err) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: `⚠️ **Connection Error:** Unable to reach the AI service.\n\nPlease check:\n1. Ollama is running (\`ollama serve\`)\n2. The model ${selectedModel} is installed\n3. Your network connection`,
                timestamp: new Date(),
                context: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsConnected(false);
        }
        
        setIsLoading(false);
    };

    const handleQuickAction = (action: QuickAction) => {
        setInputMessage(action.prompt + (action.prompt.endsWith(':') ? ' ' : ''));
    };

    const clearChat = () => {
        setCurrentConversationId(null);
        setMessages([defaultGreeting]);
    };

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        success('Copied to clipboard');
    };

    const handleEditTitle = (conversation: Conversation) => {
        setEditingConversation(conversation);
        setNewTitle(conversation.title);
        setEditTitleDialog(true);
    };

    const saveTitle = async () => {
        if (!editingConversation || !newTitle.trim()) return;

        try {
            const response = await fetch(`/ai/conversations/${editingConversation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ title: newTitle }),
            });
            const data = await response.json();
            if (data.success) {
                setConversations(prev => prev.map(c => 
                    c.id === editingConversation.id 
                        ? { ...c, title: newTitle }
                        : c
                ));
                success('Title updated');
            }
        } catch (err) {
            error('Failed to update title');
        }
        setEditTitleDialog(false);
        setEditingConversation(null);
    };

    const handleDeleteConversation = (conversation: Conversation) => {
        setDeletingConversation(conversation);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!deletingConversation) return;

        try {
            const response = await fetch(`/ai/conversations/${deletingConversation.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setConversations(prev => prev.filter(c => c.id !== deletingConversation.id));
                if (currentConversationId === deletingConversation.id) {
                    clearChat();
                }
                success('Conversation deleted');
            }
        } catch (err) {
            error('Failed to delete conversation');
        }
        setDeleteDialog(false);
        setDeletingConversation(null);
    };

    const filteredQuickActions = selectedCategory === 'all' 
        ? quickActions 
        : quickActions.filter(action => action.category === selectedCategory);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-PH', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    // Render markdown-like content
    const renderContent = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            if (line.startsWith('### ')) {
                return <h3 key={index} className="font-bold text-base mt-2 mb-1">{line.slice(4)}</h3>;
            }
            if (line.startsWith('## ')) {
                return <h2 key={index} className="font-bold text-lg mt-3 mb-1">{line.slice(3)}</h2>;
            }
            let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            rendered = rendered.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">$1</code>');
            if (line.startsWith('• ') || line.startsWith('- ')) {
                return <div key={index} className="ml-4" dangerouslySetInnerHTML={{ __html: '• ' + rendered.slice(2) }} />;
            }
            if (/^\d+\.\s/.test(line)) {
                return <div key={index} className="ml-4" dangerouslySetInnerHTML={{ __html: rendered }} />;
            }
            if (line.trim() === '') {
                return <br key={index} />;
            }
            return <div key={index} dangerouslySetInnerHTML={{ __html: rendered }} />;
        });
    };

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="AI Veterinary Assistant"
            description="AI-powered assistant with real-time access to your clinic database."
        >
            <Head title="Chatbot Assistant" />
            
            <div className="grid gap-6 lg:grid-cols-4">
                {/* Quick Actions Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Connection Status & Model Selection */}
                    <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                {isConnected === null ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                ) : isConnected ? (
                                    <Wifi className="h-4 w-4 text-green-600" />
                                ) : (
                                    <WifiOff className="h-4 w-4 text-red-500" />
                                )}
                                AI Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Model</label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableModels.length > 0 ? (
                                            availableModels.map((model) => (
                                                <SelectItem key={model.name} value={model.name}>
                                                    {model.name} ({model.size})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="qwen3:4b">qwen3:4b</SelectItem>
                                                <SelectItem value="sailor2:1b">sailor2:1b</SelectItem>
                                                <SelectItem value="gpt-oss:20b">gpt-oss:20b</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={checkConnection}
                                disabled={isCheckingConnection}
                            >
                                {isCheckingConnection ? (
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-3 w-3 mr-2" />
                                )}
                                Test Connection
                            </Button>
                            {isConnected === false && (
                                <p className="text-xs text-red-500">
                                    Run `ollama serve` to start the AI server
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Conversation History */}
                    <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <History className="h-4 w-4 text-blue-600" />
                                    Conversations
                                </CardTitle>
                                <Button size="sm" variant="outline" onClick={createNewConversation}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[200px]">
                                {isLoadingConversations ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="text-center py-8 px-4">
                                        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                        <p className="text-xs text-muted-foreground">No conversations yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1 p-2">
                                        {conversations.map((conv) => (
                                            <div
                                                key={conv.id}
                                                className={cn(
                                                    "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent",
                                                    currentConversationId === conv.id && "bg-accent"
                                                )}
                                                onClick={() => loadConversation(conv.id)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{conv.title}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {conv.message_count} messages • {conv.last_message_at || conv.created_at}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                                            <MoreVertical className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditTitle(conv); }}>
                                                            <Pencil className="h-3 w-3 mr-2" />
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="text-red-600"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv); }}
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-500" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription>
                                Common tasks with database access
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="inventory">Inventory</SelectItem>
                                    <SelectItem value="medical">Medical</SelectItem>
                                    <SelectItem value="administrative">Administrative</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {filteredQuickActions.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <Button
                                            key={action.id}
                                            variant="ghost"
                                            className="w-full justify-start h-auto p-3 text-left"
                                            onClick={() => handleQuickAction(action)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Icon className="h-4 w-4 mt-0.5 text-blue-600" />
                                                <div className="space-y-1">
                                                    <div className="font-medium text-sm">{action.title}</div>
                                                    <div className="text-xs text-muted-foreground">{action.description}</div>
                                                </div>
                                            </div>
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sample Questions */}
                    <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-green-600" />
                                Sample Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {sampleQuestions.map((question, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        className="w-full justify-start h-auto p-2 text-left text-xs"
                                        onClick={() => setInputMessage(question)}
                                    >
                                        "{question}"
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-3">
                    <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900 h-[calc(100vh-200px)] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                    <Bot className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        SmartVet AI Assistant
                                        <Badge variant="outline" className="text-xs">
                                            {selectedModel}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <Database className="h-3 w-3" />
                                        Connected to clinic database • {messages.length - 1} {messages.length === 2 ? 'message' : 'messages'}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={clearChat} title="New Chat">
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Badge 
                                    variant="secondary" 
                                    className={cn(
                                        isConnected 
                                            ? "bg-green-100 text-green-800" 
                                            : "bg-red-100 text-red-800"
                                    )}
                                >
                                    {isConnected ? 'Online' : 'Offline'}
                                </Badge>
                            </div>
                        </CardHeader>
                        
                        {/* Messages Area */}
                        <CardContent className="flex-1 overflow-y-auto space-y-4 p-6">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-3",
                                        message.type === 'user' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    {message.type === 'assistant' && (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                                            <Bot className="h-4 w-4 text-blue-600" />
                                        </div>
                                    )}
                                    
                                    <div className={cn(
                                        "max-w-[80%] rounded-lg p-4 space-y-2",
                                        message.type === 'user' 
                                            ? 'bg-blue-600 text-white ml-12' 
                                            : message.context === 'error'
                                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                : 'bg-gray-100 dark:bg-gray-800'
                                    )}>
                                        <div className="text-sm">
                                            {message.type === 'user' ? message.content : renderContent(message.content)}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-xs",
                                                message.type === 'user' 
                                                    ? 'text-blue-100' 
                                                    : 'text-muted-foreground'
                                            )}>
                                                {formatTime(message.timestamp)}
                                            </span>
                                            {message.type === 'assistant' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 ml-2"
                                                    onClick={() => copyMessage(message.content)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {message.type === 'user' && (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex-shrink-0">
                                            <User className="h-4 w-4 text-green-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                        <Bot className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                            <span className="text-sm text-muted-foreground">
                                                AI is analyzing your request...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        
                        {/* Input Area */}
                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Ask about inventory, pets, vaccinations, financials..."
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    disabled={isLoading || !isConnected}
                                />
                                <Button 
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim() || isLoading || !isConnected}
                                    className="px-4"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 text-center">
                                {isConnected 
                                    ? `Using ${selectedModel} with real-time database access`
                                    : 'Connect to Ollama to start chatting'
                                }
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Edit Title Dialog */}
            <Dialog open={editTitleDialog} onOpenChange={setEditTitleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Conversation</DialogTitle>
                        <DialogDescription>
                            Enter a new title for this conversation.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Conversation title"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTitleDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveTitle}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Conversation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingConversation?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
