#!/bin/bash

# Démarre la version "build" de app, auth & backend pour
# pouvoir lancer les tests e2e localement.
# Nécessite que le build ait été effectué au préalable avec :
# `pnpm nx run-many -t build -p app auth backend`

LOG_DIR=$1
if [ -z "$LOG_DIR" ]; then
  LOG_DIR='/tmp/logs'
  echo "Log dir not specified, default to $LOG_DIR"
fi

mkdir -p "$LOG_DIR"

function startFrontApp() {
  cp -r "./apps/$1/public" "./apps/$1/.next/standalone/apps/$1/public"
  cp -r "./apps/$1/.next/static" "./apps/$1/.next/standalone/apps/$1/.next/static"
  echo "Starting $1"
  HOSTNAME=0.0.0.0 PORT="$2" COOKIE_DOMAIN=localhost node --env-file="./apps/$1/.env" "./apps/$1/.next/standalone/apps/$1/server.js" > "$LOG_DIR/$1.log" 2>&1 &
  PID=$!
  echo "$1 starting (PID: $PID)"
}

function startBackApp() {
  echo "Starting $1"
  HOSTNAME=0.0.0.0 PORT="$2" QUEUE_REDIS_HOST=localhost node --env-file="./apps/$1/.env" "./apps/$1/dist/main.js" > "$LOG_DIR/$1.log" 2>&1 &
  PID=$!
  echo "$1 starting (PID: $PID)"
}

function waitForURL() {
  echo "Waiting for $1"
  curl --head --request GET --silent --retry 5 --retry-connrefused --retry-delay 1 "$1" > /dev/null
}

startFrontApp app 3000
APP_PID=$PID

startFrontApp auth 3003
AUTH_PID=$PID

startBackApp backend 8080
BACK_PID=$PID

waitForURL http://localhost:3000
waitForURL http://localhost:3003
waitForURL http://localhost:8080/api-docs/v1

echo ""
echo "Ready!"
echo "Press CTRL+C to stop apps..."
read -r -s -d ''
kill "$APP_PID"
kill "$AUTH_PID"
kill "$BACK_PID"
