// 应用程序的全局状态管理
const APP_STATE = {
    currentStory: [],
    currentStoryOutlines: [],
    selectedWorld: null,
    selectedCharacters: [],
    apiSettings: {
        defaultApiKey: 'sk-xxx', // DeepSeek的默认API key
        defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
        defaultModel: 'deepseek-chat',
        userApiKey: null,
        userApiUrl: null,
        userModel: null
    },
    storageKeys: {
        worlds: 'story-generator-worlds',
        characters: 'story-generator-characters',
        apiSettings: 'story-generator-api-settings'
    }
};

// 本地存储管理工具
const StorageManager = {
    // 保存世界观
    saveWorld(world) {
        const worlds = this.getWorlds();
        // 如果已存在同名世界观，先删除
        const existingIndex = worlds.findIndex(w => w.name === world.name);
        if (existingIndex !== -1) {
            worlds.splice(existingIndex, 1);
        }
        worlds.push(world);
        localStorage.setItem(APP_STATE.storageKeys.worlds, JSON.stringify(worlds));
    },

    // 获取所有世界观
    getWorlds() {
        const worlds = localStorage.getItem(APP_STATE.storageKeys.worlds);
        return worlds ? JSON.parse(worlds) : [];
    },

    // 保存角色
    saveCharacter(character) {
        const characters = this.getCharacters();
        // 如果已存在同名角色，先删除
        const existingIndex = characters.findIndex(c => c.name === character.name);
        if (existingIndex !== -1) {
            characters.splice(existingIndex, 1);
        }
        characters.push(character);
        localStorage.setItem(APP_STATE.storageKeys.characters, JSON.stringify(characters));
    },

    // 获取所有角色
    getCharacters() {
        const characters = localStorage.getItem(APP_STATE.storageKeys.characters);
        return characters ? JSON.parse(characters) : [];
    },

    // 保存API设置
    saveApiSettings(settings) {
        localStorage.setItem(APP_STATE.storageKeys.apiSettings, JSON.stringify(settings));
    },

    // 获取API设置
    getApiSettings() {
        const settings = localStorage.getItem(APP_STATE.storageKeys.apiSettings);
        return settings ? JSON.parse(settings) : null;
    }
};

// API调用管理器
const ApiManager = {
    // 选择使用的API设置
    getApiConfig() {
        // 优先使用用户设置的API
        if (APP_STATE.apiSettings.userApiKey) {
            return {
                apiKey: APP_STATE.apiSettings.userApiKey,
                apiUrl: APP_STATE.apiSettings.userApiUrl || APP_STATE.apiSettings.defaultApiUrl,
                model: APP_STATE.apiSettings.userModel || APP_STATE.apiSettings.defaultModel
            };
        }
        // 使用默认DeepSeek API
        return {
            apiKey: APP_STATE.apiSettings.defaultApiKey,
            apiUrl: APP_STATE.apiSettings.defaultApiUrl,
            model: APP_STATE.apiSettings.defaultModel
        };
    },

    // 构建AI对话的系统提示词
    buildSystemPrompt(world, characters) {
        let prompt = `你是一个专业的小说创作助手。我将提供世界观和角色设定，请基于这些信息创作故事。\n\n世界观：${world.description}\n\n角色设定：\n`;
        
        characters.forEach((character, index) => {
            prompt += `角色${index + 1}：\n姓名：${character.name}\n性别：${character.gender}\n简介：${character.description}\n\n`;
        });

        return prompt;
    },

    // 生成故事的API调用
    async generateStory(systemPrompt, userPrompt, wordCount) {
        const apiConfig = this.getApiConfig();
        
        try {
            const response = await fetch(apiConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: apiConfig.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `请创作一章${wordCount}字左右的故事情节。${userPrompt}` }
                    ],
                    max_tokens: wordCount + 200 // 留出一些额外空间
                })
            });

            if (!response.ok) {
                throw new Error('API请求失败');
            }

            const data = await response.json();
            const storyContent = data.choices[0].message.content;

            // 生成大纲
            const outlineResponse = await fetch(apiConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: apiConfig.model,
                    messages: [
                        { role: 'system', content: '你是一个擅长提炼文章要点的助手' },
                        { role: 'user', content: `请为以下文章内容生成50-500字的大纲：\n${storyContent}` }
                    ]
                })
            });

            if (!outlineResponse.ok) {
                throw new Error('大纲生成失败');
            }

            const outlineData = await outlineResponse.json();
            const outline = outlineData.choices[0].message.content;

            return { content: storyContent, outline };
        } catch (error) {
            console.error('故事生成错误:', error);
            alert('故事生成失败，请检查API设置');
            return null;
        }
    }
};

// UI交互管理器
const UIManager = {
    // 初始化所有事件监听器
    init() {
        this.initSidebarToggle();
        this.initModalClosers();
        this.initNewCreationTabs();
        this.initWorldAndCharacterSaving();
        this.initViewCreation();
        this.initStartCreation();
        this.initStoryGeneration();
        this.initOutlineButton();
        this.initApiSettings();
        this.initDownloadStory();
    },

    // 侧边栏切换
    initSidebarToggle() {
        const settingsBtn = document.getElementById('settings-btn');
        const sidebar = document.getElementById('sidebar');
        const closeSidebarBtn = document.getElementById('close-sidebar');

        settingsBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });

        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    },

    // 模态框关闭逻辑
    initModalClosers() {
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    },

    // 新建页面的选项卡切换
    initNewCreationTabs() {
        const tabs = document.querySelectorAll('.new-creation-tabs .tab');
        const contents = document.querySelectorAll('.new-creation-modal .tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 重置所有选项卡状态
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // 激活当前选项卡
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
    },

    // 保存世界观和角色
    initWorldAndCharacterSaving() {
        // 保存世界观
        document.getElementById('save-world').addEventListener('click', () => {
            const worldName = document.getElementById('world-name').value.trim();
            const worldDescription = document.getElementById('world-description').value.trim();

            if (!worldName || !worldDescription) {
                alert('请填写世界观名称和描述');
                return;
            }

            StorageManager.saveWorld({ name: worldName, description: worldDescription });
            alert('世界观保存成功');
            document.getElementById('world-name').value = '';
            document.getElementById('world-description').value = '';
        });

        // 保存角色
        document.getElementById('save-character').addEventListener('click', () => {
            const characterName = document.getElementById('character-name').value.trim();
            const characterGender = document.getElementById('character-gender').value.trim();
            const characterDescription = document.getElementById('character-description').value.trim();

            if (!characterName || !characterGender || !characterDescription) {
                alert('请填写角色姓名、性别和简介');
                return;
            }

            StorageManager.saveCharacter({ 
                name: characterName, 
                gender: characterGender, 
                description: characterDescription 
            });
            alert('角色保存成功');
            document.getElementById('character-name').value = '';
            document.getElementById('character-gender').value = '';
            document.getElementById('character-description').value = '';
        });
    },

    // 查看已保存的世界观和角色
    initViewCreation() {
        document.getElementById('view-creation').addEventListener('click', () => {
            const savedWorldsList = document.getElementById('saved-worlds-list');
            const savedCharactersList = document.getElementById('saved-characters-list');
            const viewModal = document.getElementById('view-modal');

            // 显示世界观列表
            const worlds = StorageManager.getWorlds();
            savedWorldsList.innerHTML = worlds.map(world => `
                <div class="saved-item">
                    <strong>${world.name}</strong>
                    <p>${world.description}</p>
                    <div class="item-actions">
                        <button class="edit-world" data-name="${world.name}">编辑</button>
                        <button class="delete-world" data-name="${world.name}">删除</button>
                    </div>
                </div>
            `).join('');

            // 显示角色列表
            const characters = StorageManager.getCharacters();
            savedCharactersList.innerHTML = characters.map(character => `
                <div class="saved-item">
                    <strong>${character.name}</strong>
                    <p>性别：${character.gender}</p>
                    <p>${character.description}</p>
                    <div class="item-actions">
                        <button class="edit-character" data-name="${character.name}">编辑</button>
                        <button class="delete-character" data-name="${character.name}">删除</button>
                    </div>
                </div>
            `).join('');

            viewModal.style.display = 'block';
        });
    },

    // 开始创作
    initStartCreation() {
        const startCreationBtn = document.getElementById('start-creation');
        const startCreationModal = document.getElementById('start-creation-modal');
        const worldSelect = document.getElementById('world-select');
        const characterSelects = ['character1-select', 'character2-select', 'character3-select'];

        // 打开开始创作模态框
        startCreationBtn.addEventListener('click', () => {
            // 填充世界观下拉选项
            const worlds = StorageManager.getWorlds();
            worldSelect.innerHTML = worlds.map(world => 
                `<option value="${world.name}">${world.name}</option>`
            ).join('');

            // 填充角色下拉选项
            const characters = StorageManager.getCharacters();
            characterSelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                select.innerHTML = `<option value="">不选择</option>` + 
                    characters.map(character => 
                        `<option value="${character.name}">${character.name}</option>`
                    ).join('');
            });

            startCreationModal.style.display = 'block';
        });

        // 确认创作
        document.getElementById('confirm-creation').addEventListener('click', () => {
            const selectedWorld = worldSelect.value;
            const selectedCharacters = characterSelects
                .map(selectId => document.getElementById(selectId).value)
                .filter(name => name);

            if (!selectedWorld) {
                alert('请选择世界观');
                return;
            }

            if (selectedCharacters.length === 0) {
                alert('请至少选择一个角色');
                return;
            }

            // 保存选择
            APP_STATE.selectedWorld = StorageManager.getWorlds().find(w => w.name === selectedWorld);
            APP_STATE.selectedCharacters = selectedCharacters.map(name => 
                StorageManager.getCharacters().find(c => c.name === name)
            );

            startCreationModal.style.display = 'none';
        });
    },

    // 故事生成
    initStoryGeneration() {
        const generateBtn = document.getElementById('generate-story');
        const regenerateBtn = document.getElementById('regenerate-story');
        const storyOutput = document.getElementById('story-output');

        generateBtn.addEventListener('click', async () => {
            if (!APP_STATE.selectedWorld || APP_STATE.selectedCharacters.length === 0) {
                alert('请先开始创作并选择世界观和角色');
                return;
            }

            const userPrompt = document.getElementById('story-prompt').value.trim();
            const wordCount = document.getElementById('word-count').value;

            // 构建系统提示词
            const systemPrompt = ApiManager.buildSystemPrompt(
                APP_STATE.selectedWorld, 
                APP_STATE.selectedCharacters
            );

            // 生成故事
            const result = await ApiManager.generateStory(systemPrompt, userPrompt, parseInt(wordCount));

            if (result) {
                // 存储故事章节和大纲
                APP_STATE.currentStory.push(result.content);
                APP_STATE.currentStoryOutlines.push(result.outline);

                // 控制记忆长度
                if (APP_STATE.currentStory.length > 50) {
                    APP_STATE.currentStory.shift();
                    APP_STATE.currentStoryOutlines.shift();
                }

                // 显示故事
                storyOutput.innerHTML = result.content;
                
                // 切换按钮状态
                generateBtn.style.display = 'none';
                regenerateBtn.style.display = 'inline-block';
            }
        });

        // 重新生成功能
        regenerateBtn.addEventListener('click', async () => {
            // 重新生成，保持上一次的提示和设置
            const generateEvent = new Event('click');
            generateBtn.dispatchEvent(generateEvent);
        });
    },

    // 故事大纲按钮
    initOutlineButton() {
        const outlineBtn = document.getElementById('outline-btn');
        const outlineModal = document.getElementById('outline-modal');
        const outlineContainer = document.getElementById('story-outlines');

        outlineBtn.addEventListener('click', () => {
            // 显示所有章节大纲
            outlineContainer.innerHTML = APP_STATE.currentStoryOutlines.map((outline, index) => `
                <div class="outline-item">
                    <h3>第${index + 1}章大纲</h3>
                    <p>${outline}</p>
                </div>
            `).join('');

            outlineModal.style.display = 'block';
        });
    },

    // API设置
    initApiSettings() {
        const apiSettingsBtn = document.getElementById('api-settings');
        const apiModal = document.getElementById('api-modal');
        const saveApiBtn = document.getElementById('save-api-settings');

        // 打开API设置模态框
        apiSettingsBtn.addEventListener('click', () => {
            // 如果有之前保存的设置，填充表单
            const savedSettings = StorageManager.getApiSettings();
            if (savedSettings) {
                document.getElementById('api-key').value = savedSettings.userApiKey || '';
                document.getElementById('api-url').value = savedSettings.userApiUrl || '';
                document.getElementById('api-model').value = savedSettings.userModel || '';
            }
            apiModal.style.display = 'block';
        });

        // 保存API设置
        saveApiBtn.addEventListener('click', () => {
            const apiKey = document.getElementById('api-key').value.trim();
            const apiUrl = document.getElementById('api-url').value.trim();
            const apiModel = document.getElementById('api-model').value.trim();

            // 更新全局API设置
            APP_STATE.apiSettings.userApiKey = apiKey;
            APP_STATE.apiSettings.userApiUrl = apiUrl;
            APP_STATE.apiSettings.userModel = apiModel;

            // 保存到本地存储
            StorageManager.saveApiSettings({
                userApiKey: apiKey,
                userApiUrl: apiUrl,
                userModel: apiModel
            });

            alert('API设置已保存');
            apiModal.style.display = 'none';
        });
    },

    // 下载故事
    initDownloadStory() {
        const downloadBtn = document.getElementById('download-story');
        const downloadModal = document.getElementById('download-modal');
        const confirmDownloadBtn = document.getElementById('confirm-download');

        downloadBtn.addEventListener('click', () => {
            if (APP_STATE.currentStory.length === 0) {
                alert('当前没有可下载的故事');
                return;
            }
            downloadModal.style.display = 'block';
        });

        confirmDownloadBtn.addEventListener('click', () => {
            const format = document.querySelector('input[name="download-format"]:checked').value;
            const filename = document.getElementById('story-filename').value.trim() || '我的故事';

            let downloadContent = '';
            APP_STATE.currentStory.forEach((chapter, index) => {
                if (format === 'with-outline') {
                    downloadContent += `第${index + 1}章\n\n${APP_STATE.currentStoryOutlines[index]}\n\n${chapter}\n\n`;
                } else {
                    downloadContent += `第${index + 1}章\n\n${chapter}\n\n`;
                }
            });

            // 创建并下载文件
            const blob = new Blob([downloadContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}.txt`;
            link.click();
        });
    },

    // 清除当前故事内容
    initClearStory() {
        const clearBtn = document.getElementById('clear-story');

        clearBtn.addEventListener('click', () => {
            // 清空故事内容和大纲
            APP_STATE.currentStory = [];
            APP_STATE.currentStoryOutlines = [];
            
            // 清空界面
            document.getElementById('story-output').innerHTML = '';
            document.getElementById('story-prompt').value = '';

            // 重置生成按钮状态
            document.getElementById('generate-story').style.display = 'inline-block';
            document.getElementById('regenerate-story').style.display = 'none';

            alert('已清除当前故事内容');
        });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
});
