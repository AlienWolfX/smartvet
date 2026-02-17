import { Head, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Camera, Check, Palette, Building2, Sparkles } from 'lucide-react';

interface SetupProps {
    user: {
        name: string;
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
    sidebar: string;
    accent: string;
    description: string;
}

const themePresets: ThemePreset[] = [
    {
        name: 'default',
        label: 'Slate',
        color: '#0f172a',
        sidebar: 'bg-slate-950',
        accent: 'bg-slate-600',
        description: 'Classic dark sidebar',
    },
    {
        name: 'ocean',
        label: 'Ocean',
        color: '#1e3a5f',
        sidebar: 'bg-blue-950',
        accent: 'bg-blue-600',
        description: 'Calm ocean blue',
    },
    {
        name: 'forest',
        label: 'Forest',
        color: '#14532d',
        sidebar: 'bg-emerald-950',
        accent: 'bg-emerald-600',
        description: 'Natural green',
    },
    {
        name: 'sunset',
        label: 'Sunset',
        color: '#7c2d12',
        sidebar: 'bg-orange-950',
        accent: 'bg-orange-600',
        description: 'Warm sunset tones',
    },
    {
        name: 'rose',
        label: 'Rose',
        color: '#4c0519',
        sidebar: 'bg-rose-950',
        accent: 'bg-rose-600',
        description: 'Elegant rose',
    },
    {
        name: 'purple',
        label: 'Violet',
        color: '#2e1065',
        sidebar: 'bg-violet-950',
        accent: 'bg-violet-600',
        description: 'Royal violet',
    },
];

export default function Setup({ user }: SetupProps) {
    const [step, setStep] = useState(1);
    const [logoPreview, setLogoPreview] = useState<string | null>(user.clinic_logo);
    const [selectedTheme, setSelectedTheme] = useState(user.theme_name || 'default');
    const [customColor, setCustomColor] = useState(user.theme_color || '#0f172a');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        clinic_name: user.clinic_name || '',
        clinic_logo: null as File | null,
        theme_name: user.theme_name || 'default',
        theme_color: user.theme_color || '#0f172a',
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('clinic_logo', file);
            const reader = new FileReader();
            reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/setup', {
            forceFormData: true,
        });
    };

    const canProceedStep1 = data.clinic_name.trim().length > 0;
    const totalSteps = 3;

    const getActiveColor = () => {
        if (selectedTheme === 'custom') return customColor;
        return themePresets.find(t => t.name === selectedTheme)?.color || '#0f172a';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <Head title="Setup Your Clinic" />

            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                {/* Progress indicator */}
                <div className="mb-8 flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                                    step === s
                                        ? 'scale-110 shadow-lg'
                                        : step > s
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-slate-200 text-slate-500',
                                )}
                                style={step === s ? { backgroundColor: getActiveColor(), color: '#fff' } : {}}
                            >
                                {step > s ? <Check className="h-5 w-5" /> : s}
                            </div>
                            {s < totalSteps && (
                                <div
                                    className={cn(
                                        'mx-2 h-0.5 w-12 rounded transition-colors',
                                        step > s ? 'bg-emerald-500' : 'bg-slate-200',
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                    {/* Step 1: Clinic Info */}
                    {step === 1 && (
                        <Card className="border-0 shadow-2xl shadow-slate-200/60">
                            <CardContent className="p-8 md:p-12">
                                <div className="mb-8 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                        <Building2 className="h-8 w-8" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Welcome, {user.name}!
                                    </h1>
                                    <p className="mt-2 text-slate-500">
                                        Let's set up your clinic profile to get started.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="clinic_name" className="text-sm font-semibold">
                                            Clinic Name *
                                        </Label>
                                        <Input
                                            id="clinic_name"
                                            placeholder="e.g., Happy Paws Veterinary Clinic"
                                            value={data.clinic_name}
                                            onChange={(e) => setData('clinic_name', e.target.value)}
                                            className="h-12 text-base"
                                            required
                                            autoFocus
                                        />
                                        {errors.clinic_name && (
                                            <p className="text-sm text-red-500">{errors.clinic_name}</p>
                                        )}
                                        <p className="text-xs text-slate-400">
                                            This will be displayed in the sidebar and throughout the system.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <Button
                                        type="button"
                                        size="lg"
                                        disabled={!canProceedStep1}
                                        onClick={() => setStep(2)}
                                        className="px-8"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Logo Upload */}
                    {step === 2 && (
                        <Card className="border-0 shadow-2xl shadow-slate-200/60">
                            <CardContent className="p-8 md:p-12">
                                <div className="mb-8 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
                                        <Camera className="h-8 w-8" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Clinic Logo
                                    </h1>
                                    <p className="mt-2 text-slate-500">
                                        Upload your clinic's logo (optional). It will appear in the sidebar.
                                    </p>
                                </div>

                                <div className="flex flex-col items-center space-y-6">
                                    <div
                                        className="group relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-slate-400 hover:bg-slate-100"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {logoPreview ? (
                                            <>
                                                <img
                                                    src={logoPreview}
                                                    alt="Clinic logo preview"
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Camera className="h-8 w-8 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <Camera className="mx-auto h-10 w-10 text-slate-400" />
                                                <p className="mt-2 text-sm text-slate-500">Click to upload</p>
                                                <p className="text-xs text-slate-400">PNG, JPG, SVG up to 2MB</p>
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
                                    {errors.clinic_logo && (
                                        <p className="text-sm text-red-500">{errors.clinic_logo}</p>
                                    )}
                                </div>

                                <div className="mt-8 flex justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setStep(1)}
                                    >
                                        Back
                                    </Button>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="lg"
                                            onClick={() => setStep(3)}
                                        >
                                            Skip
                                        </Button>
                                        <Button
                                            type="button"
                                            size="lg"
                                            onClick={() => setStep(3)}
                                            className="px-8"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Theme Selection */}
                    {step === 3 && (
                        <Card className="border-0 shadow-2xl shadow-slate-200/60">
                            <CardContent className="p-8 md:p-12">
                                <div className="mb-8 text-center">
                                    <div
                                        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white transition-colors"
                                        style={{ backgroundColor: getActiveColor() }}
                                    >
                                        <Palette className="h-8 w-8" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Choose Your Theme
                                    </h1>
                                    <p className="mt-2 text-slate-500">
                                        Select a color theme for your clinic's dashboard.
                                    </p>
                                </div>

                                {/* Theme Presets */}
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    {themePresets.map((theme) => (
                                        <button
                                            type="button"
                                            key={theme.name}
                                            onClick={() => handleThemeSelect(theme)}
                                            className={cn(
                                                'group relative flex flex-col items-center rounded-xl border-2 p-4 transition-all hover:shadow-md',
                                                selectedTheme === theme.name
                                                    ? 'border-slate-900 shadow-md'
                                                    : 'border-slate-200 hover:border-slate-300',
                                            )}
                                        >
                                            {/* Mini sidebar preview */}
                                            <div className="mb-3 flex w-full overflow-hidden rounded-lg shadow-sm">
                                                <div
                                                    className="h-20 w-8 flex-shrink-0"
                                                    style={{ backgroundColor: theme.color }}
                                                />
                                                <div className="flex-1 bg-slate-100 p-1.5">
                                                    <div className="mb-1 h-1.5 w-3/4 rounded bg-slate-300" />
                                                    <div className="mb-1 h-1 w-1/2 rounded bg-slate-200" />
                                                    <div className="h-1 w-2/3 rounded bg-slate-200" />
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {theme.label}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {theme.description}
                                            </span>
                                            {selectedTheme === theme.name && (
                                                <div
                                                    className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white"
                                                    style={{ backgroundColor: theme.color }}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Color Picker */}
                                <div className="mt-6 rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-5 w-5 text-slate-400" />
                                        <span className="text-sm font-semibold text-slate-700">Custom Color</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={customColor}
                                                onChange={(e) => handleCustomColor(e.target.value)}
                                                className="h-12 w-12 cursor-pointer rounded-lg border-2 border-slate-200 p-0.5"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                value={customColor}
                                                onChange={(e) => handleCustomColor(e.target.value)}
                                                placeholder="#000000"
                                                className="h-10 font-mono text-sm uppercase"
                                                maxLength={7}
                                            />
                                        </div>
                                        {/* Preview strip */}
                                        <div
                                            className={cn(
                                                'h-10 w-24 rounded-lg transition-colors',
                                                selectedTheme === 'custom' && 'ring-2 ring-slate-900 ring-offset-2',
                                            )}
                                            style={{ backgroundColor: customColor }}
                                        />
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div className="mt-6">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Preview
                                    </p>
                                    <div className="flex overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        {/* Mini sidebar */}
                                        <div
                                            className="flex w-16 flex-col items-center py-4 text-white transition-colors"
                                            style={{ backgroundColor: getActiveColor() }}
                                        >
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo"
                                                    className="h-8 w-8 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
                                                    {data.clinic_name.substring(0, 2).toUpperCase() || 'SV'}
                                                </div>
                                            )}
                                            <div className="mt-4 space-y-2">
                                                <div className="h-1.5 w-6 rounded bg-white/40" />
                                                <div className="h-1.5 w-6 rounded bg-white/20" />
                                                <div className="h-1.5 w-6 rounded bg-white/20" />
                                            </div>
                                        </div>
                                        {/* Content area */}
                                        <div className="flex-1 bg-slate-50 p-4">
                                            <div className="mb-3 h-2 w-24 rounded bg-slate-300" />
                                            <div className="space-y-2">
                                                <div className="h-1.5 w-full rounded bg-slate-200" />
                                                <div className="h-1.5 w-3/4 rounded bg-slate-200" />
                                                <div className="h-1.5 w-1/2 rounded bg-slate-200" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setStep(2)}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={processing}
                                        className="px-8"
                                        style={{ backgroundColor: getActiveColor() }}
                                    >
                                        {processing ? 'Setting up...' : 'Complete Setup'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </form>

                {/* Step labels */}
                <div className="mt-6 flex items-center gap-8 text-xs text-slate-400">
                    <span className={cn(step === 1 && 'font-semibold text-slate-700')}>
                        Clinic Info
                    </span>
                    <span className={cn(step === 2 && 'font-semibold text-slate-700')}>
                        Logo
                    </span>
                    <span className={cn(step === 3 && 'font-semibold text-slate-700')}>
                        Theme
                    </span>
                </div>
            </div>
        </div>
    );
}
