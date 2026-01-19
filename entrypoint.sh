#!/bin/sh
set -e

: "${VITE_API_URL:=http://localhost:8000/api}"


if [ -f /app/dist/env.js ]; then
  sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" /app/dist/env.js
fi

exec serve -s /app/dist -l 3000