import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBell } from '@/components/notification-bell';
import { InactivityWarning } from '@/components/inactivity-warning';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { dashboard } from '@/routes';
import {
    Activity,
    ChevronDown,
    Menu,
    Users,
    BarChart3,
    Boxes,
    Heart,
    CreditCard,
    Pill,
    PawPrint,
    Settings,
    QrCode,
    Syringe,
} from 'lucide-react';
import { type SharedData, type BreadcrumbItem } from '@/types';

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
}

export default function AdminLayout({
    children,
    title = 'SmartVet Control Center',
    description = 'Monitor hospital performance, triage schedules, and handle operational workflows.',
    breadcrumbs = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
    ],
    actions
}: AdminLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [themeColor, setThemeColor] = useState((auth.user as { theme_color?: string })?.theme_color || '#0f172a');
    const [countdownSeconds, setCountdownSeconds] = useState(30);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const userRole = (auth.user as { role?: string })?.role;
    const logoutUrl = userRole === 'admin' ? '/admin/logout' : '/clinic/logout';
    const loginUrl = userRole === 'admin' ? '/admin' : '/clinic';

    // Initialize inactivity timeout hook
    const { showWarning, dismissWarning, logout } = useInactivityTimeout({
        enabled: true,
        logoutUrl,
        loginUrl,
    });

    // Listen for theme color changes
    useEffect(() => {
        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            setThemeColor(customEvent.detail.color);
        };

        // Listen to custom clinic theme change event
        window.addEventListener('clinicThemeChange', handleThemeChange);

        // Also check localStorage on mount for theme color
        const storedColor = localStorage.getItem('clinicThemeColor');
        if (storedColor) {
            setThemeColor(storedColor);
        }

        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'clinicThemeColor' && e.newValue) {
                setThemeColor(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('clinicThemeChange', handleThemeChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Countdown timer for warning dialog
    useEffect(() => {
        if (!showWarning) return;

        setCountdownSeconds(30);
        const interval = setInterval(() => {
            setCountdownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showWarning]);

    const isAdmin = (auth.user as { role?: string })?.role === 'admin';
    const clinicName = (auth.user as { clinic_name?: string })?.clinic_name || 'SmartVet';
    const clinicLogo = (auth.user as { clinic_logo?: string })?.clinic_logo;

    const navigation = [
        {
            name: 'Dashboard',
            href: dashboard().url,
            icon: Activity,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'Pet Records',
            href: '/pet-records',
            icon: Heart,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'Scan Pet QR',
            href: '/pet-records/scan',
            icon: QrCode,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'Inventory Management',
            href: '/inventory-management',
            icon: Boxes,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'Consultation Types',
            href: '/consultation-types',
            icon: Syringe,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'Inventory Sales',
            href: '/medication-sales',
            icon: Pill,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'Billing & Payments',
            href: '/billing',
            icon: CreditCard,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'Reports & Analytics',
            href: '/reports',
            icon: BarChart3,
            adminOnly: false,
            clinicOnly: true
        },
        {
            name: 'User Management',
            href: '/user-management',
            icon: Users,
            adminOnly: true,
            clinicOnly: false
        },
        {
            name: 'Owner Management',
            href: '/owner-management',
            icon: PawPrint,
            adminOnly: true,
            clinicOnly: false
        },
        {
            name: 'System Settings',
            href: isAdmin ? '/admin/settings' : '/clinic-settings',
            icon: Settings,
            adminOnly: false,
            clinicOnly: false
        }
    ].filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.clinicOnly && isAdmin) return false;
        return true;
    })
     .map(item => ({
         ...item,
         current: item.href === '/dashboard' || item.href === '/'
             ? currentPath === item.href || currentPath === '/dashboard'
             : currentPath === item.href,
     }));

    const SidebarContent = () => (
        <div className="flex h-full flex-col border-r text-white shadow-[0_20px_60px_rgba(2,6,23,0.45)]" style={{ backgroundColor: themeColor }}>
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/10">
                <Link href={dashboard().url} className="flex items-center space-x-2">
                    {clinicLogo ? (
                        <img src={`/storage/${clinicLogo}`} alt={clinicName} className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src="/images/logo.png" alt="SmartVet" className="h-6 w-auto brightness-0 invert" />
                        </div>
                    )}
                    <span className="text-white font-semibold text-sm truncate max-w-[140px]">
                        {clinicName}
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                item.current
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                            <span className="flex-1">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

        </div>
    );

    return (
        <>
            <Head title={title} />

            <InactivityWarning
                open={showWarning}
                timeoutSeconds={countdownSeconds}
                onContinue={dismissWarning}
                onLogout={logout}
            />

            <div
                className="min-h-screen flex flex-col"
                style={{
                    backgroundColor: '#f1f5f9',
                    backgroundImage: 'var(--paw-pattern), radial-gradient(circle at top, rgba(16,185,129,0.12), transparent 42%)',
                    backgroundSize: '160px 160px, 100%',
                    backgroundRepeat: 'repeat, no-repeat',
                    backgroundAttachment: 'fixed, scroll',
                }}
            >
                {/* Mobile sidebar */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="left" className="p-0 w-72">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>

                {/* Desktop sidebar */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                    <SidebarContent />
                </div>

                {/* Main content */}
                <div className="lg:pl-72 flex flex-col min-h-screen">
                    {/* Top navigation */}
                    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/60 bg-white/95 px-4 shadow-sm backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Open sidebar</span>
                        </Button>

                        {/* Separator */}
                        <div className="h-6 w-px bg-border lg:hidden" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1">
                            <div className="flex items-center">
                                <div>
                                    <p className="text-sm font-semibold text-neutral-800">
                                        {title}
                                    </p>
                                </div>
                            </div>
                        </div>                            <div className="flex items-center gap-x-4 lg:gap-x-6">
                                {!isAdmin && <NotificationBell />}
                                {/* Profile dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center space-x-3 text-sm">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={(auth.user as { avatar?: string })?.avatar ?? ''} />
                                                <AvatarFallback>
                                                    {auth.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="hidden lg:flex lg:items-center">
                                                <span className="text-sm font-medium">
                                                    {auth.user.name}
                                                </span>
                                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <UserMenuContent user={auth.user} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Main content area */}
                    <main className="py-6 flex-1">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-semibold text-neutral-900">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="mt-1 max-w-3xl text-sm text-neutral-500">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Breadcrumbs breadcrumbs={breadcrumbs} />
                            </div>
                        </div>                            <div className="mt-6 flex flex-col gap-6">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
