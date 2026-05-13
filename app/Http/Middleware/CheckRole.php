<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return redirect()->route('login');
        }

        if (!empty($roles) && !$request->user()->hasAnyRole($roles)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access this resource.',
                ], 403);
            }

            // Redirect to the appropriate portal based on role
            /** @var \App\Models\User $user */
            $user = $request->user();
            if ($user->isOwner()) {
                return redirect()->route('owner.pets')->with('error', 'You do not have permission to access this page.');
            }
            if ($user->isAdmin()) {
                return redirect()->route('admin.user-management')->with('error', 'You do not have permission to access this page.');
            }

            return redirect()->route('dashboard')->with('error', 'You do not have permission to access this page.');
        }

        return $next($request);
    }
}
