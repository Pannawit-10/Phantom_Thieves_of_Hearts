document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Home module loaded.");

    // ==========================================
    // 1. 📊 ระบบสถิติแบบ Real-time (ดึงจาก MySQL จริง!)
    // ==========================================
    const statBlacklist = document.getElementById('stat-blacklist');
    const statFiles = document.getElementById('stat-files');

    // ฟังก์ชันดึงข้อมูลจากหลังบ้าน
    async function fetchRealStats() {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/stats');
            const data = await response.json();

            if (data.success && statBlacklist) {
                // เอาตัวเลขจริงจากฐานข้อมูลมาแสดง + ใส่ลูกน้ำ (comma) ให้สวยงาม
                statBlacklist.innerText = `ฐานข้อมูลมิจฉาชีพ: ${data.total_blacklist.toLocaleString()} รายการ`;
                
                // ใส่เอฟเฟกต์กระพริบเวลามีการอัปเดตข้อมูลใหม่ๆ
                statBlacklist.style.color = '#e74c3c';
                setTimeout(() => statBlacklist.style.color = '', 500);
            }
        } catch (error) {
            console.log("C-VAFAS: ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์สถิติได้");
        }
    }

    // 1. ดึงข้อมูลทันทีที่เปิดหน้าเว็บ
    fetchRealStats();

    // 2. ตั้งเวลาให้ดึงข้อมูลอัปเดตใหม่ทุกๆ 10 วินาที (Real-time Sync)
    setInterval(fetchRealStats, 10000); 

    // (ส่วนของ statFiles ถ้ายังไม่มีตารางเก็บในฐานข้อมูล สามารถใช้โค้ดจำลองที่คุณเขียนไว้ก่อนได้ครับ)
    if (statFiles) {
        let blockedFilesCount = 342;
        setInterval(() => {
            if (Math.random() > 0.7) {
                blockedFilesCount += 1;
                statFiles.innerText = `สกัดไฟล์อันตราย: ${blockedFilesCount.toLocaleString()} ครั้ง`;
                statFiles.style.color = '#27ae60';
                setTimeout(() => statFiles.style.color = '', 500);
            }
        }, 3500);
    }

    // ==========================================
    // 2. เอฟเฟกต์คลิกเมนูการ์ด (Click Ripple/Feedback)
    // ==========================================
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            if(e.target.tagName.toLowerCase() === 'a') return;
            const link = this.querySelector('a.btn');
            if (link) {
                window.location.href = link.href;
            }
        });
        card.style.cursor = 'pointer';
    });
});