#!/bin/bash
set -euo pipefail
if curl --fail --silent http://localhost:3000/api/health >/dev/null; then exit 0; fi
if [ -n "${CODESPACE_NAME:-}" ]; then
  export APP_BASE_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
fi
nohup npm run dev >/tmp/workshop.log 2>&1 </dev/null &
