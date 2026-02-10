export function AdminFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-sidebar-border/50 px-6 py-4 text-xs text-muted-foreground md:flex-row">
            <span className="font-medium text-foreground">SmartVet Administrative Console</span>
            <span>
                © {year} SmartVet Clinics. Internal use only.
            </span>
        </footer>
    );
}
