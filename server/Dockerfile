FROM node:20-alpine

WORKDIR /app

# 先安装依赖，再复制源码，可以让云端构建缓存更稳定。
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
