FROM node:lts
COPY . /app
WORKDIR /app
RUN export DEBIAN_FRONTEND=noninteractive \
    && apt-get update \
    && apt-get dist-upgrade -y \
    && apt-get autoremove -y \
    && apt-get autoclean -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g npm@latest
RUN npm install
CMD ["node", "index.js"]