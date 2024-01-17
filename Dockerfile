FROM node:21-alpine AS builder

COPY . /home/node/app

RUN chown -R node:node /home/node/app

USER node
WORKDIR /home/node/app

RUN test -f package-lock.json
RUN npm install
RUN node_modules/.bin/tsc


FROM node:21-alpine

COPY --chown=node:node --from=builder /home/node/app/node_modules /home/node/app/node_modules
COPY --chown=node:node --from=builder /home/node/app/dist /home/node/app/dist

WORKDIR /home/node/app

COPY --chown=root:root --chmod=0555 docker-healthcheck /docker-healthcheck

HEALTHCHECK \
  --interval=30s \
  --timeout=20s \
  --retries=3 \
  --start-period=40s \
  CMD /docker-healthcheck

STOPSIGNAL SIGINT

ENV NODE_OPTIONS="--enable-source-maps"

CMD ["node", "dist/index.js"]
