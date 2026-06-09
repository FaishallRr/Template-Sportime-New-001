$ErrorActionPreference = 'Stop'

# 1. Login as User
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"robby@email.com","password":"User@2026"}'
$token = $loginResponse.data.access_token
Write-Host "✅ Login Success. Token: ${token}"

# 2. Find a Court and Slot. Let's just create a raw booking.
# We need to hit /api/bookings
# We need an idempotency_key and a slot_id.
# Let's find an available slot ID.
$slots = Invoke-RestMethod -Uri "http://localhost:8080/api/venues/a1b2c3d4-e5f6-7890-abcd-ef1234567890/slots?date=$(Get-Date -Format 'yyyy-MM-dd')" -Method Get
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
    Write-Host "❌ No available slots to book!"
    exit
}
Write-Host "✅ Found available slot: $availableSlotId"

# 3. Create Booking
$bookResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/bookings" -Method Post -Headers @{ "Authorization" = "Bearer $token" } -ContentType "application/json" -Body (ConvertTo-Json @{
    slot_id = $availableSlotId
    idempotency_key = "test-$((Get-Date).Ticks)"
})
$bookingId = $bookResponse.data.booking_id
$orderId = $bookResponse.data.order_id
Write-Host "✅ Booking Created: ID=$bookingId, OrderID=$orderId"

# 4. Simulate Webhook Settlement from Midtrans!
$webhookBody = @{
    order_id = $orderId
    transaction_status = "settlement"
    status_code = "200"
    gross_amount = "250000"
    fraud_status = "accept"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/webhooks/midtrans" -Method Post -ContentType "application/json" -Body $webhookBody
Write-Host "✅ Webhook Simulasikan Settlement Dikirim!"
Write-Host "WhatsApp API seharus memfire request ke Fonnte sekarang. Cek log server!"
