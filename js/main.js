import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

// =======================
// 初始化（兼容独立页面）
// =======================
document.addEventListener('DOMContentLoaded', function() {
    // 仅主站存在文章容器时渲染文章
    const postsContainer = document.getElementById('postsContainer');
    if (postsContainer) {
        renderPosts(posts);
    }

    setupEventListeners();
    initializeTheme();
    hljs.highlightAll();

    // 仅存在文章内容区时渲染LaTeX（所有页面通用）
    const postContent = document.getElementById('postContent');
    if (postContent) {
        renderMathInElement(postContent, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }
});

// =======================
// 事件监听器（兼容独立页面）
// =======================
function setupEventListeners() {
    const postsContainer = document.getElementById('postsContainer');
    const backBtn = document.getElementById('backBtn');
    const themeToggle = document.getElementById('themeToggle');
    
    // 仅主站存在文章容器时绑定相关事件
    if (postsContainer) {
        postsContainer.addEventListener('click', function(e) {
            const postCard = e.target.closest('.post-card');
            if (postCard) {
                const postId = parseInt(postCard.dataset.id);
                showPostDetail(postId, posts);
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', hidePostDetail);
    }
    
    // 主题切换（所有页面生效）
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // 袋鼠点击特效（所有页面生效）
    document.addEventListener('click', function(e) {
        spawnKangaroos(e.clientX, e.clientY);
    });

    // 侧边栏导航逻辑
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            // 仅当前页面存在对应锚点时阻止默认行为，否则直接跳转页面
            if (targetId.startsWith('#') && document.querySelector(targetId)) {
                e.preventDefault();
                sidebarLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                smoothScrollTo(targetId);
            }
        });
    });

    // 滚动高亮（仅当前页面有section时生效）
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        if (sections.length === 0) return;
        
        const scrollPos = window.scrollY + 100;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = '#' + section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === sectionId || link.getAttribute('href') === `index.html${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}