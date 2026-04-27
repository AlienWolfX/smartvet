import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useState } from 'react';

export interface OnboardingStep {
    title: string;
    description: string;
    bulletPoints: string[];
}

interface OnboardingTourProps {
    open: boolean;
    title: string;
    description: string;
    steps: OnboardingStep[];
    onComplete: () => void;
    onClose: () => void;
}

export default function OnboardingTour({
    open,
    title,
    description,
    steps,
    onComplete,
    onClose,
}: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="text-left">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <Sparkles className="h-6 w-6" />
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <Card className="border border-slate-200 bg-slate-50 p-4 mt-4">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold">Step {currentStep + 1} of {steps.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                        <div className="text-lg font-semibold">{step.title}</div>
                        <div className="text-sm text-slate-600">{step.description}</div>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                            {step.bulletPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <DialogFooter className="mt-6 gap-2">
                    <Button
                        variant="secondary"
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button variant="outline" onClick={onComplete}>
                        Skip Tour
                    </Button>
                    <Button
                        onClick={() => {
                            if (isLastStep) {
                                onComplete();
                            } else {
                                setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
                            }
                        }}
                    >
                        {isLastStep ? (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Finish</>
                        ) : (
                            <><ArrowRight className="mr-2 h-4 w-4" /> Next</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
