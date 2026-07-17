// 模拟博客文章数据
const posts = [
    {
        title: "Hello World",
        date: "2026-07-17",
        url: "posts/hello-world.html"
    },
    {
        title: "博客搭建笔记",
        date: "2026-07-16",
        url: "#"
    }
];

// 渲染文章列表
function renderPosts() {
    const container = document.querySelector(".post-list");

    posts.forEach(post => {
        const article = document.createElement("article");
        article.className = "post-item";

        article.innerHTML = `
            <h2 class="post-title">
                <a href="${post.url}">${post.title}</a>
            </h2>
            <div class="post-date">${post.date}</div>
        `;

        container.appendChild(article);
    });
}

document.addEventListener("DOMContentLoaded", renderPosts);