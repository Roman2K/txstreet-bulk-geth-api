FROM node:21-alpine

COPY . /home/node/app

RUN chown -R node:node /home/node/app

USER node
WORKDIR /home/node/app

RUN test -f package-lock.json
RUN npm install

COPY --chown=root:root --chmod=0555 docker-healthcheck /docker-healthcheck

HEALTHCHECK \
  --interval=30s \
  --timeout=20s \
  --retries=3 \
  --start-period=40s \
  CMD /docker-healthcheck

STOPSIGNAL SIGINT

CMD ["node", "index.js"]
