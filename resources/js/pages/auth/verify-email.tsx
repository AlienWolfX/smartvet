import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface VerifyEmailProps {
    email?: string;
    status?: string;
}

export default function VerifyEmail({ email, status }: VerifyEmailProps) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/email/verify');
    };

    const resend = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <div className="relative h-screen bg-slate-50 text-slate-900">
            <Head title="Verify your email" />

            <div className="flex h-full items-center justify-center bg-white px-8 py-12">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-3 text-left">
                        <img src="/images/logo.png" alt="SmartVet" className="h-14 w-auto" />
                        <h1 className="text-3xl font-semibold">Verify your email</h1>
                        <p className="text-sm text-slate-500">
                            Enter the 6-digit code we sent to <strong>{email}</strong>.
                        </p>
                    </div>

                    {status && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            {status}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Verification code</Label>
                            <Input
                                id="code"
                                type="text"
                                name="code"
                                required
                                maxLength={6}
                                minLength={6}
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                autoComplete="one-time-code"
                                placeholder="123456"
                            />
                            <InputError message={errors.code} />
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing && <Spinner />} Verify email
                        </Button>
                    </form>

                    <form onSubmit={resend} className="text-center">
                        <Button type="submit" variant="secondary" className="w-full" disabled={processing}>
                            {processing && <Spinner />} Resend code
                        </Button>
                    </form>

                    <div className="text-center text-sm text-slate-500">
                        <Link href="/login" className="font-medium underline underline-offset-4 hover:text-slate-900">
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
