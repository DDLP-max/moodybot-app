#!/bin/bash
set -euo pipefail
npm install
npm run build
if [ ! -f runtime/prompt_runtime.py ]; then
  git clone --depth 1 https://github.com/DDLP-max/moodybot-telegram.git runtime || echo "MoodyBot runtime checkout failed"
fi
if command -v python3 >/dev/null 2>&1; then
  python3 -m pip install --disable-pip-version-check --target pydeps pillow \
    || python3 -m ensurepip --upgrade \
    && python3 -m pip install --disable-pip-version-check --target pydeps pillow \
    || true
  PYTHONPATH="${PWD}/pydeps${PYTHONPATH:+:$PYTHONPATH}" python3 -c "from PIL import Image" \
    || echo "Pillow was not installed during the build."
fi
