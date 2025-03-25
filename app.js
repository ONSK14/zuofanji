// ================= 全局变量定义 =================
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

// 获取当前 API 设置（用户填写优先，否则使用默认）
function getAPISettings() {
  const apiKey = document.getElementById('api-key').value || defaultAPIKey;
  const apiUrl = document.getElementById('api-url').value || defaultAPIUrl;
  const modelName = document.getElementById('model-name').value || defaultModel;
  return { apiKey, apiUrl, modelName };
}

// 根据当前选中的世界观和角色生成系统 prompt
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

// 控制故事内存数量，防止 token 超限
function manageMemory() {
  if (storyMemory.length > 2) storyMemory.shift();
  if (outlineMemory.length > 50) outlineMemory.shift();
}

// ================= 菜单控制 =================

document.getElementById('menu-toggle').onclick = () => {
  document.getElementById('side-menu').classList.toggle('hidden');
};

function closeMenu() {
  document.getElementById('side-menu').classList.add('hidden');
}

// ================= 弹出框控制 =================

function closePopup() {
  document.getElementById('popup').classList.add('hidden');
}

// ================= 新建角色/世界观 =================

function openNew() {
  const popup = document.getElementById('popup');
  const popupContent = document.getElementById('popup-content');
  popupContent.innerHTML = `
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

// 保存世界观到 localStorage
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

// 保存角色到 localStorage
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

// ================= 查看与编辑角色/世界观 =================

function openView() {
  const popup = document.getElementById('popup');
  const popupContent = document.getElementById('popup-content');
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');

  let html = '<h3>世界观</h3>';
  worlds.forEach((w, i) => {
    html += `
      <div class="item-title" onclick="toggleDetails('world-${i}')">${w.name || '未命名世界观'}</div>
      <div id="world-${i}" class="details">
        ${w.description}<br/>
        <button class="edit-btn" onclick="editWorld(${i})">编辑</button>
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
        <button class="edit-btn" onclick="editCharacter(${i})">编辑</button>
        <button onclick="deleteCharacter(${i})">删除</button>
      </div>
    `;
  });

  popupContent.innerHTML = html;
  popup.classList.remove('hidden');
}

function toggleDetails(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

function editWorld(index) {
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  const w = worlds[index];
  const name = prompt("修改世界观名称：", w.name);
  const desc = prompt("修改世界观描述：", w.description);
  if (name && desc) {
    worlds[index] = { name, description: desc };
    localStorage.setItem('worlds', JSON.stringify(worlds));
    openView();
  }
}

function editCharacter(index) {
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');
  const c = chars[index];
  const name = prompt("修改角色姓名：", c.name);
  const gender = prompt("修改性别：", c.gender);
  const desc = prompt("修改简介：", c.description);
  if (name && desc) {
    chars[index] = { name, gender, description: desc };
    localStorage.setItem('characters', JSON.stringify(chars));
    openView();
  }
}

// ================= 删除角色或世界观 =================

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
  const popupContent = document.getElementById('popup-content');
  const worlds = JSON.parse(localStorage.getItem('worlds') || '[]');
  const chars = JSON.parse(localStorage.getItem('characters') || '[]');

  let html = '<h3>选择世界观</h3><select id="world-select">';
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

  popupContent.innerHTML = html;
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

// ================= 自动保存与加载当前故事 =================

function saveStoryToStorage() {
  const data = {
    storyMemory,
    outlineMemory,
    storyChapters,
    currentWorld,
    currentCharacters,
  };
  localStorage.setItem('currentStory', JSON.stringify(data));
}

function loadStoryFromStorage() {
  const data = JSON.parse(localStorage.getItem('currentStory') || 'null');
  if (!data) return;

  storyMemory = data.storyMemory || [];
  outlineMemory = data.outlineMemory || [];
  storyChapters = data.storyChapters || [];
  currentWorld = data.currentWorld || null;
  currentCharacters = data.currentCharacters || [];
  updateSystemPrompt();

  const storyDiv = document.getElementById('story-output');
  storyDiv.innerHTML = '';
  storyChapters.forEach((chapter, i) => {
    storyDiv.innerHTML += `
      <div id="chapter-${i + 1}">
        <h3>第${i + 1}章</h3>
        <p>${chapter.content.replace(/\n/g, '<br/>')}</p>
        <button onclick="regenerateChapter(${i}, false)">按原提示重新生成</button>
        <button onclick="regenerateChapter(${i}, true)">输入新提示重新生成</button>
      </div>`;
  });
}

// ================= 多故事保存与切换 =================

function saveCurrentStoryAsNew() {
  const name = prompt("请输入要保存的故事名称：");
  if (!name) return;
  const storyList = JSON.parse(localStorage.getItem('storyList') || '[]');
  const data = { storyMemory, outlineMemory, storyChapters, currentWorld, currentCharacters };
  storyList.push({ name, data });
  localStorage.setItem('storyList', JSON.stringify(storyList));
  alert("已保存为新故事！");
}

function openStoryList() {
  const popup = document.getElementById('popup');
  const popupContent = document.getElementById('popup-content');
  const storyList = JSON.parse(localStorage.getItem('storyList') || '[]');

  let html = '<h3>已保存的故事</h3>';
  if (storyList.length === 0) {
    html += '<p>暂无已保存的故事。</p>';
  } else {
    storyList.forEach((story, i) => {
      html += `
        <div class="item-title">${story.name}</div>
        <div class="details">
          <button onclick="loadStory(${i})">切换到这个故事</button>
          <button onclick="deleteStory(${i})">删除这个故事</button>
        </div>
      `;
    });
  }

  popupContent.innerHTML = html;
  popup.classList.remove('hidden');
}

function loadStory(index) {
  const storyList = JSON.parse(localStorage.getItem('storyList') || '[]');
  const story = storyList[index];
  if (!story) return;
  localStorage.setItem('currentStory', JSON.stringify(story.data));
  loadStoryFromStorage();
  closePopup();
  alert("已切换到选定的故事！");
}

function deleteStory(index) {
  const storyList = JSON.parse(localStorage.getItem('storyList') || '[]');
  if (!confirm("确定要删除这个故事吗？")) return;
  storyList.splice(index, 1);
  localStorage.setItem('storyList', JSON.stringify(storyList));
  openStoryList();
}

// ================= 页面加载时自动恢复故事 =================

window.onload = loadStoryFromStorage;