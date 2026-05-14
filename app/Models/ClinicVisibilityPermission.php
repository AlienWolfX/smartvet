<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicVisibilityPermission extends Model
{
    protected $table = 'clinic_visibility_permissions';

    protected $fillable = [
        'granting_clinic_id',
        'receiving_clinic_id',
    ];

    /**
     * Get the clinic that grants the visibility permission.
     */
    public function grantingClinic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granting_clinic_id', 'user_id');
    }

    /**
     * Get the clinic that receives the visibility permission.
     */
    public function receivingClinic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiving_clinic_id', 'user_id');
    }
}
