import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

let allPosts = [];
let filteredPosts = [];
const MAX_HISTORY = 5;

// 安全地获取DOM元素，避免报错
const safeGetElement = (id) => document.getElementById(id);
const searchInput = safeGetElement('searchInput');
const searchClear = safeGetElement('searchClear');
const searchHistory = safeGetElement('searchHistory');
const searchHistoryList = safeGetElement('searchHistoryList');
const clearHistoryBtn = safeGetElement('clearHistory');
let backToTopBtn;

// =======================
// 初始化（增加容错）
// =======================
document.addEventListener('DOMContentLoaded', function() {
    // 只有在主站才有postsContainer
    const postsContainer = safeGetElement('postsContainer');
    if (postsContainer) {
        allPosts = posts || [];
        filteredPosts = [...allPosts];
        renderPosts(filteredPosts);
    }

    setupEventListeners();
    initializeTheme();
    hljs.highlightAll();
    
    // 只有在主站才加载搜索历史和创建进度条
    if (searchInput) {
        loadSearchHistory();
    }
    createProgressBar();
    createBackToTopButton();
});

// =======================
// 事件监听器（全面容错）
// =======================
function setupEventListeners() {
    const postsContainer = safeGetElement('postsContainer');
    const backBtn = safeGetElement('backBtn');
    const themeToggle = safeGetElement('themeToggle');
    
    if (postsContainer) {
        postsContainer.addEventListener('click', function(e) {
            const postCard = e.target.closest('.post-card');
            if (postCard) {
                const postId = parseInt(postCard.dataset.id);
                showPostDetail(postId, allPosts);
                enterReadingMode();
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            exitReadingMode();
            hidePostDetail();
        });
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // --- 搜索相关（仅在元素存在时绑定）---
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', () => {
            if (searchHistoryList && searchHistoryList.children.length > 0) {
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
            searchInput?.focus();
        });
    }

    if (searchHistoryList) {
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

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }
    
    // --- 全局点击 & 滚动 ---
    document.addEventListener('click', (e) => {
        spawnKangaroos(e.clientX, e.clientY);
    });

    window.addEventListener('scroll', handleScroll);

    // --- 侧边栏逻辑（核心修改：强制回首页） ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            
            // 情况1：在个人中心页面，点击任何侧边栏链接都强制回主站首页
            // 判断依据：当前URL包含 profile.html
            if (window.location.pathname.includes('profile.html')) {
                // 如果是主页链接，直接跳转（不带锚点，确保是刷新时的状态）
                if (targetHref.includes('#home') || targetHref === 'index.html') {
                    window.location.href = 'index.html';
                    return;
                }
                // 其他链接（文章、介绍）也跳回主站
                window.location.href = targetHref;
                return;
            }

            // 情况2：在主站
            // 如果点击的是主页链接，强制回到刷新时的状态（隐藏文章详情，显示首页和介绍）
            if (targetHref.includes('#home') || targetHref === 'index.html' || targetHref === '#home') {
                e.preventDefault();
                exitReadingMode(); // 确保退出阅读模式
                hidePostDetail(); // 确保隐藏文章详情
                // 滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // 重置搜索框
                if (searchInput) {
                    searchInput.value = '';
                    filterPosts('');
                    toggleClearButton('');
                }
                return;
            }

            // 情况3：在主站点击其他链接（文章、介绍）
            // 如果在阅读模式，先退出
            const postDetail = safeGetElement('postDetail');
            if (postDetail && !postDetail.classList.contains('hidden')) {
                e.preventDefault();
                exitReadingMode();
                hidePostDetail();
                // 延迟滚动，确保DOM已更新
                setTimeout(() => {
                    if (targetHref.startsWith('#') && document.querySelector(targetHref)) {
                        smoothScrollTo(targetHref);
                    }
                }, 100);
                return;
            }

            // 正常情况下的锚点跳转
            if (targetHref.startsWith('#') && document.querySelector(targetHref)) {
                e.preventDefault();
                smoothScrollTo(targetHref);
            }
        });
    });
}

// =======================
// 搜索函数（容错版）
// =======================
function handleSearchInput() {
    if (!searchInput) return;
    const keyword = searchInput.value.trim();
    filterPosts(keyword);
    toggleClearButton(keyword);
}

function filterPosts(keyword) {
    const noResults = safeGetElement('noResults');
    
    if (!keyword) {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => 
            post.title.toLowerCase().includes(keyword.toLowerCase()) ||
            post.category.toLowerCase().includes(keyword.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
        );
    }
    
    renderPosts(filteredPosts);
    
    if (noResults) {
        if (filteredPosts.length === 0 && keyword) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }
}

function toggleClearButton(keyword) {
    if (searchClear) {
        searchClear.classList.toggle('visible', !!keyword);
    }
}

// =======================
// 搜索历史 (LocalStorage)
// =======================
function loadSearchHistory() {
    const history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
    renderSearchHistory(history);
}

function saveSearchHistory(keyword) {
    if (!keyword || !searchHistoryList) return;
    let history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
    history = history.filter(item => item !== keyword);
    history.unshift(keyword);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    localStorage.setItem('blogSearchHistory', JSON.stringify(history));
    renderSearchHistory(history);
}

function clearSearchHistory() {
    localStorage.removeItem('blogSearchHistory');
    renderSearchHistory([]);
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

// =======================
// 阅读模式 & 进度条 & TOC
// =======================
function createProgressBar() {
    // 防止重复创建
    if (document.getElementById('readingProgressBar')) return;
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    progressBar.id = 'readingProgressBar';
    document.body.appendChild(progressBar);
}

function handleScroll() {
    // 回到顶部按钮
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
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

    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;
    
    progressBar.style.width = `${progress}%`;
}

function enterReadingMode() {
    const homeSection = safeGetElement('home');
    const aboutSection = safeGetElement('about');
    const progressBar = safeGetElement('readingProgressBar');
    
    if (homeSection) homeSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (progressBar) progressBar.style.opacity = '1';

    generateTableOfContents();
    wrapCodeBlocks();
}

function exitReadingMode() {
    const homeSection = safeGetElement('home');
    const aboutSection = safeGetElement('about');
    const progressBar = safeGetElement('readingProgressBar');
    const tocContainer = safeGetElement('toc-container');
    
    if (homeSection) homeSection.style.display = 'block';
    if (aboutSection) aboutSection.style.display = 'block';
    if (progressBar) {
        progressBar.style.opacity = '0';
        progressBar.style.width = '0%';
    }
    if (tocContainer) {
        tocContainer.remove();
    }
}

// =======================
// 文章目录 (TOC)
// =======================
function generateTableOfContents() {
    const postContent = safeGetElement('postContent');
    if (!postContent) return;

    const headings = postContent.querySelectorAll('h2, h3');
    if (headings.length < 2) return;

    const tocContainer = document.createElement('div');
    tocContainer.id = 'toc-container';
    tocContainer.className = 'toc-container';
    tocContainer.innerHTML = '<h3><i class="fas fa-list"></i> 目录</h3><ul class="toc-list"></ul>';
    const tocList = tocContainer.querySelector('.toc-list');

    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        
        const listItem = document.createElement('li');
        listItem.className = `toc-${heading.tagName.toLowerCase()}`;
        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = heading.textContent;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScrollTo(`#${id}`);
        });
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });

    postContent.prepend(tocContainer);
}

// =======================
// 代码块一键复制
// =======================
function wrapCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.post-content pre');
    codeBlocks.forEach(block => {
        if (block.parentElement.classList.contains('code-block-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.textContent = '复制';
        copyButton.addEventListener('click', async () => {
            const code = block.querySelector('code').innerText;
            try {
                await navigator.clipboard.writeText(code);
                copyButton.textContent = '成功!';
                copyButton.classList.add('copied');
                setTimeout(() => {
                    copyButton.textContent = '复制';
                    copyButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                copyButton.textContent = '失败';
            }
        });
        wrapper.appendChild(copyButton);
    });
}

// =======================
// 回到顶部按钮
// =======================
function createBackToTopButton() {
    // 防止重复创建
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