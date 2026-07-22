import { posts } from './data/posts.js';
import { renderPosts } from './components/postsList.js';
import { showPostDetail, hidePostDetail } from './components/postDetail.js';
import { toggleTheme, initializeTheme } from './components/theme.js';
import { spawnKangaroos } from './utils/kangaroo.js';
import { smoothScrollTo } from './utils/helpers.js';

let allPosts = [];
let filteredPosts = [];
const MAX_HISTORY = 5;

// ✅ 内存存储替代 LocalStorage（解决 file:// 协议问题）
let memoryStorage = {
    theme: null,
    searchHistory: []
};

// 安全获取DOM元素
const safeGetElement = (id) => document.getElementById(id);
const searchInput = safeGetElement('searchInput');
const searchClear = safeGetElement('searchClear');
const searchHistory = safeGetElement('searchHistory');
const searchHistoryList = safeGetElement('searchHistoryList');
const clearHistoryBtn = safeGetElement('clearHistory');
let backToTopBtn;

// ✅ 检测是否支持 LocalStorage（用于主题持久化）
function isLocalStorageSupported() {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

const canUseLocalStorage = isLocalStorageSupported();

// =======================
// 初始化
// =======================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Blog initialized');
    console.log('📄 Current page:', window.location.pathname);
    console.log('🔧 LocalStorage supported:', canUseLocalStorage);
    
    allPosts = posts || [];
    filteredPosts = [...allPosts];
    
    // 渲染文章列表
    const postsContainer = safeGetElement('postsContainer');
    const profilePostsContainer = safeGetElement('profilePostsContainer');
    
    if (postsContainer) {
        console.log('🏠 Rendering posts on homepage');
        renderPosts(filteredPosts, 'postsContainer');
    }
    
    if (profilePostsContainer) {
        console.log('👤 Rendering posts on profile page');
        renderPosts(filteredPosts, 'profilePostsContainer');
    }
    
    setupEventListeners();
    initializeTheme();
    
    // 延迟高亮，确保DOM已渲染
    setTimeout(() => {
        hljs.highlightAll();
    }, 100);
    
    // 只在主站加载搜索历史
    if (searchInput && canUseLocalStorage) {
        loadSearchHistory();
    }
    
    createProgressBar();
    createBackToTopButton();
});

// =======================
// 事件监听器
// =======================
function setupEventListeners() {
    const postsContainer = safeGetElement('postsContainer');
    const profilePostsContainer = safeGetElement('profilePostsContainer');
    const backBtn = safeGetElement('backBtn');
    const themeToggle = safeGetElement('themeToggle');
    
    // 文章点击（支持双容器）
    [postsContainer, profilePostsContainer].forEach(container => {
        if (container) {
            container.addEventListener('click', function(e) {
                const postCard = e.target.closest('.post-card');
                if (postCard) {
                    const postId = parseInt(postCard.dataset.id);
                    showPostDetail(postId, allPosts);
                    enterReadingMode();
                }
            });
        }
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            exitReadingMode();
            hidePostDetail();
        });
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // 搜索相关（仅在支持且存在时绑定）
    if (searchInput && canUseLocalStorage) {
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
    
    // 全局点击袋鼠特效
    document.addEventListener('click', (e) => {
        spawnKangaroos(e.clientX, e.clientY);
    });

    window.addEventListener('scroll', handleScroll);

    // 侧边栏导航逻辑
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            
            // 在个人中心页面，强制回主站
            if (window.location.pathname.includes('profile.html')) {
                if (targetHref.includes('#home') || targetHref === 'index.html') {
                    window.location.href = 'index.html';
                    return;
                }
                window.location.href = targetHref;
                return;
            }

            // 主站逻辑
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

            const postDetail = safeGetElement('postDetail');
            if (postDetail && !postDetail.classList.contains('hidden')) {
                e.preventDefault();
                exitReadingMode();
                hidePostDetail();
                setTimeout(() => {
                    if (targetHref.startsWith('#') && document.querySelector(targetHref)) {
                        smoothScrollTo(targetHref);
                    }
                }, 100);
                return;
            }

            if (targetHref.startsWith('#') && document.querySelector(targetHref)) {
                e.preventDefault();
                smoothScrollTo(targetHref);
            }
        });
    });
}

// =======================
// 搜索函数
// =======================
function handleSearchInput() {
    if (!searchInput) return;
    const keyword = searchInput.value.trim();
    filterPosts(keyword);
    toggleClearButton(keyword);
}

function filterPosts(keyword) {
    const noResults = safeGetElement('noResults');
    const profileNoResults = safeGetElement('profileNoResults');
    
    if (!keyword) {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => 
            post.title.toLowerCase().includes(keyword.toLowerCase()) ||
            post.category.toLowerCase().includes(keyword.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
        );
    }
    
    const postsContainer = safeGetElement('postsContainer');
    const profilePostsContainer = safeGetElement('profilePostsContainer');
    
    if (postsContainer) {
        renderPosts(filteredPosts, 'postsContainer');
    }
    
    if (profilePostsContainer) {
        renderPosts(filteredPosts, 'profilePostsContainer');
    }
    
    if (noResults) {
        if (filteredPosts.length === 0 && keyword) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }
    
    if (profileNoResults) {
        if (filteredPosts.length === 0 && keyword) {
            profileNoResults.classList.remove('hidden');
        } else {
            profileNoResults.classList.add('hidden');
        }
    }
}

function toggleClearButton(keyword) {
    if (searchClear) {
        searchClear.classList.toggle('visible', !!keyword);
    }
}

// =======================
// 搜索历史（内存存储版）
// =======================
function loadSearchHistory() {
    if (!canUseLocalStorage) return;
    
    try {
        const history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
        renderSearchHistory(history);
    } catch (e) {
        console.warn('Failed to load search history:', e);
        renderSearchHistory([]);
    }
}

function saveSearchHistory(keyword) {
    if (!canUseLocalStorage || !keyword || !searchHistoryList) return;
    
    try {
        let history = JSON.parse(localStorage.getItem('blogSearchHistory') || '[]');
        history = history.filter(item => item !== keyword);
        history.unshift(keyword);
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }
        localStorage.setItem('blogSearchHistory', JSON.stringify(history));
        renderSearchHistory(history);
    } catch (e) {
        console.warn('Failed to save search history:', e);
    }
}

function clearSearchHistory() {
    if (!canUseLocalStorage) return;
    
    try {
        localStorage.removeItem('blogSearchHistory');
        renderSearchHistory([]);
    } catch (e) {
        console.warn('Failed to clear search history:', e);
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

// =======================
// 阅读模式 & 进度条 & TOC
// =======================
function createProgressBar() {
    if (document.getElementById('readingProgressBar')) return;
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    progressBar.id = 'readingProgressBar';
    document.body.appendChild(progressBar);
}

function handleScroll() {
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
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
    let progress = (scrolled / totalHeight) * 100;

    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;
    
    progressBar.style.width = `${progress}%`;
}

function enterReadingMode() {
    const homeSection = safeGetElement('home');
    const aboutSection = safeGetElement('about');
    const profileSection = safeGetElement('profile');
    const profilePostsSection = safeGetElement('profilePosts');
    const progressBar = safeGetElement('readingProgressBar');
    
    if (homeSection) homeSection.style.display = 'none';
    if (aboutSection) aboutSection.style.display = 'none';
    if (profileSection) profileSection.style.display = 'none';
    if (profilePostsSection) profilePostsSection.style.display = 'none';
    if (progressBar) progressBar.style.opacity = '1';

    generateTableOfContents();
    wrapCodeBlocks();
}

function exitReadingMode() {
    const homeSection = safeGetElement('home');
    const aboutSection = safeGetElement('about');
    const profileSection = safeGetElement('profile');
    const profilePostsSection = safeGetElement('profilePosts');
    const progressBar = safeGetElement('readingProgressBar');
    const tocContainer = safeGetElement('toc-container');
    
    if (homeSection) homeSection.style.display = 'block';
    if (aboutSection) aboutSection.style.display = 'block';
    if (profileSection) profileSection.style.display = 'block';
    if (profilePostsSection) profilePostsSection.style.display = 'block';
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