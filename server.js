const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// 文件上传配置
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// 确保输出目录存在
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 存储会话历史（用于多轮对话）
const chatSessions = new Map();

// 清理过期会话（1小时后过期）
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of chatSessions.entries()) {
    if (now - session.lastAccess > 3600000) {
      chatSessions.delete(id);
    }
  }
}, 60000);

// ==================== Gemini API 接口 ====================
app.post('/api/gemini/generate', upload.array('images', 14), async (req, res) => {
  try {
    const {
      prompt,
      model = 'gemini-2.5-flash-image',
      apiKey,
      aspectRatio = '1:1',
      imageSize = '1K',
      responseModalities = ['TEXT', 'IMAGE'],
      enableGoogleSearch = 'false',
      sessionId = null,
      showThinking = 'false'
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: '请提供 Gemini API Key' });
    }

    if (!prompt) {
      return res.status(400).json({ error: '请提供生成提示词' });
    }

    // 构建请求内容
    const parts = [{ text: prompt }];

    // 添加上传的图片
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64Data = file.buffer.toString('base64');
        parts.push({
          inline_data: {
            mime_type: file.mimetype,
            data: base64Data
          }
        });
      }
    }

    // 处理多轮对话
    let contents = [];
    if (sessionId && chatSessions.has(sessionId)) {
      const session = chatSessions.get(sessionId);
      contents = [...session.history];
      session.lastAccess = Date.now();
    }

    // 添加当前用户消息
    contents.push({
      role: 'user',
      parts
    });

    // 构建请求体
    const requestBody = {
      contents,
      generationConfig: {
        responseModalities: typeof responseModalities === 'string'
          ? JSON.parse(responseModalities)
          : responseModalities
      }
    };

    // 添加图像配置
    if (requestBody.generationConfig.responseModalities.includes('IMAGE')) {
      requestBody.generationConfig.imageConfig = {
        aspectRatio
      };
      // imageSize 仅 Gemini 3 Pro 支持
      if (model.includes('gemini-3')) {
        requestBody.generationConfig.imageConfig.imageSize = imageSize;
      }
    }

    // 添加 thinking 配置（仅 Gemini 2.5+ 和 Gemini 3 支持）
    if (showThinking === 'true') {
      requestBody.generationConfig.thinkingConfig = {
        includeThoughts: true
      };
      console.log('[Gemini] 已启用思考过程显示');
    }

    // 添加 Google 搜索接地工具
    if (enableGoogleSearch === 'true') {
      requestBody.tools = [{ google_search: {} }];
    }

    console.log(`[Gemini] 模型: ${model}, 提示: ${prompt.substring(0, 50)}...`);
    console.log(`[Gemini] 配置: 宽高比=${aspectRatio}, 分辨率=${imageSize}, 搜索=${enableGoogleSearch}`);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Gemini Error]', data);
      return res.status(response.status).json({
        error: data.error?.message || '生成失败',
        details: data
      });
    }

    // 处理响应
    const result = {
      text: '',
      images: [],
      thinking: [],
      groundingMetadata: null,
      sessionId: sessionId || `session_${Date.now()}`
    };

    if (data.candidates && data.candidates[0]?.content?.parts) {
      const modelParts = [];

      console.log('[Gemini] 收到', data.candidates[0].content.parts.length, '个parts');
      // 调试：打印完整响应
      console.log('[Gemini] 完整响应:', JSON.stringify(data.candidates[0], null, 2).substring(0, 2000));

      for (const part of data.candidates[0].content.parts) {
        // 兼容 Google API 返回的驼峰命名 (inlineData) 和下划线命名 (inline_data)
        const inlineData = part.inlineData || part.inline_data;
        const mimeType = inlineData?.mimeType || inlineData?.mime_type;

        // 调试：打印每个 part 的属性
        console.log('[Gemini] Part:', { thought: part.thought, hasText: !!part.text, hasImage: !!inlineData });

        // 处理思考内容（只有明确 thought===true 的才跳过）
        if (part.thought === true) {
          if (showThinking === 'true') {
            if (part.text) {
              result.thinking.push({ type: 'text', content: part.text });
            }
            if (inlineData) {
              result.thinking.push({
                type: 'image',
                content: inlineData.data,
                mimeType: mimeType
              });
            }
          }
          continue;
        }

        if (part.text) {
          result.text += part.text;
          modelParts.push({ text: part.text });
        }
        if (inlineData) {
          // 保存图片并返回路径
          const timestamp = Date.now();
          const filename = `gemini_${timestamp}_${result.images.length}.png`;
          const filepath = path.join(outputDir, filename);

          const imageBuffer = Buffer.from(inlineData.data, 'base64');
          fs.writeFileSync(filepath, imageBuffer);

          result.images.push({
            filename,
            path: `/output/${filename}`,
            base64: inlineData.data,
            mimeType: mimeType
          });

          // 保存到历史时包含思考签名
          modelParts.push({
            inline_data: {
              mime_type: mimeType,
              data: inlineData.data
            },
            thought_signature: part.thought_signature || part.thoughtSignature
          });
        }
      }

      // 更新会话历史
      const newSessionId = result.sessionId;
      const session = chatSessions.get(newSessionId) || { history: [], lastAccess: Date.now() };
      session.history = contents;
      session.history.push({
        role: 'model',
        parts: modelParts
      });
      session.lastAccess = Date.now();
      chatSessions.set(newSessionId, session);

      // 处理接地元数据
      if (data.candidates[0].groundingMetadata) {
        result.groundingMetadata = {
          searchEntryPoint: data.candidates[0].groundingMetadata.searchEntryPoint,
          groundingChunks: data.candidates[0].groundingMetadata.groundingChunks
        };
      }
    }

    console.log(`[Gemini] 生成完成: ${result.images.length} 张图片`);
    res.json(result);

  } catch (error) {
    console.error('[Gemini Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// 清除会话
app.delete('/api/gemini/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  chatSessions.delete(sessionId);
  res.json({ success: true });
});

// ==================== Gemini 流式生成 SSE 接口 ====================
app.post('/api/gemini/stream', upload.array('images', 14), async (req, res) => {
  try {
    const {
      prompt,
      model = 'gemini-2.5-flash-image',
      apiKey,
      aspectRatio = '1:1',
      imageSize = '1K',
      responseModalities = ['TEXT', 'IMAGE'],
      enableGoogleSearch = 'false',
      showThinking = 'false',
      sessionId = null
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: '请提供 Gemini API Key' });
    }

    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 发送开始事件
    res.write(`data: ${JSON.stringify({ type: 'start', message: '开始生成...' })}\n\n`);

    // 处理图片
    const imageParts = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        imageParts.push({
          inline_data: {
            mime_type: file.mimetype,
            data: file.buffer.toString('base64')
          }
        });
      }
    }

    // 构建内容
    const userContent = { role: 'user', parts: [] };
    if (imageParts.length > 0) userContent.parts.push(...imageParts);
    userContent.parts.push({ text: prompt });

    // 获取或创建会话
    let contents = [];
    const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (sessionId && chatSessions.has(sessionId)) {
      contents = [...chatSessions.get(sessionId).history];
    }
    contents.push(userContent);

    // 构建请求体
    const requestBody = {
      contents,
      generationConfig: {
        responseModalities: typeof responseModalities === 'string' ? JSON.parse(responseModalities) : responseModalities
      }
    };

    // 添加图像配置
    if (requestBody.generationConfig.responseModalities.includes('IMAGE')) {
      requestBody.generationConfig.imageConfig = { aspectRatio };
      if (model.includes('gemini-3')) {
        requestBody.generationConfig.imageConfig.imageSize = imageSize;
      }
    }

    // 添加 thinking 配置
    if (showThinking === 'true') {
      requestBody.generationConfig.thinkingConfig = { includeThoughts: true };
    }

    // 添加 Google 搜索
    if (enableGoogleSearch === 'true') {
      requestBody.tools = [{ google_search: {} }];
    }

    res.write(`data: ${JSON.stringify({ type: 'status', message: '正在请求 API...' })}\n\n`);

    // 使用流式 API（alt=sse）
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorText })}\n\n`);
      res.end();
      return;
    }

    // 处理流式响应
    const result = { text: '', images: [], thinking: [], sessionId: newSessionId };
    const reader = response.body;
    let buffer = '';

    reader.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.candidates && data.candidates[0]?.content?.parts) {
              for (const part of data.candidates[0].content.parts) {
                const inlineData = part.inlineData || part.inline_data;
                const mimeType = inlineData?.mimeType || inlineData?.mime_type;

                if (part.thought === true) {
                  if (showThinking === 'true' && part.text) {
                    result.thinking.push({ type: 'text', content: part.text });
                    res.write(`data: ${JSON.stringify({ type: 'thinking', content: part.text })}\n\n`);
                  }
                } else if (part.text) {
                  result.text += part.text;
                  res.write(`data: ${JSON.stringify({ type: 'text', content: part.text })}\n\n`);
                } else if (inlineData) {
                  result.images.push({ base64: inlineData.data, mimeType });
                  res.write(`data: ${JSON.stringify({ type: 'image', base64: inlineData.data, mimeType })}\n\n`);
                }
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });

    reader.on('end', () => {
      // 更新会话历史
      const session = chatSessions.get(newSessionId) || { history: [], lastAccess: Date.now() };
      session.history = contents;
      session.history.push({
        role: 'model',
        parts: [{ text: result.text }]
      });
      session.lastAccess = Date.now();
      chatSessions.set(newSessionId, session);

      res.write(`data: ${JSON.stringify({ type: 'done', sessionId: newSessionId, result })}\n\n`);
      res.end();
    });

    reader.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('[Gemini Stream Error]', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// ==================== 自定义 OpenAI 格式 API 接口 ====================
app.post('/api/openai/generate', upload.array('images', 10), async (req, res) => {
  try {
    const {
      prompt,
      apiUrl,
      apiKey,
      model = 'dall-e-3',
      size = '1024x1024',
      quality = 'standard',
      n = 1,
      style = 'vivid',
      responseFormat = 'b64_json'
    } = req.body;

    if (!apiUrl) {
      return res.status(400).json({ error: '请提供 API URL' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: '请提供 API Key' });
    }

    if (!prompt) {
      return res.status(400).json({ error: '请提供生成提示词' });
    }

    // 构建请求体 - 支持多种格式
    let requestBody;
    let endpoint = apiUrl;

    // 检查是否是图片编辑请求
    if (req.files && req.files.length > 0) {
      // 图片编辑模式 - 使用 chat/completions 格式（更通用）
      const messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt }
        ]
      }];

      // 添加图片
      for (const file of req.files) {
        const base64Data = file.buffer.toString('base64');
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.mimetype};base64,${base64Data}`
          }
        });
      }

      requestBody = {
        model,
        messages,
        max_tokens: 4096
      };

      // 如果URL不包含路径，添加默认路径
      if (!endpoint.includes('/v1/')) {
        endpoint = endpoint.replace(/\/$/, '') + '/v1/chat/completions';
      }
    } else {
      // 纯文本生成图片模式
      // 检测API类型 - 如果URL包含images/generations则使用DALL-E格式
      if (endpoint.includes('images/generations') || endpoint.includes('dall-e')) {
        requestBody = {
          model,
          prompt,
          size,
          quality,
          n: parseInt(n),
          style,
          response_format: responseFormat
        };
      } else {
        // 通用 chat/completions 格式
        requestBody = {
          model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 4096
        };

        if (!endpoint.includes('/v1/')) {
          endpoint = endpoint.replace(/\/$/, '') + '/v1/chat/completions';
        }
      }
    }

    console.log(`[OpenAI] 请求: ${endpoint}, 模型: ${model}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[OpenAI Error]', data);
      return res.status(response.status).json({
        error: data.error?.message || '生成失败',
        details: data
      });
    }

    // 处理响应 - 支持多种格式
    const result = {
      text: '',
      images: []
    };

    // DALL-E 格式响应
    if (data.data && Array.isArray(data.data)) {
      for (let i = 0; i < data.data.length; i++) {
        const item = data.data[i];
        if (item.b64_json) {
          const timestamp = Date.now();
          const filename = `openai_${timestamp}_${i}.png`;
          const filepath = path.join(outputDir, filename);

          const imageBuffer = Buffer.from(item.b64_json, 'base64');
          fs.writeFileSync(filepath, imageBuffer);

          result.images.push({
            filename,
            path: `/output/${filename}`,
            base64: item.b64_json,
            mimeType: 'image/png'
          });
        } else if (item.url) {
          result.images.push({
            url: item.url,
            mimeType: 'image/png'
          });
        }
        if (item.revised_prompt) {
          result.text += item.revised_prompt + '\n';
        }
      }
    }

    // Chat Completions 格式响应
    if (data.choices && Array.isArray(data.choices)) {
      for (const choice of data.choices) {
        if (choice.message?.content) {
          if (typeof choice.message.content === 'string') {
            result.text += choice.message.content;
          } else if (Array.isArray(choice.message.content)) {
            for (const part of choice.message.content) {
              if (part.type === 'text') {
                result.text += part.text;
              }
              if (part.type === 'image_url' || part.image) {
                const imageData = part.image || part.image_url;
                if (imageData.url?.startsWith('data:')) {
                  const base64Match = imageData.url.match(/base64,(.+)/);
                  if (base64Match) {
                    const timestamp = Date.now();
                    const filename = `openai_${timestamp}_${result.images.length}.png`;
                    const filepath = path.join(outputDir, filename);

                    const imageBuffer = Buffer.from(base64Match[1], 'base64');
                    fs.writeFileSync(filepath, imageBuffer);

                    result.images.push({
                      filename,
                      path: `/output/${filename}`,
                      base64: base64Match[1],
                      mimeType: 'image/png'
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log(`[OpenAI] 生成完成: ${result.images.length} 张图片`);
    res.json(result);

  } catch (error) {
    console.error('[OpenAI Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// 静态文件服务 - 输出目录
app.use('/output', express.static(outputDir));

// 获取历史图片列表
app.get('/api/history', (req, res) => {
  try {
    const files = fs.readdirSync(outputDir)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .map(filename => {
        const stats = fs.statSync(path.join(outputDir, filename));
        return {
          filename,
          path: `/output/${filename}`,
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除图片
app.delete('/api/history/:filename', (req, res) => {
  try {
    const filepath = path.join(outputDir, req.params.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 提示词模板
app.get('/api/templates', (req, res) => {
  const templates = [
    {
      name: '逼真照片',
      category: 'photo',
      template: '一张{subject}的专业摄影照片，{environment}环境，{lighting}光线，使用{camera}相机拍摄',
      placeholders: ['subject', 'environment', 'lighting', 'camera'],
      placeholderLabels: {
        subject: '主体（如：年轻女性、商务男士）',
        environment: '环境（如：户外花园、城市街道）',
        lighting: '光线（如：金色夕阳、柔和自然光）',
        camera: '相机（如：Canon EOS R5、Sony A7R4）'
      },
      example: '一张年轻女性的专业摄影照片，户外花园环境，金色夕阳光线，使用Canon EOS R5相机拍摄'
    },
    {
      name: '贴纸/图标',
      category: 'sticker',
      template: '一个{style}风格的{subject}贴纸，{color}配色，{line}线条，透明背景',
      placeholders: ['style', 'subject', 'color', 'line'],
      placeholderLabels: {
        style: '风格（如：可爱卡通、扁平化、3D立体）',
        subject: '主体（如：小猫、星星、爱心）',
        color: '配色（如：粉色和白色、彩虹色）',
        line: '线条（如：圆润、锐利、粗线条）'
      },
      example: '一个可爱卡通风格的小猫贴纸，粉色和白色配色，圆润线条，透明背景'
    },
    {
      name: '文字渲染',
      category: 'text',
      template: '一张{type}图片，上面写着"{text}"，{font}字体风格，{scheme}配色方案',
      placeholders: ['type', 'text', 'font', 'scheme'],
      placeholderLabels: {
        type: '图片类型（如：海报、横幅、标志）',
        text: '文字内容（如：Hello World、新年快乐）',
        font: '字体风格（如：霓虹灯、手写体、像素风）',
        scheme: '配色方案（如：紫色和蓝色、黑金色）'
      },
      example: '一张海报图片，上面写着"Hello World"，霓虹灯字体风格，紫色和蓝色配色方案'
    },
    {
      name: '产品展示',
      category: 'product',
      template: '专业产品摄影，{product}，{background}背景，{lighting}打光，高清细节',
      placeholders: ['product', 'background', 'lighting'],
      placeholderLabels: {
        product: '产品（如：高端香水、智能手表）',
        background: '背景（如：纯白、渐变、大理石纹）',
        lighting: '打光（如：柔和工作室、戏剧性侧光）'
      },
      example: '专业产品摄影，一瓶高端香水，纯白背景，柔和的工作室打光，高清细节'
    },
    {
      name: '极简艺术',
      category: 'minimal',
      template: '{subject}，{position}位置，大量留白，{color}纯色画布背景',
      placeholders: ['subject', 'position', 'color'],
      placeholderLabels: {
        subject: '主体（如：一朵红玫瑰、一只蝴蝶）',
        position: '位置（如：画面中央偏右、左下角）',
        color: '背景色（如：浅灰色、米白色、淡蓝色）'
      },
      example: '一朵红玫瑰，画面中央偏右位置，大量留白，浅灰色纯色画布背景'
    },
    {
      name: '漫画风格',
      category: 'comic',
      template: '{style}漫画风格，{character}角色，{scene}场景，分格漫画形式',
      placeholders: ['style', 'character', 'scene'],
      placeholderLabels: {
        style: '漫画风格（如：日式、美式、欧漫）',
        character: '角色（如：戴眼镜的男孩、长发少女）',
        scene: '场景（如：在图书馆看书、在咖啡厅）'
      },
      example: '日式漫画风格，一个戴眼镜的男孩角色，在图书馆看书场景，分格漫画形式'
    },
    {
      name: '信息图表',
      category: 'infographic',
      template: '关于{topic}的信息图表，{style}设计风格，包含{elements}元素，{color}配色',
      placeholders: ['topic', 'style', 'elements', 'color'],
      placeholderLabels: {
        topic: '主题（如：光合作用、太阳系、健康饮食）',
        style: '设计风格（如：扁平化、拟物化、简约）',
        elements: '元素（如：图标和数据可视化、流程图）',
        color: '配色（如：绿色和蓝色、暖色调）'
      },
      example: '关于光合作用的信息图表，扁平化设计风格，包含图标和数据可视化元素，绿色和蓝色配色'
    },
    {
      name: '角色一致性',
      category: 'character',
      template: '请根据提供的参考图片中的人物，生成一张{scene}场景的图片，保持人物外貌特征一致',
      placeholders: ['scene'],
      placeholderLabels: {
        scene: '场景（如：在海边度假、在办公室工作）'
      },
      example: '请根据提供的参考图片中的人物，生成一张在海边度假场景的图片，保持人物外貌特征一致'
    }
  ];
  res.json(templates);
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🍌 大香蕉 Pro 图像生成器 v2.0 - 已启动                     ║
╠════════════════════════════════════════════════════════════════╣
║  🌐 访问地址: http://localhost:${PORT}                          ║
║  📁 输出目录: ${outputDir}
╠════════════════════════════════════════════════════════════════╣
║  ✨ 新功能:                                                    ║
║  • 多轮对话支持                                                ║
║  • Google 搜索接地                                             ║
║  • 思考过程显示                                                ║
║  • 提示词模板                                                  ║
║  • 人物一致性 (最多14张参考图)                                 ║
╠════════════════════════════════════════════════════════════════╣
║  支持的 API:                                                   ║
║  • Gemini (gemini-2.5-flash-image, gemini-3-pro-image)         ║
║  • 自定义 OpenAI 格式 API                                      ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
