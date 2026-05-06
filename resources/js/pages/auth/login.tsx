import InputError from '@/components/input-error';
import TurnstileCaptcha from '@/components/turnstile-captcha';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
    canRegister?: boolean;
    captchaSiteKey: string | null;
}

export default function Login({ status, captchaSiteKey }: LoginProps) {
    const queryStatus = useMemo(() => {
        return typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('status') ?? ''
            : '';
    }, []);

    const displayStatus = status || queryStatus;
    const [captchaRefreshNonce, setCaptchaRefreshNonce] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
        captcha_token: '',
    });

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
        post('/login', {
            onFinish: () => {
                setData('password', '');
                setData('captcha_token', '');
                setCaptchaRefreshNonce((prev) => prev + 1);
            },
        });
    };

    return (
        <div className="relative h-screen bg-slate-50 text-slate-900">
            <Head title="Log in" />

            <div className="grid h-full lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="relative hidden h-full overflow-hidden lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1563460716037-460a3ad24ba9?auto=format&fit=crop&w=1200&q=80"
                        alt="Veterinary professional caring for a pet"
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

                </div>

                <div className="flex h-full items-center justify-center bg-white px-8 py-12 shadow-lg shadow-slate-900/5">
                    <div className="w-full max-w-md space-y-10">
                        <div className="space-y-3 text-left">
                            <img src="/images/logo.png" alt="SmartVet" className="h-14 w-auto" />
                            <div>
                                <h1 className="text-3xl font-semibold">Login</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Sign in with your account.
                                </p>
                            </div>
                        </div>

                        {displayStatus && (
                            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-200">
                                {displayStatus}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        value={data.password}
                                        onChange={(event) =>
                                            setData('password', event.target.value)
                                        }
                                        className="pr-10"
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

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    checked={data.remember}
                                    onCheckedChange={(checked) =>
                                        setData('remember', checked === true)
                                    }
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <TurnstileCaptcha
                                siteKey={captchaSiteKey}
                                error={errors.captcha_token}
                                refreshNonce={captchaRefreshNonce}
                                onTokenChange={handleCaptchaTokenChange}
                            />

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </form>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold mb-3">Quick access</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Link
                                    href="/clinic"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Clinic login
                                </Link>
                                <Link
                                    href="/admin"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Admin login
                                </Link>
                            </div>
                        </div>

                        <div className="text-center text-sm text-slate-500">
                            <p>
                                Don't have an account?{' '}
                                <Link href="/register" className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
