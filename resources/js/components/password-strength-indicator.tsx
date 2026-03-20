import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
    password: string;
}

interface Criterion {
    label: string;
    met: boolean;
}

function evaluate(password: string): { score: number; criteria: Criterion[] } {
    const criteria: Criterion[] = [
        { label: '8+ characters',      met: password.length >= 8 },
        { label: 'Uppercase',          met: /[A-Z]/.test(password) },
        { label: 'Lowercase',          met: /[a-z]/.test(password) },
        { label: 'Number',             met: /[0-9]/.test(password) },
        { label: 'Special character',  met: /[^A-Za-z0-9]/.test(password) },
    ];
    return { score: criteria.filter((c) => c.met).length, criteria };
}

const LEVELS = [
    { label: '',          segmentColor: 'bg-slate-200',   textColor: 'text-slate-400' },   // 0
    { label: 'Very weak', segmentColor: 'bg-red-500',     textColor: 'text-red-500' },     // 1
    { label: 'Weak',      segmentColor: 'bg-orange-400',  textColor: 'text-orange-500' },  // 2
    { label: 'Fair',      segmentColor: 'bg-yellow-400',  textColor: 'text-yellow-600' },  // 3
    { label: 'Good',      segmentColor: 'bg-emerald-400', textColor: 'text-emerald-500' }, // 4
    { label: 'Strong',    segmentColor: 'bg-emerald-600', textColor: 'text-emerald-700' }, // 5
];

// Map 0-5 score → 0-4 filled segments
const SCORE_TO_SEGMENTS = [0, 1, 2, 3, 4, 4];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const { score, criteria } = useMemo(() => evaluate(password), [password]);

    if (!password) return null;

    const level = LEVELS[score];
    const filled = SCORE_TO_SEGMENTS[score];

    return (
        <div className="mt-2 space-y-2">
            {/* Strength bars */}
            <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i < filled ? level.segmentColor : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>

            {/* Label + checklist row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {criteria.map((c) => (
                        <span
                            key={c.label}
                            className={`flex items-center gap-1 text-[11px] transition-colors duration-200 ${
                                c.met ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                        >
                            <svg
                                viewBox="0 0 12 12"
                                className="h-3 w-3 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {c.met ? (
                                    <path d="M2 6l3 3 5-5" />
                                ) : (
                                    <circle cx="6" cy="6" r="4" />
                                )}
                            </svg>
                            {c.label}
                        </span>
                    ))}
                </div>

                {score > 0 && (
                    <span className={`shrink-0 text-xs font-semibold ${level.textColor}`}>
                        {level.label}
                    </span>
                )}
            </div>
        </div>
    );
}

interface PasswordMatchIndicatorProps {
    password: string;
    confirmation: string;
}

export function PasswordMatchIndicator({ password, confirmation }: PasswordMatchIndicatorProps) {
    if (!confirmation) return null;

    const matched = password === confirmation;

    return (
        <span
            className={`flex items-center gap-1 text-[11px] font-medium transition-colors duration-200 mt-1 ${
                matched ? 'text-emerald-600' : 'text-red-500'
            }`}
        >
            <svg
                viewBox="0 0 12 12"
                className="h-3 w-3 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {matched ? (
                    <path d="M2 6l3 3 5-5" />
                ) : (
                    <>
                        <path d="M2 2l8 8" />
                        <path d="M10 2l-8 8" />
                    </>
                )}
            </svg>
            {matched ? 'Passwords match' : 'Passwords do not match'}
        </span>
    );
}
