<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class TurnstileVerifier
{
    public function verifyOrFail(?string $captchaToken, ?string $ipAddress): void
    {
        if (!is_string($captchaToken) || trim($captchaToken) === '') {
            throw ValidationException::withMessages([
                'captcha_token' => 'Captcha is required.',
            ]);
        }

        $secretKey = config('services.turnstile.secret_key');

        if (!is_string($secretKey) || $secretKey === '') {
            throw ValidationException::withMessages([
                'captcha_token' => 'Captcha is not configured. Please contact support.',
            ]);
        }

        $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => $secretKey,
            'response' => $captchaToken,
            'remoteip' => $ipAddress,
        ]);

        if (!$response->successful() || !$response->json('success')) {
            throw ValidationException::withMessages([
                'captcha_token' => 'Captcha verification failed. Please try again.',
            ]);
        }
    }
}
