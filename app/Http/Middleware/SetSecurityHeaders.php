<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($response instanceof Response) {
            $response->headers->remove('Permissions-Policy');
            $response->headers->set('Permissions-Policy', 'fullscreen=(), geolocation=(), microphone=(), camera=()');
            $response->headers->set('Content-Security-Policy', implode('; ', [
                "default-src 'self'",
                "script-src 'self' https://challenges.cloudflare.com",
                "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
                "font-src 'self' https://challenges.cloudflare.com",
                "frame-src https://challenges.cloudflare.com",
                "connect-src 'self' https://challenges.cloudflare.com",
                "img-src 'self' data:",
            ]) . ';');
        }

        return $response;
    }
}
