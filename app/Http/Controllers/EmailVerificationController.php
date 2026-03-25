<?php

namespace App\Http\Controllers;

use App\Mail\EmailVerificationCode;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class EmailVerificationController extends Controller
{
    public function showVerificationNotice(Request $request)
    {
        $user = $request->user();

        return Inertia::render('auth/verify-email', [
            'email' => $user?->email,
            'status' => $request->session()->get('status'),
            'expiresAt' => $user?->email_verification_expires_at?->toIso8601String(),
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (! $user) {
            return redirect()->route('login')->withErrors(['error' => 'Please login first.']);
        }

        if ($user->email_verified_at) {
            if ($user->isClinic()) {
                return redirect()->route($user->is_setup_complete ? 'dashboard' : 'setup');
            }
            if ($user->isAdmin()) {
                return redirect()->route('user-management');
            }
            return redirect()->route('owner.pets');
        }

        if (! $user->email_verification_code || $user->email_verification_expires_at === null || $user->email_verification_expires_at->isPast()) {
            return back()->withErrors(['code' => 'Your verification code has expired. Please request a new code.']);
        }

        if (! hash_equals($user->email_verification_code, $request->input('code'))) {
            return back()->withErrors(['code' => 'The verification code is invalid.']);
        }

        $user->forceFill([
            'email_verified_at' => Carbon::now(),
            'email_verification_code' => null,
            'email_verification_expires_at' => null,
        ])->save();

        if ($user->isClinic()) {
            return redirect()->route($user->is_setup_complete ? 'dashboard' : 'setup')->with('status', 'Email verified successfully.');
        }

        if ($user->isAdmin()) {
            return redirect()->route('user-management')->with('status', 'Email verified successfully.');
        }

        return redirect()->route('owner.pets')->with('status', 'Email verified successfully.');
    }

    public function resend(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->email_verified_at) {
            if ($user->isClinic()) {
                return redirect()->route($user->is_setup_complete ? 'dashboard' : 'setup');
            }
            if ($user->isAdmin()) {
                return redirect()->route('user-management');
            }
            return redirect()->route('owner.pets');
        }

        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->forceFill([
            'email_verification_code' => $verificationCode,
            'email_verification_expires_at' => Carbon::now()->addMinutes(3),
        ])->save();

        Mail::to($user->email)->send(new EmailVerificationCode($user, $verificationCode));

        return back()->with('status', 'A new verification code has been sent to your email.');
    }
}
