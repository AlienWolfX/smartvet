<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SetupController extends Controller
{
    public function show()
    {
        $user = auth()->user();

        // If setup is already complete, redirect to dashboard
        if ($user->is_setup_complete) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('setup', [
            'user' => [
                'name' => $user->name,
                'clinic_name' => $user->clinic_name ?? '',
                'clinic_logo' => $user->clinic_logo ? Storage::url($user->clinic_logo) : null,
                'theme_name' => $user->theme_name ?? 'default',
                'theme_color' => $user->theme_color ?? '#0f172a',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'clinic_name' => 'required|string|max:255',
            'clinic_logo' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'theme_name' => 'required|string|in:default,ocean,forest,sunset,rose,purple,custom',
            'theme_color' => 'required|string|max:7',
        ]);

        $user = auth()->user();

        $updateData = [
            'clinic_name' => $validated['clinic_name'],
            'theme_name' => $validated['theme_name'],
            'theme_color' => $validated['theme_color'],
            'is_setup_complete' => true,
        ];

        if ($request->hasFile('clinic_logo')) {
            // Delete old logo if exists
            if ($user->clinic_logo) {
                Storage::disk('public')->delete($user->clinic_logo);
            }
            $updateData['clinic_logo'] = $request->file('clinic_logo')->store('clinic-logos', 'public');
        }

        $user->update($updateData);

        return redirect()->route('dashboard')->with('success', 'Clinic setup completed successfully!');
    }
}
