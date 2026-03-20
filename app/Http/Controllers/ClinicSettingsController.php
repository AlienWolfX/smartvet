<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

class ClinicSettingsController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $requiresConfirmation = Fortify::confirmsTwoFactorAuthentication();
        $hasSecret = !is_null($user?->two_factor_secret);
        $isConfirmed = !is_null($user?->two_factor_confirmed_at);

        return Inertia::render('clinic-settings', [
            'settings' => [
                'clinic_name' => $user->clinic_name ?? '',
                'clinic_logo' => $user->clinic_logo ? Storage::url($user->clinic_logo) : null,
                'theme_name' => $user->theme_name ?? 'default',
                'theme_color' => $user->theme_color ?? '#0f172a',
            ],
            'twoFactorEnabled' => $hasSecret && (!$requiresConfirmation || $isConfirmed),
            'twoFactorPending' => $hasSecret && $requiresConfirmation && !$isConfirmed,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'clinic_name' => 'required|string|max:255',
            'clinic_logo' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'remove_logo' => 'nullable|boolean',
            'theme_name' => 'required|string|in:default,ocean,forest,sunset,rose,purple,custom',
            'theme_color' => 'required|string|max:7',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $updateData = [
            'clinic_name' => $validated['clinic_name'],
            'theme_name' => $validated['theme_name'],
            'theme_color' => $validated['theme_color'],
        ];

        // Handle logo removal
        if ($request->boolean('remove_logo') && $user->clinic_logo) {
            Storage::disk('public')->delete($user->clinic_logo);
            $updateData['clinic_logo'] = null;
        }

        // Handle logo upload
        if ($request->hasFile('clinic_logo')) {
            if ($user->clinic_logo) {
                Storage::disk('public')->delete($user->clinic_logo);
            }
            $updateData['clinic_logo'] = $request->file('clinic_logo')->store('clinic-logos', 'public');
        }

        $user->update($updateData);

        return redirect()->back()->with('success', 'Clinic settings updated successfully!');
    }
}
