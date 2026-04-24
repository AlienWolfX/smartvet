<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Consultation;
use App\Models\Vaccination;

class PetPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_id',
        'consultation_id',
        'vaccination_id',
        'total_amount',
        'payment_method',
        'reference_number',
        'notes',
        'paid_at',
        'recorded_by',
        'status',
        'deduction_amount',
        'deduction_reason',
        'deduction_type',
        'final_amount',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'total_amount' => 'decimal:2',
        'deduction_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
    ];

    public function pet(): BelongsTo
    {
        return $this->belongsTo(Pet::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PetPaymentItem::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function vaccination(): BelongsTo
    {
        return $this->belongsTo(Vaccination::class);
    }
}
