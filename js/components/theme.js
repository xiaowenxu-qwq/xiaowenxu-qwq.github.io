// ✅ 内存存储替代 LocalStorage
let memoryTheme = null;

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

export function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle?.querySelector('i');
    
    if (!icon) return;
    
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    
    if (canUseLocalStorage) {
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch (e) {
            console.warn('Failed to save theme to localStorage');
        }
    } else {
        memoryTheme = isDark ? 'dark' : 'light';
    }
    
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

export function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle?.querySelector('i');
    
    if (!icon) return;
    
    let savedTheme = null;
    
    if (canUseLocalStorage) {
        try {
            savedTheme = localStorage.getItem('theme');
        } catch (e) {
            console.warn('Failed to load theme from localStorage');
        }
    } else {
        savedTheme = memoryTheme;
    }
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-theme');
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}