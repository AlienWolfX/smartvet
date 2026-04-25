<?php
require 'vendor/autoload.php';
(Dotenv\Dotenv::createImmutable(__DIR__))->safeLoad();
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\Pet;
$pet = Pet::find(15);
echo 'clinic_ids=';
var_export($pet->clinic_ids);
echo "\n";
echo 'owner_user_id=';
var_export($pet->owner->user_id);
echo "\n";
echo 'type=';
echo gettype($pet->clinic_ids[0]);
echo "\n";
