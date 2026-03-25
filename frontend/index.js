// รอให้โครงสร้าง HTML โหลดเสร็จก่อนแล้วค่อยให้ JavaScript ทำงาน
document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Home module loaded.");

    // ==========================================
    // 1. ระบบจำลองสถิติแบบ Real-time (Live Stats)
    // ==========================================
    // กำหนดตัวเลขเริ่มต้น
    let blacklistCount = 15420;
    let blockedFilesCount = 342;

    // หาตำแหน่ง (Element) บนหน้าเว็บที่จะเอาตัวเลขไปแสดง
    // หมายเหตุ: ต้องตรวจสอบว่าใน index.html ของคุณมี id="stat-blacklist" และ id="stat-files" อยู่ในแถบ Header นะครับ
    const statBlacklist = document.getElementById('stat-blacklist');
    const statFiles = document.getElementById('stat-files');

    // ถ้าหา Elements เจอ ให้เริ่มจำลองการอัปเดตข้อมูล
    if (statBlacklist && statFiles) {
        // ใช้ setInterval ทำงานซ้ำๆ ทุกๆ 3.5 วินาที
        setInterval(() => {
            // สุ่มโอกาสเกิดเหตุการณ์ (ให้ตัวเลขดูขยับแบบเป็นธรรมชาติ ไม่ได้ขึ้นพร้อมกันเป๊ะๆ)
            const randomEvent = Math.random();

            if (randomEvent > 0.6) {
                // มีคนรายงานบัญชีดำเพิ่ม 1-3 บัญชี
                blacklistCount += Math.floor(Math.random() * 3) + 1;
                statBlacklist.innerText = `บัญชีดำ: ${blacklistCount.toLocaleString()}`;
                
                // ใส่เอฟเฟกต์กระพริบสีแดงเล็กน้อยเวลามีข้อมูลอัปเดต
                statBlacklist.style.color = '#e74c3c';
                setTimeout(() => statBlacklist.style.color = '', 500);
            }

            if (randomEvent > 0.8) {
                // มีไฟล์อันตรายถูกสกัดกั้นเพิ่ม 1 ไฟล์
                blockedFilesCount += 1;
                statFiles.innerText = `สกัดไฟล์: ${blockedFilesCount.toLocaleString()}`;
                
                // ใส่เอฟเฟกต์กระพริบสีเขียวเล็กน้อย
                statFiles.style.color = '#27ae60';
                setTimeout(() => statFiles.style.color = '', 500);
            }
        }, 3500); // 3500 มิลลิวินาที (3.5 วินาที)
    }

    // ==========================================
    // 2. เอฟเฟกต์คลิกเมนูการ์ด (Click Ripple/Feedback)
    // ==========================================
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // ถ้าคลิกโดนปุ่ม <a> ข้างใน ให้ข้ามไป ไม่ต้องทำเอฟเฟกต์ซ้ำซ้อน
            if(e.target.tagName.toLowerCase() === 'a') return;

            // ค้นหาลิงก์ที่อยู่ในการ์ดใบนั้น แล้วสั่งให้ทำงาน (ช่วยให้คลิกตรงไหนของการ์ดก็ไปหน้าต่อไปได้)
            const link = this.querySelector('a.btn');
            if (link) {
                window.location.href = link.href;
            }
        });

        // เปลี่ยนเมาส์เป็นรูปนิ้วชี้ เพื่อให้รู้ว่าทั้งกล่องกดได้
        card.style.cursor = 'pointer';
    });
});