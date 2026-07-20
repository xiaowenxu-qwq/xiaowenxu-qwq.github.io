export function renderPosts(posts, containerId = 'postsContainer') {
    const postsContainer = document.getElementById(containerId);
    if (!postsContainer) return;
    
    // 1. 按发布日期降序排序（最新的文章排在最前）
    const sortedPosts = [...posts].sort((a, b) => {
        const dateA = new Date(a.date.replace(/-/g, '/'));
        const dateB = new Date(b.date.replace(/-/g, '/'));
        return dateB - dateA; // 降序：新的日期更大，排在前面
    });
    
    // 2. 计算7天前的时间戳，用于判断是否为新文章
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    postsContainer.innerHTML = '';
    
    sortedPosts.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'post-card';
        postElement.dataset.id = post.id;
        
        // 3. 判断是否为7天内发布的新文章
        const postDate = new Date(post.date.replace(/-/g, '/'));
        const isNew = postDate >= sevenDaysAgo;
        
        postElement.innerHTML = `
            <div class="post-header">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span><i class="far fa-calendar"></i> ${post.date}</span>
                    <span><i class="fas fa-tag"></i> ${post.category}</span>
                    <!-- 最新文章标记 -->
                    <span class="post-date-badge ${isNew ? 'new' : ''}">
                        ${isNew ? '<i class="fas fa-star"></i> 最新' : ''}
                    </span>
                </div>
            </div>
            <div class="post-excerpt">
                ${post.excerpt}
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        postsContainer.appendChild(postElement);
    });
}