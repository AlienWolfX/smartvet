import InputError from '@/components/input-error';
import { PasswordStrengthIndicator, PasswordMatchIndicator } from '@/components/password-strength-indicator';
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
    const themeColor = (auth.user as { theme_color?: string })?.theme_color || '#0e4d3a';

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}1A` }}>
                        <UserCircle className="h-4 w-4" style={{ color: themeColor }} />
                    </div>
                    <div>
                        <CardTitle className="text-sm">Profile information</CardTitle>
                        <CardDescription className="text-xs">Update your name and email address.</CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <form onSubmit={handleProfileSubmit} className="space-y-3">
                        <div className="grid gap-1">
                            <Label htmlFor="name" className="text-xs">Full name</Label>
                            <Input
                                id="name"
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                autoComplete="name"
                                className="h-8 text-sm"
                            />
                            <InputError message={profileForm.errors.name} />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="email" className="text-xs">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                autoComplete="email"
                                className="h-8 text-sm"
                            />
                            <InputError message={profileForm.errors.email} />
                        </div>

                        <Button type="submit" size="sm" disabled={profileForm.processing} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                            {profileForm.processing && <Spinner />}
                            Save changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password */}
            <Card>
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${themeColor}1A` }}>
                        <KeyRound className="h-4 w-4" style={{ color: themeColor }} />
                    </div>
                    <div>
                        <CardTitle className="text-sm">Change password</CardTitle>
                        <CardDescription className="text-xs">Use a strong password you don't use elsewhere.</CardDescription>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                        <div className="grid gap-1">
                            <Label htmlFor="current_password" className="text-xs">Current password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                autoComplete="current-password"
                                className="h-8 text-sm"
                            />
                            <InputError message={passwordForm.errors.current_password} />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="new_password" className="text-xs">New password</Label>
                            <Input
                                id="new_password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                autoComplete="new-password"
                                className="h-8 text-sm"
                            />
                            <PasswordStrengthIndicator password={passwordForm.data.password} />
                            <InputError message={passwordForm.errors.password} />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="password_confirmation" className="text-xs">Confirm new password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                className="h-8 text-sm"
                            />
                            <PasswordMatchIndicator password={passwordForm.data.password} confirmation={passwordForm.data.password_confirmation} />
                            <InputError message={passwordForm.errors.password_confirmation} />
                        </div>

                        <Button type="submit" size="sm" disabled={passwordForm.processing} className="text-white" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                            {passwordForm.processing && <Spinner />}
                            Update password
                        </Button>
                    </form>
                </CardContent>
            </Card>
            </div>
        </OwnerLayout>
    );
}
