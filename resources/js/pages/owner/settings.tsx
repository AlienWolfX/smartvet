import InputError from '@/components/input-error';
import { PasswordStrengthIndicator, PasswordMatchIndicator } from '@/components/password-strength-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import OwnerLayout from '@/layouts/owner-layout';
import { type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, KeyRound, ShieldCheck, UserCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface OwnerSettingsProps {
    status?: string;
    twoFactorEnabled?: boolean;
    twoFactorPending?: boolean;
}

export default function OwnerSettings({
    status,
    twoFactorEnabled = false,
    twoFactorPending = false,
}: OwnerSettingsProps) {
    const { auth } = usePage<SharedData>().props;
    const { success, error } = useToast();
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0e4d3a';
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(twoFactorEnabled);
    const [isTwoFactorPending, setIsTwoFactorPending] = useState(twoFactorPending);
    const [qrSvg, setQrSvg] = useState<string | null>(null);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [setupModalOpen, setSetupModalOpen] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [confirmingCode, setConfirmingCode] = useState(false);
    const [setupCompleted, setSetupCompleted] = useState(false);
    const [copyingCodes, setCopyingCodes] = useState(false);

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
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

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

    // Profile form
    const profileForm = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        profileForm.patch('/settings/profile', {
            onSuccess: () => success('Profile updated successfully.'),
        });
    };

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        passwordForm.put('/settings/password', {
            onSuccess: () => {
                success('Password updated successfully.');
                passwordForm.reset();
            },
        });
    };

    return (
        <OwnerLayout
            title="Settings"
            description="Manage your account details and password."
        >
            <Head title="Settings" />

            {status && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {status}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}1A` }}>
                        <UserCircle className="h-4 w-4" style={{ color: themeColor }} />
                    </div>
                    <div>
                        <CardTitle className="text-sm">Profile information</CardTitle>
                        <CardDescription className="text-xs">Update your name and email address.</CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <form onSubmit={handleProfileSubmit} className="space-y-3">
                        <div className="grid gap-1">
                            <Label htmlFor="name" className="text-xs">Full name</Label>
                            <Input
                                id="name"
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                autoComplete="name"
                                className="h-8 text-sm"
                            />
                            <InputError message={profileForm.errors.name} />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="email" className="text-xs">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                autoComplete="email"
                                className="h-8 text-sm"
                            />
                            <InputError message={profileForm.errors.email} />
                        </div>

                        <Button type="submit" size="sm" disabled={profileForm.processing} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                            {profileForm.processing && <Spinner />}
                            Save changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}1A` }}>
                        <KeyRound className="h-4 w-4" style={{ color: themeColor }} />
                    </div>
                    <div>
                        <CardTitle className="text-sm">Change password</CardTitle>
                        <CardDescription className="text-xs">Use a strong password you don't use elsewhere.</CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                        <div className="grid gap-1">
                            <Label htmlFor="current_password" className="text-xs">Current password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                autoComplete="current-password"
                                className="h-8 text-sm"
                            />
                            <InputError message={passwordForm.errors.current_password} />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="new_password" className="text-xs">New password</Label>
                            <Input
                                id="new_password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                autoComplete="new-password"
                                className="h-8 text-sm"
                            />
                            <PasswordStrengthIndicator password={passwordForm.data.password} />
                            <InputError message={passwordForm.errors.password} />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="password_confirmation" className="text-xs">Confirm new password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                className="h-8 text-sm"
                            />
                            <PasswordMatchIndicator password={passwordForm.data.password} confirmation={passwordForm.data.password_confirmation} />
                            <InputError message={passwordForm.errors.password_confirmation} />
                        </div>

                        <Button type="submit" size="sm" disabled={passwordForm.processing} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                            {passwordForm.processing && <Spinner />}
                            Update password
                        </Button>
                    </form>
                </CardContent>
            </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}1A` }}>
                        <ShieldCheck className="h-4 w-4" style={{ color: themeColor }} />
                    </div>
                    <div>
                        <CardTitle className="text-sm">Two-factor authentication</CardTitle>
                        <CardDescription className="text-xs">Secure your account with an authenticator app and backup codes.</CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-4">
                    {!isTwoFactorEnabled && !isTwoFactorPending ? (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">Enable 2FA to require a verification code during login.</p>
                            <Button type="button" className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }} onClick={handleEnableTwoFactor}>
                                Enable 2FA
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-600">
                                    {isTwoFactorEnabled
                                        ? '2FA is active on your account.'
                                        : '2FA setup is pending. Verify your authenticator code to activate it.'}
                                </p>
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
                                            <div
                                                className="inline-block rounded-lg border bg-white p-3"
                                                dangerouslySetInnerHTML={{ __html: qrSvg }}
                                            />
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="verification_code">Authenticator code</Label>
                                        <Input
                                            id="verification_code"
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-3">
                                    {recoveryCodes.map((code) => (
                                        <code key={code} className="text-xs rounded bg-slate-50 px-2 py-1">{code}</code>
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
        </OwnerLayout>
    );
}
