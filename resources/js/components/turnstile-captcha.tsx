import InputError from '@/components/input-error';
import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement, options: {
                sitekey: string;
                callback: (token: string) => void;
                'expired-callback'?: () => void;
            }) => string;
            reset: (widgetId?: string) => void;
        };
    }
}

interface TurnstileCaptchaProps {
    siteKey: string | null;
    error?: string;
    refreshNonce?: number;
    onTokenChange: (token: string) => void;
}

export default function TurnstileCaptcha({ siteKey, error, refreshNonce = 0, onTokenChange }: TurnstileCaptchaProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!siteKey) return;

        const renderWidget = () => {
            if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => onTokenChange(token),
                'expired-callback': () => onTokenChange(''),
            });
        };

        const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
        if (existingScript) {
            renderWidget();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = 'true';
        script.onload = renderWidget;
        document.head.appendChild(script);
    }, [siteKey, onTokenChange]);

    useEffect(() => {
        if (!widgetIdRef.current || !window.turnstile) return;

        window.turnstile.reset(widgetIdRef.current);
        onTokenChange('');
    }, [refreshNonce, onTokenChange]);

    return (
        <div className="grid gap-2">
            <div>
                {siteKey ? (
                    <div ref={containerRef} className="min-h-[65px]" />
                ) : (
                    <p className="text-xs text-amber-700">Captcha is not configured. Please contact support.</p>
                )}
            </div>
            <InputError message={error} />
        </div>
    );
}
