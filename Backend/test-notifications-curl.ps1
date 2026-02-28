# Test Phase 7 Notifications API với seed data
# Chạy: .\test-notifications-curl.ps1
# Yêu cầu: Backend đang chạy tại http://localhost:3000

$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:3000" }
$Pass = "User123456"

Write-Host "=== 1. Login Duy_Solo_Top (người gửi join request) ===" -ForegroundColor Cyan
$loginSender = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"duy.nguyen@example.com","password":"User123456"}'
$tokenSender = $loginSender.data.tokens.accessToken
if (-not $tokenSender) { $tokenSender = $loginSender.data.accessToken }
if (-not $tokenSender) { $tokenSender = $loginSender.accessToken }
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== 2. Login Linh_Xinh_Genshin (chủ zone - sẽ nhận notification) ===" -ForegroundColor Cyan
$loginLinh = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"linh.nguyen@example.com","password":"User123456"}'
$tokenLinh = $loginLinh.data.tokens.accessToken
if (-not $tokenLinh) { $tokenLinh = $loginLinh.data.accessToken }
if (-not $tokenLinh) { $tokenLinh = $loginLinh.accessToken }
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== 3. Lấy zone của Linh (GET /zones/my) ===" -ForegroundColor Cyan
$myZones = Invoke-RestMethod -Uri "$BaseUrl/zones/my" -Method Get -Headers @{Authorization="Bearer $tokenLinh"}
$zoneList = if ($myZones.data) { $myZones.data } else { $myZones }
$zoneId = $zoneList[0].id
Write-Host "Zone ID: $zoneId (owner: Linh)" -ForegroundColor Yellow

Write-Host "`n=== 4. Duy gửi join request (tạo notification cho Linh) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$BaseUrl/zones/$zoneId/join" -Method Post -Headers @{Authorization="Bearer $tokenSender"} -ContentType "application/json"
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "Response: $_" -ForegroundColor Yellow
}

Write-Host "`n=== 5. Linh: GET /notifications ===" -ForegroundColor Cyan
$notifResp = Invoke-RestMethod -Uri "$BaseUrl/notifications?page=1&limit=10" -Method Get -Headers @{Authorization="Bearer $tokenLinh"}
$notifResp | ConvertTo-Json -Depth 5
$notifId = $null
$items = if ($notifResp.data) { $notifResp.data.items } else { $notifResp.items }
if ($items) {
    $notifId = if ($items.Count -gt 0) { $items[0].id } else { $items.id }
    Write-Host "Notification ID: $notifId" -ForegroundColor Yellow
}

if ($notifId) {
    Write-Host "`n=== 6. Linh: PATCH /notifications/$notifId/read ===" -ForegroundColor Cyan
    Invoke-RestMethod -Uri "$BaseUrl/notifications/$notifId/read" -Method Patch -Headers @{Authorization="Bearer $tokenLinh"}
    Write-Host "OK" -ForegroundColor Green

    Write-Host "`n=== 7. Linh: PATCH /notifications/read-all ===" -ForegroundColor Cyan
    Invoke-RestMethod -Uri "$BaseUrl/notifications/read-all" -Method Patch -Headers @{Authorization="Bearer $tokenLinh"}
    Write-Host "OK" -ForegroundColor Green

    Write-Host "`n=== 8. Linh: DELETE /notifications/$notifId ===" -ForegroundColor Cyan
    Invoke-RestMethod -Uri "$BaseUrl/notifications/$notifId" -Method Delete -Headers @{Authorization="Bearer $tokenLinh"}
    Write-Host "OK" -ForegroundColor Green

    Write-Host "`n=== 9. Linh: GET /notifications (sau khi xóa) ===" -ForegroundColor Cyan
    Invoke-RestMethod -Uri "$BaseUrl/notifications?page=1&limit=10" -Method Get -Headers @{Authorization="Bearer $tokenLinh"} | ConvertTo-Json -Depth 5
} else {
    Write-Host "`n(Không có notification - thử read-all)" -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$BaseUrl/notifications/read-all" -Method Patch -Headers @{Authorization="Bearer $tokenLinh"} | ConvertTo-Json
}

Write-Host "`n=== DONE ===" -ForegroundColor Green
