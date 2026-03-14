import InputError from '@/components/input-error';
import { PasswordStrengthIndicator, PasswordMatchIndicator } from '@/components/password-strength-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: {
                sitekey: string;
                callback: (token: string) => void;
                'expired-callback'?: () => void;
            }) => string;
            reset: (widgetId?: string) => void;
        };
    }
}

interface OwnerRegisterProps {
    captchaSiteKey: string | null;
}

export default function OwnerRegister({ captchaSiteKey }: OwnerRegisterProps) {
    const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
    const turnstileWidgetIdRef = useRef<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        captcha_token: '',
    });

    useEffect(() => {
        if (!captchaSiteKey) return;

        const renderTurnstile = () => {
            if (!window.turnstile || !turnstileContainerRef.current || turnstileWidgetIdRef.current) return;

            turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
                sitekey: captchaSiteKey,
                callback: (token: string) => setData('captcha_token', token),
                'expired-callback': () => setData('captcha_token', ''),
            });
        };

        const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
        if (existingScript) {
            renderTurnstile();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = 'true';
        script.onload = renderTurnstile;
        document.head.appendChild(script);

        return () => {
            if (turnstileWidgetIdRef.current && window.turnstile) {
                window.turnstile.reset(turnstileWidgetIdRef.current);
            }
            turnstileWidgetIdRef.current = null;
        };
    }, [captchaSiteKey, setData]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/register', {
            onFinish: () => {
                setData('password', '');
                setData('password_confirmation', '');
                setData('captcha_token', '');
                if (turnstileWidgetIdRef.current && window.turnstile) {
                    window.turnstile.reset(turnstileWidgetIdRef.current);
                }
            },
        });
    };

    return (
        <div className="relative h-screen bg-slate-50 text-slate-900">
            <Head title="Create your account" />

            <div className="grid h-full lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="relative hidden h-full overflow-hidden lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80"
                        alt="Happy dog with owner"
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                    <div className="absolute bottom-10 left-10 right-10 text-white">
                        <p className="text-xl font-semibold leading-snug">
                            Create your pet owner account and stay connected with your pet's health journey.
                        </p>
                    </div>
                </div>

                <div className="flex h-full items-center justify-center overflow-y-auto bg-white px-8 py-12 shadow-lg shadow-slate-900/5">
                    <div className="w-full max-w-md space-y-10">
                        <div className="space-y-3 text-left">
                            <img src="/images/logo.png" alt="SmartVet" className="h-14 w-auto" />
                            <div>
                                <h1 className="text-3xl font-semibold">Create your account</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Sign up as a pet owner to access your pet's records.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    placeholder="Juan dela Cruz"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} />
                                <p className="text-xs text-slate-500">
                                    Use the same email your vet clinic has on file — your pets will appear automatically.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <PasswordStrengthIndicator password={data.password} />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    placeholder="Repeat your password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                />
                                <PasswordMatchIndicator password={data.password} confirmation={data.password_confirmation} />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Captcha</Label>
                                {captchaSiteKey ? (
                                    <div ref={turnstileContainerRef} className="min-h-[65px]" />
                                ) : (
                                    <p className="text-xs text-amber-700">Captcha is not configured. Please contact support.</p>
                                )}
                                <InputError message={errors.captcha_token} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </form>

                        <div className="text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
