import InputError from '@/components/input-error';
import TurnstileCaptcha from '@/components/turnstile-captcha';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface ClinicLoginProps {
    status?: string;
    captchaSiteKey: string | null;
}

export default function ClinicLogin({ status, captchaSiteKey }: ClinicLoginProps) {
    const [captchaRefreshNonce, setCaptchaRefreshNonce] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
        captcha_token: '',
    });

    const queryStatus = useMemo(() => {
        if (typeof window === 'undefined') {
            return '';
        }
        return new URLSearchParams(window.location.search).get('status') ?? '';
    }, []);
    const displayStatus = status || queryStatus;

    useEffect(() => {
        if (!displayStatus || typeof window === 'undefined') {
            return;
        }

        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
        };
        window.addEventListener('popstate', handlePopState);

        return () => window.removeEventListener('popstate', handlePopState);
    }, [displayStatus]);

    const handleCaptchaTokenChange = useCallback((token: string) => {
        setData('captcha_token', token);
    }, [setData]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/clinic/login', {
            onFinish: () => {
                setData('password', '');
                setData('captcha_token', '');
                setCaptchaRefreshNonce((prev) => prev + 1);
            },
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-slate-50 to-cyan-100 px-4 py-12">
            <Head title="Clinic Login" />

            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

            <div className="relative w-full max-w-sm">
                {/* Card */}
                <div className="rounded-2xl border border-white/80 bg-white/80 shadow-xl shadow-teal-900/10 backdrop-blur-sm">

                    {/* Header strip */}
                    <div className="flex flex-col items-center rounded-t-2xl bg-gradient-to-b from-teal-600 to-teal-700 px-8 py-8 text-white">
                        <img src="/images/logo.png" alt="SmartVet" className="h-16 w-auto brightness-0 invert" />
                        <h1 className="mt-3 text-xl font-semibold">Clinic Portal</h1>
                        <p className="mt-0.5 text-xs text-teal-200">Sign in to manage your clinic</p>
                    </div>

                    <div className="space-y-5 px-8 py-7">
                        {displayStatus && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
                                {displayStatus}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="email" className="text-xs font-medium text-slate-600">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="clinic@example.com"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    className="h-9 text-sm"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password" className="text-xs font-medium text-slate-600">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(event) => setData('password', event.target.value)}
                                        className="h-9 text-sm pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute inset-y-0 right-2 flex items-center rounded px-1 text-slate-500 hover:text-slate-900"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked === true)}
                                />
                                <Label htmlFor="remember" className="text-xs text-slate-500">Remember me</Label>
                            </div>

                            <TurnstileCaptcha
                                siteKey={captchaSiteKey}
                                error={errors.captcha_token}
                                refreshNonce={captchaRefreshNonce}
                                onTokenChange={handleCaptchaTokenChange}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </form>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} SmartVet. All rights reserved.
                </p>
            </div>
        </div>
    );
}
