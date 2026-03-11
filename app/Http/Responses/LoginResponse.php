<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        if ($user && $user->isAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('admin.login')->with(
                'status',
                'Please use the Admin login page.'
            );
        }

        // Clinic users must use /clinic
        if ($user && $user->isClinic()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('clinic.login')->with(
                'status',
                'Please use the Clinic login page.'
            );
        }

        return $request->wantsJson()
            ? new JsonResponse('', 204)
            : redirect()->intended('/dashboard');
    }
}
