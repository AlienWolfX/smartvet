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
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'pet_payment_id';

    protected $fillable = [
        'pet_id',
        'customer_name',
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
        return $this->belongsTo(Pet::class, 'pet_id', 'pet_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PetPaymentItem::class, 'pet_payment_id', 'pet_payment_id');
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by', 'user_id');
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class, 'consultation_id', 'consultation_id');
    }

    public function vaccination(): BelongsTo
    {
        return $this->belongsTo(Vaccination::class, 'vaccination_id', 'vaccination_id');
    }
}
