import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Camera, Check, Sparkles, Save, Trash2 } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { dashboard } from '@/routes';
import { useToast } from '@/hooks/use-toast';

interface ClinicSettingsProps {
    settings: {
        clinic_name: string;
        clinic_logo: string | null;
        theme_name: string;
        theme_color: string;
    };
}

interface ThemePreset {
    name: string;
    label: string;
    color: string;
    description: string;
}

const themePresets: ThemePreset[] = [
    { name: 'default', label: 'Slate', color: '#0f172a', description: 'Classic dark sidebar' },
    { name: 'ocean', label: 'Ocean', color: '#1e3a5f', description: 'Calm ocean blue' },
    { name: 'forest', label: 'Forest', color: '#14532d', description: 'Natural green' },
    { name: 'sunset', label: 'Sunset', color: '#7c2d12', description: 'Warm sunset tones' },
    { name: 'rose', label: 'Rose', color: '#4c0519', description: 'Elegant rose' },
    { name: 'purple', label: 'Violet', color: '#2e1065', description: 'Royal violet' },
];

export default function ClinicSettings({ settings }: ClinicSettingsProps) {
    const { success } = useToast();
    const { auth } = usePage<SharedData>().props;
    const isAdmin = (auth.user as { role?: string })?.role === 'admin';
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0f172a';

    const breadcrumbs: BreadcrumbItem[] = isAdmin
        ? [{ title: 'System Settings', href: '/clinic-settings' }]
        : [
            { title: 'Dashboard', href: dashboard().url },
            { title: 'System Settings', href: '/clinic-settings' },
        ];

    const [logoPreview, setLogoPreview] = useState<string | null>(settings.clinic_logo);
    const [selectedTheme, setSelectedTheme] = useState(settings.theme_name || 'default');
    const [customColor, setCustomColor] = useState(settings.theme_color || '#0f172a');
    const [removeLogo, setRemoveLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        clinic_name: settings.clinic_name || '',
        clinic_logo: null as File | null,
        remove_logo: false,
        theme_name: settings.theme_name || 'default',
        theme_color: settings.theme_color || '#0f172a',
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('clinic_logo', file);
            setData('remove_logo', false);
            setRemoveLogo(false);
            const reader = new FileReader();
            reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setData('clinic_logo', null);
        setData('remove_logo', true);
        setRemoveLogo(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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

    const getActiveColor = () => {
        if (selectedTheme === 'custom') return customColor;
        return themePresets.find(t => t.name === selectedTheme)?.color || '#0f172a';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/clinic-settings', {
            forceFormData: true,
            onSuccess: () => {
                success('Settings updated! Reloading...');
                // Reload after short delay to reflect theme changes
                setTimeout(() => window.location.reload(), 500);
            },
        });
    };

    return (
        <AdminLayout
            title="System Settings"
            description="Manage your clinic profile and appearance preferences."
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Clinic Information */}
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Clinic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4 items-start">
                            {/* Logo */}
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <div
                                    className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-slate-400 hover:bg-slate-100"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {logoPreview && !removeLogo ? (
                                        <>
                                            <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Camera className="h-5 w-5 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-2">
                                            <Camera className="mx-auto h-6 w-6 text-slate-400" />
                                            <p className="mt-1 text-xs text-slate-500">Upload logo</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/svg+xml,image/webp"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                                {(logoPreview || settings.clinic_logo) && !removeLogo && (
                                    <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 text-xs h-7 px-2" onClick={handleRemoveLogo}>
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Remove
                                    </Button>
                                )}
                                {errors.clinic_logo && <p className="text-xs text-red-500">{errors.clinic_logo}</p>}
                            </div>

                            {/* Clinic Name */}
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="clinic_name" className="text-sm font-semibold">Clinic Name *</Label>
                                <Input
                                    id="clinic_name"
                                    placeholder="e.g., Happy Paws Veterinary Clinic"
                                    value={data.clinic_name}
                                    onChange={(e) => setData('clinic_name', e.target.value)}
                                    className="h-9"
                                    required
                                />
                                {errors.clinic_name && <p className="text-sm text-red-500">{errors.clinic_name}</p>}
                                <p className="text-xs text-slate-400">Displayed in the sidebar and throughout the system.</p>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Preview</p>
                            <div className="flex overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                <div
                                    className="flex w-14 flex-col items-center py-3 text-white transition-colors"
                                    style={{ backgroundColor: getActiveColor() }}
                                >
                                    {logoPreview && !removeLogo ? (
                                        <img src={logoPreview} alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
                                    ) : (
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
                                            {data.clinic_name.substring(0, 2).toUpperCase() || 'SV'}
                                        </div>
                                    )}
                                    <div className="mt-3 space-y-1.5">
                                        <div className="h-1 w-5 rounded bg-white/40" />
                                        <div className="h-1 w-5 rounded bg-white/20" />
                                        <div className="h-1 w-5 rounded bg-white/20" />
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-50 p-3">
                                    <div className="mb-2 h-2 w-20 rounded bg-slate-300" />
                                    <div className="space-y-1.5">
                                        <div className="h-1.5 w-full rounded bg-slate-200" />
                                        <div className="h-1.5 w-3/4 rounded bg-slate-200" />
                                        <div className="h-1.5 w-1/2 rounded bg-slate-200" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Theme Selection */}
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Appearance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Preset Themes */}
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Color Theme</Label>
                            <div className="grid grid-cols-3 gap-2">
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

                        {/* Custom Color */}
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
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={processing}
                        className="px-8 text-white"
                        style={{ backgroundColor: getActiveColor() }}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
