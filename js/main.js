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
    
    // 平滑滚动导航
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
}