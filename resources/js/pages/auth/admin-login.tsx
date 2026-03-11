import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { FormEvent } from 'react';

interface AdminLoginProps {
    status?: string;
}

export default function AdminLogin({ status }: AdminLoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/admin/login', {
            onFinish: () => setData('password', ''),
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
            <Head title="Admin Login" />

            {/* Subtle grid overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Glow */}
            <div className="pointer-events-none absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative w-full max-w-sm">
                {/* Restricted badge */}
                <div className="mb-5 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                        <ShieldCheck className="h-3 w-3" />
                        Restricted access
                    </span>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60">
                    <div className="flex flex-col items-center border-b border-white/10 px-8 py-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/30">
                            <ShieldCheck className="h-7 w-7 text-amber-400" />
                        </div>
                        <h1 className="mt-4 text-xl font-semibold text-white">Admin access</h1>
                        <p className="mt-0.5 text-xs text-slate-400">Sign in with your administrator account</p>
                    </div>

                    <div className="space-y-5 px-8 py-7">
                        {status && (
                            <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/30 px-4 py-2.5 text-sm font-medium text-emerald-400">
                                {status}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="email" className="text-xs font-medium text-slate-400">Email address</Label>
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
                                    className="h-9 border-white/10 bg-slate-800/80 text-sm text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password" className="text-xs font-medium text-slate-400">Password</Label>
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
                                    className="h-9 border-white/10 bg-slate-800/80 text-sm text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
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
                                    className="border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                />
                                <Label htmlFor="remember" className="text-xs text-slate-400">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                tabIndex={4}
                                disabled={processing}
                                className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </form>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-600">
                    © {new Date().getFullYear()} SmartVet. All rights reserved.
                </p>
            </div>
        </div>
    );
}
