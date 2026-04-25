#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Iniciando Backend (NestJS) na porta 3001..."
kill $(lsof -ti:3001) 2>/dev/null
cd "$ROOT_DIR/backend" && npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "Iniciando Frontend (Next.js) na porta 3000..."
kill $(lsof -ti:3000) 2>/dev/null
cd "$ROOT_DIR/frontend" && npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "Aguardando inicialização..."
sleep 10

BACKEND_OK=$(grep -c "successfully started" /tmp/backend.log 2>/dev/null)
FRONTEND_OK=$(grep -c "Ready in" /tmp/frontend.log 2>/dev/null)

echo ""
if [ "$BACKEND_OK" -gt 0 ]; then
  echo "Backend:  http://localhost:3001 (PID $BACKEND_PID)"
else
  echo "Backend:  ERRO ao iniciar (veja /tmp/backend.log)"
fi

if [ "$FRONTEND_OK" -gt 0 ]; then
  echo "Frontend: http://localhost:3000 (PID $FRONTEND_PID)"
else
  echo "Frontend: ERRO ao iniciar (veja /tmp/frontend.log)"
fi
