# 🍌 大香蕉 Pro 图像生成器 v1.0

一个高自由度的图像生成工具，支持 Google Gemini API 和自定义 OpenAI 格式 API。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 访问
http://localhost:3000
```

## ✨ 功能特性

### Gemini API 功能
- **模型支持**
  - `gemini-2.5-flash-image` - 快速生成
  - `gemini-3-pro-image-preview` - 高质量，支持4K
  - `gemini-2.0-flash-preview-image-generation`

- **图像配置**
  - 宽高比：1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 4:5, 5:4, 21:9
  - 分辨率：1K, 2K, 4K (仅Pro模型)

- **高级功能**
  - 多轮对话模式 - 可迭代修改生成的图像
  - Google 搜索接地 - 基于实时信息生成图像
  - 思考过程显示 - 查看 Gemini 3 Pro 的思考步骤和草图
  - 人物一致性 - 支持最多14张参考图片

### 💬 AI 对话功能 (新)
- **流式输出** - SSE 实时显示生成内容
- **打字机效果** - 逐字显示文字
- **Markdown 渲染** - 支持 **粗体**、*斜体*、`代码`
- **重新生成** - 🔄 按钮重新生成回复
- **删除消息** - 🗑️ 按钮删除单条消息
- **图片放大** - 点击图片全屏查看
- **对话持久化** - 刷新浏览器不丢失对话

### 📱 移动端适配
- 响应式布局，支持手机访问
- 针对 iPhone 16 Pro 等设备优化

### 自定义 OpenAI 格式 API
- 自定义 API URL 地址
- 支持 `/v1/images/generations` 和 `/v1/chat/completions` 格式

### 提示词模板
内置8种提示词模板：逼真照片、贴纸/图标、文字渲染、产品展示等

## 📦 VPS 部署

```bash
# 1. 克隆仓库
git clone https://github.com/你的用户名/banana-image-generator.git
cd banana-image-generator

# 2. 安装依赖
npm install

# 3. 使用 PM2 后台运行
npm install -g pm2
pm2 start server.js --name "banana-generator"
pm2 save && pm2 startup
```

### Nginx 反向代理配置
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## 📁 项目结构

```
├── server.js          # 后端服务 (Express)
├── package.json       # 项目配置
├── public/
│   ├── index.html     # 前端页面
│   ├── style.css      # 样式文件
│   └── app.js         # 前端脚本
└── output/            # 生成图片保存目录
```

## 🔑 获取 API Key

- Gemini API Key: https://aistudio.google.com/apikey

## 📚 技术栈

- 后端：Node.js + Express
- 前端：原生 HTML/CSS/JavaScript
- API：Google Gemini API, OpenAI 格式兼容 API
