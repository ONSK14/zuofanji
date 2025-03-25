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
            localStorage.setItem('worlds', JSON.stringify(STATE.worlds));
        }
    },

    // 保存角色
    saveCharacter(character) {
        if (!STATE.characters.some(c => c.name === character.name)) {
            STATE.characters.push(character);
            localStorage.setItem('characters', JSON.stringify(STATE.characters));
        }
    },

    // 加载保存的数据
    loadSavedData() {
        const savedWorlds = localStorage.getItem('worlds');
        const savedCharacters = localStorage.getItem('characters');
        
        if (savedWorlds) STATE.worlds = JSON.parse(savedWorlds);
        if (savedCharacters) STATE.characters = JSON.parse(savedCharacters);
    }
};

// API调用管理
const AIService = {
    // 构建API请求的提示词
    buildPrompt(worldSetting, characters, userPrompt, chapterLength) {
        const characterPrompts = characters.map(char => 
            `角色: ${char.name}, 性别: ${char.gender}, 简介: ${char.description}`
        ).join('\n');

        return `世界观: ${worldSetting.description}

角色设定:
${characterPrompts}

创作要求:
- 生成长度: ${chapterLength}字
- 情节提示: ${userPrompt}
- 请创作一章故事，分段合理，关注角色互动和情节发展
- 同时生成本章50-500字的大纲，突出关键情节和重要对话`;
    },

    // 调用AI API生成故事
    async generateStory(prompt, apiConfig) {
        try {
            const response = await fetch(apiConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: apiConfig.modelName,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 8000
                })
            });

            const data = await response.json();
            const fullResponse = data.choices[0].message.content;

            // 按照指定格式分割内容
            const [outline, story] = fullResponse.split('---故事内容---');

            return {
                outline: outline.trim(),
                story: story.trim()
            };
        } catch (error) {
            console.error('AI生成故事失败:', error);
            throw error;
        }
    }
};

// UI 交互管理
const UIManager = {
    // 初始化侧边栏切换
    initSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const closeSidebar = document.getElementById('close-sidebar');

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    },

    // 初始化模态框
    initModalHandlers() {
        const modals = document.querySelectorAll('.modal');
        const closeButtons = document.querySelectorAll('.close');

        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                modal.style.display = 'none';
            });
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    },

    // 打开模态框的通用方法
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
    },

    // 初始化所有功能按钮
    initButtons() {
        // API配置按钮
        document.getElementById('api-config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const apiKey = document.getElementById('api-key').value;
            const apiUrl = document.getElementById('api-url').value;
            const modelName = document.getElementById('model-name').value;

            STATE.currentApiConfig = {
                apiKey: apiKey || STATE.currentApiConfig.apiKey,
                apiUrl: apiUrl || STATE.currentApiConfig.apiUrl,
                modelName: modelName || STATE.currentApiConfig.modelName
            };

            this.openModal('start-creation-modal');
        });

        // 侧边栏按钮
        document.getElementById('start-creation').addEventListener('click', () => {
            this.openModal('start-creation-modal');
        });

        document.getElementById('new-project').addEventListener('click', () => {
            this.openModal('new-project-modal');
        });

        document.getElementById('view-projects').addEventListener('click', () => {
            this.openModal('view-projects-modal');
        });

        document.getElementById('download-story').addEventListener('click', () => {
            this.openModal('download-story-modal');
        });

        document.getElementById('view-outline').addEventListener('click', () => {
            this.openModal('outline-modal');
        });
    }
};

// 初始化应用
function initApp() {
    // 加载保存的数据
    StorageManager.loadSavedData();

    // 初始化UI交互
    UIManager.initSidebarToggle();
    UIManager.initModalHandlers();
    UIManager.initButtons();
}

// 页面加载时初始化应用
document.addEventListener('DOMContentLoaded', initApp);
