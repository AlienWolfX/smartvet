import InputError from '@/components/input-error';
import TurnstileCaptcha from '@/components/turnstile-captcha';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { LockKeyhole, Sparkles } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface AdminLoginProps {
    status?: string;
    captchaSiteKey: string | null;
}

export default function AdminLogin({ status, captchaSiteKey }: AdminLoginProps) {
    const [captchaRefreshNonce, setCaptchaRefreshNonce] = useState(0);
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
        post('/admin/login', {
            onFinish: () => {
                setData('password', '');
                setData('captcha_token', '');
                setCaptchaRefreshNonce((prev) => prev + 1);
            },
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-slate-50 to-sky-100 px-4 py-12">
            <Head title="Admin Login" />

            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-200/45 blur-3xl" />

            <div className="relative w-full max-w-sm">
                {/* Card */}
                <div className="rounded-2xl border border-white/80 bg-white/80 shadow-xl shadow-indigo-900/10 backdrop-blur-sm">

                    {/* Header strip */}
                    <div className="flex flex-col items-center rounded-t-2xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-8 py-8 text-white">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                            <LockKeyhole className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="mt-4 text-xl font-semibold">Admin Portal</h1>
                        <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-700">
                                <Sparkles className="h-3 w-3" />
                                Elevated access
                            </span>
                        </div>
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
                                    placeholder="admin@example.com"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    className="h-9 border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-indigo-500/60 focus:ring-indigo-500/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password" className="text-xs font-medium text-slate-600">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(event) => setData('password', event.target.value)}
                                    className="h-9 border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:border-indigo-500/60 focus:ring-indigo-500/20"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked === true)}
                                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
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
                                tabIndex={4}
                                disabled={processing}
                                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold"
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
