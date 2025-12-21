# 使用 Node.js 官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建输出目录
RUN mkdir -p output

# 暴露端口
EXPOSE 8686

# 启动命令
CMD ["node", "server.js"]
