export function showPostDetail(postId, posts) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const postContent = document.getElementById('postContent');
    const postDetail = document.getElementById('postDetail');
    if (!postContent || !postDetail) return;
    
    // 使用marked解析Markdown
    postContent.innerHTML = marked.parse(post.content);
    
    // 高亮代码块
    postContent.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
    
    // ===== 渲染 LaTeX 公式 =====
    if (window.renderMathInElement) {
        window.renderMathInElement(postContent, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }
    // ==========================
    
    // ✅ 核心修复：适配双页面逻辑
    const isProfilePage = window.location.pathname.includes('profile.html');
    if (isProfilePage) {
        // 个人中心：隐藏个人中心文章列表
        const profilePostsSection = document.getElementById('profilePosts');
        if (profilePostsSection) profilePostsSection.classList.add('hidden');
    } else {
        // 首页：隐藏首页文章列表
        const postsSection = document.getElementById('posts');
        if (postsSection) postsSection.classList.add('hidden');
    }
    
    // 显示详情页
    postDetail.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function hidePostDetail() {
    const postDetail = document.getElementById('postDetail');
    if (postDetail) postDetail.classList.add('hidden');
    
    // ✅ 核心修复：返回时显示对应列表
    const isProfilePage = window.location.pathname.includes('profile.html');
    if (isProfilePage) {
        const profilePostsSection = document.getElementById('profilePosts');
        if (profilePostsSection) profilePostsSection.classList.remove('hidden');
    } else {
        const postsSection = document.getElementById('posts');
        if (postsSection) postsSection.classList.remove('hidden');
    }
}