# ─── Stage 1: Build the React frontend ───────────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# ─── Stage 2: Final image — Python + Node together ───────────────────────────
FROM python:3.11-slim

# Install Node.js 20 and curl (for health-check wait loop)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies ──────────────────────────────────────────────────────
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# ── Python backend source ────────────────────────────────────────────────────
COPY backend/ ./backend/

# ── Node dependencies (production only) ──────────────────────────────────────
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# ── Copy frontend source (server.ts, tsconfig, etc.) and built assets ────────
COPY frontend/ ./frontend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# ── Start script ──────────────────────────────────────────────────────────────
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 3000

CMD ["bash", "start.sh"]
