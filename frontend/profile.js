document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: User Profile module loaded.");

    // 1. ดึงข้อมูลบัตรประจำตัว (localStorage)
    const savedUser = localStorage.getItem('cvafas_user');

    // 2. ถ้าไม่มีข้อมูล = แอบเข้าหน้าโปรไฟล์โดยไม่ล็อกอิน -> เตะกลับไปหน้า Login!
    if (!savedUser) {
        alert("🔒 กรุณาเข้าสู่ระบบก่อนเข้าใช้งานหน้าโปรไฟล์");
        window.location.href = 'login.html';
        return; // หยุดการทำงานของโค้ดที่เหลือ
    }

    // 3. ถ้าล็อกอินแล้ว ให้แกะกล่องข้อมูลผู้ใช้ออกมา
    const user = JSON.parse(savedUser);

    // 4. ดึง Elements บนหน้าจอมาเตรียมไว้
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const userBadgeEl = document.getElementById('userBadge');
    const trustScoreEl = document.getElementById('trustScore');
    const reportCountEl = document.getElementById('reportCount');
    const btnLogoutProfile = document.getElementById('btnLogoutProfile');

    // 5. เอาข้อมูลไปแปะบนหน้าจอ
    userNameEl.textContent = user.username;
    // เอาตัวอักษรตัวแรกของชื่อมาทำเป็นรูปโปรไฟล์เท่ๆ
    userAvatarEl.textContent = user.username.charAt(0).toUpperCase(); 
    
    // ใส่ Trust Score
    const score = user.trust_score || 0;
    trustScoreEl.textContent = score;

    // จำลองจำนวนเบาะแสที่แจ้ง (ในระบบจริงต้องไปดึงตารางใหม่จาก MySQL มานับ)
    // ตรงนี้เราเอาคะแนน Trust / 50 (เพราะเราแจกทีละ 50) มาจำลองจำนวนรีพอร์ตไปก่อน
    reportCountEl.textContent = Math.floor(score / 50);

    // 6. ระบบคำนวณยศ (Gamification Badges)
    // ถ้ายศเปลี่ยน สีของป้ายก็จะเปลี่ยนตามไปด้วย
    userBadgeEl.classList.remove('badge-bronze', 'badge-silver', 'badge-gold');
    
    if (score >= 500) {
        userBadgeEl.textContent = "🏆 ผู้พิทักษ์ไซเบอร์ (Gold)";
        userBadgeEl.classList.add('badge-gold');
    } else if (score >= 150) {
        userBadgeEl.textContent = "🛡️ สายลับระดับกลาง (Silver)";
        userBadgeEl.classList.add('badge-silver');
    } else {
        userBadgeEl.textContent = "🔰 พลเมืองดีไซเบอร์ (Bronze)";
        userBadgeEl.classList.add('badge-bronze');
    }

    // 7. สั่งงานปุ่ม "ออกจากระบบ" ในหน้าโปรไฟล์
    if (btnLogoutProfile) {
        btnLogoutProfile.addEventListener('click', function() {
            if(confirm("คุณต้องการออกจากระบบ C-VAFAS ใช่หรือไม่?")) {
                localStorage.removeItem('cvafas_user'); 
                window.location.href = 'index.html'; // เด้งไปหน้าแรก
            }
        });
    }
});