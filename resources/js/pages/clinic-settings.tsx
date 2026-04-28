import InputError from '@/components/input-error';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { PasswordStrengthIndicator, PasswordMatchIndicator } from '@/components/password-strength-indicator';
import { Camera, Check, Copy, Download, Save, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
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
    twoFactorEnabled?: boolean;
    twoFactorPending?: boolean;
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

export default function ClinicSettings({
    settings,
    twoFactorEnabled = false,
    twoFactorPending = false,
}: ClinicSettingsProps) {
    const { success, error } = useToast();
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
    const [selectedTheme, setSelectedTheme] = useState(settings.theme_name || 'forest');
    const [customColor, setCustomColor] = useState(settings.theme_color || '#14532d');
    const [removeLogo, setRemoveLogo] = useState(false);
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(twoFactorEnabled);
    const [isTwoFactorPending, setIsTwoFactorPending] = useState(twoFactorPending);
    const [setupModalOpen, setSetupModalOpen] = useState(false);
    const [qrSvg, setQrSvg] = useState<string | null>(null);
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [confirmingCode, setConfirmingCode] = useState(false);
    const [setupCompleted, setSetupCompleted] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [copyingCodes, setCopyingCodes] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        clinic_name: settings.clinic_name || '',
        clinic_logo: null as File | null,
        remove_logo: false,
        theme_name: settings.theme_name || 'forest',
        theme_color: settings.theme_color || '#14532d',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
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
        // Save to localStorage for real-time update
        localStorage.setItem('clinicThemeColor', theme.color);
        localStorage.setItem('clinicThemeName', theme.name);
        // Dispatch custom event so other components can listen
        window.dispatchEvent(new CustomEvent('clinicThemeChange', { detail: { color: theme.color, name: theme.name } }));
    };

    const handleCustomColor = (color: string) => {
        setCustomColor(color);
        setSelectedTheme('custom');
        setData('theme_name', 'custom');
        setData('theme_color', color);
        // Save to localStorage for real-time update
        localStorage.setItem('clinicThemeColor', color);
        localStorage.setItem('clinicThemeName', 'custom');
        // Dispatch custom event so other components can listen
        window.dispatchEvent(new CustomEvent('clinicThemeChange', { detail: { color: color, name: 'custom' } }));
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

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/settings/password', {
            onSuccess: () => {
                success('Password updated successfully.');
                passwordForm.reset();
            },
        });
    };

    const fetchQrCode = async () => {
        setTwoFactorLoading(true);
        try {
            const qrRes = await fetch('/user/two-factor-qr-code', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });

            if (qrRes.ok) {
                const qrData = await qrRes.json();
                setQrSvg(qrData.svg ?? null);
            }
        } catch {
            error('Unable to load the QR code. Please try again.');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    useEffect(() => {
        if (isTwoFactorPending && setupModalOpen) {
            fetchQrCode();
        }
    }, [isTwoFactorPending, setupModalOpen]);

    const handleEnableTwoFactor = () => {
        setVerificationCode('');
        setVerificationError(null);
        setRecoveryCodes([]);
        setSetupCompleted(false);

        router.post('/user/two-factor-authentication', {}, {
            preserveScroll: true,
            onSuccess: async () => {
                setIsTwoFactorPending(true);
                setIsTwoFactorEnabled(false);
                setSetupModalOpen(true);
                await fetchQrCode();
            },
            onError: () => error('Unable to enable two-factor authentication.'),
        });
    };

    const handleOpenPendingSetup = async () => {
        setVerificationCode('');
        setVerificationError(null);
        setRecoveryCodes([]);
        setSetupCompleted(false);
        setSetupModalOpen(true);
        await fetchQrCode();
    };

    const handleVerifyAuthenticatorCode = async () => {
        if (!verificationCode.trim()) {
            setVerificationError('Enter the authenticator code to continue.');
            return;
        }

        setVerificationError(null);
        setConfirmingCode(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/user/confirmed-two-factor-authentication', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ code: verificationCode.trim() }),
            });

            if (!response.ok) {
                if (response.status === 422) {
                    const payload = await response.json();
                    const message = payload?.errors?.code?.[0] ?? 'The authentication code is invalid.';
                    setVerificationError(message);
                    return;
                }

                setVerificationError('Unable to verify the authentication code. Please try again.');
                return;
            }

            const codesRes = await fetch('/user/two-factor-recovery-codes', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });

            if (codesRes.ok) {
                const codesData = await codesRes.json();
                setRecoveryCodes(Array.isArray(codesData) ? codesData : []);
            } else {
                setRecoveryCodes([]);
            }

            setSetupCompleted(true);
            setIsTwoFactorEnabled(true);
            setIsTwoFactorPending(false);
            success('Two-factor authentication is now active. Save your backup codes now.');
        } catch {
            setVerificationError('Unable to verify the authentication code. Please try again.');
        } finally {
            setConfirmingCode(false);
        }
    };

    const handleDisableTwoFactor = () => {
        router.delete('/user/two-factor-authentication', {
            preserveScroll: true,
            onSuccess: () => {
                success('Two-factor authentication disabled.');
                setIsTwoFactorEnabled(false);
                setIsTwoFactorPending(false);
                setSetupModalOpen(false);
                setSetupCompleted(false);
                setQrSvg(null);
                setRecoveryCodes([]);
            },
            onError: () => error('Unable to disable two-factor authentication.'),
        });
    };

    const buildRecoveryCodesContent = () => {
        return ['SmartVet Backup Codes', `User: ${auth.user.email}`, '', ...recoveryCodes].join('\n');
    };

    const handleDownloadRecoveryCodes = () => {
        if (!recoveryCodes.length) return;
        const content = buildRecoveryCodesContent();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'smartvet-backup-codes.txt';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyRecoveryCodes = async () => {
        if (!recoveryCodes.length) return;

        setCopyingCodes(true);
        try {
            await navigator.clipboard.writeText(buildRecoveryCodesContent());
            success('Backup codes copied to clipboard.');
        } catch {
            error('Unable to copy backup codes.');
        } finally {
            setCopyingCodes(false);
        }
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

            <form onSubmit={handlePasswordSubmit} className="mt-4">
                <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}1A` }}>
                            <ShieldCheck className="h-4 w-4" style={{ color: themeColor }} />
                        </div>
                        <div>
                            <CardTitle className="text-base">Change Password</CardTitle>
                            <CardDescription className="text-xs">Use a secure password and keep it private.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password" className="text-xs">Current password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                autoComplete="current-password"
                                className="h-9"
                            />
                            <InputError message={passwordForm.errors.current_password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="new_password" className="text-xs">New password</Label>
                            <Input
                                id="new_password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                autoComplete="new-password"
                                className="h-9"
                            />
                            <PasswordStrengthIndicator password={passwordForm.data.password} />
                            <InputError message={passwordForm.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="text-xs">Confirm new password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                className="h-9"
                            />
                            <PasswordMatchIndicator password={passwordForm.data.password} confirmation={passwordForm.data.password_confirmation} />
                            <InputError message={passwordForm.errors.password_confirmation} />
                        </div>
                        <Button type="submit" size="sm" disabled={passwordForm.processing} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                            {passwordForm.processing ? 'Updating...' : 'Update password'}
                        </Button>
                    </CardContent>
                </Card>
            </form>

            <Card className="border border-white/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}1A` }}>
                            <ShieldCheck className="h-4 w-4" style={{ color: themeColor }} />
                        </div>
                        <CardTitle className="text-base">Two-factor authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!isTwoFactorEnabled && !isTwoFactorPending ? (
                            <>
                                <p className="text-sm text-slate-600">Enable 2FA to require a verification code during login.</p>
                                <Button type="button" className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }} onClick={handleEnableTwoFactor}>
                                    Enable 2FA
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-600">
                                    {isTwoFactorEnabled
                                        ? '2FA is active on this account.'
                                        : '2FA setup is pending. Verify your authenticator code to activate it.'}
                                </p>
                                <div className="flex items-center gap-2">
                                    {!isTwoFactorEnabled && isTwoFactorPending && (
                                        <Button type="button" variant="outline" onClick={handleOpenPendingSetup}>Complete setup</Button>
                                    )}
                                    <Button type="button" variant="outline" onClick={handleDisableTwoFactor}>Disable 2FA</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            <Dialog open={setupModalOpen} onOpenChange={setSetupModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Set up two-factor authentication</DialogTitle>
                        <DialogDescription>
                            {setupCompleted
                                ? 'These backup codes are shown only once. Save them somewhere safe before closing this window.'
                                : 'Scan the QR code, then enter the code from your authenticator app to verify and activate 2FA.'}
                        </DialogDescription>
                    </DialogHeader>

                    {!setupCompleted ? (
                        <div className="space-y-4">
                            {twoFactorLoading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Spinner /> Loading setup details...
                                </div>
                            ) : (
                                <>
                                    {qrSvg && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Authenticator QR code</p>
                                            <div className="inline-block rounded-lg border bg-white p-3" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="clinic_verification_code">Authenticator code</Label>
                                        <Input
                                            id="clinic_verification_code"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            placeholder="123456"
                                            value={verificationCode}
                                            onChange={(event) => {
                                                setVerificationCode(event.target.value);
                                                setVerificationError(null);
                                            }}
                                        />
                                        <InputError message={verificationError ?? undefined} />
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Backup codes</p>
                            {recoveryCodes.length ? (
                                <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2">
                                    {recoveryCodes.map((code) => (
                                        <code key={code} className="rounded bg-slate-50 px-2 py-1 text-xs">{code}</code>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">No backup codes were returned. Please disable and set up 2FA again.</p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {!setupCompleted ? (
                            <Button
                                type="button"
                                className="text-white"
                                style={{ backgroundColor: themeColor, borderColor: themeColor }}
                                onClick={handleVerifyAuthenticatorCode}
                                disabled={confirmingCode || twoFactorLoading}
                            >
                                {confirmingCode && <Spinner />}
                                Verify code
                            </Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={handleCopyRecoveryCodes} disabled={!recoveryCodes.length || copyingCodes}>
                                    <Copy className="mr-1 h-4 w-4" />
                                    {copyingCodes ? 'Copying...' : 'Copy codes'}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleDownloadRecoveryCodes} disabled={!recoveryCodes.length}>
                                    <Download className="mr-1 h-4 w-4" />
                                    Download codes
                                </Button>
                                <Button type="button" className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }} onClick={() => setSetupModalOpen(false)}>
                                    Done
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
