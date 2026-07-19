export function showPostDetail(postId, posts) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const postContent = document.getElementById('postContent');
    const postDetail = document.getElementById('postDetail');
    const postsSection = document.getElementById('posts');
    
    if (!postContent || !postDetail || !postsSection) return;
    
    // 使用marked解析Markdown
    postContent.innerHTML = marked.parse(post.content);
    
    // 高亮代码块
    postContent.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
    
    // 显示详情，隐藏列表
    postsSection.classList.add('hidden');
    postDetail.classList.remove('hidden');
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function hidePostDetail() {
    const postDetail = document.getElementById('postDetail');
    const postsSection = document.getElementById('posts');
    
    if (postDetail) postDetail.classList.add('hidden');
    if (postsSection) postsSection.classList.remove('hidden');
}