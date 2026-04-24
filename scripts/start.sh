#!/bin/sh
set -e
echo "[entrypoint] Running prisma db push..."
node node_modules/.bin/prisma db push
echo "[entrypoint] Starting server..."
exec node server.js
