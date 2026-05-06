import { useEffect, useRef, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

const INACTIVITY_TIMEOUT_SECONDS = 30 * 60;
const WARNING_DISPLAY_TIME = 30;
const ACTIVITY_PING_INTERVAL = 60000;

interface UseInactivityTimeoutOptions {
    enabled?: boolean;
    logoutUrl?: string;
    loginUrl?: string;
}

export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
    const { enabled = true, logoutUrl = '/logout', loginUrl = '/login' } = options;
    const { props } = usePage();
    const csrfToken =
        (props as any).csrf_token ||
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        '';
    const [showWarning, setShowWarning] = useState(false);
    const [timeoutSeconds] = useState(INACTIVITY_TIMEOUT_SECONDS);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const activityPingRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const performLogout = useCallback(async () => {
        setShowWarning(false);

        try {
            const response = await fetch(logoutUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Logout request failed');
            }
        } catch (error) {
            console.warn('Automatic logout failed, redirecting to login:', error);
        }

        const statusMessage = encodeURIComponent('You have been logged out due to inactivity. Please sign in again.');
        const separator = loginUrl.includes('?') ? '&' : '?';
        window.location.href = `${loginUrl}${separator}status=${statusMessage}`;
    }, [csrfToken, loginUrl, logoutUrl]);

    // Ping activity endpoint to update session
    const pingActivity = useCallback(async () => {
        try {
            await fetch('/activity/ping', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });
        } catch (error) {
            console.error('Failed to ping activity:', error);
        }
    }, [csrfToken]);

    // Reset inactivity timers
    const resetInactivityTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        // Clear existing timers
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        setShowWarning(false);

        // Set warning timer (show warning before logout)
        const warningTime = Math.max((timeoutSeconds - WARNING_DISPLAY_TIME) * 1000, 0);
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
        }, warningTime);

        // Set logout timer
        const logoutTime = timeoutSeconds * 1000;
        inactivityTimerRef.current = setTimeout(() => {
            performLogout();
        }, logoutTime);
    }, [timeoutSeconds, csrfToken, performLogout]);

    // Handle user activity events
    const handleActivity = useCallback(() => {
        // Only reset if significant time has passed (avoid excessive resets)
        if (Date.now() - lastActivityRef.current > 1000) {
            resetInactivityTimer();
            pingActivity();
        }
    }, [resetInactivityTimer, pingActivity]);

    // Setup activity listeners and timers
    useEffect(() => {
        if (!enabled) return;

        // User activity events to track
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'touchmove', 'click'];

        // Add event listeners
        events.forEach((event) => {
            document.addEventListener(event, handleActivity);
        });

        // Initial timer setup
        resetInactivityTimer();

        // Periodic activity ping (every 60 seconds)
        activityPingRef.current = setInterval(pingActivity, ACTIVITY_PING_INTERVAL);

        // Cleanup function
        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (activityPingRef.current) clearInterval(activityPingRef.current);
        };
    }, [enabled, handleActivity, resetInactivityTimer, pingActivity]);

    // Function to manually dismiss warning and continue session
    const dismissWarning = useCallback(() => {
        setShowWarning(false);
        resetInactivityTimer();
        pingActivity();
    }, [resetInactivityTimer, pingActivity]);

    // Function to manually logout
    const logout = useCallback(() => {
        performLogout();
    }, [performLogout]);

    return {
        showWarning,
        timeoutSeconds,
        dismissWarning,
        logout,
    };
}
