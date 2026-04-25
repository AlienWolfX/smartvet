<?php
require 'vendor/autoload.php';
(Dotenv\Dotenv::createImmutable(__DIR__))->safeLoad();
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$columns = DB::select("SHOW COLUMNS FROM consultations");
print_r($columns);
$rows = DB::select("SELECT c.id,c.pet_id,c.consultation_type,c.veterinarian,c.payment_status,c.created_by,pp.recorded_by,p.clinic_ids FROM consultations c LEFT JOIN pet_payments pp ON pp.consultation_id=c.id LEFT JOIN pets p ON p.id=c.pet_id WHERE JSON_LENGTH(p.clinic_ids) > 0 ORDER BY c.id DESC LIMIT 50");
$nullCreatedBy = 0;
foreach ($rows as $row) {
    if ($row->created_by === null) {
        $nullCreatedBy++;
    }
}
echo 'rows=' . count($rows) . " nullCreatedBy=" . $nullCreatedBy . "\n";
foreach ($rows as $row) {
    print_r($row);
}
