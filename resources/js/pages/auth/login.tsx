import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAppearance } from '@/hooks/use-appearance';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
    canRegister?: boolean;
}

export default function Login({ status }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const { appearance, updateAppearance } = useAppearance();
    const [isDarkMode, setIsDarkMode] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/login', {
            onFinish: () => setData('password', ''),
        });
    };

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, [appearance]);

    const toggleAppearance = () => {
        const nextAppearance = isDarkMode ? 'light' : 'dark';
        updateAppearance(nextAppearance);
    };

    const themeLabel = useMemo(
        () => (isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'),
        [isDarkMode],
    );

    return (
        <div className="relative h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-50">
            <Head title="Log in" />

            <div className="absolute right-6 top-6 z-30 flex w-full justify-end">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-pressed={isDarkMode}
                    onClick={toggleAppearance}
                    className="h-10 w-10 rounded-full border-slate-200 bg-white/90 text-slate-900 shadow-sm transition dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-50"
                >
                    {isDarkMode ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                    <span className="sr-only">{themeLabel}</span>
                </Button>
            </div>

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

                <div className="flex h-full items-center justify-center bg-white px-8 py-12 shadow-lg shadow-slate-900/5 dark:bg-slate-900 dark:shadow-black/20">
                    <div className="w-full max-w-md space-y-10">
                        <div className="space-y-3 text-left">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                SmartVet
                            </p>
                            <div>
                                <h1 className="text-3xl font-semibold">Admin access</h1>
                            </div>
                        </div>

                        {status && (
                            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-200">
                                {status}
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
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(event) =>
                                        setData('password', event.target.value)
                                    }
                                />
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
                    </div>
                </div>
            </div>
        </div>
    );
}
