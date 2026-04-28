<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Fortify;

class AppearanceSettingsController extends Controller
{
    public function adminEdit(Request $request): Response
    {
        $user = $request->user();
        $requiresConfirmation = Fortify::confirmsTwoFactorAuthentication();
        $hasSecret = !is_null($user?->two_factor_secret);
        $isConfirmed = !is_null($user?->two_factor_confirmed_at);

        return Inertia::render('admin/settings', [
            'settings' => [
                'theme_name' => $user->theme_name ?? 'forest',
                'theme_color' => $user->theme_color ?? '#14532d',
            ],
            'twoFactorEnabled' => $hasSecret && (!$requiresConfirmation || $isConfirmed),
            'twoFactorPending' => $hasSecret && $requiresConfirmation && !$isConfirmed,
        ]);
    }

    public function adminUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'theme_name' => 'required|string|in:default,ocean,forest,sunset,rose,purple,custom',
            'theme_color' => 'required|string|max:7',
        ]);

        $request->user()->update([
            'theme_name' => $validated['theme_name'],
            'theme_color' => $validated['theme_color'],
        ]);

        return redirect()->back()->with('success', 'Admin appearance settings updated successfully!');
    }

    public function ownerEdit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('owner/appearance-settings', [
            'settings' => [
                'theme_name' => $user->theme_name ?? 'forest',
                'theme_color' => $user->theme_color ?? '#14532d',
            ],
        ]);
    }

    public function ownerUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'theme_name' => 'required|string|in:default,ocean,forest,sunset,rose,purple,custom',
            'theme_color' => 'required|string|max:7',
        ]);

        $request->user()->update([
            'theme_name' => $validated['theme_name'],
            'theme_color' => $validated['theme_color'],
        ]);

        return redirect()->back()->with('success', 'Owner appearance settings updated successfully!');
    }
}
