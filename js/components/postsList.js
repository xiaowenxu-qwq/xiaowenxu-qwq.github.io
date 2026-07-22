export function renderPosts(posts, containerId = 'postsContainer') {
    const postsContainer = document.getElementById(containerId);
    if (!postsContainer) {
        console.warn(`⚠️ 容器 #${containerId} 不存在`);
        return;
    }

    // ✅ 空数组时显示友好提示
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-book-open"></i>
                <p>暂无文章</p>
                <span class="no-results-hint">请稍后再来查看</span>
            </div>
        `;
        return;
    }

    // 按日期降序排序
    const sortedPosts = [...posts].sort((a, b) => {
        const dateA = new Date(a.date.replace(/-/g, '/'));
        const dateB = new Date(b.date.replace(/-/g, '/'));
        return dateB - dateA;
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    postsContainer.innerHTML = '';

    sortedPosts.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'post-card';
        postElement.dataset.id = post.id;

        const postDate = new Date(post.date.replace(/-/g, '/'));
        const isNew = postDate >= sevenDaysAgo;

        postElement.innerHTML = `
            <div class="post-header">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span><i class="far fa-calendar"></i> ${post.date}</span>
                    <span><i class="fas fa-tag"></i> ${post.category}</span>
                    <span class="post-date-badge ${isNew ? 'new' : ''}">
                        ${isNew ? '<i class="fas fa-star"></i> 最新' : ''}
                    </span>
                </div>
            </div>
            <div class="post-excerpt">${post.excerpt}</div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;

        postsContainer.appendChild(postElement);
    });
}