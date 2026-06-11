#!/usr/bin/env bash
set -u

cd "$(dirname "$0")"

PORT="${PORT:-10296}"
HOST="0.0.0.0"
PUBLIC_HOST="narnialab.duckdns.org"
CERT_DIR="/etc/letsencrypt/live/${PUBLIC_HOST}"
CERT_FILE="${CERT_DIR}/fullchain.pem"
KEY_FILE="${CERT_DIR}/privkey.pem"
PID_FILE="server.pid"
LOG_FILE="server.log"

echo "포트 ${PORT} 및 관련 프로세스를 정리합니다..."

if [ -f "$PID_FILE" ]; then
    OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "${OLD_PID}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "PID 파일의 프로세스(${OLD_PID})를 종료합니다..."
        kill "$OLD_PID" 2>/dev/null || true
        for _ in $(seq 1 20); do
            kill -0 "$OLD_PID" 2>/dev/null || break
            sleep 0.2
        done
        kill -9 "$OLD_PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
fi

LSOF_PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$LSOF_PIDS" ]; then
    echo "포트 ${PORT}를 점유 중인 프로세스를 종료합니다..."
    kill $LSOF_PIDS 2>/dev/null || true
    sleep 1
    kill -9 $LSOF_PIDS 2>/dev/null || true
fi

if [ ! -x ./node_modules/.bin/next ]; then
    echo "의존성이 없어 npm install을 실행합니다..."
    export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-$HOME/.npm-cache}"
    npm install --silent || {
        echo "의존성 설치에 실패했습니다."
        exit 1
    }
fi

if [ ! -f ./node_modules/.prisma/client/default.js ]; then
    echo "Prisma Client가 없어 생성합니다..."
    export NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-$HOME/.npm-cache}"
    npx --yes prisma generate || {
        echo "Prisma Client 생성에 실패했습니다."
        exit 1
    }
fi

if [ ! -r "$CERT_FILE" ] || [ ! -r "$KEY_FILE" ]; then
    echo "HTTPS 인증서 파일을 읽을 수 없습니다."
    exit 1
fi

echo "서버를 시작합니다..."
: > "$LOG_FILE"
nohup setsid ./node_modules/.bin/next dev --webpack \
    --hostname "$HOST" \
    --port "$PORT" \
    --experimental-https \
    --experimental-https-cert "$CERT_FILE" \
    --experimental-https-key "$KEY_FILE" \
    < /dev/null \
    >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

echo "서버 시작 확인 중..."
for _ in $(seq 1 30); do
    if curl -kfsS "https://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
        echo ""
        echo "========================================="
        echo "서버가 성공적으로 실행되었습니다."
        echo "PID: ${NEW_PID}"
        echo "접속 URL: https://${PUBLIC_HOST}:${PORT}"
        echo "========================================="
        exit 0
    fi

    if ! kill -0 "$NEW_PID" 2>/dev/null; then
        echo "서버 실행에 실패했습니다. ${LOG_FILE}를 확인해주세요."
        tail -n 120 "$LOG_FILE"
        exit 1
    fi

    sleep 1
done

echo "서버가 제한 시간 안에 응답하지 않았습니다. ${LOG_FILE}를 확인해주세요."
tail -n 120 "$LOG_FILE"
exit 1
