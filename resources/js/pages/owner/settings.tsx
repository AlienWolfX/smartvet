import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import OwnerLayout from '@/layouts/owner-layout';
import { type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, UserCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface OwnerSettingsProps {
    status?: string;
}

export default function OwnerSettings({ status }: OwnerSettingsProps) {
    const { auth } = usePage<SharedData>().props;
    const { success } = useToast();

    // Profile form
    const profileForm = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        profileForm.patch('/settings/profile', {
            onSuccess: () => success('Profile updated successfully.'),
        });
    };

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        passwordForm.put('/settings/password', {
            onSuccess: () => {
                success('Password updated successfully.');
                passwordForm.reset();
            },
        });
    };

    return (
        <OwnerLayout
            title="Settings"
            description="Manage your account details and password."
        >
            <Head title="Settings" />

            {status && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {status}
                </div>
            )}

            {/* Profile */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0e4d3a]/10">
                        <UserCircle className="h-5 w-5 text-[#0e4d3a]" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Profile information</CardTitle>
                        <CardDescription className="text-sm">Update your name and email address.</CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                    <form onSubmit={handleProfileSubmit} className="max-w-md space-y-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                autoComplete="name"
                            />
                            <InputError message={profileForm.errors.name} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                autoComplete="email"
                            />
                            <InputError message={profileForm.errors.email} />
                        </div>

                        <Button type="submit" disabled={profileForm.processing}>
                            {profileForm.processing && <Spinner />}
                            Save changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0e4d3a]/10">
                        <KeyRound className="h-5 w-5 text-[#0e4d3a]" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Change password</CardTitle>
                        <CardDescription className="text-sm">Use a strong password you don't use elsewhere.</CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                    <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="current_password">Current password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                autoComplete="current-password"
                            />
                            <InputError message={passwordForm.errors.current_password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="new_password">New password</Label>
                            <Input
                                id="new_password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={passwordForm.errors.password} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password_confirmation">Confirm new password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                            />
                            <InputError message={passwordForm.errors.password_confirmation} />
                        </div>

                        <Button type="submit" disabled={passwordForm.processing}>
                            {passwordForm.processing && <Spinner />}
                            Update password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </OwnerLayout>
    );
}
