#!/bin/sh
set -eu
set -o pipefail 2>/dev/null || true

CONFIG_PATH="/app/dist/runtime-config.js"

node /app/runtime-config/generate.js "$CONFIG_PATH"

exec "$@"
