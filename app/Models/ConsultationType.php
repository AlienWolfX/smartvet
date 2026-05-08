<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ConsultationType extends Model
{
    use HasFactory, HasAliasedPrimaryKey;

    protected $primaryKey = 'consultation_type_id';

    protected $fillable = [
        'user_id',
        'slug',
        'name',
        'fee',
        'description',
    ];

    protected $casts = [
        'fee' => 'decimal:2',
    ];

    public static function generateUniqueSlug(string $name, int $userId): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (self::where('user_id', $userId)->where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        return $slug;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
