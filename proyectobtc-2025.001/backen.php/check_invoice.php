<?php
header('Content-Type: application/json');
require_once 'config.php';

if(empty($_GET['id'])){
  echo json_encode(['ok'=>false, 'msg'=>'Falta ID']);
  exit;
}

$id = $_GET['id'];

$ch = curl_init();
curl_setopt_array($ch, [
  CURLOPT_URL => LNbits_HOST . "/api/v1/payments/" . $id,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "X-Api-Key: " . ADMIN_KEY
  ]
]);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if(!$data){ echo json_encode(['ok'=>false]); exit; }

echo json_encode([
  'ok'=>true,
  'paid'=>$data['paid'] ?? false
]);
