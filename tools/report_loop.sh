#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
while true; do
  ./tools/make_report.sh
  echo "Esperando 40 minutos..."
  sleep 2400
done
