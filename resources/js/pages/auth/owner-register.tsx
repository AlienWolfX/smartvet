import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function OwnerRegister() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/register', {
            onFinish: () => {
                setData('password', '');
                setData('password_confirmation', '');
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
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                                SmartVet
                            </p>
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
                                <InputError message={errors.password_confirmation} />
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
