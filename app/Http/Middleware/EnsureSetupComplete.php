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
        if ($request->user() && !$request->user()->is_setup_complete) {
            // Allow access to setup routes, logout, and login
            $allowedRoutes = ['setup', 'setup.store', 'logout'];
            
            if (!in_array($request->route()?->getName(), $allowedRoutes)) {
                return redirect()->route('setup');
            }
        }

        return $next($request);
    }
}
