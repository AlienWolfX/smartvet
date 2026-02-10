<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PetPaymentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_payment_id',
        'service_type',
        'service_id',
        'description',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(PetPayment::class, 'pet_payment_id');
    }
}
