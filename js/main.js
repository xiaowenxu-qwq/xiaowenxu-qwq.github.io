/**
 * 主入口文件 - 超级修复版（含详细日志）
 */

// 安全获取全局库
const marked = window.marked;
const hljs = window.hljs;
const renderMathInElement = window.renderMathInElement;

import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

// ======================= 全局状态 =======================
let allPosts = [];
let filteredPosts = [];
const MAX_HISTORY = 5;
let memoryStorage = { theme: null, searchHistory: [] };

// ======================= 工具函数 =======================
const safeGetElement = (id) => document.getElementById(id);

function isLocalStorageSupported() {
    try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        return true;
    } catch {
        return false;
    }
}
const canUseLocalStorage = isLocalStorageSupported();

// ======================= DOM 缓存 =======================
const searchInput = safeGetElement('searchInput');
const searchClear = safeGetElement('searchClear');
const searchHistory = safeGetElement('searchHistory');
const searchHistoryList = safeGetElement('searchHistoryList');
const clearHistoryBtn = safeGetElement('clearHistory');
let backToTopBtn = null;

// ======================= 初始化 =======================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 博客初始化开始...');
    console.log('📍 当前路径:', window.location.pathname);
    console.log('📦 原始 posts 数据:', posts?.length || 0, '篇');

    // 赋值数据
    allPosts = Array.isArray(posts) ? [...posts] : [];
    filteredPosts = [...allPosts];
    console.log('✅ allPosts 已填充，长度:', allPosts.length);

    // 初始化基础功能
    initializeTheme();
    setupEventListeners();
    
    // 高亮代码
    requestAnimationFrame(() => {
        if (hljs) hljs.highlightAll();
    });

    // ⭐ 核心修复：统一渲染调度（增加容错）
    try {
        forceRenderAllPages();
    } catch (err) {
        console.error('❌ 渲染过程中发生错误:', err);
    }

    // 通用组件
    createProgressBar();
    createBackToTopButton();
    if (canUseLocalStorage) loadSearchHistory();

    console.log('✅ 初始化完成');
});

// ======================= 强制渲染（核心修复 + 详细日志） =======================
function forceRenderAllPages() {
    // 判断是否为个人中心页
    const hasProfileElement = !!document.getElementById('profile');
    const isProfilePage = hasProfileElement || window.location.pathname.includes('profile.html');
    const isHomePage = !isProfilePage;

    console.log(`🔀 页面类型：${isProfilePage ? '个人中心' : '主页'}`);
    console.log(`   - hasProfileElement: ${hasProfileElement}`);
    console.log(`   - pathname: ${window.location.pathname}`);

    // --- 显示/隐藏区块 ---
    const homeSection = safeGetElement('home');
    const aboutSection = safeGetElement('about');
    const profileSection = safeGetElement('profile');
    const profilePostsSection = safeGetElement('profilePosts');

    if (homeSection) homeSection.style.display = isHomePage ? 'block' : 'none';
    if (aboutSection) aboutSection.style.display = isHomePage ? 'block' : 'none';
    if (profileSection) profileSection.style.display = isProfilePage ? 'block' : 'none';
    if (profilePostsSection) profilePostsSection.style.display = isProfilePage ? 'block' : 'none';

    // --- 渲染文章 ---
    if (isProfilePage) {
        console.log('👤 进入个人中心渲染分支');
        const container = safeGetElement('profilePostsContainer');
        if (!container) {
            console.error('❌ 个人中心容器 #profilePostsContainer 不存在！请检查 profile.html');
            // 尝试用备用选择器
            const altContainer = document.querySelector('.posts-grid#profilePostsContainer');
            if (altContainer) {
                console.log('✅ 通过备用选择器找到容器');
                renderPosts(allPosts, 'profilePostsContainer');
            } else {
                console.error('❌ 完全找不到容器，渲染中止');
            }
            return;
        }
        console.log('✅ 容器 #profilePostsContainer 已找到');
        console.log('📄 即将渲染的文章数:', allPosts.length);
        
        // 先清空容器，确保干净
        container.innerHTML = '';
        
        // 调用渲染函数
        renderPosts(allPosts, 'profilePostsContainer');
        
        // 隐藏无结果提示
        const noRes = safeGetElement('profileNoResults');
        if (noRes) noRes.classList.add('hidden');
        
        console.log('✅ 个人中心渲染调用完成');
    } else {
        const container = safeGetElement('postsContainer');
        if (container) {
            console.log('🏠 渲染主页，文章数:', filteredPosts.length);
            renderPosts(filteredPosts, 'postsContainer');
        }
    }
}

// ======================= 事件监听 =======================
function setupEventListeners() {
    // 文章点击（支持两个容器）
    const containers = ['postsContainer', 'profilePostsContainer']
        .map(id => safeGetElement(id))
        .filter(Boolean);

    containers.forEach(container => {
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.post-card');
            if (card) {
                const id = Number(card.dataset.id);
                showPostDetail(id, allPosts);
                enterReadingMode();
            }
        });
    });

    // 主题切换
    const themeToggle = safeGetElement('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // 返回按钮
    const backBtn = safeGetElement('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            exitReadingMode();
            hidePostDetail();
        });
    }

    // 搜索逻辑（仅主页）
    if (searchInput && canUseLocalStorage) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', () => {
            if (searchHistoryList?.children.length > 0) {
                searchHistory?.classList.add('visible');
            }
        });
        searchInput.addEventListener('blur', () => {
            setTimeout(() => searchHistory?.classList.remove('visible'), 200);
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveSearchHistory(searchInput.value.trim());
                searchInput.blur();
            }
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            filterPosts('');
            toggleClearButton('');
        });
    }

    if (searchHistoryList && canUseLocalStorage) {
        searchHistoryList.addEventListener('click', (e) => {
            const item = e.target.closest('.search-history-item');
            if (item) {
                const keyword = item.dataset.keyword;
                if (searchInput) searchInput.value = keyword;
                filterPosts(keyword);
                toggleClearButton(keyword);
                searchHistory?.classList.remove('visible');
            }
        });
    }

    if (clearHistoryBtn && canUseLocalStorage) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }

    // 袋鼠特效
    document.addEventListener('click', (e) => {
        spawnKangaroos(e.clientX, e.clientY);
    });

    // 滚动
    window.addEventListener('scroll', handleScroll);

    // 侧边栏导航（统一处理）
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // 个人中心内点击任何链接，跳转到主页
            if (window.location.pathname.includes('profile.html')) {
                e.preventDefault();
                window.location.href = href.startsWith('#') ? 'index.html' : href;
                return;
            }
            // 主页内点击“主页”或锚点
            if (href.includes('#home') || href === 'index.html' || href === '#home') {
                e.preventDefault();
                exitReadingMode();
                hidePostDetail();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (searchInput) {
                    searchInput.value = '';
                    filterPosts('');
                    toggleClearButton('');
                }
                return;
            }
            // 阅读模式下的锚点
            const postDetail = safeGetElement('postDetail');
            if (postDetail && !postDetail.classList.contains('hidden')) {
                e.preventDefault();
                exitReadingMode();
                hidePostDetail();
                setTimeout(() => {
                    if (href.startsWith('#')) {
                        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                return;
            }
            // 普通锚点
            if (href.startsWith('#')) {
                e.preventDefault();
                document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ======================= 搜索函数 =======================
function handleSearchInput() {
    if (!searchInput) return;
    const keyword = searchInput.value.trim();
    filterPosts(keyword);
    toggleClearButton(keyword);
}

function filterPosts(keyword) {
    if (!keyword) {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post =>
            post.title.toLowerCase().includes(keyword.toLowerCase()) ||
            post.category.toLowerCase().includes(keyword.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
        );
    }
    // 主页容器
    const homeContainer = safeGetElement('postsContainer');
    if (homeContainer) renderPosts(filteredPosts, 'postsContainer');
    // 个人中心容器（同步更新，但一般不会在个人中心搜索）
    const profileContainer = safeGetElement('profilePostsContainer');
    if (profileContainer) renderPosts(filteredPosts, 'profilePostsContainer');

    const noResults = safeGetElement('noResults');
    const profileNoResults = safeGetElement('profileNoResults');
    if (noResults) noResults.classList.toggle('hidden', !(filteredPosts.length === 0 && keyword));
    if (profileNoResults) profileNoResults.classList.toggle('hidden', !(filteredPosts.length === 0 && keyword));
}

function toggleClearButton(keyword) {
    if (searchClear) {
        searchClear.classList.toggle('visible', !!keyword);
    }
}

// ======================= 搜索历史 =======================
function loadSearchHistory() {
    if (!canUseLocalStorage) return;
    try {
        const history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
        renderSearchHistory(history);
    } catch {}
}

function saveSearchHistory(keyword) {
    if (!canUseLocalStorage || !keyword || !searchHistoryList) return;
    try {
        let history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
        history = history.filter(item => item !== keyword);
        history.unshift(keyword);
        if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
        localStorage.setItem('blogSearchHistory', JSON.stringify(history));
        renderSearchHistory(history);
    } catch {}
}

function clearSearchHistory() {
    if (!canUseLocalStorage) return;
    try {
        localStorage.removeItem('blogSearchHistory');
        renderSearchHistory([]);
    } catch {}
}

function renderSearchHistory(history) {
    if (!searchHistoryList) return;
    searchHistoryList.innerHTML = '';
    if (history.length === 0) {
        searchHistory?.classList.remove('visible');
        return;
    }
    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'search-history-item';
        li.dataset.keyword = item;
        li.innerHTML = `<i class="fas fa-history"></i> <span>${item}</span>`;
        searchHistoryList.appendChild(li);
    });
}

// ======================= 阅读模式相关 =======================
function createProgressBar() {
    if (document.getElementById('readingProgressBar')) return;
    const bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    bar.id = 'readingProgressBar';
    document.body.appendChild(bar);
}

function handleScroll() {
    if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', window.scrollY > 300);
    }
    const progressBar = safeGetElement('readingProgressBar');
    const postDetail = safeGetElement('postDetail');
    if (!progressBar || !postDetail || postDetail.classList.contains('hidden')) {
        if (progressBar) progressBar.style.width = '0%';
        return;
    }
    const content = safeGetElement('postContent');
    if (!content) return;
    const totalHeight = content.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY - postDetail.offsetTop;
    let progress = Math.max(0, Math.min(100, (scrolled / totalHeight) * 100));
    progressBar.style.width = `${progress}%`;
}

function enterReadingMode() {
    ['home', 'about', 'profile', 'profilePosts'].forEach(id => {
        const el = safeGetElement(id);
        if (el) el.style.display = 'none';
    });
    const bar = safeGetElement('readingProgressBar');
    if (bar) bar.style.opacity = '1';
    generateTableOfContents();
    wrapCodeBlocks();
}

function exitReadingMode() {
    ['home', 'about', 'profile', 'profilePosts'].forEach(id => {
        const el = safeGetElement(id);
        if (el) el.style.display = 'block';
    });
    const bar = safeGetElement('readingProgressBar');
    if (bar) {
        bar.style.opacity = '0';
        bar.style.width = '0%';
    }
    const toc = safeGetElement('toc-container');
    if (toc) toc.remove();
}

function generateTableOfContents() {
    const content = safeGetElement('postContent');
    if (!content) return;
    const headings = content.querySelectorAll('h2, h3');
    if (headings.length < 2) return;
    const toc = document.createElement('div');
    toc.id = 'toc-container';
    toc.className = 'toc-container';
    toc.innerHTML = '<h3><i class="fas fa-list"></i> 目录</h3><ul class="toc-list"></ul>';
    const list = toc.querySelector('.toc-list');
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        const li = document.createElement('li');
        li.className = `toc-${heading.tagName.toLowerCase()}`;
        const a = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = heading.textContent;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        });
        li.appendChild(a);
        list.appendChild(li);
    });
    content.prepend(toc);
}

function wrapCodeBlocks() {
    document.querySelectorAll('.post-content pre').forEach(block => {
        if (block.parentElement.classList.contains('code-block-wrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.textContent = '复制';
        btn.addEventListener('click', async () => {
            try {
                const code = block.querySelector('code')?.innerText || '';
                await navigator.clipboard.writeText(code);
                btn.textContent = '成功!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = '复制';
                    btn.classList.remove('copied');
                }, 2000);
            } catch {
                btn.textContent = '失败';
            }
        });
        wrapper.appendChild(btn);
    });
}

function createBackToTopButton() {
    if (document.querySelector('.back-to-top')) return;
    backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.setAttribute('aria-label', '回到顶部');
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(backToTopBtn);
}