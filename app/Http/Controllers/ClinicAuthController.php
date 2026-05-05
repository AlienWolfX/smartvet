<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TurnstileVerifier;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

class ClinicAuthController extends Controller
{
    public function __construct(private readonly TurnstileVerifier $turnstileVerifier)
    {
    }

    public function showLoginForm(Request $request)
    {
        return Inertia::render('auth/clinic-login', [
            'status' => $request->session()->get('status'),
            'captchaSiteKey' => config('services.turnstile.site_key'),
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
            'remember' => ['boolean'],
            'captcha_token' => ['required', 'string'],
        ]);

        $this->turnstileVerifier->verifyOrFail($credentials['captcha_token'], $request->ip());

        /** @var User|null $user */
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return back()->withErrors([
                'email' => 'These credentials do not match our records.',
            ])->onlyInput('email');
        }

        if (! $user->isClinic()) {
            return back()->withErrors([
                'email' => 'These credentials do not have clinic access.',
            ])->onlyInput('email');
        }

        $status = $user->status ?? 'active';
        if ($status !== 'active') {
            $message = $status === 'suspended'
                ? 'This clinic account has been suspended. Please contact support.'
                : 'This clinic account is inactive. Please contact your administrator.';

            return back()->withErrors([
                'email' => $message,
            ])->onlyInput('email');
        }

        if (! $user->hasVerifiedEmail()) {
            Auth::login($user, $request->boolean('remember'));
            return redirect()->route('verification.notice')->with('status', 'Please verify your email before accessing the clinic dashboard.');
        }

        if ($this->requiresTwoFactorChallenge($user)) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            return redirect()->route('two-factor.login');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        $user->last_login_at = Carbon::now();
        $user->save();

        return redirect()->intended('/dashboard');
    }

    private function requiresTwoFactorChallenge(User $user): bool
    {
        if (! $user->two_factor_secret) {
            return false;
        }

        if (Fortify::confirmsTwoFactorAuthentication()) {
            return ! is_null($user->two_factor_confirmed_at);
        }

        return true;
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('clinic.login');
    }
}
