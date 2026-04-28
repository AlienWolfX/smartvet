<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InactivityTimeout
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  float|null  $timeoutMinutes
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ?float $timeoutMinutes = null)
    {
        if (! Auth::check()) {
            return $next($request);
        }

        $timeoutMinutes = $timeoutMinutes ?: floatval(config('session.inactivity_timeout', config('session.lifetime', 120)));
        $timeoutSeconds = (int) ($timeoutMinutes * 60);

        $lastActivity = (int) $request->session()->get('last_activity', now()->timestamp);
        $currentTime = now()->timestamp;

        if ($currentTime - $lastActivity > $timeoutSeconds) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('status', 'You have been logged out due to inactivity. Please sign in again.');
        }

        $request->session()->put('last_activity', $currentTime);

        return $next($request);
    }
}
