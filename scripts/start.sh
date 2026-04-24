#!/bin/sh
set -e

# Validate required env vars
if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

if [ -z "$DIRECT_URL" ]; then
  echo "[entrypoint] DIRECT_URL not set, falling back to DATABASE_URL"
  export DIRECT_URL="$DATABASE_URL"
fi

# Generate AUTH_SECRET if not set (required by NextAuth v5)
if [ -z "$AUTH_SECRET" ]; then
  echo "[entrypoint] AUTH_SECRET not set, generating a random secret"
  export AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
fi

# Default AUTH_TRUST_HOST for containerized deployments
if [ -z "$AUTH_TRUST_HOST" ]; then
  export AUTH_TRUST_HOST=true
fi

# Wait for the database to accept TCP connections before running db push
echo "[entrypoint] Waiting for database to be ready..."
until node -e "
const net = require('net');
const url = new URL(process.env.DATABASE_URL);
const port = parseInt(url.port || '5432', 10);
const host = url.hostname;
const s = net.createConnection(port, host);
s.setTimeout(3000);
s.on('connect', () => { s.destroy(); process.exit(0); });
s.on('error', () => { s.destroy(); process.exit(1); });
s.on('timeout', () => { s.destroy(); process.exit(1); });
" 2>/dev/null; do
  echo "[entrypoint] Database not ready, retrying in 2s..."
  sleep 2
done

echo "[entrypoint] Running prisma db push..."
node node_modules/prisma/build/index.js db push --skip-generate
echo "[entrypoint] Starting server..."
exec node server.js
