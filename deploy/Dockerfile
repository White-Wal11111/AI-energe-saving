FROM node:18-alpine

WORKDIR /app

# 复制后端依赖文件并安装
COPY backend/package*.json ./
RUN npm ci --production

# 复制后端代码
COPY backend/src ./src
COPY backend/public ./public

# 创建上传目录
RUN mkdir -p /app/public/uploads

# 复制前端构建产物
COPY frontend/dist/ ./public/app/

# 暴露端口
EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "src/server.js"]
