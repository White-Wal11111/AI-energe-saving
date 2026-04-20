FROM node:18-alpine

WORKDIR /app

# 安装后端依赖
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production

# 复制后端代码
COPY backend/ ./backend/

# 创建上传目录
RUN mkdir -p /app/backend/public/uploads

# 安装前端依赖并构建
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npx vite build

# 将前端构建产物移到后端静态目录
RUN mkdir -p /app/backend/public/app && cp -r /app/frontend/dist/* /app/backend/public/app/

# 暴露端口
EXPOSE 4000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=4000

# 启动后端服务（同时提供前端静态文件）
WORKDIR /app/backend
CMD ["node", "src/server.js"]
