FROM node:10-alpine
WORKDIR /opt/mre

COPY package*.json ./
RUN ["npm", "install", "--production"]

COPY built ./built/
CMD ["npm", "start"]