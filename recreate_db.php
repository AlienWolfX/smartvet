<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Server version: " . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . "\n";
    
    // Stop InnoDB and fully drop
    $pdo->exec('DROP DATABASE IF EXISTS smartvet');
    $pdo->exec('CREATE DATABASE smartvet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->exec('USE smartvet');
    
    // Check default engine  
    $result = $pdo->query("SHOW VARIABLES LIKE 'default_storage_engine'");
    $row = $result->fetch();
    echo "Default storage engine: " . $row[1] . "\n";
    
    // Check innodb data paths
    $result = $pdo->query("SHOW VARIABLES LIKE 'innodb_data_home_dir'");
    $row = $result->fetch();
    echo "InnoDB data dir: " . ($row[1] ?: '(default)') . "\n";
    
    $result = $pdo->query("SHOW VARIABLES LIKE 'datadir'");
    $row = $result->fetch();
    echo "Data dir: " . $row[1] . "\n";
    
    // Try to see if the Aria engine is causing issues
    $result = $pdo->query("SHOW ENGINES");
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        if ($row['Support'] === 'DEFAULT' || $row['Engine'] === 'InnoDB' || $row['Engine'] === 'Aria') {
            echo "Engine: " . $row['Engine'] . " - " . $row['Support'] . "\n";
        }
    }
    
    // Try creating table directly
    $pdo->exec("CREATE TABLE test_table (id INT PRIMARY KEY) ENGINE=InnoDB");
    $pdo->query("SELECT * FROM test_table");
    echo "InnoDB test table works fine\n";
    $pdo->exec("DROP TABLE test_table");
    
    echo "Database ready. Run: php artisan migrate --seed\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
