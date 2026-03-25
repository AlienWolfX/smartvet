<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSetupComplete
{
    /**
     * Redirect users to setup page if they haven't completed setup.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $routeName = $request->route()?->getName();
        $user = $request->user();

        if ($user && !$user->isAdmin() && !$user->isOwner() && !$user->is_setup_complete) {
            if (! $user->hasVerifiedEmail()) {
                $allowedVerificationRoutes = ['verification.notice', 'verification.verify', 'verification.send', 'logout'];

                if (! in_array($routeName, $allowedVerificationRoutes)) {
                    return redirect()->route('verification.notice');
                }

                return $next($request);
            }

            $allowedSetupRoutes = ['setup', 'setup.store', 'logout'];

            if (! in_array($routeName, $allowedSetupRoutes)) {
                return redirect()->route('setup');
            }
        }

        return $next($request);
    }
}
