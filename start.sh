#!/bin/bash
set -e

echo "========================================="
echo "  PreventAI — Starting unified server"
echo "========================================="

# ── 1. Start Python FastAPI on internal port 8001 ─────────────────────────
echo "[1/2] Starting Python ML backend on port 8001..."
cd /opt/render/project/src/backend
uvicorn main:app --host 127.0.0.1 --port 8001 &
PYTHON_PID=$!

# Wait up to 60s for FastAPI to be ready
echo "      Waiting for ML backend..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8001/health > /dev/null 2>&1; then
    echo "      ML backend ready after ${i}x2 seconds"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "      WARNING: ML backend did not respond in 60s — continuing anyway"
  fi
  sleep 2
done

# ── 2. Start Node.js server on $PORT (Render sets this automatically) ──────
echo "[2/2] Starting Node.js server on port ${PORT:-3000}..."
cd /opt/render/project/src/frontend
NODE_ENV=production tsx server.ts
