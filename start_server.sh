#!/bin/sh
# 1. 기존 서버 및 관련 프로세스 종료
PORT=10296
echo "포트 $PORT 및 관련 프로세스를 정리합니다..."

# PID 파일이 있으면 해당 프로세스 종료
if [ -f server.pid ]; then
    PID=$(cat server.pid)
    echo "PID 파일의 프로세스($PID)를 종료합니다..."
    kill -9 $PID 2>/dev/null
    rm server.pid
fi

# 포트를 사용 중인 프로세스 강제 종료
LSOF_PID=$(lsof -t -i:$PORT)
if [ ! -z "$LSOF_PID" ]; then
    echo "포트 $PORT 를 점유 중인 프로세스($LSOF_PID)를 종료합니다..."
    kill -9 $LSOF_PID 2>/dev/null
fi

# 남은 next 관련 프로세스 정리
pkill -f "next-server" 2>/dev/null

echo "정리가 완료되었습니다. 잠시 대기합니다..."
sleep 2

# 2. 새 서버 시작 (더 견고한 백그라운드 실행 방식)
echo "서버를 시작합니다..."
# node로 직접 실행하여 npm 오버헤드와 시그널 전달 문제 방지
# --webpack 옵션으로 안정성 확보
# </dev/null 로 입력 차단, nohup으로 세션 분리
nohup ./node_modules/.bin/next dev --webpack -p $PORT < /dev/null > server.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > server.pid

# 서버가 시작될 시간을 충분히 줍니다.
echo "서버 시작 중 (10초 대기)..."
sleep 10

echo ""
echo "========================================="
if ps -p $NEW_PID > /dev/null; then
    echo "서버가 성공적으로 백그라운드에서 실행되었습니다."
    echo "PID: $NEW_PID"
    echo "접속 URL: http://narnia-lab.duckdns.org:$PORT"
else
    echo "서버 실행에 실패했습니다. server.log를 확인해주세요."
    cat server.log
fi
echo "========================================="
