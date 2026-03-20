import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

export default function TwoFactorChallenge() {
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        recovery_code: '',
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/two-factor-challenge');
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <Head title="Two-factor authentication" />

            <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-8 shadow-lg">
                <div className="space-y-2">
                    <img src="/images/logo.png" alt="SmartVet" className="h-12 w-auto" />
                    <h1 className="text-2xl font-semibold text-slate-900">Two-factor authentication</h1>
                    <p className="text-sm text-slate-500">
                        {useRecoveryCode
                            ? 'Enter one of your recovery codes to continue.'
                            : 'Enter the authentication code from your authenticator app.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {!useRecoveryCode ? (
                        <div className="grid gap-2">
                            <Label htmlFor="code">Authentication code</Label>
                            <Input
                                id="code"
                                autoFocus
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="123456"
                            />
                            <InputError message={errors.code} />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="recovery_code">Recovery code</Label>
                            <Input
                                id="recovery_code"
                                autoFocus
                                value={data.recovery_code}
                                onChange={(e) => setData('recovery_code', e.target.value)}
                                placeholder="xxxx-xxxx"
                            />
                            <InputError message={errors.recovery_code} />
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing && <Spinner />}
                        Verify
                    </Button>
                </form>

                <button
                    type="button"
                    className="mt-4 text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
                    onClick={() => {
                        setUseRecoveryCode((prev) => !prev);
                        setData('code', '');
                        setData('recovery_code', '');
                    }}
                >
                    {useRecoveryCode ? 'Use an authentication code instead' : 'Use a recovery code instead'}
                </button>
            </div>
        </div>
    );
}
