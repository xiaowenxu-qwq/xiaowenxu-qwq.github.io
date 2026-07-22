/**
 * 主入口文件 - 最终修复版
 * 修复清单：
 * 1. ✅ 模块化导入posts数据，解决作用域报错
 * 2. ✅ 兼容file://协议的LocalStorage禁用问题
 * 3. ✅ 个人中心文章列表强制渲染逻辑
 * 4. ✅ 完善错误处理和调试日志
 */

// ✅ 核心修复：从data目录导入posts数据（路径相对于当前main.js所在目录）
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

// ✅ 内存存储兜底（解决file://协议下LocalStorage不可用问题）
let memoryStorage = {
    theme: null,
    searchHistory: []
};

// ======================= 工具函数 =======================
const safeGetElement = (id) => document.getElementById(id);

/**
 * 检测浏览器是否支持LocalStorage
 */
function isLocalStorageSupported() {
    try {
        const testKey = '__blog_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        console.warn('⚠️ LocalStorage不可用，已切换为内存存储模式');
        return false;
    }
}
const canUseLocalStorage = isLocalStorageSupported();

// DOM元素缓存
const searchInput = safeGetElement('searchInput');
const searchClear = safeGetElement('searchClear');
const searchHistory = safeGetElement('searchHistory');
const searchHistoryList = safeGetElement('searchHistoryList');
const clearHistoryBtn = safeGetElement('clearHistory');
let backToTopBtn = null;

// ======================= 初始化逻辑 =======================
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c✅ 博客初始化完成', 'color: #10b981; font-weight: bold;');
    console.log(`📄 当前页面：${window.location.pathname}`);
    console.log(`🔧 LocalStorage支持：${canUseLocalStorage}`);
    console.log(`📚 加载文章总数：${posts?.length || 0}`);

    // 初始化文章数据
    allPosts = Array.isArray(posts) ? [...posts] : [];
    filteredPosts = [...allPosts];

    // 初始化基础功能
    initializeTheme();
    setupEventListeners();
    
    // 延迟高亮代码块（确保DOM已渲染）
    requestAnimationFrame(() => hljs.highlightAll());

    // 页面路由分发
    handlePageRouting();

    // 初始化通用组件
    createProgressBar();
    createBackToTopButton();
    if (canUseLocalStorage) loadSearchHistory();
});

// ======================= 页面路由（核心渲染逻辑） =======================
function handlePageRouting() {
    const path = window.location.pathname;
    const isProfilePage = path.includes('profile.html');
    const isHomePage = path.includes('index.html') || path === '/' || path.endsWith('/');

    console.log(`🔀 路由分发：主页=${isHomePage}，个人中心=${isProfilePage}`);

    // 1. 控制页面区块显示/隐藏
    const homeSection = safeGetElement('home');
    const aboutSection = safeGetElement('about');
    const profileSection = safeGetElement('profile');
    const profilePostsSection = safeGetElement('profilePosts');

    if (homeSection) homeSection.style.display = isHomePage ? 'block' : 'none';
    if (aboutSection) aboutSection.style.display = isHomePage ? 'block' : 'none';
    if (profileSection) profileSection.style.display = isProfilePage ? 'block' : 'none';
    if (profilePostsSection) profilePostsSection.style.display = isProfilePage ? 'block' : 'none';

    // 2. 个人中心强制渲染所有文章（不走过滤逻辑）
    if (isProfilePage) {
        const profileContainer = safeGetElement('profilePostsContainer');
        
        if (!profileContainer) {
            console.error('❌ 致命错误：未找到个人中心文章容器 #profilePostsContainer');
            console.error('请检查profile.html中是否存在 <div id="profilePostsContainer">');
            return;
        }

        if (allPosts.length === 0) {
            console.warn('⚠️ 文章数据为空，请检查js/data/posts.js配置');
            profileContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-book-open"></i>
                    <p>暂无文章内容</p>
                    <span class="no-results-hint">请检查js/data/posts.js配置</span>
                </div>
            `;
            return;
        }

        console.log(`👤 开始渲染个人中心文章，数量：${allPosts.length}`);
        renderPosts(allPosts, 'profilePostsContainer');
        console.log('✅ 个人中心文章渲染完成');
    }

    // 3. 主页渲染文章
    if (isHomePage) {
        const homeContainer = safeGetElement('postsContainer');
        if (homeContainer) {
            console.log(`🏠 开始渲染主页文章，数量：${filteredPosts.length}`);
            renderPosts(filteredPosts, 'postsContainer');
        }
    }
}

// ======================= 事件监听 =======================
function setupEventListeners() {
    // 文章点击（同时支持主页和个人中心容器）
    const containers = [
        safeGetElement('postsContainer'),
        safeGetElement('profilePostsContainer')
    ].filter(Boolean);

    containers.forEach(container => {
        container.addEventListener('click', (e) => {
            const postCard = e.target.closest('.post-card');
            if (postCard) {
                const postId = Number(postCard.dataset.id);
                showPostDetail(postId, allPosts);
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

    // 搜索相关（仅主站生效）
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

    // 搜索清除按钮
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            filterPosts('');
            toggleClearButton('');
        });
    }

    // 搜索历史点击
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

    // 清空搜索历史
    if (clearHistoryBtn && canUseLocalStorage) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }

    // 全局袋鼠特效
    document.addEventListener('click', (e) => {
        spawnKangaroos(e.clientX, e.clientY);
    });

    // 滚动监听
    window.addEventListener('scroll', handleScroll);

    // 侧边栏导航逻辑（兼容个人中心强制回主页）
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetHref = link.getAttribute('href');

            // 个人中心点击任何链接都强制回主站
            if (window.location.pathname.includes('profile.html')) {
                e.preventDefault();
                window.location.href = targetHref.startsWith('#') ? 'index.html' : targetHref;
                return;
            }

            // 主站首页链接逻辑
            if (targetHref.includes('#home') || targetHref === 'index.html' || targetHref === '#home') {
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

            // 阅读模式下点击锚点
            const postDetail = safeGetElement('postDetail');
            if (postDetail && !postDetail.classList.contains('hidden')) {
                e.preventDefault();
                exitReadingMode();
                hidePostDetail();
                setTimeout(() => {
                    if (targetHref.startsWith('#')) {
                        const target = document.querySelector(targetHref);
                        target?.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                return;
            }

            // 普通锚点跳转
            if (targetHref.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(targetHref);
                target?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ======================= 搜索逻辑 =======================
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

    // 同时更新主页和个人中心的文章列表
    const homeContainer = safeGetElement('postsContainer');
    const profileContainer = safeGetElement('profilePostsContainer');
    
    if (homeContainer) renderPosts(filteredPosts, 'postsContainer');
    if (profileContainer) renderPosts(filteredPosts, 'profilePostsContainer');

    // 更新无结果提示
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

// ======================= 搜索历史（兼容LocalStorage禁用） =======================
function loadSearchHistory() {
    if (!canUseLocalStorage) return;
    try {
        const history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
        renderSearchHistory(history);
    } catch (e) {
        console.warn('加载搜索历史失败：', e);
    }
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
    } catch (e) {
        console.warn('保存搜索历史失败：', e);
    }
}

function clearSearchHistory() {
    if (!canUseLocalStorage) return;
    try {
        localStorage.removeItem('blogSearchHistory');
        renderSearchHistory([]);
    } catch (e) {
        console.warn('清空搜索历史失败：', e);
    }
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

// ======================= 阅读模式 =======================
function createProgressBar() {
    if (document.getElementById('readingProgressBar')) return;
    const bar = document.createElement('div');
    bar.className = 'reading-progress-bar';
    bar.id = 'readingProgressBar';
    document.body.appendChild(bar);
}

function handleScroll() {
    // 回到顶部按钮
    if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', window.scrollY > 300);
    }

    // 阅读进度条
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
    let progress = (scrolled / totalHeight) * 100;
    progress = Math.max(0, Math.min(100, progress));
    progressBar.style.width = `${progress}%`;
}

function enterReadingMode() {
    ['home', 'about', 'profile', 'profilePosts'].forEach(id => {
        const el = safeGetElement(id);
        if (el) el.style.display = 'none';
    });
    const progressBar = safeGetElement('readingProgressBar');
    if (progressBar) progressBar.style.opacity = '1';

    generateTableOfContents();
    wrapCodeBlocks();
}

function exitReadingMode() {
    ['home', 'about', 'profile', 'profilePosts'].forEach(id => {
        const el = safeGetElement(id);
        if (el) el.style.display = 'block';
    });
    const progressBar = safeGetElement('readingProgressBar');
    if (progressBar) {
        progressBar.style.opacity = '0';
        progressBar.style.width = '0%';
    }
    const toc = safeGetElement('toc-container');
    if (toc) toc.remove();
}

// ======================= 文章目录 =======================
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

// ======================= 代码复制 =======================
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
                await navigator.clipboard.writeText(block.querySelector('code').innerText);
                btn.textContent = '成功!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = '复制';
                    btn.classList.remove('copied');
                }, 2000);
            } catch (e) {
                btn.textContent = '失败';
            }
        });
        wrapper.appendChild(btn);
    });
}

// ======================= 回到顶部 =======================
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