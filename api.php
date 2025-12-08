<?php
// api.php
header("Content-Type: application/json");

// Izinkan akses dari localhost:3001 (Opsional jika pakai Proxy, tapi bagus untuk keamanan)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$file = 'database_absensi.json';

// Handle Preflight Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. GET: Ambil Data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(["students" => [], "attendance" => []]);
    }
}

// 2. POST: Simpan Data
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (is_array($data)) {
        // Simpan ke file JSON
        if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT))) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Gagal menulis file"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data JSON tidak valid"]);
    }
}
?>
