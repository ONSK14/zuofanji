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
    prompt += `【世界观】\n${currentWorld.name}\n${currentWorld.description}\n\n`;
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
      <div class="item-title" onclick="toggleDetails('world-${i}')">${w.name}</div>
      <div id="world-${i}" class="details">${w.description}<br/>
        <button onclick="deleteWorld(${i})">删除</button>
      </div>
    `;
  });
  html += '<h3>角色</h3>';
  chars.forEach((c, i) => {
    html += `
      <div class="item-title" onclick="toggleDetails('char-${i}')">${c.name}</div>
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

// （后面生成章节、下载等功能与上次一致，可以接着保留）