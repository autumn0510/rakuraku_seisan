FROM alpine

RUN apk add --no-cache \
      chromium \
      nodejs \
      fontconfig \
      font-noto-cjk \
      yarn \
      && fc-cache -fv

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN yarn add puppeteer@10.0.0

WORKDIR /app/
