FROM node:18-alpine
WORKDIR /usr/src/app

# 仅复制依赖文件以利用缓存
COPY package*.json ./
RUN npm install --production

# 复制应用源代码
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
