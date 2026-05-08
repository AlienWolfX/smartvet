<?php

namespace App\Models;

trait HasAliasedPrimaryKey
{
    public function getIdAttribute()
    {
        return $this->attributes[$this->getKeyName()] ?? null;
    }
}
