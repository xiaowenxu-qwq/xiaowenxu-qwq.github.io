export function spawnKangaroos(x, y) {
    const kangarooCount = Math.floor(Math.random() * 4) + 4; // 4-7只袋鼠
    const kangarooEmojis = ['🦘', '🦘', '🦘', '🦘', '💨', '✨', '🌟'];
    
    for (let i = 0; i < kangarooCount; i++) {
        const kangaroo = document.createElement('div');
        kangaroo.className = 'kangaroo';
        kangaroo.textContent = kangarooEmojis[Math.floor(Math.random() * kangarooEmojis.length)];
        
        // 四散参数
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 120;
        const scatterX = Math.cos(angle) * distance;
        const scatterY = Math.sin(angle) * distance;
        const spinDeg = (Math.random() - 0.5) * 720;
        
        // 设置CSS变量
        kangaroo.style.left = `${x}px`;
        kangaroo.style.top = `${y}px`;
        kangaroo.style.setProperty('--scatter-x', `${scatterX}px`);
        kangaroo.style.setProperty('--scatter-y', `${scatterY}px`);
        kangaroo.style.setProperty('--spin-deg', `${spinDeg}deg`);
        
        document.body.appendChild(kangaroo);
        
        // 触发动画
        requestAnimationFrame(() => {
            kangaroo.classList.add('scatter');
        });
        
        // 清理
        setTimeout(() => {
            kangaroo.remove();
        }, 800);
    }
}