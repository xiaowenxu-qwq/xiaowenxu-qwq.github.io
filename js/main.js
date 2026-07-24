/**
 * 主入口文件 - 完整版
 */
const marked = window.marked;
const hljs = window.hljs;
const renderMathInElement = window.renderMathInElement;

import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

let allPosts = [];
let filteredPosts = [];
const MAX_HISTORY = 5;
let memoryStorage = { theme: null, searchHistory: [] };

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

const searchInput = safeGetElement('searchInput');
const searchClear = safeGetElement('searchClear');
const searchHistory = safeGetElement('searchHistory');
const searchHistoryList = safeGetElement('searchHistoryList');
const clearHistoryBtn = safeGetElement('clearHistory');
let backToTopBtn = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 博客初始化开始...');
    console.log('📍 当前路径:', window.location.pathname);
    console.log('📦 原始 posts 数据:', posts?.length || 0, '篇');

    allPosts = Array.isArray(posts) ? [...posts] : [];
    filteredPosts = [...allPosts];
    console.log('✅ allPosts 已填充，长度:', allPosts.length);

    initializeTheme();
    setupEventListeners();
    
    requestAnimationFrame(() => {
        if (hljs) hljs.highlightAll();
    });

    try {
        forceRenderAllPages();
    } catch (err) {
        console.error('❌ 渲染过程中发生错误:', err);
    }

    // 新增：渲染个人中心统计
    renderProfileStats();

    createProgressBar();
    createBackToTopButton();
    if (canUseLocalStorage) loadSearchHistory();

    console.log('✅ 初始化完成');
});

function forceRenderAllPages() {
    const hasProfileElement = !!document.getElementById('profile');
    const isProfilePage = hasProfileElement || window.location.pathname.includes('profile.html');
    const isHomePage = !isProfilePage;

    console.log(`🔀 页面类型：${isProfilePage ? '个人中心' : '主页'}`);

    const homeSection = safeGetElement('home');
    const aboutSection = safeGetElement('about');
    const profileSection = safeGetElement('profile');
    const profilePostsSection = safeGetElement('profilePosts');

    if (homeSection) homeSection.style.display = isHomePage ? 'block' : 'none';
    if (aboutSection) aboutSection.style.display = isHomePage ? 'block' : 'none';
    if (profileSection) profileSection.style.display = isProfilePage ? 'block' : 'none';
    if (profilePostsSection) profilePostsSection.style.display = isProfilePage ? 'block' : 'none';

    if (isProfilePage) {
        console.log('👤 进入个人中心渲染分支');
        const container = safeGetElement('profilePostsContainer');
        if (!container) {
            console.error('❌ 个人中心容器 #profilePostsContainer 不存在！');
            return;
        }
        container.innerHTML = '';
        renderPosts(allPosts, 'profilePostsContainer');
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

function setupEventListeners() {
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

    const themeToggle = safeGetElement('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const backBtn = safeGetElement('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            exitReadingMode();
            hidePostDetail();
        });
    }

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

    document.addEventListener('click', (e) => {
        spawnKangaroos(e.clientX, e.clientY);
    });

    window.addEventListener('scroll', handleScroll);

    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (window.location.pathname.includes('profile.html')) {
                e.preventDefault();
                window.location.href = href.startsWith('#') ? 'index.html' : href;
                return;
            }
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
            if (href.startsWith('#')) {
                e.preventDefault();
                document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

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
    const homeContainer = safeGetElement('postsContainer');
    if (homeContainer) renderPosts(filteredPosts, 'postsContainer');
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

// ===== 新增：个人中心统计渲染 =====
function renderProfileStats() {
    const articlesEl = document.getElementById('statArticles');
    const categoriesEl = document.getElementById('statCategories');
    const tagsEl = document.getElementById('statTags');

    const categories = [...new Set(allPosts.map(p => p.category))];
    const tags = [...new Set(allPosts.flatMap(p => p.tags || []))];

    animateNum(articlesEl, allPosts.length);
    animateNum(categoriesEl, categories.length);
    animateNum(tagsEl, tags.length);
}

function animateNum(el, target) {
    if (!el) return;
    if (target === 0) {
        el.textContent = '0';
        return;
    }
    let current = 0;
    const step = target / 30;
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(current);
    }, 20);
}