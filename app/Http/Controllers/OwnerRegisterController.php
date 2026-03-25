<?php

namespace App\Http\Controllers;

use App\Mail\EmailVerificationCode;
use App\Models\Owner;
use App\Models\User;
use App\Services\TurnstileVerifier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class OwnerRegisterController extends Controller
{
    public function __construct(private readonly TurnstileVerifier $turnstileVerifier)
    {
    }

    public function showForm()
    {
        return Inertia::render('auth/owner-register', [
            'captchaSiteKey' => config('services.turnstile.site_key'),
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'captcha_token' => ['required', 'string'],
        ]);

        $this->turnstileVerifier->verifyOrFail($data['captcha_token'], $request->ip());

        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => User::ROLE_OWNER,
            'is_setup_complete' => true,
            'email_verified_at' => null,
            'email_verification_code' => $verificationCode,
            'email_verification_expires_at' => Carbon::now()->addMinutes(3),
        ]);

        // Retroactively link any clinic-created owner records that share this email
        Owner::where('email', $data['email'])
            ->whereNull('account_user_id')
            ->update(['account_user_id' => $user->id]);

        Mail::to($user->email)->send(new EmailVerificationCode($user, $verificationCode));

        Auth::login($user);

        return redirect()->route('verification.notice')->with('status', 'A verification code has been sent to your email.');
    }
}
