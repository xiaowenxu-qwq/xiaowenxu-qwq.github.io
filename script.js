// =======================
// 文章数据
// =======================
const posts = [
    {
        id: 1,
        title: "JavaScript异步编程指南",
        date: "2024-01-15",
        category: "JavaScript",
        excerpt: "深入探讨Promise、async/await和事件循环机制...",
        tags: ["JavaScript", "异步", "Promise"],
        content: "# JavaScript异步编程指南\n\n在现代Web开发中..."
    },
    {
        id: 2,
        title: "CSS Grid布局完全指南",
        date: "2024-01-10",
        category: "CSS",
        excerpt: "掌握现代CSS布局利器，创建响应式网页设计...",
        tags: ["CSS", "Grid", "响应式"],
        content: "# CSS Grid布局完全指南\n\nCSS Grid是创建二维布局的强大工具..."
    },
    {
        id: 3,
        title: "Git常用命令速查表",
        date: "2024-01-05",
        category: "工具",
        excerpt: "开发必备的Git命令集合，提高版本控制效率...",
        tags: ["Git", "版本控制", "命令行"],
        content: "# Git常用命令速查表\n\n## 基础配置\n```bash\ngit config...\n```"
    },
    {
        id: 4,
        title: "测试1",
        date: "2026-7-19",
        category: "测试1.1",
        excerpt: "测试1.2",
        tags: ["测试1.3.1", "测试1.3.2", "测试1.3.3"],
        content: "测试1.4:"
    },
    {
        id: 5,
        title: "论存在的碎片：一则关于虚无的注脚",
        date: "2026-7-19",
        category: "文章",
        excerpt: "名言风暴席卷逻辑废墟，一场荒诞而华丽的思想拼贴盛宴。",
        tags: ["可读性强", "逻辑性强", "名言广泛"],
        content: "论存在的碎片：一则关于虚无的注脚\n\n亚里士多德曾言..."
    }
];

// =======================
// DOM元素
// =======================
const postsContainer = document.getElementById('postsContainer');
const postDetail = document.getElementById('postDetail');
const postContent = document.getElementById('postContent');
const backBtn = document.getElementById('backBtn');
const themeToggle = document.getElementById('themeToggle');
const sprayIndicator = document.getElementById('sprayIndicator');
const kangarooCountEl = document.getElementById('kangarooCount');

// 控制面板元素
const gravitySlider = document.getElementById('gravitySlider');
const frequencySlider = document.getElementById('frequencySlider');
const powerSlider = document.getElementById('powerSlider');
const trailToggle = document.getElementById('trailToggle');
const cleanupToggle = document.getElementById('cleanupToggle');
const gravityValue = document.getElementById('gravityValue');
const frequencyValue = document.getElementById('frequencyValue');
const powerValue = document.getElementById('powerValue');

// =======================
// 袋鼠物理引擎参数
// =======================
const KANGAROO_EMOJIS = ['🦘', '🦘', '🦘', '💨', '✨'];
let GRAVITY = 900;
let LAUNCH_INTERVAL = 50;
let INITIAL_SPEED_MIN = 300;
let INITIAL_SPEED_MAX = 600;
let SHOW_TRAIL = false;
let AUTO_CLEANUP = true;

let kangarooSpawnTimer = null;
let activeKangaroos = [];
let mouseX = 0;
let mouseY = 0;

// =======================
// 初始化
// =======================
document.addEventListener('DOMContentLoaded', function() {
    renderPosts();
    setupEventListeners();
    initializeTheme();
    hljs.highlightAll();
    setupControlPanel();
});

// =======================
// 渲染文章列表
// =======================
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
            <div class="post-excerpt">${post.excerpt}</div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        postsContainer.appendChild(postElement);
    });
}

// =======================
// 事件监听
// =======================
function setupEventListeners() {
    // 文章点击
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
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // =======================
    // 袋鼠喷射核心事件
    // =======================
    document.addEventListener('mousedown', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        sprayIndicator.style.left = `${mouseX}px`;
        sprayIndicator.style.top = `${mouseY}px`;
        sprayIndicator.classList.add('active');
        
        spawnKangaroo(mouseX, mouseY);
        
        kangarooSpawnTimer = setInterval(() => {
            spawnKangaroo(mouseX, mouseY);
        }, LAUNCH_INTERVAL);
    });
    
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (kangarooSpawnTimer) {
            sprayIndicator.style.left = `${mouseX}px`;
            sprayIndicator.style.top = `${mouseY}px`;
        }
    });
    
    document.addEventListener('mouseup', stopSpraying);
    document.addEventListener('mouseleave', stopSpraying);
}

function stopSpraying() {
    clearInterval(kangarooSpawnTimer);
    kangarooSpawnTimer = null;
    sprayIndicator.classList.remove('active');
}

// =======================
// 控制面板逻辑
// =======================
function setupControlPanel() {
    gravitySlider.addEventListener('input', e => {
        GRAVITY = parseInt(e.target.value);
        gravityValue.textContent = GRAVITY;
    });
    
    frequencySlider.addEventListener('input', e => {
        LAUNCH_INTERVAL = parseInt(e.target.value);
        frequencyValue.textContent = LAUNCH_INTERVAL;
    });
    
    powerSlider.addEventListener('input', e => {
        const power = parseInt(e.target.value);
        INITIAL_SPEED_MIN = power * 0.7;
        INITIAL_SPEED_MAX = power * 1.3;
        powerValue.textContent = power;
    });
    
    trailToggle.addEventListener('click', () => {
        trailToggle.classList.toggle('active');
        SHOW_TRAIL = trailToggle.classList.contains('active');
    });
    
    cleanupToggle.addEventListener('click', () => {
        cleanupToggle.classList.toggle('active');
        AUTO_CLEANUP = cleanupToggle.classList.contains('active');
    });
}

// =======================
// 袋鼠物理系统
// =======================
function spawnKangaroo(x, y) {
    const el = document.createElement('div');
    el.className = 'kangaroo';
    if (SHOW_TRAIL) el.classList.add('has-trail');
    el.textContent = KANGAROO_EMOJIS[Math.floor(Math.random() * KANGAROO_EMOJIS.length)];
    
    const angle = (Math.random() - 0.5) * Math.PI / 1.5;
    const speed = INITIAL_SPEED_MIN + Math.random() * (INITIAL_SPEED_MAX - INITIAL_SPEED_MIN);
    
    const vx = Math.sin(angle) * speed;
    const vy = -Math.cos(angle) * speed;
    
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    document.body.appendChild(el);
    
    activeKangaroos.push({
        el,
        x,
        y,
        vx,
        vy,
        startTime: performance.now(),
        rotation: Math.random() * 360
    });
    
    updateKangarooCounter();
}

function updateKangaroos(now) {
    for (let i = activeKangaroos.length - 1; i >= 0; i--) {
        const k = activeKangaroos[i];
        const dt = (now - k.startTime) / 1000;
        
        k.x += k.vx * dt;
        k.y += k.vy * dt + 0.5 * GRAVITY * dt * dt;
        k.vy += GRAVITY * dt;
        k.rotation += k.vx * 0.3;
        
        k.el.style.transform = `translate(${k.x - mouseX}px, ${k.y - mouseY}px) rotate(${k.rotation}deg)`;
        
        if (AUTO_CLEANUP && (k.y > window.innerHeight + 100 || now - k.startTime > 2000)) {
            k.el.classList.add('fade-out');
            setTimeout(() => k.el.remove(), 600);
            activeKangaroos.splice(i, 1);
            updateKangarooCounter();
        }
        
        k.startTime = now;
    }
}

function updateKangarooCounter() {
    kangarooCountEl.textContent = activeKangaroos.length;
}

// 启动物理循环
requestAnimationFrame(function animate(now) {
    updateKangaroos(now);
    requestAnimationFrame(animate);
});

// =======================
// 博客业务逻辑
// =======================
function showPostDetail(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    
    postContent.innerHTML = marked.parse(post.content);
    postContent.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
    
    document.getElementById('posts').classList.add('hidden');
    postDetail.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hidePostDetail() {
    postDetail.classList.add('hidden');
    document.getElementById('posts').classList.remove('hidden');
}

function toggleTheme() {
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    
    body.classList.toggle('dark-theme');
    icon.className = body.classList.contains('dark-theme') ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = themeToggle.querySelector('i');
    
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-theme');
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}