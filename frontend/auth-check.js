document.addEventListener('DOMContentLoaded', function() {
    // 1. ค้นหาปุ่ม Login ในเมนูบาร์ (อ้างอิงจากคลาส .nav-login)
    const loginNav = document.querySelector('.nav-login');
    
    // ถ้าหน้านี้ไม่มีเมนูบาร์ (เช่น หน้าพัง) ให้ข้ามไปเลย
    if (!loginNav) return; 

    // 2. ตรวจสอบว่ามีการล็อกอินค้างไว้ในเครื่องหรือไม่
    const savedUser = localStorage.getItem('cvafas_user');

    if (savedUser) {
        // 🟢 กรณีที่: ล็อกอินอยู่
        // แปลงข้อมูลจากข้อความ JSON กลับมาเป็น Object เพื่อดึงชื่อ
        const user = JSON.parse(savedUser);
        
        // 3. เปลี่ยนหน้าตาปุ่มบนเมนูบาร์
        loginNav.innerHTML = `👤 สวัสดี, ${user.username} <span style="font-size: 0.8em; color: #f1c40f;">(Trust: ${user.trust_score})</span>`;
        loginNav.href = "profile.html"; // เปลี่ยนให้ลิงก์ไปหน้า Profile
        loginNav.style.backgroundColor = "#27ae60"; // เปลี่ยนเป็นสีเขียว
        loginNav.style.color = "white";

        // 4. สร้างปุ่ม "ออกจากระบบ" แปะไว้ข้างๆ
        const navBar = loginNav.parentElement; // ดึงแถบ <nav> ออกมา
        
        const logoutBtn = document.createElement('a');
        logoutBtn.href = "#";
        logoutBtn.innerHTML = "🚪 ออกจากระบบ";
        logoutBtn.style.color = "#e74c3c";
        logoutBtn.style.fontWeight = "bold";
        logoutBtn.style.marginLeft = "15px";
        
        // 5. สั่งงานปุ่มออกจากระบบ
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if(confirm("คุณต้องการออกจากระบบ C-VAFAS ใช่หรือไม่?")) {
                // ลบบัตรประจำตัวออกจากเครื่อง
                localStorage.removeItem('cvafas_user'); 
                alert("ออกจากระบบเรียบร้อยแล้ว ไว้พบกันใหม่ครับ!");
                // รีเฟรชหน้าเว็บ 1 รอบ เพื่อให้เมนูกลับเป็นเหมือนเดิม
                window.location.reload(); 
            }
        });

        // เอาปุ่ม Logout ไปแปะในเมนูบาร์
        navBar.appendChild(logoutBtn);
    } else {
        // 🔴 กรณีที่: ยังไม่ล็อกอิน (ไม่ต้องทำอะไร ปล่อยให้ปุ่มเป็น Login / Profile เหมือนเดิม)
        console.log("C-VAFAS Auth: Guest Mode (ยังไม่เข้าสู่ระบบ)");
    }
});