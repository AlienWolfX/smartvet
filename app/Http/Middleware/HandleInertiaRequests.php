<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $clinicThemeColor = null;
        $clinicName = null;
        $clinicLogo = null;

        if ($request->user()?->isOwner()) {
            $owner = \App\Models\Owner::where('account_user_id', $request->user()->getKey())
                ->with('user')
                ->first();
            if ($owner?->user) {
                $clinicThemeColor = $owner->user->theme_color;
                $clinicName       = $owner->user->clinic_name;
                $clinicLogo       = $owner->user->clinic_logo
                    ? \Illuminate\Support\Facades\Storage::url($owner->user->clinic_logo)
                    : null;
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'clinicSettings' => [
                'themeColor' => $clinicThemeColor,
                'clinicName' => $clinicName,
                'clinicLogo' => $clinicLogo,
            ],
        ];
    }
}
