import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface ClinicLoginProps {
    status?: string;
}

export default function ClinicLogin({ status }: ClinicLoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/clinic/login', {
            onFinish: () => setData('password', ''),
        });
    };

    return (
        <div className="relative h-screen bg-slate-50 text-slate-900">
            <Head title="Clinic Login" />

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
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                                SmartVet
                            </p>
                            <div>
                                <h1 className="text-3xl font-semibold">Clinic login</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Sign in with your clinic account.
                                </p>
                            </div>
                        </div>

                        {status && (
                            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
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
                                    placeholder="clinic@example.com"
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
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </form>

                        <div className="space-y-2 text-center text-sm text-slate-500">
                            <p>
                                Are you a pet owner?{' '}
                                <Link href="/login" className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900">
                                    Owner login
                                </Link>
                            </p>
                            <p>
                                Are you an admin?{' '}
                                <Link href="/admin" className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900">
                                    Admin login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
