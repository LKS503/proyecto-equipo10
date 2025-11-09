<?php
header('Content-Type: application/json');
require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
if(!$input || empty($input['total_usd']) || empty($input['wallet_id'])) {
    echo json_encode(['ok'=>false, 'msg'=>'Datos incompletos']);
    exit;
}

$usd_to_sats = 1000;
$amount_sats = round($input['total_usd'] * $usd_to_sats);
$wallet_id = $input['wallet_id'];

$apiKey = ($wallet_id === 'walletB') ? WALLET_B_KEY : WALLET_A_KEY;

$payload = json_encode([
  "out" => false,
  "amount" => $amount_sats,
  "memo" => "Compra en MercadoKids"
]);

$ch = curl_init();
curl_setopt_array($ch, [
  CURLOPT_URL => LNbits_HOST . "/api/v1/payments",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "X-Api-Key: $apiKey"
  ],
  CURLOPT_POSTFIELDS => $payload
]);
$response = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if($http != 200 && $http != 201){
    echo json_encode(['ok'=>false, 'msg'=>'Error LNbits']);
    exit;
}

$data = json_decode($response, true);
if(!$data || empty($data['payment_request'])){
    echo json_encode(['ok'=>false,'msg'=>'Respuesta inválida']);
    exit;
}

$bolt11 = $data['payment_request'];
$invoice_id = $data['payment_hash'];
$qr = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($bolt11);

echo json_encode([
  'ok'=>true,
  'payment_request'=>$bolt11,
  'invoice_id'=>$invoice_id,
  'qr'=>$qr
]);
