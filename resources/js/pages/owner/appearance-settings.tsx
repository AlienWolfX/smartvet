import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import OwnerLayout from '@/layouts/owner-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OwnerAppearanceSettingsProps {
    settings: {
        theme_name: string;
        theme_color: string;
    };
}

interface ThemePreset {
    name: string;
    label: string;
    color: string;
}

const themePresets: ThemePreset[] = [
    { name: 'default', label: 'Forest', color: '#0e4d3a' },
    { name: 'ocean', label: 'Ocean', color: '#1e3a5f' },
    { name: 'sunset', label: 'Sunset', color: '#7c2d12' },
    { name: 'rose', label: 'Rose', color: '#4c0519' },
    { name: 'purple', label: 'Violet', color: '#2e1065' },
    { name: 'forest', label: 'Pine', color: '#14532d' },
];

export default function OwnerAppearanceSettings({ settings }: OwnerAppearanceSettingsProps) {
    const { success } = useToast();
    const [selectedTheme, setSelectedTheme] = useState(settings.theme_name || 'default');
    const [customColor, setCustomColor] = useState(settings.theme_color || '#0e4d3a');

    const { data, setData, post, processing } = useForm({
        theme_name: settings.theme_name || 'default',
        theme_color: settings.theme_color || '#0e4d3a',
    });

    const handleThemeSelect = (theme: ThemePreset) => {
        setSelectedTheme(theme.name);
        setData('theme_name', theme.name);
        setData('theme_color', theme.color);
        setCustomColor(theme.color);
    };

    const handleCustomColor = (color: string) => {
        setCustomColor(color);
        setSelectedTheme('custom');
        setData('theme_name', 'custom');
        setData('theme_color', color);
    };

    const activeColor = selectedTheme === 'custom'
        ? customColor
        : themePresets.find((t) => t.name === selectedTheme)?.color || '#0e4d3a';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/owner/settings/appearance', {
            onSuccess: () => {
                success('Appearance updated! Reloading...');
                setTimeout(() => window.location.reload(), 500);
            },
        });
    };

    return (
        <OwnerLayout
            title="Appearance Settings"
            description="Customize your owner portal appearance."
        >
            <Head title="Owner Appearance Settings" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Theme</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Color Theme</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {themePresets.map((theme) => (
                                    <button
                                        type="button"
                                        key={theme.name}
                                        onClick={() => handleThemeSelect(theme)}
                                        className={cn(
                                            'group relative flex flex-col items-center rounded-xl border-2 p-2 transition-all hover:shadow-md',
                                            selectedTheme === theme.name
                                                ? 'border-slate-900 shadow-md'
                                                : 'border-slate-200 hover:border-slate-300',
                                        )}
                                    >
                                        <div className="mb-1.5 flex w-full overflow-hidden rounded-lg shadow-sm">
                                            <div className="h-12 w-6 flex-shrink-0" style={{ backgroundColor: theme.color }} />
                                            <div className="flex-1 bg-slate-100 p-1">
                                                <div className="mb-0.5 h-1 w-3/4 rounded bg-slate-300" />
                                                <div className="mb-0.5 h-1 w-1/2 rounded bg-slate-200" />
                                                <div className="h-1 w-2/3 rounded bg-slate-200" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700">{theme.label}</span>
                                        {selectedTheme === theme.name && (
                                            <div
                                                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
                                                style={{ backgroundColor: theme.color }}
                                            >
                                                <Check className="h-3 w-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-700">Custom Color</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => handleCustomColor(e.target.value)}
                                    className="h-9 w-9 cursor-pointer rounded-lg border-2 border-slate-200 p-0.5"
                                />
                                <Input
                                    value={customColor}
                                    onChange={(e) => handleCustomColor(e.target.value)}
                                    placeholder="#000000"
                                    className="h-9 font-mono text-sm uppercase flex-1"
                                    maxLength={7}
                                />
                                <div
                                    className={cn(
                                        'h-9 w-16 rounded-lg transition-colors shrink-0',
                                        selectedTheme === 'custom' && 'ring-2 ring-slate-900 ring-offset-2',
                                    )}
                                    style={{ backgroundColor: customColor }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={processing}
                        className="px-8 text-white"
                        style={{ backgroundColor: activeColor }}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </OwnerLayout>
    );
}
