document.addEventListener('DOMContentLoaded', async () => {
    console.log("C-VAFAS: Randomized News Aggregator module loaded.");
    
    const newsContainer = document.getElementById('newsContainer');

    // โชว์แอนิเมชันกำลังโหลด
    newsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <div style="font-size: 3rem; animation: pulse 1.5s infinite;">🎲</div>
            <h3 style="color: #7f8c8d; margin-top: 1rem;">กำลังสุ่มและรวบรวมข่าวสารเตือนภัยไซเบอร์...</h3>
        </div>
    `;

    try {
        // 1. กำหนดแหล่งข่าว
        const searchQueries = [
            "ตำรวจไซเบอร์ บัญชีม้า",
            "เตือนภัย มิจฉาชีพ แก๊งคอลเซ็นเตอร์"
        ];

        // เติม Math.random() เพื่อบังคับให้ดึงข้อมูลใหม่เสมอ
        const rssUrls = [
            `https://news.google.com/rss/search?q=${encodeURIComponent(searchQueries[0])}&hl=th&gl=TH&ceid=TH:th&cb=${Math.random()}`,
            `https://news.google.com/rss/search?q=${encodeURIComponent(searchQueries[1])}&hl=th&gl=TH&ceid=TH:th&cb=${Math.random()}`,
            `https://www.bing.com/news/search?q=${encodeURIComponent("ภัยไซเบอร์ มิจฉาชีพ")}&format=rss&cc=th&cb=${Math.random()}`
        ];

        // 2. ยิง API ดึงข่าวพร้อมกัน
        const fetchPromises = rssUrls.map(url => {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
            return fetch(apiUrl).then(res => res.json()).catch(() => null); 
        });

        const results = await Promise.all(fetchPromises);

        // 3. รวมข่าวทั้งหมดเข้าด้วยกัน
        let allArticles = [];
        results.forEach(data => {
            if (data && data.status === 'ok') {
                allArticles = allArticles.concat(data.items);
            }
        });

        if (allArticles.length > 0) {
            newsContainer.innerHTML = ''; 

            // 4. ระบบคัดกรองข่าวซ้ำ
            const uniqueArticles = [];
            const seenTitles = new Set();
            
            allArticles.forEach(article => {
                let cleanTitle = article.title.split(" - ")[0].trim();
                if (!seenTitles.has(cleanTitle)) {
                    seenTitles.add(cleanTitle);
                    uniqueArticles.push(article);
                }
            });

            // 5. 🎲 ระบบสับไพ่ (Array Shuffling) - สุ่มตำแหน่งข่าวให้มั่วไปหมด!
            uniqueArticles.sort(() => Math.random() - 0.5);

            // ดึงมาแสดง 12 ข่าวที่ถูกสุ่มแล้ว
            const finalArticles = uniqueArticles.slice(0, 12);

            // รูปภาพสำรอง
            const fallbackImages = [
                'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=500&q=80',
                'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=500&q=80',
                'https://images.unsplash.com/photo-1614064641913-6b43cd2922e1?auto=format&fit=crop&w=500&q=80',
                'https://images.unsplash.com/photo-1510511459019-5d019796628b?auto=format&fit=crop&w=500&q=80'
            ];

            finalArticles.forEach((article, index) => {
                const pubDate = new Date(article.pubDate).toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                // ลอจิกควานหารูปภาพ
                let imageUrl = fallbackImages[index % fallbackImages.length]; 
                if (article.enclosure && article.enclosure.link) {
                    imageUrl = article.enclosure.link;
                } else {
                    const imgMatch = article.description.match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch && imgMatch[1]) imageUrl = imgMatch[1];
                }

                // วิเคราะห์ชื่อสำนักข่าว
                let title = article.title;
                let source = "สำนักข่าวไซเบอร์";
                if (title.includes(" - ")) {
                    const parts = title.split(" - ");
                    source = parts.pop(); 
                    title = parts.join(" - "); 
                } else if (article.author) {
                    source = article.author;
                }

                // สุ่มสีป้ายกำกับให้ดูตื่นเต้น!
                const badgeColors = ["#e74c3c", "#e67e22", "#2c3e50", "#8e44ad"];
                const randomBadgeColor = badgeColors[Math.floor(Math.random() * badgeColors.length)];

                // 6. สร้างการ์ด HTML
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card fade-in';
                newsCard.innerHTML = `
                    <div style="position: relative;">
                        <img src="${imageUrl}" alt="News Image" class="news-img" onerror="this.src='${fallbackImages[0]}'">
                        <span class="badge" style="position: absolute; top: 10px; left: 10px; background: ${randomBadgeColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">
                            🚨 ข่าวเตือนภัย
                        </span>
                    </div>
                    <div class="news-content">
                        <div style="margin-bottom: 8px;">
                            <span style="font-size: 0.8rem; color: #3498db; font-weight: bold;">🗞️ ${source}</span>
                        </div>
                        <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem; line-height: 1.4;">
                            <a href="${article.link}" target="_blank" style="color: #2c3e50; text-decoration: none;">${title}</a>
                        </h3>
                        <p style="color: #95a5a6; font-size: 0.85rem; margin-bottom: 1.5rem; flex-grow: 1;">
                            🕒 อัปเดต: ${pubDate} น.
                        </p>
                        <a href="${article.link}" target="_blank" class="btn" style="background: transparent; border: 2px solid #2c3e50; color: #2c3e50; text-align: center; padding: 8px; transition: all 0.3s;">
                            อ่านที่ ${source} ➡️
                        </a>
                    </div>
                `;
                newsContainer.appendChild(newsCard);
            });
        } else {
            throw new Error("ไม่พบข้อมูลข่าวสารจากแหล่งข่าว");
        }

    } catch (error) {
        console.error("Error fetching news:", error);
        newsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #e74c3c; padding: 2rem;">
                <p>❌ ระบบรวบรวมข่าวสารขัดข้อง โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
            </div>
        `;
    }
});