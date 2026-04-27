import { Head, Link, router, usePage } from '@inertiajs/react';
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { logout } from '@/routes';
import { InactivityWarning } from '@/components/inactivity-warning';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { ChevronDown, Menu, PawPrint, Settings, LogOut } from 'lucide-react';
import { type SharedData, type BreadcrumbItem } from '@/types';

interface OwnerLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
}

const SIDEBAR_COLOR = '#0e4d3a'; // fallback only

export default function OwnerLayout({
    children,
    title = 'My Pet Portal',
    description,
    actions,
}: OwnerLayoutProps) {
    const { auth, clinicSettings } = usePage<SharedData>().props;
    const ownerThemeColor = (auth.user as { theme_color?: string })?.theme_color;
    const [themeColor, setThemeColor] = useState(
        ownerThemeColor || clinicSettings?.themeColor || SIDEBAR_COLOR
    );
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // Initialize inactivity timeout hook
    const { showWarning, timeoutSeconds, dismissWarning, logout: handleInactivityLogout } = useInactivityTimeout({ enabled: true });
    const [countdownSeconds, setCountdownSeconds] = useState(timeoutSeconds);

    // Listen for theme color changes in localStorage and custom events
    useEffect(() => {
        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            setThemeColor(customEvent.detail.color);
        };

        // Listen to custom theme change event
        window.addEventListener('themeChange', handleThemeChange);

        // Also check localStorage and server theme color on mount and when props change
        const serverThemeColor = ownerThemeColor || clinicSettings?.themeColor;
        const storedColor = localStorage.getItem('ownerThemeColor');

        if (serverThemeColor) {
            if (storedColor !== serverThemeColor) {
                localStorage.setItem('ownerThemeColor', serverThemeColor);
            }
            setThemeColor(serverThemeColor);
        } else if (storedColor) {
            setThemeColor(storedColor);
        }

        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'ownerThemeColor' && e.newValue) {
                setThemeColor(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [ownerThemeColor, clinicSettings?.themeColor]);

    // Countdown timer for warning dialog
    useEffect(() => {
        if (!showWarning) return;

        setCountdownSeconds(timeoutSeconds);
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
    }, [showWarning, timeoutSeconds]);

    const navigation = [
        { name: 'My Pets', href: '/owner/pets', icon: PawPrint },
        { name: 'Settings', href: '/owner/settings', icon: Settings },
        { name: 'Appearance', href: '/owner/settings/appearance', icon: Settings },
    ].map((item) => ({
        ...item,
        current:
            item.href === '/owner/settings'
                ? currentPath === '/owner/settings'
                : currentPath.startsWith(item.href),
    }));

    const handleLogout = () => {
        router.flushAll();
    };

    const SidebarContent = () => (
        <div
            className="flex h-full flex-col border-r text-white shadow-[0_20px_60px_rgba(2,6,23,0.45)]"
            style={{ backgroundColor: themeColor }}
        >
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
                                    : 'text-white/70 hover:bg-white/10 hover:text-white',
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
                onLogout={handleInactivityLogout}
            />

            <div
                className="h-screen overflow-hidden bg-slate-50 flex flex-col"
                style={{
                    backgroundImage: 'var(--paw-pattern)',
                    backgroundSize: '160px 160px',
                    backgroundRepeat: 'repeat',
                    backgroundAttachment: 'fixed',
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
                <div className="lg:pl-72 flex flex-col h-screen overflow-hidden">
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

                        <div className="h-6 w-px bg-border lg:hidden" />

                        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                            <div className="flex flex-1 items-center">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                                        Pet Owner Portal
                                    </p>
                                    <p className="text-sm font-semibold text-neutral-800">{title}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-x-4 lg:gap-x-6">
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
                                                <span className="text-sm font-medium">{auth.user.name}</span>
                                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                                            </span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="p-0 font-normal">
                                            <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-xs">
                                                        {auth.user.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-sm">{auth.user.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{auth.user.email}</p>
                                                </div>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/owner/settings" className="cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/owner/settings/appearance" className="cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                Appearance
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={logout()}
                                                method="post"
                                                as="button"
                                                className="w-full cursor-pointer text-destructive focus:text-destructive"
                                                onClick={handleLogout}
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Page content */}
                    <main className="py-6 flex-1 overflow-y-auto">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-3xl font-semibold text-neutral-900">{title}</h1>
                                    {description && (
                                        <p className="mt-1 max-w-3xl text-sm text-neutral-500">{description}</p>
                                    )}
                                </div>
                                {actions && <div>{actions}</div>}
                            </div>

                            <div className="mt-6 flex flex-col gap-6">{children}</div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
