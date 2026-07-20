import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

let allPosts = [];
let filteredPosts = [];
const MAX_HISTORY = 5; // 最多保存5条历史

// =======================
// DOM元素缓存
// =======================
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const searchHistory = document.getElementById('searchHistory');
const searchHistoryList = document.getElementById('searchHistoryList');
const clearHistoryBtn = document.getElementById('clearHistory');

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
    loadSearchHistory(); // 加载历史记录
    createProgressBar(); // 创建进度条DOM
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
            if (searchHistoryList.children.length > 0) {
                searchHistory.classList.add('visible');
            }
        });
        searchInput.addEventListener('blur', () => {
            // 延迟隐藏，允许点击历史项
            setTimeout(() => searchHistory.classList.remove('visible'), 200);
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
            searchInput.value = '';
            filterPosts('');
            toggleClearButton('');
            searchInput.focus();
        });
    }

    // 搜索历史点击代理
    if (searchHistoryList) {
        searchHistoryList.addEventListener('click', (e) => {
            const item = e.target.closest('.search-history-item');
            if (item) {
                const keyword = item.dataset.keyword;
                searchInput.value = keyword;
                filterPosts(keyword);
                toggleClearButton(keyword);
                searchHistory.classList.remove('visible');
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

    // 监听滚动更新进度条
    window.addEventListener('scroll', handleScroll);

    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId.includes('#home') || targetId.includes('#posts') || targetId.includes('#about')) {
                exitReadingMode();
            }
            
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
// 搜索处理函数
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
// 搜索历史逻辑 (LocalStorage)
// =======================
function loadSearchHistory() {
    const history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
    renderSearchHistory(history);
}

function saveSearchHistory(keyword) {
    if (!keyword) return;
    let history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
    // 去重并插入到最前面
    history = history.filter(item => item !== keyword);
    history.unshift(keyword);
    // 限制长度
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
        searchHistory.classList.remove('visible');
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
// 阅读模式 & 进度条
// =======================
function createProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    progressBar.id = 'readingProgressBar';
    document.body.appendChild(progressBar);
}

function handleScroll() {
    const progressBar = document.getElementById('readingProgressBar');
    const postDetail = document.getElementById('postDetail');
    
    if (!progressBar || !postDetail || postDetail.classList.contains('hidden')) {
        if (progressBar) progressBar.style.width = '0%';
        return;
    }

    // 计算阅读进度
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
}

function exitReadingMode() {
    const homeSection = document.getElementById('home');
    const aboutSection = document.getElementById('about');
    const progressBar = document.getElementById('readingProgressBar');
    
    if (homeSection) homeSection.style.display = 'block';
    if (aboutSection) aboutSection.style.display = 'block';
    if (progressBar) {
        progressBar.style.opacity = '0';
        progressBar.style.width = '0%';
    }
}