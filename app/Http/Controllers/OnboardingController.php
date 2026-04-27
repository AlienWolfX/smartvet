<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function complete(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->update(['onboarding_complete' => true]);
        }

        return redirect()->route('owner.pets')->with('success', 'Onboarding completed successfully.');
    }
}
