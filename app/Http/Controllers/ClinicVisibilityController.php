<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Pet;
use App\Models\ClinicVisibilityPermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClinicVisibilityController extends Controller
{
    /**
     * Display the clinic visibility management page.
     */
    public function index(Request $request)
    {
        $currentUser = Auth::user();

        // Only admin can access this page
        if (!$currentUser || !$currentUser->isAdmin()) {
            abort(403, 'Unauthorized');
        }

        $search = $request->query('search', '');
        $page = $request->query('page', 1);

        // Get all clinics in the system
        $query = User::where('role', User::ROLE_CLINIC)
            ->orderBy('clinic_name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('clinic_name', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $clinics = $query->paginate(20)->through(function ($clinic) {
            $ownedPets = Pet::whereHas('owner', function ($q) use ($clinic) {
                $q->where('owners.user_id', $clinic->getKey());
            })->count();

            $importedPets = Pet::whereJsonContains('clinic_ids', $clinic->getKey())->count();

            return [
                'id' => $clinic->getKey(),
                'name' => $clinic->clinic_name ?? $clinic->name,
                'email' => $clinic->email,
                'ownedPets' => $ownedPets,
                'importedPets' => $importedPets,
            ];
        });

        return Inertia::render('admin/clinic-visibility', [
            'clinics' => $clinics,
            'search' => $search,
        ]);
    }

    /**
     * Get visibility permissions for a specific clinic.
     */
    public function getPermissions(Request $request, $clinicId)
    {
        $currentUser = Auth::user();

        if (!$currentUser || !$currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $clinic = User::where('user_id', $clinicId)
            ->where('role', User::ROLE_CLINIC)
            ->firstOrFail();

        $canView = ClinicVisibilityPermission::where('receiving_clinic_id', $clinicId)
            ->with('grantingClinic')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->grantingClinic->getKey(),
                'name' => $p->grantingClinic->clinic_name ?? $p->grantingClinic->name,
                'email' => $p->grantingClinic->email,
            ]);


        $canBeViewedBy = ClinicVisibilityPermission::where('granting_clinic_id', $clinicId)
            ->with('receivingClinic')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->receivingClinic->getKey(),
                'name' => $p->receivingClinic->clinic_name ?? $p->receivingClinic->name,
                'email' => $p->receivingClinic->email,
            ]);

        return response()->json([
            'clinic' => [
                'id' => $clinic->getKey(),
                'name' => $clinic->clinic_name ?? $clinic->name,
                'email' => $clinic->email,
            ],
            'canView' => $canView,
            'canBeViewedBy' => $canBeViewedBy,
        ]);
    }

    /**
     * Grant visibility permission for a clinic to view another clinic.
     */
    public function grantPermission(Request $request)
    {
        $currentUser = Auth::user();

        if (!$currentUser || !$currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'granting_clinic_id' => 'required|exists:users,user_id',
            'receiving_clinic_id' => 'required|exists:users,user_id',
        ]);

        $grantingClinicId = $request->input('granting_clinic_id');
        $receivingClinicId = $request->input('receiving_clinic_id');

        if ($grantingClinicId === $receivingClinicId) {
            return response()->json(['error' => 'Cannot grant permission to the same clinic'], 400);
        }

        $grantingClinic = User::where('user_id', $grantingClinicId)
            ->where('role', User::ROLE_CLINIC)
            ->first();

        $receivingClinic = User::where('user_id', $receivingClinicId)
            ->where('role', User::ROLE_CLINIC)
            ->first();

        if (!$grantingClinic || !$receivingClinic) {
            return response()->json(['error' => 'Invalid clinic'], 404);
        }

        // Create or update the permission
        $permission = ClinicVisibilityPermission::firstOrCreate(
            [
                'granting_clinic_id' => $grantingClinicId,
                'receiving_clinic_id' => $receivingClinicId,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Permission granted to {$receivingClinic->clinic_name} to view {$grantingClinic->clinic_name}'s history",
            'permission' => [
                'id' => $permission->id,
                'grantingClinicId' => $permission->granting_clinic_id,
                'receivingClinicId' => $permission->receiving_clinic_id,
            ],
        ]);
    }

    /**
     * Revoke visibility permission.
     */
    public function revokePermission(Request $request)
    {
        $currentUser = Auth::user();

        // Only admin can revoke permissions
        if (!$currentUser || !$currentUser->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'granting_clinic_id' => 'required|exists:users,user_id',
            'receiving_clinic_id' => 'required|exists:users,user_id',
        ]);

        $grantingClinicId = $request->input('granting_clinic_id');
        $receivingClinicId = $request->input('receiving_clinic_id');

        $permission = ClinicVisibilityPermission::where('granting_clinic_id', $grantingClinicId)
            ->where('receiving_clinic_id', $receivingClinicId)
            ->first();

        if (!$permission) {
            return response()->json(['error' => 'Permission not found'], 404);
        }

        $grantingClinic = User::find($grantingClinicId);
        $receivingClinic = User::find($receivingClinicId);

        $permission->delete();

        return response()->json([
            'success' => true,
            'message' => "Permission revoked for {$receivingClinic->clinic_name} to view {$grantingClinic->clinic_name}'s history",
        ]);
    }
}
