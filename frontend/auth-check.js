document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 🛡️ ระบบตรวจสอบสถานะล็อกอินและจัดการ Navbar
    // ==========================================
    const savedUserStr = localStorage.getItem('cvafas_user');
    
    if (savedUserStr) {
        const userObj = JSON.parse(savedUserStr);
        
        // ค้นหาปุ่ม Login บน Navbar (ใช้ class .nav-login จะแม่นยำที่สุด)
        const loginBtn = document.querySelector('.nav-login');

        if (loginBtn) {
            // สร้างกล่อง (div) มาครอบปุ่มชื่อและปุ่มออกระบบให้อยู่ด้วยกัน ไม่แตกแถว
            const userMenuBox = document.createElement('div');
            userMenuBox.style.display = 'inline-flex';
            userMenuBox.style.alignItems = 'center';
            userMenuBox.style.gap = '15px'; // ระยะห่างระหว่างปุ่มชื่อกับปุ่มออกระบบ

            userMenuBox.innerHTML = `
                <a href="profile.html" style="background-color: #27ae60; color: white; padding: 5px 15px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 0.95rem; white-space: nowrap;">
                    <i class="fa-solid fa-user-shield"></i> <span data-i18n="nav_hello">สวัสดี</span>, ${userObj.username} 
                    <span style="color: #f1c40f; font-size: 0.85rem;">(Trust: ${userObj.trust_score || 0})</span>
                </a>
                <a href="#" id="btnLogout" style="color: #e74c3c; text-decoration: none; font-size: 0.95rem; font-weight: bold; white-space: nowrap;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> <span data-i18n="profile_btn_logout">ออกจากระบบ</span>
                </a>
            `;

            // สลับร่างปุ่ม Login เดิม ให้กลายเป็นกล่อง User Menu ที่เราสร้างขึ้น
            loginBtn.replaceWith(userMenuBox);

            // สั่งให้ปุ่ม "ออกจากระบบ" ทำงานได้จริง
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('cvafas_user'); // ล้างข้อมูล
                window.location.href = 'index.html'; // เด้งกลับไปหน้าแรก
            });
        }
    }
});