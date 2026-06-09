$ErrorActionPreference = 'Stop'

# 1. Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"robby@email.com","password":"User@2026"}'
$token = $loginResponse.data.access_token

# 2. Get random venue
$venues = Invoke-RestMethod -Uri "http://localhost:8080/api/venues"
$venueId = $venues.data[0].id

# 3. Get slots
$slots = Invoke-RestMethod -Uri "http://localhost:8080/api/venues/$venueId/slots?date=$(Get-Date -Format 'yyyy-MM-dd')" 
$availableSlotId = ""
foreach ($court in $slots.data) {
    foreach ($slot in $court.slots) {
        if ($slot.is_available -eq $true) {
            $availableSlotId = $slot.id
            break
        }
    }
    if ($availableSlotId) { break }
}

if (-not $availableSlotId) {
    Write-Host "❌ No slots"
    exit
}

# 4. Book
$bookResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings" -Method Post -Headers @{ "Authorization" = "Bearer $token" } -ContentType "application/json" -Body (ConvertTo-Json @{
    slot_id = $availableSlotId
    idempotency_key = "test-$((Get-Date).Ticks)"
})
$orderId = $bookResponse.data.order_id
Write-Host "✅ OrderID=$orderId"

# 5. MOCK WEDHOOK Midtrans! Let's ensure Whatsapp fires.
$webhookBody = @{
    order_id = $orderId
    transaction_status = "settlement"
    status_code = "200"
    gross_amount = "250000"
    fraud_status = "accept"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/webhooks/midtrans" -Method Post -ContentType "application/json" -Body $webhookBody
Write-Host "✅ Selesai!"
