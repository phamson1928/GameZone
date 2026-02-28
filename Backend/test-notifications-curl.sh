#!/bin/bash
# Test Phase 7 Notifications API với seed data
# Chạy: bash test-notifications-curl.sh (hoặc ./test-notifications-curl.sh)
# Yêu cầu: Backend đang chạy tại http://localhost:3000

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS="User123456"

echo "=== 1. Login SonGoku_VN (người gửi join request) ==="
LOGIN_SON=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"son.pham@example.com\",\"password\":\"$PASS\"}")
TOKEN_SON=$(echo "$LOGIN_SON" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN_SON" ]; then
  echo "❌ Login Son failed. Response: $LOGIN_SON"
  exit 1
fi
echo "✅ Son logged in"

echo ""
echo "=== 2. Login Linh_Xinh_Genshin (chủ zone - sẽ nhận notification) ==="
LOGIN_LINH=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"linh.nguyen@example.com\",\"password\":\"$PASS\"}")
TOKEN_LINH=$(echo "$LOGIN_LINH" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN_LINH" ]; then
  echo "❌ Login Linh failed. Response: $LOGIN_LINH"
  exit 1
fi
echo "✅ Linh logged in"

echo ""
echo "=== 3. Lấy zone của Linh (Genshin - Farm Thánh Di Vật) ==="
ZONES=$(curl -s "$BASE_URL/zones?page=1&limit=20")
ZONE_ID=$(echo "$ZONES" | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
if [ -z "$ZONE_ID" ]; then
  ZONE_ID=$(echo "$ZONES" | grep -o '"[a-f0-9-]\{36\}"' | head -1 | tr -d '"')
fi
echo "Zone ID: $ZONE_ID"

echo ""
echo "=== 4. Son gửi join request -> Linh nhận notification JOIN_REQUEST ==="
JOIN_RESULT=$(curl -s -X POST "$BASE_URL/zones/$ZONE_ID/join" \
  -H "Authorization: Bearer $TOKEN_SON" \
  -H "Content-Type: application/json")
echo "$JOIN_RESULT"

echo ""
echo "=== 5. Linh: GET /notifications ==="
NOTIF_RESP=$(curl -s "$BASE_URL/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN_LINH")
echo "$NOTIF_RESP" | head -c 500
echo ""
NOTIF_ID=$(echo "$NOTIF_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Notification ID: $NOTIF_ID"

if [ -n "$NOTIF_ID" ]; then
  echo ""
  echo "=== 6. Linh: PATCH /notifications/$NOTIF_ID/read ==="
  curl -s -X PATCH "$BASE_URL/notifications/$NOTIF_ID/read" \
    -H "Authorization: Bearer $TOKEN_LINH" \
    -H "Content-Type: application/json"
  echo ""

  echo ""
  echo "=== 7. Linh: PATCH /notifications/read-all ==="
  curl -s -X PATCH "$BASE_URL/notifications/read-all" \
    -H "Authorization: Bearer $TOKEN_LINH" \
    -H "Content-Type: application/json"
  echo ""

  echo ""
  echo "=== 8. Linh: DELETE /notifications/$NOTIF_ID ==="
  curl -s -X DELETE "$BASE_URL/notifications/$NOTIF_ID" \
    -H "Authorization: Bearer $TOKEN_LINH"
  echo ""

  echo ""
  echo "=== 9. Linh: GET /notifications (sau khi xóa) ==="
  curl -s "$BASE_URL/notifications?page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN_LINH"
  echo ""
else
  echo ""
  echo "=== 6-9. Bỏ qua (không có notification - zone có thể autoApprove) ==="
  echo "Thử PATCH read-all với user không có notification:"
  curl -s -X PATCH "$BASE_URL/notifications/read-all" \
    -H "Authorization: Bearer $TOKEN_LINH" \
    -H "Content-Type: application/json"
  echo ""
fi

echo ""
echo "=== DONE ==="
