<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Owner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $oldEmail = $user->email;
        $newEmail = $request->validated()['email'] ?? $oldEmail;

        $user->fill($request->validated());
        $user->save();

        if ($newEmail !== $oldEmail) {
            // Update the email on all clinic Owner records already linked to this account
            Owner::where('account_user_id', $user->getKey())
                ->update(['email' => $newEmail]);

            // Retroactively link any clinic Owner records that carry the new email
            // but aren't linked yet (e.g. clinic added them before they registered)
            Owner::where('email', $newEmail)
                ->whereNull('account_user_id')
                ->update(['account_user_id' => $user->getKey()]);
        }

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
