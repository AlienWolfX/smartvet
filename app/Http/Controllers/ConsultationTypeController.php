<?php

namespace App\Http\Controllers;

use App\Http\Traits\ScopesToTenant;
use App\Models\ConsultationType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ConsultationTypeController extends Controller
{
    use ScopesToTenant;

    public function index(): Response
    {
        $types = $this->scopeToUser(
            ConsultationType::query()->orderBy('name')
        )->get();

        return Inertia::render('consultation-types', [
            'types' => $types->map(fn (ConsultationType $type) => [
                'id' => $type->id,
                'slug' => $type->slug,
                'name' => $type->name,
                'fee' => (float) $type->fee,
                'description' => $type->description,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'fee' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
        ]);

        $userId = Auth::id();

        ConsultationType::create([
            'user_id' => $userId,
            'name' => $validated['name'],
            'slug' => ConsultationType::generateUniqueSlug($validated['name'], $userId),
            'fee' => $validated['fee'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Consultation type added successfully!');
    }

    public function update(Request $request, ConsultationType $consultationType)
    {
        if (! $request->user()?->isAdmin() && $consultationType->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'fee' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
        ]);

        $slug = $consultationType->slug;
        if ($validated['name'] !== $consultationType->name) {
            $slug = ConsultationType::generateUniqueSlug($validated['name'], $request->user()->id);
        }

        $consultationType->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'fee' => $validated['fee'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Consultation type updated successfully!');
    }

    public function destroy(Request $request, ConsultationType $consultationType)
    {
        if (! $request->user()?->isAdmin() && $consultationType->user_id !== $request->user()->id) {
            abort(403);
        }

        $consultationType->delete();

        return redirect()->back()->with('success', 'Consultation type deleted successfully!');
    }
}
