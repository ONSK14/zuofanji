// ================= 初始化数据 =================
let currentWorld = null;
let currentCharacters = [];
let storyMemory = [];
let outlineMemory = [];
let storyChapters = [];
let systemPrompt = '';

// 默认 DeepSeek API 设置
const defaultAPIKey = 'sk-4dd324d0fdf849ebbec7e4692fde112a';
const defaultAPIUrl = 'https://api.deepseek.com/chat/completions';
const defaultModel = 'deepseek-chat';

// ================= 工具函数 =================

function getAPISettings() {
  const apiKey = document.getElementById('api-key').value || defaultAPIKey;
  const apiUrl = document.getElementById('api-url').value || defaultAPIUrl;
  const modelName = document.getElementById('model-name').value || defaultModel;
  return { apiKey, apiUrl, modelName };
}

function updateSystemPrompt() {
  let prompt = '';
  if (currentWorld) {
    prompt += `【世界观】\n${currentWorld.name || '未命名世界观'}\n${currentWorld.description}\n\n`;
  }
  currentCharacters.forEach((char, i) => {
    prompt += `【角色${i + 1}】\n姓名：${char.name}\n性别：${char.gender}\n简介：${char.description}\n\n`;
  });
  systemPrompt = prompt;
}

function manageMemory() {
  if (storyMemory.length > 2) storyMemory.shift();
  if (outlineMemory.length > 50) outlineMemory.shift();
}

// ================= 弹窗控制 =================

function closePopup() {
  document.getElementById('popup').classList.add('hidden');
}

// ================= 菜单操作 =================

document.getElementById('menu-toggle').onclick = () => {
  document.getElementById('side-menu').classList.toggle('hidden');
};

function closeMenu() {
  document.getElementById('side-menu').classList.add('hidden');
}

// ================= 新建、查看 =================

function openNew() {
  const popup = document.getElementById('popup');
  popup.innerHTML = `
    <button id="popup-close" onclick="closePopup()">关闭</button>
    <h3>新建设定</h3>
    <div>
      <h4>新建世界观</h4>
      <input id="new-world-name" placeholder="世界观名称" />
      <textarea id="new-world-desc" placeholder="请输入世界观描述"></textarea>
      <button onclick="saveNewWorld()">保存世界观</button>
    </div>
    <div>
      <h4>新建角色</h4>
      <input id="char-name" placeholder="姓名" />
      <input id="char-gender" placeholder="性别（可自由填写）" />
      <textarea id="char-desc" placeholder="简介"></textarea>
      <button onclick="saveNewCharacter()">保存角色</button>
    </div>
  `;
  popup.classList.remove('hidden');
}

function openView() {
  const popup = document.getElementById('popup');
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');
  let html = `<button id="popup-close" onclick="closePopup()">关闭</button>`;
  html += '<h3>世界观</h3>';
  worlds.forEach((w, i) => {
    html += `
      <div class="item-title" onclick="toggleDetails('world-${i}')">${w.name || '未命名世界观'}</div>
      <div id="world-${i}" class="details">${w.description}<br/>
        <button onclick="deleteWorld(${i})">删除</button>
      </div>
    `;
  });
  html += '<h3>角色</h3>';
  chars.forEach((c, i) => {
    html += `
      <div class="item-title" onclick="toggleDetails('char-${i}')">${c.name || '未命名角色'}</div>
      <div id="char-${i}" class="details">
        性别：${c.gender}<br/>简介：${c.description}<br/>
        <button onclick="deleteCharacter(${i})">删除</button>
      </div>
    `;
  });
  popup.innerHTML = html;
  popup.classList.remove('hidden');
}

function toggleDetails(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// ================= 保存角色、世界观 =================

function saveNewWorld() {
  const name = document.getElementById('new-world-name').value.trim();
  const desc = document.getElementById('new-world-desc').value.trim();
  if (!name || !desc) {
    alert("请填写完整的世界观名称和描述");
    return;
  }
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  worlds.push({ name, description: desc });
  localStorage.setItem('worlds', JSON.stringify(worlds));
  alert('世界观已保存');
}

function saveNewCharacter() {
  const name = document.getElementById('char-name').value.trim();
  const gender = document.getElementById('char-gender').value.trim();
  const desc = document.getElementById('char-desc').value.trim();
  if (!name || !desc) {
    alert("请填写角色的姓名和简介");
    return;
  }
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');
  chars.push({ name, gender, description: desc });
  localStorage.setItem('characters', JSON.stringify(chars));
  alert('角色已保存');
}

// ================= 删除角色、世界观 =================

function deleteWorld(index) {
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  worlds.splice(index, 1);
  localStorage.setItem('worlds', JSON.stringify(worlds));
  openView();
}

function deleteCharacter(index) {
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');
  chars.splice(index, 1);
  localStorage.setItem('characters', JSON.stringify(chars));
  openView();
}

// ================= 开始创作 =================

function startStory() {
  const popup = document.getElementById('popup');
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');

  let html = `<button id="popup-close" onclick="closePopup()">关闭</button>`;
  html += '<h3>选择世界观</h3><select id="world-select">';
  worlds.forEach((w, i) => {
    html += `<option value="${i}">${w.name || '未命名世界观'}</option>`;
  });
  html += '</select>';

  html += '<h3>选择角色（最多3个）</h3>';
  html += '<select multiple id="char-select" size="6">';
  chars.forEach((c, i) => {
    html += `<option value="${i}">${c.name || '未命名角色'}</option>`;
  });
  html += '</select><br/><button onclick="confirmStart()">确定</button>';

  popup.innerHTML = html;
  popup.classList.remove('hidden');
}

function confirmStart() {
  const worldIndex = document.getElementById('world-select').value;
  const charIndices = Array.from(document.getElementById('char-select').selectedOptions).map(o => o.value);
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');

  currentWorld = worlds[worldIndex];
  currentCharacters = charIndices.map(i => chars[i]);

  updateSystemPrompt();
  storyMemory = [];
  outlineMemory = [];
  storyChapters = [];
  document.getElementById('story-output').innerHTML = '';
  document.getElementById('popup').classList.add('hidden');
  alert('准备好了，可以开始创作！');
}

// ================= 生成故事 =================

async function generateStory() {
  const prompt = document.getElementById('user-prompt').value.trim();
  if (!prompt) {
    alert("请输入情节提示后再生成故事！");
    return;
  }
  const length = document.getElementById('length-selector').value;
  const { apiKey, apiUrl, modelName } = getAPISettings();

  const messages = [
    { role: 'system', content: systemPrompt },
    ...storyMemory,
    { role: 'user', content: `${prompt}（请生成一章故事，长度约${length}字，并在开头先提供50-500字的大纲）` }
  ];

  // 请求接口生成
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.9
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '生成失败';

    // 分离大纲和正文
    const [outline, ...contentParts] = reply.split('\n\n');
    const content = contentParts.join('\n\n');

    // 存储内存 & 限制历史条数
    outlineMemory.push(outline);
    storyMemory.push({ role: 'assistant', content });
    storyChapters.push({ outline, content });
    manageMemory();

    // 展示章节
    const chapterNum = storyChapters.length;
    // 展示章节 + 加入重新生成按钮
const storyDiv = document.getElementById('story-output');
storyDiv.innerHTML += `
  <div id="chapter-${chapterNum}">
    <h3>第${chapterNum}章</h3>
    <p>${content.replace(/\n/g, '<br/>')}</p>
    <button onclick="regenerateChapter(${chapterNum - 1}, false)">按原提示重新生成</button>
    <button onclick="regenerateChapter(${chapterNum - 1}, true)">输入新提示重新生成</button>
  </div>`;

    // 清空输入框
    document.getElementById('user-prompt').value = '';

  } catch (err) {
    alert("生成失败，请检查 API 设置是否正确。");
    console.error(err);
  }
}

// ================= 查看大纲 =================

function toggleOutlines() {
  const outlineDiv = document.getElementById('outlines');
  if (outlineDiv.classList.contains('hidden')) {
    let html = '';
    outlineMemory.forEach((o, i) => {
      html += `<div><strong>第${i + 1}章大纲：</strong><p>${o}</p></div>`;
    });
    outlineDiv.innerHTML = html;
    outlineDiv.classList.remove('hidden');
  } else {
    outlineDiv.classList.add('hidden');
  }
}

// ================= 清除当前故事 =================

function clearStory() {
  if (!confirm('确定要清除当前故事内容吗？这将重置对话。')) return;
  storyMemory = [];
  outlineMemory = [];
  storyChapters = [];
  document.getElementById('story-output').innerHTML = '';
  document.getElementById('outlines').innerHTML = '';
  document.getElementById('outlines').classList.add('hidden');
  alert('当前故事已清除，准备开始新故事。');
}

// ================= 重新生成章节 =================

async function regenerateChapter(index, askNewPrompt = false) {
  const originalChapter = storyChapters[index];
  const oldPrompt = document.getElementById('user-prompt').value.trim() || '请延续上一章生成新一章故事';
  const userPrompt = askNewPrompt ? prompt('请输入新的提示：', oldPrompt) : oldPrompt;

  if (!userPrompt) return;

  // 只使用 system prompt，不保留旧上下文
  const { apiKey, apiUrl, modelName } = getAPISettings();
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${userPrompt}（请生成一章故事，长度约2000字，并在开头提供50-500字大纲）` }
  ];

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.9
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '生成失败';

    const [outline, ...contentParts] = reply.split('\n\n');
    const content = contentParts.join('\n\n');

    // 更新内存与显示
    storyChapters[index] = { outline, content };
    outlineMemory[index] = outline;
    storyMemory = [{ role: 'assistant', content }]; // 只保留当前一章内容作为记忆

    const chapterDiv = document.getElementById(`chapter-${index + 1}`);
    chapterDiv.innerHTML = `
      <h3>第${index + 1}章（已重写）</h3>
      <p>${content.replace(/\n/g, '<br/>')}</p>
      <button onclick="regenerateChapter(${index}, false)">按原提示重新生成</button>
      <button onclick="regenerateChapter(${index}, true)">输入新提示重新生成</button>
    `;

  } catch (err) {
    alert("重新生成失败，请检查 API 设置。");
    console.error(err);
  }
}

// ================= 下载故事 =================

function downloadStory() {
  if (storyChapters.length === 0) {
    alert("当前没有任何内容可下载！");
    return;
  }

  const withOutline = confirm("是否包含大纲？点击【确定】包含，点击【取消】不包含大纲。");

  let text = '';
  storyChapters.forEach((chapter, i) => {
    text += `第${i + 1}章\n\n`;
    if (withOutline) {
      text += `大纲：\n${chapter.outline}\n\n`;
    }
    text += `${chapter.content}\n\n`;
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  const filename = prompt('请输入要保存的文件名', '我的故事') || '故事';
  link.href = URL.createObjectURL(blob);
  link.download = filename + '.txt';
  link.click();
}