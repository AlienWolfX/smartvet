import { useEffect, useRef, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';

const INACTIVITY_TIMEOUT_MINUTES = 3; // Match backend config
const WARNING_DISPLAY_TIME = 30; // Show warning 30 seconds before logout
const ACTIVITY_PING_INTERVAL = 60000; // Ping every 60 seconds to keep session alive

interface UseInactivityTimeoutOptions {
    enabled?: boolean;
}

/**
 * Hook to track user inactivity and automatically log them out after 3 minutes
 * Also shows a warning dialog 30 seconds before logout
 * Tracks user activity (mouse, keyboard, clicks) to reset the timeout
 */
export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
    const { enabled = true } = options;
    const { props } = usePage();
    const csrfToken = (props as any).csrf_token || '';
    const [showWarning, setShowWarning] = useState(false);
    const [timeoutMinutes, setTimeoutMinutes] = useState(INACTIVITY_TIMEOUT_MINUTES);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const activityPingRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    // Ping activity endpoint to update session
    const pingActivity = useCallback(async () => {
        try {
            await fetch('/activity/ping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': csrfToken,
                },
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
        const warningTime = (timeoutMinutes * 60 - WARNING_DISPLAY_TIME) * 1000;
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
        }, warningTime);

        // Set logout timer
        const logoutTime = timeoutMinutes * 60 * 1000;
        inactivityTimerRef.current = setTimeout(() => {
            // Logout due to inactivity
            setShowWarning(false);
            // Post logout request or just redirect
            fetch('/logout', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': csrfToken,
                },
            }).catch(() => {
                // Fallback to redirect if logout fails
                window.location.href = '/login';
            });
        }, logoutTime);
    }, [timeoutMinutes, csrfToken]);

    // Handle user activity events
    const handleActivity = useCallback(() => {
        // Only reset if significant time has passed (avoid excessive resets)
        if (Date.now() - lastActivityRef.current > 5000) {
            resetInactivityTimer();
            pingActivity();
        }
    }, [resetInactivityTimer, pingActivity]);

    // Setup activity listeners and timers
    useEffect(() => {
        if (!enabled) return;

        // User activity events to track
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

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
        setShowWarning(false);
        fetch('/logout', {
            method: 'POST',
            headers: {
                'X-CSRF-Token': csrfToken,
            },
        }).catch(() => {
            window.location.href = '/login';
        });
    }, [csrfToken]);

    return {
        showWarning,
        timeoutMinutes,
        dismissWarning,
        logout,
    };
}
