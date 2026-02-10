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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Bot,
    Save,
    TestTube,
    CheckCircle,
    AlertCircle,
    Key,
    Server,
    Shield,
    Zap,
    RefreshCw,
    Database,
    Globe,
    Lock,
    Eye,
    EyeOff
} from 'lucide-react';
import { useState, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'System Settings',
        href: '/system-settings',
    },
];

interface AIConfig {
    provider: 'openai' | 'anthropic' | 'google' | 'local';
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    categoryRules: string;
    enabled: boolean;
    features: {
        chatbot: boolean;
        diagnosticAssistance: boolean;
        reportGeneration: boolean;
        inventoryPrediction: boolean;
    };
}



export default function SystemSettings() {
    const [showApiKey, setShowApiKey] = useState(false);
    const [isTestingAI, setIsTestingAI] = useState(false);
    const [isSavingAI, setIsSavingAI] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [aiTestResult, setAiTestResult] = useState<'success' | 'error' | null>(null);
    const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);

    const [aiConfig, setAiConfig] = useState<AIConfig>({
        provider: 'local',
        apiKey: '',
        model: 'qwen3:4b',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: '',
        categoryRules: '',
        enabled: true,
        features: {
            chatbot: true,
            diagnosticAssistance: false,
            reportGeneration: true,
            inventoryPrediction: true,
        }
    });

    // Load AI configuration from database on mount
    useEffect(() => {
        loadAiConfig();
    }, []);

    const loadAiConfig = async () => {
        setIsLoadingConfig(true);
        try {
            const response = await fetch('/ai/config', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success && data.config) {
                setAiConfig({
                    provider: data.config.provider || 'local',
                    apiKey: data.config.api_key || '',
                    model: data.config.model || 'qwen3:4b',
                    temperature: data.config.temperature || 0.7,
                    maxTokens: data.config.max_tokens || 1000,
                    systemPrompt: data.config.system_prompt || '',
                    categoryRules: data.config.category_rules || '',
                    enabled: data.config.enabled ?? true,
                    features: data.config.features || {
                        chatbot: true,
                        diagnosticAssistance: false,
                        reportGeneration: true,
                        inventoryPrediction: true,
                    },
                });
            }
        } catch (err) {
            console.error('Failed to load AI config:', err);
        }
        setIsLoadingConfig(false);
    };

    const handleSaveAI = async () => {
        setIsSavingAI(true);
        setSaveResult(null);
        try {
            const response = await fetch('/ai/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    provider: aiConfig.provider,
                    model: aiConfig.model,
                    api_key: aiConfig.apiKey,
                    temperature: aiConfig.temperature,
                    max_tokens: aiConfig.maxTokens,
                    system_prompt: aiConfig.systemPrompt,
                    category_rules: aiConfig.categoryRules,
                    enabled: aiConfig.enabled,
                    features: aiConfig.features,
                }),
            });
            const data = await response.json();
            setSaveResult(data.success ? 'success' : 'error');
        } catch (err) {
            setSaveResult('error');
        }
        setIsSavingAI(false);
    };

    const handleResetAI = async () => {
        try {
            const response = await fetch('/ai/config/reset', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success && data.config) {
                setAiConfig(prev => ({
                    ...prev,
                    systemPrompt: data.config.system_prompt,
                    categoryRules: data.config.category_rules,
                }));
                setSaveResult('success');
            }
        } catch (err) {
            setSaveResult('error');
        }
    };

    const handleTestAI = async () => {
        setIsTestingAI(true);
        setAiTestResult(null);
        
        try {
            const response = await fetch('/ai/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ model: aiConfig.model }),
            });
            const data = await response.json();
            setAiTestResult(data.success ? 'success' : 'error');
        } catch (err) {
            setAiTestResult('error');
        }
        
        setIsTestingAI(false);
    };

    const aiProviders = {
        openai: { name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'] },
        anthropic: { name: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-2'] },
        google: { name: 'Google', models: ['gemini-pro', 'gemini-pro-vision'] },
        local: { name: 'Local (Ollama)', models: ['qwen3:4b', 'qwen2:7b', 'sailor2:1b', 'gpt-oss:20b', 'llama2', 'mistral'] }
    };

    return (
        <AdminLayout
            breadcrumbs={breadcrumbs}
            title="System Settings"
            description="Configure system-wide settings and AI integration for your veterinary clinic."
        >
            <Head title="System Settings" />
            
            <div className="space-y-6">
                    <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)] dark:border-white/5 dark:bg-neutral-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-blue-600" />
                                        AI Assistant Configuration
                                    </CardTitle>
                                    <CardDescription>
                                        Configure your AI assistant for administrative support and operational guidance
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={aiConfig.enabled ? "default" : "secondary"}>
                                        {aiConfig.enabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                    <Switch
                                        checked={aiConfig.enabled}
                                        onCheckedChange={(checked) => 
                                            setAiConfig(prev => ({ ...prev, enabled: checked }))
                                        }
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ai-provider">AI Provider</Label>
                                        <Select
                                            value={aiConfig.provider}
                                            onValueChange={(value: AIConfig['provider']) => 
                                                setAiConfig(prev => ({ ...prev, provider: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(aiProviders).map(([key, provider]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {provider.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ai-model">Model</Label>
                                        <Select
                                            value={aiConfig.model}
                                            onValueChange={(value) => 
                                                setAiConfig(prev => ({ ...prev, model: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {aiProviders[aiConfig.provider].models.map(model => (
                                                    <SelectItem key={model} value={model}>
                                                        {model}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="api-key">API Key</Label>
                                        <div className="relative">
                                            <Input
                                                id="api-key"
                                                type={showApiKey ? "text" : "password"}
                                                value={aiConfig.apiKey}
                                                onChange={(e) => 
                                                    setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))
                                                }
                                                className="pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                            >
                                                {showApiKey ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="temperature">Temperature: {aiConfig.temperature}</Label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={aiConfig.temperature}
                                            onChange={(e) => 
                                                setAiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))
                                            }
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>More Focused</span>
                                            <span>More Creative</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="max-tokens">Max Tokens</Label>
                                        <Input
                                            id="max-tokens"
                                            type="number"
                                            min="100"
                                            max="4000"
                                            value={aiConfig.maxTokens}
                                            onChange={(e) => 
                                                setAiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Test Connection</Label>
                                            {aiTestResult && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    {aiTestResult === 'success' ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                            <span className="text-green-600">Connected</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                                            <span className="text-red-600">Failed</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleTestAI}
                                            disabled={isTestingAI}
                                            className="w-full"
                                        >
                                            {isTestingAI ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                    Testing...
                                                </>
                                            ) : (
                                                <>
                                                    <TestTube className="h-4 w-4 mr-2" />
                                                    Test AI Connection
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>System Prompt</Label>
                                <Textarea
                                    value={aiConfig.systemPrompt}
                                    onChange={(e) => 
                                        setAiConfig(prev => ({ ...prev, systemPrompt: e.target.value }))
                                    }
                                    rows={8}
                                    className="font-mono text-sm"
                                    placeholder="Enter the base system prompt for the AI assistant..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use placeholders: {'{{CATEGORY_RULES}}'}, {'{{INVENTORY_DATA}}'}, {'{{PET_STATISTICS}}'}, {'{{FINANCIAL_SUMMARY}}'}, {'{{LOW_STOCK_ALERTS}}'}, {'{{UPCOMING_VACCINATIONS}}'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Category Rules</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetAI}
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Reset to Default
                                    </Button>
                                </div>
                                <Textarea
                                    value={aiConfig.categoryRules}
                                    onChange={(e) => 
                                        setAiConfig(prev => ({ ...prev, categoryRules: e.target.value }))
                                    }
                                    rows={6}
                                    className="font-mono text-sm"
                                    placeholder="Enter rules for how AI should categorize and filter inventory items..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Define how the AI should filter inventory by category when users ask about vaccines, medications, etc.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Label>AI Features</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="chatbot">Administrative Chatbot</Label>
                                            <p className="text-sm text-muted-foreground">Enable AI assistant in navigation</p>
                                        </div>
                                        <Switch
                                            id="chatbot"
                                            checked={aiConfig.features.chatbot}
                                            onCheckedChange={(checked) => 
                                                setAiConfig(prev => ({ 
                                                    ...prev, 
                                                    features: { ...prev.features, chatbot: checked }
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="reports">Report Generation</Label>
                                            <p className="text-sm text-muted-foreground">AI-powered analytics insights</p>
                                        </div>
                                        <Switch
                                            id="reports"
                                            checked={aiConfig.features.reportGeneration}
                                            onCheckedChange={(checked) => 
                                                setAiConfig(prev => ({ 
                                                    ...prev, 
                                                    features: { ...prev.features, reportGeneration: checked }
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="inventory">Inventory Prediction</Label>
                                            <p className="text-sm text-muted-foreground">Smart inventory recommendations</p>
                                        </div>
                                        <Switch
                                            id="inventory"
                                            checked={aiConfig.features.inventoryPrediction}
                                            onCheckedChange={(checked) => 
                                                setAiConfig(prev => ({ 
                                                    ...prev, 
                                                    features: { ...prev.features, inventoryPrediction: checked }
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="diagnostic">Diagnostic Assistance</Label>
                                            <p className="text-sm text-muted-foreground">AI diagnostic support (experimental)</p>
                                        </div>
                                        <Switch
                                            id="diagnostic"
                                            checked={aiConfig.features.diagnosticAssistance}
                                            onCheckedChange={(checked) => 
                                                setAiConfig(prev => ({ 
                                                    ...prev, 
                                                    features: { ...prev.features, diagnosticAssistance: checked }
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {saveResult && (
                                        saveResult === 'success' ? (
                                            <div className="flex items-center gap-1 text-sm text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Configuration saved</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                <span>Failed to save</span>
                                            </div>
                                        )
                                    )}
                                </div>
                                <Button onClick={handleSaveAI} disabled={isSavingAI}>
                                    {isSavingAI ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save AI Configuration
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </AdminLayout>
    );
}