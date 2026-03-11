<?php

namespace App\Http\Controllers;

use App\Models\Owner;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class OwnerRegisterController extends Controller
{
    public function showForm()
    {
        return Inertia::render('auth/owner-register');
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => User::ROLE_OWNER,
            'is_setup_complete' => true,
        ]);

        // Retroactively link any clinic-created owner records that share this email
        Owner::where('email', $data['email'])
            ->whereNull('account_user_id')
            ->update(['account_user_id' => $user->id]);

        Auth::login($user);

        return redirect()->route('owner.pets');
    }
}
