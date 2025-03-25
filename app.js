// 初始化全局状态
const STATE = {
    currentApiConfig: {
        apiKey: 'sk-4dd324d0fdf849ebbec7e4692fde112a', // 默认DeepSeek的APIKey
        apiUrl: 'https://api.deepseek.com/v1/chat/completions', // 默认DeepSeek API地址
        modelName: 'deepseek-chat' // 默认模型名称
    },
    worlds: [],
    characters: [],
    currentStory: {
        worldSetting: null,
        selectedCharacters: [],
        chapters: [],
        outlines: []
    }
};

// 本地存储管理
const StorageManager = {
    // 保存世界观
    saveWorld(world) {
        if (!STATE.worlds.some(w => w.name === world.name)) {
            STATE.worlds.push(world);
            localStorage.setItem('ai-story-worlds', JSON.stringify(STATE.worlds));
            this.renderWorlds();
        }
    },

    // 保存角色
    saveCharacter(character) {
        if (!STATE.characters.some(c => c.name === character.name)) {
            STATE.characters.push(character);
            localStorage.setItem('ai-story-characters', JSON.stringify(STATE.characters));
            this.renderCharacters();
        }
    },

    // 加载保存的数据
    loadSavedData() {
        const savedWorlds = localStorage.getItem('ai-story-worlds');
        const savedCharacters = localStorage.getItem('ai-story-characters');
        
        if (savedWorlds) STATE.worlds = JSON.parse(savedWorlds);
        if (savedCharacters) STATE.characters = JSON.parse(savedCharacters);
    },

    // 渲染世界观列表
    renderWorlds() {
        const worldsList = document.getElementById('worlds-list');
        worldsList.innerHTML = STATE.worlds.length ? 
            STATE.worlds.map(world => `
                <div class="project-item">
                    <span>${world.name}</span>
                    <div class="project-item-actions">
                        <button class="edit-world" data-name="${world.name}">编辑</button>
                        <button class="delete-world" data-name="${world.name}">删除</button>
                    </div>
                </div>
            `).join('') : 
            '<p>暂无世界观</p>';
    },

    // 渲染角色列表
    renderCharacters() {
        const charactersList = document.getElementById('characters-list');
        charactersList.innerHTML = STATE.characters.length ? 
            STATE.characters.map(character => `
                <div class="project-item">
                    <span>${character.name}</span>
                    <div class="project-item-actions">
                        <button class="edit-character" data-name="${character.name}">编辑</button>
                        <button class="delete-character" data-name="${character.name}">删除</button>
                    </div>
                </div>
            `).join('') : 
            '<p>暂无角色</p>';
    }
};

// UI 交互管理
const UIManager = {
    // 初始化模态框切换
    initModalToggle() {
        // 打开模态框的通用方法
        const openModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'block';
        };

        // 关闭模态框的通用方法
        const closeModal = (modal) => {
            modal.style.display = 'none';
        };

        // 侧边栏和功能按钮
        const buttons = [
            { id: 'start-creation', modal: 'start-creation-modal' },
            { id: 'new-project', modal: 'new-project-modal' },
            { id: 'view-projects', modal: 'view-projects-modal' },
            { id: 'api-config', modal: 'api-config-modal' }
        ];

        buttons.forEach(btn => {
            const button = document.getElementById(btn.id);
            const modal = document.getElementById(btn.modal);
            
            if (button && modal) {
                button.addEventListener('click', () => openModal(btn.modal));
            }
        });

        // 关闭按钮
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                closeModal(modal);
            });
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    },

    // 初始化标签切换
    initTabToggle() {
        const tabs = document.querySelectorAll('.tablinks');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabContainer = tab.closest('.modal-content');
                
                // 重置所有标签和内容区
                tabContainer.querySelectorAll('.tablinks').forEach(t => t.classList.remove('active'));
                tabContainer.querySelectorAll('.tabcontent').forEach(c => c.classList.remove('active'));
                
                // 激活当前标签和对应内容区
                tab.classList.add('active');
                const targetTab = tab.dataset.tab;
                tabContainer.querySelector(`#${targetTab}`).classList.add('active');
            });
        });
    },

    // 初始化表单提交处理
    initFormSubmit() {
        // 新建世界观表单
        const worldForm = document.getElementById('new-world-form');
        worldForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const worldName = document.getElementById('world-name').value;
            const worldDescription = document.getElementById('world-description').value;
            
            StorageManager.saveWorld({
                name: worldName,
                description: worldDescription
            });

            // 重置表单
            worldForm.reset();
        });

        // 新建角色表单
        const characterForm = document.getElementById('new-character-form');
        characterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const characterName = document.getElementById('character-name').value;
            const characterGender = document.getElementById('character-gender').value;
            const characterDescription = document.getElementById('character-description').value;
            
            StorageManager.saveCharacter({
                name: characterName,
                gender: characterGender,
                description: characterDescription
            });

            // 重置表单
            characterForm.reset();
        });
    },

    // 初始化侧边栏切换
    initSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const closeSidebar = document.getElementById('close-sidebar');

        sidebarToggle.addEventListener('click', () => {
            sidebar.style.left = sidebar.style.left === '0px' ? '-250px' : '0px';
        });

        closeSidebar.addEventListener('click', () => {
            sidebar.style.left = '-250px';
        });
    }
};

// 初始化应用
function initApp() {
    // 加载保存的数据
    StorageManager.loadSavedData();

    // 初始化渲染列表
    StorageManager.renderWorlds();
    StorageManager.renderCharacters();

    // 初始化UI交互
    UIManager.initModalToggle();
    UIManager.initTabToggle();
    UIManager.initFormSubmit();
    UIManager.initSidebarToggle();
}

// 页面加载时初始化应用
document.addEventListener('DOMContentLoaded', initApp);
