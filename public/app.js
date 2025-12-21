// 大香蕉 Pro 图像生成器 v2.0 - 前端脚本

document.addEventListener('DOMContentLoaded', () => {
  // 元素引用
  const navTabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.panel');
  const loading = document.getElementById('loading');
  const resultContainer = document.getElementById('result-container');
  const resultText = document.getElementById('result-text');
  const resultImages = document.getElementById('result-images');
  const closeResult = document.getElementById('close-result');
  const imageViewer = document.getElementById('image-viewer');
  const viewerImage = document.getElementById('viewer-image');
  const viewerDownload = document.getElementById('viewer-download');
  const viewerClose = document.getElementById('viewer-close');

  // 存储上传的文件
  const uploadedFiles = {
    gemini: [],
    openai: []
  };

  // 会话管理
  let currentSessionId = null;
  let templates = [];

  // 对话历史（用于显示）
  let chatHistory = [];

  // 存储最后一次请求参数（用于重新生成）
  let lastRequestParams = null;

  // 本地存储 key
  const STORAGE_KEYS = {
    provider: 'banana_provider',
    geminiApiKey: 'banana_gemini_api_key',
    geminiModel: 'banana_gemini_model',
    customUrl: 'banana_custom_url',
    customApiKey: 'banana_custom_api_key',
    customModel: 'banana_custom_model',
    aspectRatio: 'banana_aspect_ratio',
    imageSize: 'banana_image_size',
    outputType: 'banana_output_type',
    enableSearch: 'banana_enable_search',
    showThinking: 'banana_show_thinking',
    chatMode: 'banana_chat_mode'
  };

  // 当前设置
  let currentSettings = {
    provider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash-image',
    customUrl: '',
    customApiKey: '',
    customModel: 'dall-e-3',
    aspectRatio: '1:1',
    imageSize: '1K',
    outputType: 'TEXT,IMAGE',
    enableSearch: false,
    showThinking: false,
    chatMode: false
  };

  // 初始化 - 恢复保存的设置
  function initSettings() {
    // 从 localStorage 读取所有设置
    currentSettings.provider = localStorage.getItem(STORAGE_KEYS.provider) || 'gemini';
    currentSettings.geminiApiKey = localStorage.getItem(STORAGE_KEYS.geminiApiKey) || '';
    currentSettings.geminiModel = localStorage.getItem(STORAGE_KEYS.geminiModel) || 'gemini-2.5-flash-image';
    currentSettings.customUrl = localStorage.getItem(STORAGE_KEYS.customUrl) || '';
    currentSettings.customApiKey = localStorage.getItem(STORAGE_KEYS.customApiKey) || '';
    currentSettings.customModel = localStorage.getItem(STORAGE_KEYS.customModel) || 'dall-e-3';
    currentSettings.aspectRatio = localStorage.getItem(STORAGE_KEYS.aspectRatio) || '1:1';
    currentSettings.imageSize = localStorage.getItem(STORAGE_KEYS.imageSize) || '1K';
    currentSettings.outputType = localStorage.getItem(STORAGE_KEYS.outputType) || 'TEXT,IMAGE';
    currentSettings.enableSearch = localStorage.getItem(STORAGE_KEYS.enableSearch) === 'true';
    currentSettings.showThinking = localStorage.getItem(STORAGE_KEYS.showThinking) === 'true';
    currentSettings.chatMode = localStorage.getItem(STORAGE_KEYS.chatMode) === 'true';

    // 应用到 UI 元素
    applySettingsToUI();
  }

  // 应用设置到 UI
  function applySettingsToUI() {
    // 图像生成面板
    const geminiApiKeyEl = document.getElementById('gemini-apikey');
    const geminiModelEl = document.getElementById('gemini-model');
    const geminiAspectEl = document.getElementById('gemini-aspect');
    const geminSizeEl = document.getElementById('gemini-size');
    const geminiSearchEl = document.getElementById('gemini-search');
    const geminiThinkingEl = document.getElementById('gemini-thinking');
    const geminiChatModeEl = document.getElementById('gemini-chat-mode');

    if (geminiApiKeyEl) geminiApiKeyEl.value = currentSettings.geminiApiKey;
    if (geminiModelEl) geminiModelEl.value = currentSettings.geminiModel;
    if (geminiAspectEl) geminiAspectEl.value = currentSettings.aspectRatio;
    if (geminSizeEl) geminSizeEl.value = currentSettings.imageSize;
    if (geminiSearchEl) geminiSearchEl.checked = currentSettings.enableSearch;
    if (geminiThinkingEl) geminiThinkingEl.checked = currentSettings.showThinking;
    if (geminiChatModeEl) geminiChatModeEl.checked = currentSettings.chatMode;

    // 自定义 API 配置
    const customUrlEl = document.getElementById('custom-url');
    const customApiKeyEl = document.getElementById('custom-apikey');
    const customModelEl = document.getElementById('custom-model');

    if (customUrlEl) customUrlEl.value = currentSettings.customUrl;
    if (customApiKeyEl) customApiKeyEl.value = currentSettings.customApiKey;
    if (customModelEl) customModelEl.value = currentSettings.customModel;

    // 设置面板
    const settingsGeminiApiKeyEl = document.getElementById('settings-gemini-apikey');
    const settingsGeminiModelEl = document.getElementById('settings-gemini-model');
    const settingsCustomUrlEl = document.getElementById('settings-custom-url');
    const settingsCustomApiKeyEl = document.getElementById('settings-custom-apikey');
    const settingsCustomModelEl = document.getElementById('settings-custom-model');
    const settingsAspectEl = document.getElementById('settings-aspect');
    const settingsSizeEl = document.getElementById('settings-size');
    const settingsOutputTypeEl = document.getElementById('settings-output-type');
    const settingsSearchEl = document.getElementById('settings-search');
    const settingsThinkingEl = document.getElementById('settings-thinking');
    const settingsChatModeEl = document.getElementById('settings-chat-mode');

    if (settingsGeminiApiKeyEl) settingsGeminiApiKeyEl.value = currentSettings.geminiApiKey;
    if (settingsGeminiModelEl) settingsGeminiModelEl.value = currentSettings.geminiModel;
    if (settingsCustomUrlEl) settingsCustomUrlEl.value = currentSettings.customUrl;
    if (settingsCustomApiKeyEl) settingsCustomApiKeyEl.value = currentSettings.customApiKey;
    if (settingsCustomModelEl) settingsCustomModelEl.value = currentSettings.customModel;
    if (settingsAspectEl) settingsAspectEl.value = currentSettings.aspectRatio;
    if (settingsSizeEl) settingsSizeEl.value = currentSettings.imageSize;
    if (settingsOutputTypeEl) settingsOutputTypeEl.value = currentSettings.outputType;
    if (settingsSearchEl) settingsSearchEl.checked = currentSettings.enableSearch;
    if (settingsThinkingEl) settingsThinkingEl.checked = currentSettings.showThinking;
    if (settingsChatModeEl) settingsChatModeEl.checked = currentSettings.chatMode;

    // 提供商切换
    const providerRadios = document.querySelectorAll('input[name="provider"]');
    const settingsProviderRadios = document.querySelectorAll('input[name="settings-provider"]');
    providerRadios.forEach(r => r.checked = r.value === currentSettings.provider);
    settingsProviderRadios.forEach(r => r.checked = r.value === currentSettings.provider);

    // 显示/隐藏对应配置区
    updateProviderUI(currentSettings.provider);
    updateSettingsProviderUI(currentSettings.provider);
  }

  // 更新提供商 UI (图像生成面板)
  function updateProviderUI(provider) {
    const geminiConfig = document.getElementById('gemini-config');
    const customConfig = document.getElementById('custom-config');
    if (geminiConfig) geminiConfig.style.display = provider === 'gemini' ? 'block' : 'none';
    if (customConfig) customConfig.style.display = provider === 'custom' ? 'block' : 'none';
  }

  // 更新提供商 UI (设置面板)
  function updateSettingsProviderUI(provider) {
    const geminiConfig = document.getElementById('settings-gemini-config');
    const customConfig = document.getElementById('settings-custom-config');
    if (geminiConfig) geminiConfig.style.display = provider === 'gemini' ? 'block' : 'none';
    if (customConfig) customConfig.style.display = provider === 'custom' ? 'block' : 'none';
  }

  // 保存设置到本地存储
  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.provider, currentSettings.provider);
    localStorage.setItem(STORAGE_KEYS.geminiApiKey, currentSettings.geminiApiKey);
    localStorage.setItem(STORAGE_KEYS.geminiModel, currentSettings.geminiModel);
    localStorage.setItem(STORAGE_KEYS.customUrl, currentSettings.customUrl);
    localStorage.setItem(STORAGE_KEYS.customApiKey, currentSettings.customApiKey);
    localStorage.setItem(STORAGE_KEYS.customModel, currentSettings.customModel);
    localStorage.setItem(STORAGE_KEYS.aspectRatio, currentSettings.aspectRatio);
    localStorage.setItem(STORAGE_KEYS.imageSize, currentSettings.imageSize);
    localStorage.setItem(STORAGE_KEYS.outputType, currentSettings.outputType);
    localStorage.setItem(STORAGE_KEYS.enableSearch, currentSettings.enableSearch);
    localStorage.setItem(STORAGE_KEYS.showThinking, currentSettings.showThinking);
    localStorage.setItem(STORAGE_KEYS.chatMode, currentSettings.chatMode);
  }

  // 标签切换
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      panels.forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${targetId}`).classList.add('active');

      // 如果切换到历史记录，加载历史
      if (targetId === 'history') {
        loadHistory();
      }
      // 如果切换到模板，加载模板
      if (targetId === 'templates') {
        loadTemplates();
      }
    });
  });

  // ==================== 提供商切换事件 ====================
  // 图像生成面板的提供商切换
  document.querySelectorAll('input[name="provider"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentSettings.provider = e.target.value;
      updateProviderUI(e.target.value);
      // 同步到设置面板
      document.querySelectorAll('input[name="settings-provider"]').forEach(r => {
        r.checked = r.value === e.target.value;
      });
      updateSettingsProviderUI(e.target.value);
      saveSettings();
    });
  });

  // 设置面板的提供商切换
  document.querySelectorAll('input[name="settings-provider"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentSettings.provider = e.target.value;
      updateSettingsProviderUI(e.target.value);
      // 同步到图像生成面板
      document.querySelectorAll('input[name="provider"]').forEach(r => {
        r.checked = r.value === e.target.value;
      });
      updateProviderUI(e.target.value);
    });
  });

  // 设置面板保存按钮
  const settingsSaveBtn = document.getElementById('settings-save');
  if (settingsSaveBtn) {
    settingsSaveBtn.addEventListener('click', () => {
      // 从设置面板读取所有值
      currentSettings.provider = document.querySelector('input[name="settings-provider"]:checked')?.value || 'gemini';
      currentSettings.geminiApiKey = document.getElementById('settings-gemini-apikey')?.value || '';
      currentSettings.geminiModel = document.getElementById('settings-gemini-model')?.value || 'gemini-2.5-flash-image';
      currentSettings.customUrl = document.getElementById('settings-custom-url')?.value || '';
      currentSettings.customApiKey = document.getElementById('settings-custom-apikey')?.value || '';
      currentSettings.customModel = document.getElementById('settings-custom-model')?.value || 'dall-e-3';
      currentSettings.aspectRatio = document.getElementById('settings-aspect')?.value || '1:1';
      currentSettings.imageSize = document.getElementById('settings-size')?.value || '1K';
      currentSettings.outputType = document.getElementById('settings-output-type')?.value || 'TEXT,IMAGE';
      currentSettings.enableSearch = document.getElementById('settings-search')?.checked || false;
      currentSettings.showThinking = document.getElementById('settings-thinking')?.checked || false;
      currentSettings.chatMode = document.getElementById('settings-chat-mode')?.checked || false;

      // 保存并同步
      saveSettings();
      applySettingsToUI();
      // 更新 AI 对话面板的配置状态
      if (typeof updateChatConfigStatus === 'function') updateChatConfigStatus();

      // 显示保存成功提示
      settingsSaveBtn.textContent = '✅ 已保存';
      setTimeout(() => {
        settingsSaveBtn.innerHTML = '<span class="btn-icon">💾</span>保存设置';
      }, 2000);
    });
  }

  // "前往配置"链接点击跳转到设置面板
  const gotoConfigLinks = document.querySelectorAll('#chat-goto-config, #chat-welcome-config');
  gotoConfigLinks.forEach(link => {
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        // 切换到设置面板
        navTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="settings"]').classList.add('active');
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById('panel-settings').classList.add('active');
      });
    }
  });

  // 高级选项切换
  const advancedToggle = document.getElementById('gemini-advanced-toggle');
  const advancedOptions = document.getElementById('gemini-advanced-options');

  advancedToggle?.addEventListener('click', () => {
    advancedToggle.classList.toggle('open');
    advancedOptions?.classList.toggle('open');
  });

  // 多轮对话模式切换
  const chatModeCheckbox = document.getElementById('gemini-chat-mode');
  const sessionStatus = document.getElementById('gemini-session-status');

  chatModeCheckbox?.addEventListener('change', () => {
    if (!chatModeCheckbox.checked) {
      clearSession();
    }
  });

  // 清除会话
  document.getElementById('gemini-clear-session')?.addEventListener('click', clearSession);

  async function clearSession() {
    if (currentSessionId) {
      try {
        await fetch(`/api/gemini/session/${currentSessionId}`, { method: 'DELETE' });
      } catch (e) { }
    }
    currentSessionId = null;
    sessionStatus.style.display = 'none';
    // 清空对话历史
    chatHistory = [];
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) chatContainer.style.display = 'none';
  }

  // 上传区域处理
  function setupUploadArea(prefix) {
    const uploadArea = document.getElementById(`${prefix}-upload`);
    const fileInput = document.getElementById(`${prefix}-images`);
    const preview = document.getElementById(`${prefix}-preview`);

    // 空值检查，防止元素不存在时脚本崩溃
    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--accent)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      handleFiles(e.dataTransfer.files, prefix);
    });

    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files, prefix);
    });
  }

  function handleFiles(files, prefix) {
    const preview = document.getElementById(`${prefix}-preview`);
    const uploadArea = document.getElementById(`${prefix}-upload`);

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      uploadedFiles[prefix].push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
          <img src="${e.target.result}" alt="${file.name}">
          <button class="preview-remove" data-index="${uploadedFiles[prefix].length - 1}">&times;</button>
        `;
        preview.appendChild(div);
        uploadArea.classList.add('has-files');
      };
      reader.readAsDataURL(file);
    }
  }

  // 删除预览图片
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('preview-remove')) {
      const index = parseInt(e.target.dataset.index);
      const item = e.target.closest('.preview-item');
      const prefix = item.closest('.upload-area').id.replace('-upload', '');

      uploadedFiles[prefix].splice(index, 1);
      item.remove();

      const preview = document.getElementById(`${prefix}-preview`);
      const uploadArea = document.getElementById(`${prefix}-upload`);
      if (preview.children.length === 0) {
        uploadArea.classList.remove('has-files');
      }

      // 更新索引
      preview.querySelectorAll('.preview-remove').forEach((btn, i) => {
        btn.dataset.index = i;
      });
    }
  });

  setupUploadArea('gemini');
  setupUploadArea('openai');

  // Gemini 生成核心函数
  async function generateGemini(isRegenerate = false) {
    const apiKey = document.getElementById('gemini-apikey').value.trim();
    const model = document.getElementById('gemini-model').value;
    const aspectRatio = document.getElementById('gemini-aspect').value;
    const imageSize = document.getElementById('gemini-size').value;
    const prompt = document.getElementById('gemini-prompt').value.trim();
    const enableSearch = document.getElementById('gemini-search').checked;
    const showThinking = document.getElementById('gemini-thinking').checked;
    const chatMode = document.getElementById('gemini-chat-mode').checked;

    if (!apiKey) {
      alert('请输入 Gemini API Key');
      return;
    }
    if (!prompt) {
      alert('请输入提示词');
      return;
    }

    saveSettings();
    showLoading();

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', model);
      formData.append('apiKey', apiKey);
      formData.append('aspectRatio', aspectRatio);
      formData.append('imageSize', imageSize);
      formData.append('responseModalities', JSON.stringify(['TEXT', 'IMAGE']));
      formData.append('enableGoogleSearch', enableSearch.toString());
      formData.append('showThinking', showThinking.toString());

      // 重新生成时不传 sessionId，让服务器生成新的结果
      if (chatMode && currentSessionId && !isRegenerate) {
        formData.append('sessionId', currentSessionId);
      }

      for (const file of uploadedFiles.gemini) {
        formData.append('images', file);
      }

      // 保存请求参数���于重新生成
      lastRequestParams = {
        type: 'gemini',
        prompt,
        model,
        apiKey,
        aspectRatio,
        imageSize,
        enableSearch,
        showThinking,
        chatMode,
        files: [...uploadedFiles.gemini]
      };

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      // 更新会话ID
      if (chatMode && data.sessionId) {
        currentSessionId = data.sessionId;
        sessionStatus.style.display = 'flex';

        // 添加到对话历史
        chatHistory.push({
          role: 'user',
          content: prompt,
          images: uploadedFiles.gemini.length
        });
        chatHistory.push({
          role: 'assistant',
          content: data.text,
          images: data.images,
          thinking: data.thinking
        });
        updateChatDisplay();
      }

      showResult(data);
    } catch (error) {
      alert('生成失败: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  // Gemini 生成按钮事件
  document.getElementById('gemini-generate')?.addEventListener('click', () => generateGemini(false));

  // OpenAI 自定义 API 生成
  document.getElementById('openai-generate')?.addEventListener('click', async () => {
    const apiUrl = document.getElementById('openai-url').value.trim();
    const apiKey = document.getElementById('openai-apikey').value.trim();
    const model = document.getElementById('openai-model').value.trim();
    const size = document.getElementById('openai-size').value;
    const quality = document.getElementById('openai-quality').value;
    const style = document.getElementById('openai-style').value;
    const n = document.getElementById('openai-n').value;
    const prompt = document.getElementById('openai-prompt').value.trim();

    if (!apiUrl) {
      alert('请输入 API 地址');
      return;
    }
    if (!apiKey) {
      alert('请输入 API Key');
      return;
    }
    if (!prompt) {
      alert('请输入提示词');
      return;
    }

    saveSettings();
    showLoading();

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('apiUrl', apiUrl);
      formData.append('apiKey', apiKey);
      formData.append('model', model);
      formData.append('size', size);
      formData.append('quality', quality);
      formData.append('style', style);
      formData.append('n', n);

      for (const file of uploadedFiles.openai) {
        formData.append('images', file);
      }

      const response = await fetch('/api/openai/generate', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      showResult(data);
    } catch (error) {
      alert('生成失败: ' + error.message);
    } finally {
      hideLoading();
    }
  });

  // 显示结果
  function showResult(data) {
    // 处理思考过程
    const thinkingSection = document.getElementById('thinking-section');
    const thinkingContent = document.getElementById('thinking-content');

    if (data.thinking && data.thinking.length > 0) {
      thinkingSection.style.display = 'block';
      thinkingContent.innerHTML = '';

      for (const item of data.thinking) {
        if (item.type === 'text') {
          const div = document.createElement('div');
          div.className = 'thinking-text';
          div.textContent = item.content;
          thinkingContent.appendChild(div);
        } else if (item.type === 'image') {
          const img = document.createElement('img');
          img.className = 'thinking-image';
          img.src = `data:${item.mimeType || 'image/png'};base64,${item.content}`;
          thinkingContent.appendChild(img);
        }
      }
    } else {
      thinkingSection.style.display = 'none';
    }

    // 处理接地信息
    const groundingSection = document.getElementById('grounding-section');
    const groundingContent = document.getElementById('grounding-content');

    if (data.groundingMetadata && data.groundingMetadata.groundingChunks) {
      groundingSection.style.display = 'block';
      groundingContent.innerHTML = '';

      for (const chunk of data.groundingMetadata.groundingChunks) {
        if (chunk.web) {
          const a = document.createElement('a');
          a.href = chunk.web.uri;
          a.target = '_blank';
          a.textContent = chunk.web.title || chunk.web.uri;
          groundingContent.appendChild(a);
        }
      }
    } else {
      groundingSection.style.display = 'none';
    }

    // 显示文本结果
    resultText.textContent = data.text || '';
    resultImages.innerHTML = '';

    if (data.images && data.images.length > 0) {
      for (const img of data.images) {
        const div = document.createElement('div');
        div.className = 'result-image';

        const imgSrc = img.base64
          ? `data:${img.mimeType || 'image/png'};base64,${img.base64}`
          : (img.path || img.url);

        div.innerHTML = `<img src="${imgSrc}" alt="生成的图片">`;
        div.addEventListener('click', () => openViewer(imgSrc));
        resultImages.appendChild(div);
      }
    }

    resultContainer.classList.add('active');
  }

  // 思考过程切换 - 默认展开
  document.getElementById('thinking-toggle')?.addEventListener('click', () => {
    const content = document.getElementById('thinking-content');
    const toggle = document.getElementById('thinking-toggle');
    content.classList.toggle('open');
    toggle.textContent = content.classList.contains('open') ? '收起' : '展开';
  });

  // 关闭结果面板
  closeResult.addEventListener('click', () => {
    resultContainer.classList.remove('active');
  });

  // 图片查看器
  function openViewer(src) {
    viewerImage.src = src;
    viewerDownload.href = src;
    imageViewer.classList.add('active');
  }
  // 暴露到全局供对话面板使用
  window.openViewer = openViewer;

  viewerClose.addEventListener('click', () => {
    imageViewer.classList.remove('active');
  });

  imageViewer.addEventListener('click', (e) => {
    if (e.target === imageViewer) {
      imageViewer.classList.remove('active');
    }
  });

  // 加载/隐藏
  function showLoading() {
    loading.classList.add('active');
  }

  function hideLoading() {
    loading.classList.remove('active');
  }

  // 加载历史记录
  async function loadHistory() {
    const grid = document.getElementById('history-grid');
    grid.innerHTML = '<div class="history-empty">加载中...</div>';

    try {
      const response = await fetch('/api/history');
      const files = await response.json();

      if (files.length === 0) {
        grid.innerHTML = '<div class="history-empty">暂无历史记录</div>';
        return;
      }

      grid.innerHTML = '';
      for (const file of files) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
          <img src="${file.path}" alt="${file.filename}">
          <button class="delete-btn" data-filename="${file.filename}">&times;</button>
        `;
        div.querySelector('img').addEventListener('click', () => openViewer(file.path));
        grid.appendChild(div);
      }
    } catch (error) {
      grid.innerHTML = '<div class="history-empty">加载失败</div>';
    }
  }

  // 删除历史图片
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn') && e.target.closest('.history-item')) {
      const filename = e.target.dataset.filename;
      if (!confirm('确定删除这张图片吗？')) return;

      try {
        await fetch(`/api/history/${filename}`, { method: 'DELETE' });
        e.target.closest('.history-item').remove();

        const grid = document.getElementById('history-grid');
        if (grid.children.length === 0) {
          grid.innerHTML = '<div class="history-empty">暂无历史记录</div>';
        }
      } catch (error) {
        alert('删除失败');
      }
    }
  });

  // 加载模板
  async function loadTemplates() {
    const grid = document.getElementById('templates-grid');

    try {
      const response = await fetch('/api/templates');
      templates = await response.json();

      grid.innerHTML = '';
      for (const template of templates) {
        const div = document.createElement('div');
        div.className = 'template-card';
        div.dataset.template = template.name;
        div.innerHTML = `
          <div class="template-name">${template.name}</div>
          <span class="template-category">${template.category}</span>
          <div class="template-preview">${template.example}</div>
        `;
        div.addEventListener('click', () => openTemplateModal(template));
        grid.appendChild(div);
      }
    } catch (error) {
      grid.innerHTML = '<div class="history-empty">加载模板失败</div>';
    }
  }

  // 模板弹窗
  const templateModal = document.getElementById('template-modal');
  const templateModalBody = document.getElementById('template-modal-body');
  const templateModalTitle = document.getElementById('template-modal-title');
  let currentTemplate = null;

  // 字段名中英文对照表
  const FIELD_LABELS = {
    subject: '主体',
    environment: '环境',
    lighting: '光线',
    camera: '相机',
    style: '风格',
    color: '配色',
    line: '线条',
    type: '类型',
    text: '文字',
    font: '字体',
    scheme: '方案',
    product: '产品',
    background: '背景',
    position: '位置',
    character: '角色',
    scene: '场景',
    topic: '主题',
    elements: '元素'
  };

  function openTemplateModal(template) {
    currentTemplate = template;
    templateModalTitle.textContent = template.name;

    templateModalBody.innerHTML = '';
    for (const placeholder of template.placeholders) {
      const div = document.createElement('div');
      div.className = 'template-input';
      // 使用中文标签，优先使用 placeholderLabels，否则使用对照表
      const labelFromTemplate = template.placeholderLabels?.[placeholder];
      const chineseName = FIELD_LABELS[placeholder] || placeholder;
      // 显示格式: "中文名 (英文原名)" + 括号里的示例说明
      const displayLabel = labelFromTemplate || chineseName;
      const placeholderHint = labelFromTemplate ?
        labelFromTemplate.match(/（(.+)）/)?.[1] || '请输入...' :
        '请输入...';
      div.innerHTML = `
        <label>${displayLabel}</label>
        <input type="text" data-placeholder="${placeholder}" placeholder="${placeholderHint}">
      `;
      templateModalBody.appendChild(div);
    }

    templateModal.classList.add('active');
  }

  document.getElementById('template-modal-close').addEventListener('click', () => {
    templateModal.classList.remove('active');
  });

  document.getElementById('template-modal-cancel').addEventListener('click', () => {
    templateModal.classList.remove('active');
  });

  document.getElementById('template-modal-apply').addEventListener('click', () => {
    if (!currentTemplate) return;

    let result = currentTemplate.template;
    const inputs = templateModalBody.querySelectorAll('input');

    for (const input of inputs) {
      const placeholder = input.dataset.placeholder;
      const value = input.value.trim() || placeholder;
      result = result.replace(`{${placeholder}}`, value);
    }

    document.getElementById('gemini-prompt').value = result;
    templateModal.classList.remove('active');

    // 切换到 Gemini 面板
    navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById('panel-settings')?.classList.add('active');
  });

  // 使用模板按钮
  document.getElementById('gemini-use-template')?.addEventListener('click', () => {
    loadTemplates();
    navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="templates"]')?.classList.add('active');
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById('panel-templates')?.classList.add('active');
  });

  // 更新对话历史显示
  function updateChatDisplay() {
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatMode = document.getElementById('gemini-chat-mode')?.checked;

    if (!chatMode || chatHistory.length === 0) {
      chatContainer.style.display = 'none';
      return;
    }

    chatContainer.style.display = 'block';
    chatMessages.innerHTML = '';

    for (const msg of chatHistory) {
      const div = document.createElement('div');
      div.className = `chat-message chat-${msg.role}`;

      if (msg.role === 'user') {
        div.innerHTML = `
          <div class="chat-role">你</div>
          <div class="chat-content">${msg.content}</div>
          ${msg.images > 0 ? `<div class="chat-images-count">附带 ${msg.images} 张图片</div>` : ''}
        `;
      } else {
        let imagesHtml = '';
        if (msg.images && msg.images.length > 0) {
          imagesHtml = '<div class="chat-images">';
          for (const img of msg.images) {
            const src = img.base64
              ? `data:${img.mimeType || 'image/png'};base64,${img.base64}`
              : (img.path || img.url);
            imagesHtml += `<img src="${src}" class="chat-image-thumb">`;
          }
          imagesHtml += '</div>';
        }

        let thinkingHtml = '';
        if (msg.thinking && msg.thinking.length > 0) {
          thinkingHtml = '<div class="chat-thinking">💭 有思考过程</div>';
        }

        div.innerHTML = `
          <div class="chat-role">AI</div>
          ${thinkingHtml}
          <div class="chat-content">${msg.content || '（无文字回复）'}</div>
          ${imagesHtml}
        `;
      }

      chatMessages.appendChild(div);
    }

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 最小化对话历史
  document.getElementById('minimize-chat')?.addEventListener('click', () => {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.toggle('minimized');
  });

  // 重新生成按钮
  document.getElementById('regenerate-btn')?.addEventListener('click', () => {
    if (!lastRequestParams) {
      alert('没有可重新生成的请求');
      return;
    }

    if (lastRequestParams.type === 'gemini') {
      generateGemini(true);
    }
  });

  // 初始化
  initSettings();

  // ==================== AI Studio 风格对话面板逻辑 ====================
  const chatMessagesArea = document.getElementById('chat-messages-area');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send');
  const chatClearBtn = document.getElementById('chat-clear');
  const chatUploadBtn = document.getElementById('chat-upload-btn');
  const chatImageInput = document.getElementById('chat-image-input');
  const chatImagePreview = document.getElementById('chat-image-preview');

  let chatConversation = []; // 对话历史
  let chatSessionId = null;
  let chatUploadedImages = [];

  // 更新配置状态显示
  function updateChatConfigStatus() {
    const statusEl = document.getElementById('chat-current-model');

    if (statusEl) {
      let hasApiKey = false;
      let displayName = '未配置';

      if (currentSettings.provider === 'gemini') {
        hasApiKey = currentSettings.geminiApiKey?.length > 0;
        displayName = currentSettings.geminiModel || 'Gemini';
      } else if (currentSettings.provider === 'custom') {
        hasApiKey = currentSettings.customApiKey?.length > 0;
        displayName = currentSettings.customModel || '自定义 API';
      }

      if (hasApiKey) {
        statusEl.textContent = displayName;
        statusEl.style.color = 'var(--accent)';
      } else {
        statusEl.textContent = '未配置 API Key';
        statusEl.style.color = 'var(--error)';
      }
    }
  }

  // 监听 Gemini 面板配置变化
  document.getElementById('gemini-apikey')?.addEventListener('input', updateChatConfigStatus);
  document.getElementById('gemini-model')?.addEventListener('change', updateChatConfigStatus);

  // 初始化时更新状态
  setTimeout(updateChatConfigStatus, 100);

  // 跳转到配置页面
  document.getElementById('chat-goto-config')?.addEventListener('click', (e) => {
    e.preventDefault();
    navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById('panel-settings')?.classList.add('active');
  });

  document.getElementById('chat-welcome-config')?.addEventListener('click', (e) => {
    e.preventDefault();
    navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="settings"]')?.classList.add('active');
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById('panel-settings')?.classList.add('active');
  });

  // 图片上传
  chatUploadBtn?.addEventListener('click', () => chatImageInput?.click());
  chatImageInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1];
        chatUploadedImages.push({ base64, mimeType: file.type, name: file.name });
        updateChatImagePreview();
      };
      reader.readAsDataURL(file);
    }
  });

  function updateChatImagePreview() {
    if (!chatImagePreview) return;
    chatImagePreview.innerHTML = chatUploadedImages.map((img, i) => `
      <img src="data:${img.mimeType};base64,${img.base64}" title="${img.name}" onclick="chatUploadedImages.splice(${i},1);updateChatImagePreview()">
    `).join('');
    window.chatUploadedImages = chatUploadedImages;
    window.updateChatImagePreview = updateChatImagePreview;
  }

  // 发送消息事件 - 移到 sendChatMessage 函数定义之后

  // 自动调整输入框高度
  chatInput?.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  async function sendChatMessage() {
    const message = chatInput?.value.trim();
    if (!message && chatUploadedImages.length === 0) return;

    // 使用统一的 currentSettings 配置
    let apiKey = '';
    let model = '';

    if (currentSettings.provider === 'gemini') {
      apiKey = currentSettings.geminiApiKey;
      model = currentSettings.geminiModel || 'gemini-2.5-flash-image';
    } else if (currentSettings.provider === 'custom') {
      apiKey = currentSettings.customApiKey;
      model = currentSettings.customModel || 'dall-e-3';
    }

    if (!apiKey) {
      alert('请先在设置面板配置 API Key');
      // 跳转到设置页
      navTabs.forEach(t => t.classList.remove('active'));
      document.querySelector('[data-tab="settings"]')?.classList.add('active');
      panels.forEach(p => p.classList.remove('active'));
      document.getElementById('panel-settings')?.classList.add('active');
      return;
    }

    // 添加用户消息到界面
    addChatMessage('user', message, chatUploadedImages.length);

    // 清空输入
    if (chatInput) {
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }
    const imagesToSend = [...chatUploadedImages];
    chatUploadedImages = [];
    updateChatImagePreview();

    // 显示加载状态
    chatSendBtn.disabled = true;
    chatSendBtn.textContent = '生成中...';

    // 创建一个临时的 AI 消息占位符
    const aiMsgIndex = chatConversation.length;
    const streamingMsg = { text: '', images: [], thinking: [] };

    // 移除欢迎信息
    const welcome = chatMessagesArea?.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    // 创建流式消息元素
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg chat-msg-ai chat-msg-streaming';
    msgDiv.innerHTML = `
      <div class="chat-msg-avatar">✨</div>
      <div class="chat-msg-body">
        <div class="chat-msg-header">
          <span class="chat-msg-name">Model</span>
          <span class="chat-msg-status">正在生成...</span>
        </div>
        <div class="chat-msg-thoughts-container"></div>
        <div class="chat-msg-content"></div>
        <div class="chat-msg-images"></div>
      </div>
    `;
    chatMessagesArea?.appendChild(msgDiv);
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

    const contentEl = msgDiv.querySelector('.chat-msg-content');
    const imagesEl = msgDiv.querySelector('.chat-msg-images');
    const thoughtsContainer = msgDiv.querySelector('.chat-msg-thoughts-container');
    const statusEl = msgDiv.querySelector('.chat-msg-status');

    try {
      const formData = new FormData();
      formData.append('prompt', message);
      formData.append('model', model);
      formData.append('apiKey', apiKey);
      formData.append('provider', currentSettings.provider); // 添加 provider 参数
      if (currentSettings.provider === 'custom') {
        formData.append('customUrl', currentSettings.customUrl || ''); // 添加自定义 API URL
      }
      formData.append('aspectRatio', currentSettings.aspectRatio || '1:1');
      formData.append('imageSize', currentSettings.imageSize || '1K');
      formData.append('enableGoogleSearch', currentSettings.enableSearch ? 'true' : 'false');
      formData.append('showThinking', document.getElementById('chat-show-thinking')?.checked ? 'true' : 'false');
      if (chatSessionId) {
        formData.append('sessionId', chatSessionId);
      }

      // 添加图片
      for (const img of imagesToSend) {
        const blob = await fetch(`data:${img.mimeType};base64,${img.base64}`).then(r => r.blob());
        formData.append('images', blob, img.name || 'image.png');
      }

      // 使用流式 SSE 端点
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              handleStreamEvent(data, streamingMsg, contentEl, imagesEl, thoughtsContainer, statusEl);
              chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 保存到对话历史
      chatConversation.push({ role: 'ai', content: streamingMsg.text, images: streamingMsg.images, thinking: streamingMsg.thinking });

      // 移除流式状态，添加操作按钮
      finishStreamingMessage(msgDiv, statusEl, aiMsgIndex, contentEl, streamingMsg.text);

    } catch (error) {
      if (contentEl) contentEl.innerHTML = `<span style="color: var(--error)">❌ 错误: ${error.message}</span>`;
      chatConversation.push({ role: 'ai', content: `❌ 错误: ${error.message}`, images: null, thinking: null });
    } finally {
      chatSendBtn.disabled = false;
      chatSendBtn.textContent = '发送';
    }
  }

  // 绑定发送消息事件（在函数定义之后）
  chatSendBtn?.addEventListener('click', sendChatMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  function addChatMessage(role, content, images, thinking, msgIndex = null) {
    // 移除欢迎信息
    const welcome = chatMessagesArea?.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    // 如果没有提供索引，使用当前长度作为索引
    const index = msgIndex !== null ? msgIndex : chatConversation.length;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg chat-msg-${role}`;
    msgDiv.dataset.msgIndex = index;

    if (role === 'user') {
      msgDiv.innerHTML = `
        <div class="chat-msg-avatar">👤</div>
        <div class="chat-msg-body">
          <div class="chat-msg-header">
            <span class="chat-msg-name">User</span>
            <div class="chat-msg-actions">
              <button class="chat-msg-action-btn" onclick="window.deleteChatMsg(${index})" title="删除">🗑️</button>
            </div>
          </div>
          <div class="chat-msg-content">${escapeHtmlChat(content)}</div>
          ${images > 0 ? `<div style="color: var(--accent); font-size: 12px; margin-top: 4px;">📎 附带 ${images} 张图片</div>` : ''}
        </div>
      `;
    } else {
      let thinkingHtml = '';
      if (thinking && thinking.length > 0) {
        const thinkingContent = thinking.map(t => {
          if (t.type === 'text') return `<p>${escapeHtmlChat(t.content)}</p>`;
          if (t.type === 'image') return `<img src="data:${t.mimeType || 'image/png'};base64,${t.content}" style="max-width: 200px; margin: 8px 0;">`;
          return '';
        }).join('');

        thinkingHtml = `
          <div class="chat-msg-thoughts">
            <div class="chat-msg-thoughts-header" onclick="this.nextElementSibling.classList.toggle('open'); this.querySelector('.chat-msg-thoughts-toggle').textContent = this.nextElementSibling.classList.contains('open') ? '▲' : '▼'">
              <span>✦ Thoughts</span>
              <span>Expand to view model thoughts</span>
              <span class="chat-msg-thoughts-toggle">▼</span>
            </div>
            <div class="chat-msg-thoughts-content">${thinkingContent}</div>
          </div>
        `;
      }

      let imagesHtml = '';
      if (images && images.length > 0) {
        imagesHtml = '<div class="chat-msg-images">' + images.map(img => {
          const src = img.base64
            ? `data:${img.mimeType || 'image/png'};base64,${img.base64}`
            : (img.path || img.url);
          return `<img src="${src}" class="chat-msg-image" onclick="window.openViewer('${src}')">`;
        }).join('') + '</div>';
      }

      msgDiv.innerHTML = `
        <div class="chat-msg-avatar">✨</div>
        <div class="chat-msg-body">
          <div class="chat-msg-header">
            <span class="chat-msg-name">Model</span>
            <div class="chat-msg-actions">
              <button class="chat-msg-action-btn" onclick="window.regenerateChatMsg(${index})" title="重新生成">🔄</button>
              <button class="chat-msg-action-btn" onclick="window.deleteChatMsg(${index})" title="删除">🗑️</button>
            </div>
          </div>
          ${thinkingHtml}
          <div class="chat-msg-content">${renderMarkdown(content) || ''}</div>
          ${imagesHtml}
        </div>
      `;
    }

    chatMessagesArea?.appendChild(msgDiv);
    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

    // 保存到对话历史（只有新消息才保存）
    if (msgIndex === null) {
      chatConversation.push({ role, content, images, thinking });
    }
  }

  // 删除消息
  window.deleteChatMsg = function (index) {
    if (confirm('确定删除这条消息吗？')) {
      chatConversation.splice(index, 1);
      refreshChatDisplay();
    }
  };

  // 重新生成消息
  window.regenerateChatMsg = async function (index) {
    // 找到该 AI 消息之前的用户消息
    if (index > 0 && chatConversation[index]?.role === 'ai') {
      // 获取上一条用户消息
      const lastUserMsg = chatConversation[index - 1];
      if (!lastUserMsg || lastUserMsg.role !== 'user') return;

      // 删除该 AI 消息
      chatConversation.splice(index, 1);
      refreshChatDisplay();

      // 直接发送请求（不添加新用户消息）
      await regenerateAIResponse(lastUserMsg.content);
    }
  };

  // 直接发送 AI 请求（不添加用户消息）
  async function regenerateAIResponse(prompt) {
    const apiKey = document.getElementById('gemini-apikey')?.value;
    if (!apiKey) return;

    chatSendBtn.disabled = true;
    chatSendBtn.textContent = '生成中...';

    // 创建流式消息元素
    const aiMsgIndex = chatConversation.length;
    const streamingMsg = { text: '', images: [], thinking: [] };

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg chat-msg-ai chat-msg-streaming';
    msgDiv.innerHTML = `
      <div class="chat-msg-avatar">✨</div>
      <div class="chat-msg-body">
        <div class="chat-msg-header">
          <span class="chat-msg-name">Model</span>
          <span class="chat-msg-status">正在生成...</span>
        </div>
        <div class="chat-msg-thoughts-container"></div>
        <div class="chat-msg-content"></div>
        <div class="chat-msg-images"></div>
      </div>
    `;
    chatMessagesArea?.appendChild(msgDiv);

    const contentEl = msgDiv.querySelector('.chat-msg-content');
    const imagesEl = msgDiv.querySelector('.chat-msg-images');
    const thoughtsContainer = msgDiv.querySelector('.chat-msg-thoughts-container');
    const statusEl = msgDiv.querySelector('.chat-msg-status');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', document.getElementById('gemini-model')?.value || 'gemini-2.5-flash-image');
      formData.append('apiKey', apiKey);
      formData.append('aspectRatio', document.getElementById('gemini-aspect')?.value || '1:1');
      formData.append('imageSize', document.getElementById('gemini-size')?.value || '1K');
      formData.append('enableGoogleSearch', document.getElementById('gemini-search')?.checked ? 'true' : 'false');
      formData.append('showThinking', document.getElementById('chat-show-thinking')?.checked ? 'true' : 'false');
      if (chatSessionId) formData.append('sessionId', chatSessionId);

      const response = await fetch('/api/gemini/stream', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('请求失败');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              handleStreamEvent(data, streamingMsg, contentEl, imagesEl, thoughtsContainer, statusEl);
              chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
            } catch (e) { }
          }
        }
      }

      chatConversation.push({ role: 'ai', content: streamingMsg.text, images: streamingMsg.images, thinking: streamingMsg.thinking });
      finishStreamingMessage(msgDiv, statusEl, aiMsgIndex, contentEl, streamingMsg.text);

    } catch (error) {
      if (contentEl) contentEl.innerHTML = `<span style="color: var(--error)">❌ 错误: ${error.message}</span>`;
    } finally {
      chatSendBtn.disabled = false;
      chatSendBtn.textContent = '发送';
    }
  }

  // 处理流式事件
  function handleStreamEvent(data, streamingMsg, contentEl, imagesEl, thoughtsContainer, statusEl) {
    switch (data.type) {
      case 'status':
        if (statusEl) statusEl.textContent = data.message;
        break;
      case 'thinking':
        streamingMsg.thinking.push({ type: 'text', content: data.content });
        if (!thoughtsContainer.innerHTML) {
          thoughtsContainer.innerHTML = `
            <div class="chat-msg-thoughts">
              <div class="chat-msg-thoughts-header" onclick="this.nextElementSibling.classList.toggle('open'); this.querySelector('.chat-msg-thoughts-toggle').textContent = this.nextElementSibling.classList.contains('open') ? '▲' : '▼'">
                <span>✦ Thoughts</span>
                <span>Expand to view model thoughts</span>
                <span class="chat-msg-thoughts-toggle">▼</span>
              </div>
              <div class="chat-msg-thoughts-content open"></div>
            </div>
          `;
        }
        const thoughtsEl = thoughtsContainer.querySelector('.chat-msg-thoughts-content');
        // 一行行追加显示（带淡入动画）
        if (thoughtsEl) {
          const line = document.createElement('p');
          line.className = 'thought-line-animate';
          line.innerHTML = renderMarkdown(data.content);
          thoughtsEl.appendChild(line);
        }
        break;
      case 'text':
        streamingMsg.text += data.content;
        // 打字机效果
        typewriterEffect(contentEl, streamingMsg.text);
        break;
      case 'image':
        streamingMsg.images.push({ base64: data.base64, mimeType: data.mimeType });
        const src = `data:${data.mimeType || 'image/png'};base64,${data.base64}`;
        if (imagesEl) imagesEl.innerHTML += `<img src="${src}" class="chat-msg-image" onclick="window.openViewer('${src}')">`;
        break;
      case 'done':
        if (data.sessionId) chatSessionId = data.sessionId;
        break;
      case 'error':
        if (contentEl) contentEl.innerHTML = `<span style="color: var(--error)">❌ 错误: ${data.error}</span>`;
        break;
    }
  }

  // 打字机效果 - 使用字符队列逐字显示
  const typewriterElements = new Map(); // 每个元素独立追踪

  function typewriterEffect(el, fullText) {
    if (!el) {
      console.log('[打字机] 元素不存在');
      return;
    }

    console.log('[打字机] 收到文本长度:', fullText.length);

    // 获取或创建该元素的打字机状态
    let state = typewriterElements.get(el);
    if (!state) {
      state = { targetText: '', displayedLen: 0, timer: null };
      typewriterElements.set(el, state);
      console.log('[打字机] 创建新状态');
    }

    state.targetText = fullText;

    // 如果没有运行中的定时器，启动动画
    if (!state.timer) {
      console.log('[打字机] 启动动画');
      runTypewriter(el, state);
    }
  }

  function runTypewriter(el, state) {
    if (state.displayedLen < state.targetText.length) {
      state.displayedLen++;
      el.textContent = state.targetText.substring(0, state.displayedLen);
      state.timer = setTimeout(() => runTypewriter(el, state), 2); // 2ms每字，快速流畅
    } else {
      // 已追上，清除定时器但保留状态以便后续文本继续
      console.log('[打字机] 追上文本，暂停');
      state.timer = null;
    }
  }

  // 简单 Markdown 渲染
  function renderMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')  // **粗体**
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>') // *斜体* (排除**)
      .replace(/`([^`]+)`/g, '<code>$1</code>')            // `代码`
      .replace(/\n/g, '<br>');                              // 换行
  }

  // 在消息完成时应用 Markdown
  function finalizeMessageContent(contentEl, text) {
    if (contentEl && text) {
      contentEl.innerHTML = renderMarkdown(text);
    }
  }

  // 完成流式消息
  function finishStreamingMessage(msgDiv, statusEl, aiMsgIndex, contentEl, text) {
    msgDiv.classList.remove('chat-msg-streaming');
    if (statusEl) statusEl.remove();

    // 渲染 Markdown - 正文
    if (contentEl && text) {
      contentEl.innerHTML = renderMarkdown(text);
    }

    // 渲染 Markdown - 思维链
    const thoughtsEl = msgDiv.querySelector('.chat-msg-thoughts-content');
    if (thoughtsEl && thoughtsEl.textContent) {
      thoughtsEl.innerHTML = renderMarkdown(thoughtsEl.textContent);
    }

    const header = msgDiv.querySelector('.chat-msg-header');
    if (header) {
      header.innerHTML = `
        <span class="chat-msg-name">Model</span>
        <div class="chat-msg-actions">
          <button class="chat-msg-action-btn" onclick="window.regenerateChatMsg(${aiMsgIndex})" title="重新生成">🔄</button>
          <button class="chat-msg-action-btn" onclick="window.deleteChatMsg(${aiMsgIndex})" title="删除">🗑️</button>
        </div>
      `;
    }

    // 保存到 localStorage
    saveChatToStorage();
  }

  // 保存对话到 localStorage
  function saveChatToStorage() {
    try {
      localStorage.setItem('chat_conversation', JSON.stringify(chatConversation));
      localStorage.setItem('chat_sessionId', chatSessionId || '');
    } catch (e) {
      console.error('保存对话失败:', e);
    }
  }

  // 从 localStorage 加载对话
  function loadChatFromStorage() {
    try {
      const saved = localStorage.getItem('chat_conversation');
      const savedSession = localStorage.getItem('chat_sessionId');
      if (saved) {
        chatConversation = JSON.parse(saved);
        chatSessionId = savedSession || null;
        if (chatConversation.length > 0) {
          refreshChatDisplay();
        }
      }
    } catch (e) {
      console.error('加载对话失败:', e);
    }
  }

  // 页面加载时恢复对话
  loadChatFromStorage();

  // 刷新对话显示
  function refreshChatDisplay() {
    chatMessagesArea.innerHTML = '';
    if (chatConversation.length === 0) {
      chatMessagesArea.innerHTML = `
        <div class="chat-welcome">
          <div class="chat-welcome-icon">✨</div>
          <h2>欢迎使用 AI 对话</h2>
          <p>使用 Gemini API 面板的配置进行对话</p>
        </div>
      `;
      return;
    }
    chatConversation.forEach((msg, idx) => {
      addChatMessage(msg.role, msg.content, msg.images, msg.thinking, idx);
    });
  }

  function escapeHtmlChat(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 清空对话
  chatClearBtn?.addEventListener('click', () => {
    if (confirm('确定要清空对话吗？')) {
      chatConversation = [];
      chatSessionId = null;
      if (chatMessagesArea) {
        chatMessagesArea.innerHTML = `
          <div class="chat-welcome">
            <div class="chat-welcome-icon">✨</div>
            <h2>欢迎使用 AI 对话</h2>
            <p>像在 AI Studio 一样对话，支持图像生成和多轮对话</p>
          </div>
        `;
      }
    }
  });
});
