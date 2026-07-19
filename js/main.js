import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

// =======================
// 初始化
// =======================
document.addEventListener('DOMContentLoaded', function() {
    renderPosts(posts);
    setupEventListeners();
    initializeTheme();
    hljs.highlightAll();
});

// =======================
// 事件监听器
// =======================
function setupEventListeners() {
    const postsContainer = document.getElementById('postsContainer');
    const backBtn = document.getElementById('backBtn');
    const themeToggle = document.getElementById('themeToggle');
    
    // 文章点击事件
    postsContainer?.addEventListener('click', function(e) {
        const postCard = e.target.closest('.post-card');
        if (postCard) {
            const postId = parseInt(postCard.dataset.id);
            showPostDetail(postId, posts);
        }
    });
    
    // 返回按钮
    backBtn?.addEventListener('click', hidePostDetail);
    
    // 主题切换
    themeToggle?.addEventListener('click', toggleTheme);
    
    // 平滑滚动导航（顶部导航）
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            smoothScrollTo(this.getAttribute('href'));
        });
    });
    
    // 袋鼠点击特效（全屏响应）
    document.addEventListener('click', function(e) {
        spawnKangaroos(e.clientX, e.clientY);
    });

    // =======================
    // 侧边栏相关逻辑
    // =======================
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    // 点击侧边栏链接高亮
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            smoothScrollTo(this.getAttribute('href'));
        });
    });

    // 滚动时自动高亮侧边栏对应项
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = '#' + section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}