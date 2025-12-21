# 大香蕉 Pro 图像生成器 v2.0

一个高自由度的图像生成工具，支持 Google Gemini API 和自定义 OpenAI 格式 API。

## 快速开始

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 访问
http://localhost:3000
```

## 功能特性

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
  - Google 搜索接地 - 基于实时信息生成图像（天气、新闻等）
  - 思考过程显示 - 查看 Gemini 3 Pro 的思考步骤和草图
  - 人物一致性 - 支持最多14张参考图片（6张对象 + 5张人像）

### 自定义 OpenAI 格式 API
- 自定义 API URL 地址
- 自定义 API Key
- 支持 `/v1/images/generations` 和 `/v1/chat/completions` 格式
- 可调整：尺寸、质量、风格、生成数量

### 提示词模板
内置8种提示词模板：
- 逼真照片、贴纸/图标、文字渲染、产品展示
- 极简艺术、漫画风格、信息图表、角色一致性

### 界面功能
- 深色主题美观界面
- 图片拖拽上传
- 历史记录查看与管理
- 图片预览和下载
- 设置自动保存到浏览器
- **对话历史显示** - 多轮对话时显示完整对话历史
- **重新生成功能** - 一键重新生成当前图片

### 提示词模板参数说明

每个模板都有详细的中文参数说明：

| 模板 | 参数 |
|------|------|
| 逼真照片 | 主体、环境、光线、相机 |
| 贴纸/图标 | 风格、主体、配色、线条 |
| 文字渲染 | 图片类型、文字内容、字体风格、配色方案 |
| 产品展示 | 产品、背景、打光 |
| 极简艺术 | 主体、位置、背景色 |
| 漫画风格 | 漫画风格、角色、场景 |
| 信息图表 | 主题、设计风格、元素、配色 |
| 角色一致性 | 场景 |

## 项目结构

```
D:\生图\
├── server.js          # 后端服务 (Express)
├── package.json       # 项目配置
├── public/
│   ├── index.html     # 前端页面
│   ├── style.css      # 样式文件
│   └── app.js         # 前端脚本
├── output/            # 生成图片保存目录
└── README.md          # 项目说明
```

## API 端点

### Gemini 生成
```
POST /api/gemini/generate
```
参数：prompt, model, apiKey, aspectRatio, imageSize, enableGoogleSearch, showThinking, sessionId, images[]

### 自定义 OpenAI API
```
POST /api/openai/generate
```
参数：prompt, apiUrl, apiKey, model, size, quality, style, n, images[]

### 其他
- `GET /api/history` - 获取历史图片
- `DELETE /api/history/:filename` - 删除图片
- `DELETE /api/gemini/session/:sessionId` - 清除会话
- `GET /api/templates` - 获取提示词模板

## 获取 API Key

- Gemini API Key: https://aistudio.google.com/apikey

## 参考文档

- Gemini 图像生成: https://ai.google.dev/gemini-api/docs/image-generation
- Gemini 模型列表: https://ai.google.dev/gemini-api/docs/models

## 技术栈

- 后端：Node.js + Express
- 前端：原生 HTML/CSS/JavaScript
- API：Google Gemini API, OpenAI 格式兼容 API
