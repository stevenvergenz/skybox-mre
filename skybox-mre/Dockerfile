# compile image
FROM node:10-alpine AS compile-image
WORKDIR /opt/mre

COPY package*.json ./
RUN ["npm", "install", "--unsafe-perm"]

COPY src/*.ts ./src/
COPY types/*.ts ./types/
COPY tsconfig.json ./
RUN ["npm", "run", "build"]

# runtime image
FROM node:10-alpine AS runtime-image
WORKDIR /opt/mre

COPY package*.json ./
RUN ["npm", "install", "--production"]

COPY --from=compile-image /opt/mre/built ./built/
COPY public ./public/
COPY screenshots ./screenshots

EXPOSE 3901/tcp
CMD ["npm", "start"]