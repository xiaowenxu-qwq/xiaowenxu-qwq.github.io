import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

let allPosts = [];
let filteredPosts = [];
const MAX_HISTORY = 5;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const searchHistory = document.getElementById('searchHistory');
const searchHistoryList = document.getElementById('searchHistoryList');
const clearHistoryBtn = document.getElementById('clearHistory');
let backToTopBtn; // 回到顶部按钮

// =======================
// 初始化
// =======================
document.addEventListener('DOMContentLoaded', function() {
    allPosts = posts;
    filteredPosts = [...allPosts];
    
    const postsContainer = document.getElementById('postsContainer');
    if (postsContainer) {
        renderPosts(filteredPosts);
    }

    setupEventListeners();
    initializeTheme();
    hljs.highlightAll();
    loadSearchHistory();
    createProgressBar();
    createBackToTopButton(); // 创建回到顶部按钮
});

// =======================
// 事件监听器
// =======================
function setupEventListeners() {
    const postsContainer = document.getElementById('postsContainer');
    const backBtn = document.getElementById('backBtn');
    const themeToggle = document.getElementById('themeToggle');
    
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
    
    // --- 搜索相关 ---
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', () => {
            if (searchHistoryList && searchHistoryList.children.length > 0) {
                searchHistory.classList.add('visible');
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

    // --- 侧边栏逻辑（关键修改） ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const postDetail = document.getElementById('postDetail');
            
            // 如果在阅读模式（文章详情页打开），点击侧边栏任何链接都先退出阅读模式
            if (postDetail && !postDetail.classList.contains('hidden')) {
                e.preventDefault(); // 阻止默认的锚点跳转（因为我们要先关闭文章）
                exitReadingMode();
                hidePostDetail();
                
                // 如果是跳转到本页的锚点，再平滑滚动过去
                if (targetId.startsWith('#') && document.querySelector(targetId)) {
                     setTimeout(() => smoothScrollTo(targetId), 100); // 稍作延迟等待DOM更新
                } else if (!targetId.startsWith('#')) {
                    // 如果是跳转其他页面（如profile.html），允许默认行为
                    window.location.href = targetId;
                }
                return; // 结束处理
            }

            // 非阅读模式下的正常逻辑
            if (targetId.startsWith('#') && document.querySelector(targetId)) {
                e.preventDefault();
                sidebarLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                smoothScrollTo(targetId);
            }
        });
    });
}

// =======================
// 搜索函数
// =======================
function handleSearchInput() {
    const keyword = searchInput.value.trim();
    filterPosts(keyword);
    toggleClearButton(keyword);
}

function filterPosts(keyword) {
    const noResults = document.getElementById('noResults');
    
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
    if (!keyword) return;
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
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    progressBar.id = 'readingProgressBar';
    document.body.appendChild(progressBar);
}

function handleScroll() {
    // 回到顶部按钮显示/隐藏
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }

    // 阅读进度条
    const progressBar = document.getElementById('readingProgressBar');
    const postDetail = document.getElementById('postDetail');
    
    if (!progressBar || !postDetail || postDetail.classList.contains('hidden')) {
        if (progressBar) progressBar.style.width = '0%';
        return;
    }

    const content = document.getElementById('postContent');
    if (!content) return;

    const totalHeight = content.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY - postDetail.offsetTop;
    let progress = (scrolled / totalHeight) * 100;

    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;
    
    progressBar.style.width = `${progress}%`;
}

function enterReadingMode() {
    const homeSection = document.getElementById('home');
    const aboutSection = document.getElementById('about');
    const progressBar = document.getElementById('readingProgressBar');
    
    if (homeSection) homeSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (progressBar) progressBar.style.opacity = '1';

    // 生成目录
    generateTableOfContents();
    // 包装代码块并添加复制按钮
    wrapCodeBlocks();
}

function exitReadingMode() {
    const homeSection = document.getElementById('home');
    const aboutSection = document.getElementById('about');
    const progressBar = document.getElementById('readingProgressBar');
    const tocContainer = document.getElementById('toc-container');
    
    if (homeSection) homeSection.style.display = 'block';
    if (aboutSection) aboutSection.style.display = 'block';
    if (progressBar) {
        progressBar.style.opacity = '0';
        progressBar.style.width = '0%';
    }
    // 移除目录
    if (tocContainer) {
        tocContainer.remove();
    }
}

// =======================
// 新增：文章目录 (TOC) 生成
// =======================
function generateTableOfContents() {
    const postContent = document.getElementById('postContent');
    if (!postContent) return;

    const headings = postContent.querySelectorAll('h2, h3');
    if (headings.length < 2) return; // 少于2个标题不生成目录

    const tocContainer = document.createElement('div');
    tocContainer.id = 'toc-container';
    tocContainer.className = 'toc-container';
    tocContainer.innerHTML = '<h3><i class="fas fa-list"></i> 目录</h3><ul class="toc-list"></ul>';
    const tocList = tocContainer.querySelector('.toc-list');

    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id; // 给标题设置ID以便锚点跳转
        
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

    // 插入到文章内容的开头
    postContent.prepend(tocContainer);
}

// =======================
// 新增：代码块一键复制
// =======================
function wrapCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.post-content pre');
    codeBlocks.forEach(block => {
        // 避免重复添加按钮
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
                console.error('复制失败:', err);
                copyButton.textContent = '失败';
            }
        });
        wrapper.appendChild(copyButton);
    });
}

// =======================
// 新增：回到顶部按钮
// =======================
function createBackToTopButton() {
    backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.setAttribute('aria-label', '回到顶部');
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(backToTopBtn);
}