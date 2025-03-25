// ================= 初始化数据 =================
let currentWorld = null;
let currentCharacters = [];
let storyMemory = [];
let outlineMemory = [];
let storyChapters = [];
let systemPrompt = '';
let chatHistory = [];

// 默认 DeepSeek API 设置
const defaultAPIKey = 'sk-4dd324d0fdf849ebbec7e4692fde112a';
const defaultAPIUrl = 'https://api.deepseek.com/chat/completions';
const defaultModel = 'deepseek-chat';

// ================= 工具函数 =================

// 从输入框读取 API 信息，如果没填就用默认值
function getAPISettings() {
  const apiKey = document.getElementById('api-key').value || defaultAPIKey;
  const apiUrl = document.getElementById('api-url').value || defaultAPIUrl;
  const modelName = document.getElementById('model-name').value || defaultModel;
  return { apiKey, apiUrl, modelName };
}

// 更新系统 prompt（包含世界观和角色设定）
function updateSystemPrompt() {
  let prompt = '';
  if (currentWorld) {
    prompt += `【世界观】\n${currentWorld.description}\n\n`;
  }
  currentCharacters.forEach((char, i) => {
    prompt += `【角色${i + 1}】\n姓名：${char.name}\n性别：${char.gender}\n简介：${char.description}\n\n`;
  });
  systemPrompt = prompt;
}

// 限制记忆条数（正文保留2条，大纲保留50条）
function manageMemory() {
  if (storyMemory.length > 2) storyMemory.shift();
  if (outlineMemory.length > 50) outlineMemory.shift();
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
    <h3>新建设定</h3>
    <div>
      <h4>新建世界观</h4>
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
  let html = '<h3>已保存的世界观</h3>';
  worlds.forEach((w, i) => {
    html += `<div><strong>世界${i + 1}:</strong> ${w.description}
      <button onclick="deleteWorld(${i})">删除</button></div>`;
  });
  html += '<h3>已保存的角色</h3>';
  chars.forEach((c, i) => {
    html += `<div><strong>${c.name} (${c.gender})</strong>：${c.description}
      <button onclick="deleteCharacter(${i})">删除</button></div>`;
  });
  popup.innerHTML = html;
  popup.classList.remove('hidden');
}

// ================= 保存角色、世界观 =================

function saveNewWorld() {
  const desc = document.getElementById('new-world-desc').value;
  if (!desc) return;
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  worlds.push({ description: desc });
  localStorage.setItem('worlds', JSON.stringify(worlds));
  alert('已保存');
}

function saveNewCharacter() {
  const name = document.getElementById('char-name').value;
  const gender = document.getElementById('char-gender').value;
  const desc = document.getElementById('char-desc').value;
  if (!name || !desc) return;
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');
  chars.push({ name, gender, description: desc });
  localStorage.setItem('characters', JSON.stringify(chars));
  alert('已保存');
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

  let html = '<h3>选择世界观</h3><select id="world-select">';
  worlds.forEach((w, i) => {
    html += `<option value="${i}">${w.description.slice(0, 30)}</option>`;
  });
  html += '</select>';

  html += '<h3>选择角色（最多3个）</h3>';
  html += '<select multiple id="char-select" size="6">';
  chars.forEach((c, i) => {
    html += `<option value="${i}">${c.name}（${c.gender}）</option>`;
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
  const prompt = document.getElementById('user-prompt').value;
  const length = document.getElementById('length-selector').value;

  const { apiKey, apiUrl, modelName } = getAPISettings();
  const messages = [
    { role: 'system', content: systemPrompt },
    ...storyMemory,
    { role: 'user', content: `${prompt}（请生成一章故事，长度约${length}字，并在开头先提供不超过500字的大纲）` }
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: messages,
      temperature: 0.9,
    })
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '生成失败';

  // 分离大纲和正文
  const [outline, ...contentParts] = reply.split('\n\n');
  const content = contentParts.join('\n\n');

  outlineMemory.push(outline);
  storyMemory.push({ role: 'assistant', content });
  storyChapters.push({ outline, content });

  manageMemory();

  const storyDiv = document.getElementById('story-output');
  const chapterNum = storyChapters.length;
  storyDiv.innerHTML += `<div><h3>第${chapterNum}章</h3><p>${content.replace(/\n/g, '<br/>')}</p></div>`;
  document.getElementById('user-prompt').value = '';
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

// ================= 清除故事 =================

function clearStory() {
  if (!confirm('确定要清除当前故事吗？')) return;
  storyMemory = [];
  outlineMemory = [];
  storyChapters = [];
  document.getElementById('story-output').innerHTML = '';
  alert('已清除');
}

// ================= 下载故事 =================

function downloadStory() {
  const withOutline = confirm('是否包含大纲？确定为包含，取消为不包含。');
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