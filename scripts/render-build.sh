#!/bin/bash
set -euo pipefail
npm install
npm run build
if [ ! -f runtime/prompt_runtime.py ]; then
  git clone --depth 1 https://github.com/DDLP-max/moodybot-telegram.git runtime || echo "MoodyBot runtime checkout failed"
fi
if command -v python3 >/dev/null 2>&1; then
  python3 -m pip install --target pydeps pillow || true
fi
