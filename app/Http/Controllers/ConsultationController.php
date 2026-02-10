<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\ConsultationFile;
use App\Models\InventoryItem;
use App\Models\Pet;
use App\Models\PetPayment;
use App\Services\InventoryUsageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ConsultationController extends Controller
{
    public function store(Request $request, $petId)
    {
        // Extract numeric ID from PET-XXX format
        $numericId = (int) str_replace('PET-', '', $petId);
        
        // Validate pet exists
        $pet = Pet::find($numericId);
        if (!$pet) {
            return redirect()->back()->withErrors(['pet' => 'Pet not found']);
        }
        
        $validated = $request->validate([
            'consultation_type' => 'required|in:routine-checkup,emergency,vaccination,surgery,follow-up',
            'chief_complaint' => 'required|string|max:1000',
            'diagnosis' => 'nullable|string|max:1000',
            'treatment' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:1000',
            'consultation_date' => 'required|date',
            'consultation_fee' => 'nullable|numeric|min:0',
            'consultation_files.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,pdf,doc,docx|max:10240', // 10MB max
            'inventory_items' => 'nullable|array',
            'inventory_items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'inventory_items.*.quantity' => 'required|integer|min:1',
        ], [
            'consultation_type.required' => 'Please select a consultation type',
            'consultation_type.in' => 'Invalid consultation type selected',
            'chief_complaint.required' => 'Chief complaint is required',
            'chief_complaint.max' => 'Chief complaint must not exceed 1000 characters',
            'consultation_date.required' => 'Consultation date is required',
            'consultation_date.date' => 'Please provide a valid date',
            'consultation_files.*.file' => 'One or more uploaded files is invalid',
            'consultation_files.*.mimes' => 'Files must be images (JPEG, PNG, GIF, WebP), PDFs, or Word documents',
            'consultation_files.*.max' => 'Each file must be smaller than 10MB',
        ]);

        $inventoryItems = $request->input('inventory_items', []);
        $consultationFee = $this->resolveConsultationFee($validated);
        $inventoryTotal = $this->calculateInventoryTotal($inventoryItems);

        try {
            DB::transaction(function () use ($validated, $numericId, $inventoryItems, $consultationFee, $inventoryTotal) {
                $consultation = Consultation::create([
                    'pet_id' => $numericId,
                    'consultation_type' => $validated['consultation_type'],
                    'chief_complaint' => $validated['chief_complaint'],
                    'diagnosis' => $validated['diagnosis'],
                    'treatment' => $validated['treatment'],
                    'notes' => $validated['notes'],
                    'consultation_fee' => $consultationFee,
                    'consultation_date' => $validated['consultation_date'],
                    'consultation_time' => now()->format('H:i:s'),
                    'veterinarian' => auth()->user()->name ?? 'Dr. Admin',
                    'status' => 'completed',
                    'payment_status' => 'pending',
                ]);

                if (request()->hasFile('consultation_files')) {
                    foreach (request()->file('consultation_files') as $file) {
                        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                        $filePath = $file->storeAs('consultations/' . $consultation->id, $filename, 'public');

                        $fileType = $this->determineFileType($file->getMimeType());

                        ConsultationFile::create([
                            'consultation_id' => $consultation->id,
                            'file_name' => $filename,
                            'original_name' => $file->getClientOriginalName(),
                            'file_path' => $filePath,
                            'file_type' => $fileType,
                            'mime_type' => $file->getMimeType(),
                            'file_size' => $file->getSize(),
                            'uploaded_by' => auth()->user()->name ?? 'Dr. Admin',
                        ]);
                    }
                }

                if (! empty($inventoryItems)) {
                    app(InventoryUsageService::class)->attach($consultation, $inventoryItems);
                }

                PetPayment::create([
                    'pet_id' => $numericId,
                    'consultation_id' => $consultation->id,
                    'total_amount' => $consultationFee + $inventoryTotal,
                    'payment_method' => null,
                    'reference_number' => null,
                    'notes' => null,
                    'paid_at' => null,
                    'recorded_by' => auth()->id(),
                    'status' => 'pending',
                ]);
            });

            return redirect()->back()->with('success', 'Consultation record added successfully!');
        } catch (\Exception $e) {
            \Log::error('Consultation creation failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['general' => 'Failed to create consultation. Please try again.']);
        }
    }

    private function determineFileType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }
        
        if ($mimeType === 'application/pdf') {
            return 'document';
        }
        
        if (in_array($mimeType, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ])) {
            return 'document';
        }
        
        // Handle additional image types
        if (in_array($mimeType, [
            'image/webp',
            'image/svg+xml'
        ])) {
            return 'image';
        }
        
        return 'document';
    }

    private function resolveConsultationFee(array $validated): float
    {
        $defaults = [
            'routine-checkup' => 300,
            'emergency' => 800,
            'follow-up' => 150,
            'surgery' => 500,
            'vaccination' => 0,
        ];

        $fee = $validated['consultation_fee'] ?? null;

        if ($fee === null || $fee === '') {
            return (float) ($defaults[$validated['consultation_type']] ?? 0);
        }

        return (float) $fee;
    }

    private function calculateInventoryTotal(array $items): float
    {
        if (empty($items)) {
            return 0;
        }

        $itemIds = collect($items)
            ->pluck('inventory_item_id')
            ->filter()
            ->unique()
            ->values();

        if ($itemIds->isEmpty()) {
            return 0;
        }

        $prices = InventoryItem::whereIn('id', $itemIds)->pluck('unit_price', 'id');

        return collect($items)->reduce(function ($sum, $item) use ($prices) {
            $id = $item['inventory_item_id'] ?? null;
            $quantity = max(0, (int) ($item['quantity'] ?? 0));
            $unitPrice = $prices[$id] ?? 0;

            return $sum + ($quantity * $unitPrice);
        }, 0);
    }
}
