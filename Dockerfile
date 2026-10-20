FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build \
  && git clone --depth 1 https://github.com/DDLP-max/moodybot-telegram.git /app/runtime \
  && python3 -m pip install --break-system-packages --disable-pip-version-check --target /app/pydeps pillow \
  && PYTHONPATH=/app/pydeps python3 -c "from PIL import Image"

ENV NODE_ENV=production
ENV MOODYBOT_RUNTIME=/app/runtime
ENV PYTHONPATH=/app/pydeps
ENV PORT=10000

CMD ["npm", "start"]
