<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClinicAuthController extends Controller
{
    public function showLoginForm(Request $request)
    {
        return Inertia::render('auth/clinic-login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            /** @var \App\Models\User $authUser */
            $authUser = Auth::user();

            if (! $authUser->isClinic()) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return back()->withErrors([
                    'email' => 'These credentials do not have clinic access.',
                ])->onlyInput('email');
            }

            $request->session()->regenerate();

            $authUser->last_login_at = now();
            $authUser->save();

            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'email' => 'These credentials do not match our records.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('clinic.login');
    }
}
