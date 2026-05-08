<?php

namespace App\Http\Controllers;

use App\Models\Owner;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OwnerManagementController extends Controller
{
    public function index()
    {
        $owners = User::where('role', User::ROLE_OWNER)
            ->withCount([
                'ownersAsAccount as pets_count' => function ($q) {
                    $q->join('pets', 'pets.owner_id', '=', 'owners.owner_id');
                },
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($user) => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'status'     => $user->status ?? 'active',
                'petsCount'  => $user->pets_count ?? 0,
                'lastLogin'  => $user->last_login_at?->toISOString(),
                'createdAt'  => $user->created_at->toISOString(),
            ]);

        $stats = [
            'total'   => User::where('role', User::ROLE_OWNER)->count(),
            'active'  => User::where('role', User::ROLE_OWNER)->where('status', 'active')->count(),
            'linked'  => Owner::whereNotNull('account_user_id')->distinct('account_user_id')->count('account_user_id'),
        ];

        return Inertia::render('admin/owner-management', [
            'owners' => $owners,
            'stats'  => $stats,
        ]);
    }

    public function update(Request $request, User $owner)
    {
        abort_if($owner->role !== User::ROLE_OWNER, 403);

        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:255'],
            'email'  => ['required', 'email', 'unique:users,email,' . $owner->id],
            'status' => ['required', 'in:active,inactive,suspended'],
        ]);

        // If email changed, re-link owner records
        if ($validated['email'] !== $owner->email) {
            // Unlink from old email
            Owner::where('account_user_id', $owner->id)->update(['account_user_id' => null]);

            // Link to new email matches
            Owner::where('email', $validated['email'])
                ->whereNull('account_user_id')
                ->update(['account_user_id' => $owner->id]);
        }

        $owner->update($validated);

        return redirect()->back()->with('success', 'Owner account updated successfully!');
    }

    public function toggleStatus(User $owner)
    {
        abort_if($owner->role !== User::ROLE_OWNER, 403);

        $owner->update([
            'status' => $owner->status === 'active' ? 'suspended' : 'active',
        ]);

        return redirect()->back()->with('success', 'Owner status updated!');
    }

    public function destroy(User $owner)
    {
        abort_if($owner->role !== User::ROLE_OWNER, 403);

        DB::transaction(function () use ($owner) {
            // Unlink owner records before deleting the user
            Owner::where('account_user_id', $owner->id)->update(['account_user_id' => null]);
            $owner->delete();
        });

        return redirect()->back()->with('success', 'Owner account deleted!');
    }
}
