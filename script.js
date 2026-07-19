// 文章数据
const posts = [
    {
        id: 1,
        title: "JavaScript异步编程指南",
        date: "2024-01-15",
        category: "JavaScript",
        excerpt: "深入探讨Promise、async/await和事件循环机制...",
        tags: ["JavaScript", "异步", "Promise"],
        content: `
# JavaScript异步编程指南

在现代Web开发中，异步编程是必不可少的技能。本文将深入探讨JavaScript中的异步模式。

## Promise基础

Promise是处理异步操作的对象：

\`\`\`javascript
const fetchData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("数据加载成功！");
        }, 2000);
    });
};

fetchData().then(data => {
    console.log(data); // "数据加载成功！"
});
\`\`\`

## async/await语法糖

ES2017引入的async/await让异步代码更易读：

\`\`\`javascript
async function loadData() {
    try {
        const data = await fetchData();
        console.log(data);
        return data;
    } catch (error) {
        console.error("加载失败:", error);
    }
}
\`\`\`

## 事件循环机制

JavaScript运行时包含：
- **调用栈**：执行同步代码
- **任务队列**：存放异步回调
- **微任务队列**：Promise回调优先级更高

> 理解事件循环是掌握异步编程的关键！

## 最佳实践

1. 始终处理Promise拒绝
2. 避免回调地狱
3. 合理使用Promise.all并行处理
4. 使用async/await提高可读性

---
*异步编程需要实践才能掌握，多写代码是关键！*
        `
    },
    {
        id: 2,
        title: "CSS Grid布局完全指南",
        date: "2024-01-10",
        category: "CSS",
        excerpt: "掌握现代CSS布局利器，创建响应式网页设计...",
        tags: ["CSS", "Grid", "响应式"],
        content: `
# CSS Grid布局完全指南

CSS Grid是创建二维布局的强大工具，比Flexbox更适合整体页面布局。

## 基本概念

\`\`\`css
.container {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr; /* 三列布局 */
    grid-template-rows: auto;
    gap: 20px; /* 网格间距 */
}
\`\`\`

## 常用属性

### 容器属性
- \`grid-template-columns\`: 定义列的大小和数量
- \`grid-template-rows\`: 定义行的大小和数量
- \`gap\`: 网格间距
- \`justify-items\`: 水平对齐
- \`align-items\`: 垂直对齐

### 项目属性
- \`grid-column\`: 项目跨越的列
- \`grid-row\`: 项目跨越的行
- \`justify-self\`: 单个项目水平对齐
- \`align-self\`: 单个项目垂直对齐

## 响应式布局示例

\`\`\`css
/* 移动端优先 */
.grid-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
}

/* 平板设备 */
@media (min-width: 768px) {
    .grid-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* 桌面设备 */
@media (min-width: 1024px) {
    .grid-container {
        grid-template-columns: repeat(3, 1fr);
    }
}
\`\`\`

## 实用技巧

1. 使用\`fr\`单位创建弹性布局
2. 结合Flexbox处理一维布局
3. 使用\`minmax()\`函数设置尺寸范围
4. 利用\`grid-area\`命名网格区域

CSS Grid彻底改变了我们创建网页布局的方式，值得深入学习！
        `
    },
    {
        id: 3,
        title: "Git常用命令速查表",
        date: "2024-01-05",
        category: "工具",
        excerpt: "开发必备的Git命令集合，提高版本控制效率...",
        tags: ["Git", "版本控制", "命令行"],
        content: `
# Git常用命令速查表

## 基础配置

\`\`\`bash
# 设置用户名和邮箱
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 查看配置
git config --list
\`\`\`

## 仓库操作

\`\`\`bash
# 初始化新仓库
git init

# 克隆远程仓库
git clone <repository-url>

# 查看远程仓库
git remote -v
\`\`\`

## 日常工作流

\`\`\`bash
# 检查状态
git status

# 添加文件到暂存区
git add <file>      # 添加指定文件
git add .           # 添加所有修改

# 提交更改
git commit -m "提交信息"

# 推送到远程
git push origin main

# 拉取更新
git pull origin main
\`\`\`

## 分支管理

\`\`\`bash
# 创建并切换分支
git checkout -b <branch-name>

# 列出所有分支
git branch

# 合并分支
git merge <branch-name>

# 删除分支
git branch -d <branch-name>
\`\`\`

## 撤销更改

\`\`\`bash
# 撤销工作区修改
git checkout -- <file>

# 撤销暂存区修改
git reset HEAD <file>

# 修改最后一次提交
git commit --amend
\`\`\`

## 查看历史

\`\`\`bash
# 查看提交日志
git log
git log --oneline --graph

# 查看文件差异
git diff
git diff --staged
\`\`\`

## 实用技巧

1. 使用\`.gitignore\`忽略不需要跟踪的文件
2. 定期执行\`git gc\`清理仓库
3. 使用别名简化常用命令
4. 学习交互式暂存(\`git add -p\`)

记住：频繁提交，有意义的提交信息，及时推送！
        `
    }
];

// DOM元素
const postsContainer = document.getElementById('postsContainer');
const postDetail = document.getElementById('postDetail');
const postContent = document.getElementById('postContent');
const backBtn = document.getElementById('backBtn');
const themeToggle = document.getElementById('themeToggle');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    renderPosts();
    setupEventListeners();
    initializeTheme();
    hljs.highlightAll();
});

// 渲染文章列表
function renderPosts() {
    postsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'post-card';
        postElement.dataset.id = post.id;
        
        postElement.innerHTML = `
            <div class="post-header">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span><i class="far fa-calendar"></i> ${post.date}</span>
                    <span><i class="fas fa-tag"></i> ${post.category}</span>
                </div>
            </div>
            <div class="post-excerpt">
                ${post.excerpt}
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        postsContainer.appendChild(postElement);
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 文章点击事件
    postsContainer.addEventListener('click', function(e) {
        const postCard = e.target.closest('.post-card');
        if (postCard) {
            const postId = parseInt(postCard.dataset.id);
            showPostDetail(postId);
        }
    });
    
    // 返回按钮
    backBtn.addEventListener('click', hidePostDetail);
    
    // 主题切换
    themeToggle.addEventListener('click', toggleTheme);
    
    // 平滑滚动导航
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 显示文章详情
function showPostDetail(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    
    // 使用marked解析Markdown
    postContent.innerHTML = marked.parse(post.content);
    
    // 高亮代码块
    postContent.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
    });
    
    // 显示详情，隐藏列表
    document.getElementById('posts').classList.add('hidden');
    postDetail.classList.remove('hidden');
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 隐藏文章详情
function hidePostDetail() {
    postDetail.classList.add('hidden');
    document.getElementById('posts').classList.remove('hidden');
}

// 主题切换
function toggleTheme() {
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// 初始化主题
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = themeToggle.querySelector('i');
    
    if (savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}