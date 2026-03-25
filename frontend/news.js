document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Community News & Threat Feed loaded.");

    // ==========================================
    // 1. ระบบอนิเมชันตัวเลขสถิติ (Number Counter Animation)
    // ทำให้ตัวเลขวิ่งขึ้นจาก 0 ไปจนถึงยอดจริงตอนโหลดหน้าเว็บ
    // ==========================================
    const statNumbers = document.querySelectorAll('.stat-box strong');
    
    statNumbers.forEach(stat => {
        // ดึงตัวเลขจาก HTML (เช่น "142")
        const targetValue = parseInt(stat.innerText.replace(/,/g, ''));
        let currentValue = 0;
        
        // คำนวณความเร็วให้ตัวเลขวิ่งเสร็จในเวลาไล่เลี่ยกัน (ประมาณ 1.5 วินาที)
        const increment = Math.ceil(targetValue / 60); 
        
        const counter = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                stat.innerText = targetValue.toLocaleString(); // ใส่ลูกน้ำให้ตัวเลข
                clearInterval(counter);
            } else {
                stat.innerText = currentValue.toLocaleString();
            }
        }, 25); // อัปเดตทุกๆ 25 มิลลิวินาที
    });

    // ==========================================
    // 2. ระบบ Live Alerts Feed (จำลองข้อมูลไหลเข้าแบบ Real-time)
    // ==========================================
    const alertList = document.querySelector('.alert-list');
    
    // ฐานข้อมูลจำลองสำหรับสุ่มแจ้งเตือน
    const mockLiveAlerts = [
        { type: "danger", text: "เบอร์โทร 061-xxx-xxxx ถูกรายงาน (หลอกให้กดลิงก์ PEA)" },
        { type: "warning", text: "พบผู้ใช้ค้นหาบัญชีม้า ธ.สีเขียว บ่อยผิดปกติในเขตภาคเหนือ" },
        { type: "info", text: "ระบบ Lab สกัดกั้นไฟล์ 'ใบแจ้งหนี้.pdf.exe' สำเร็จ" },
        { type: "danger", text: "ผู้ใช้ระดับ Silver เพิ่มบัญชีนาย สมชาย เข้าสู่ Blacklist" },
        { type: "info", text: "อัปเดตฐานข้อมูล Magic Bytes สำเร็จ (เวอร์ชัน 2.4.1)" },
        { type: "warning", text: "พบการแพร่ระบาดของลิงก์หลอกแจกเงินดิจิทัลทาง SMS" }
    ];

    // ฟังก์ชันสร้างเวลาปัจจุบัน (ฟอร์แมต [HH:MM:SS])
    function getCurrentTime() {
        const now = new Date();
        return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    }

    // ฟังก์ชันเพิ่มแจ้งเตือนใหม่เข้าไปในหน้าเว็บ
    function addLiveAlert() {
        if (!alertList) return;

        // สุ่มเลือกข้อความจากฐานข้อมูลจำลอง
        const randomAlert = mockLiveAlerts[Math.floor(Math.random() * mockLiveAlerts.length)];
        
        // สร้าง Element <li> ใหม่
        const newLi = document.createElement('li');
        newLi.style.opacity = '0'; // ตั้งค่าโปร่งใสก่อนเพื่อทำเอฟเฟกต์ Fade-in
        newLi.style.transform = 'translateY(-10px)'; // ดึงขึ้นไปนิดนึงเพื่อทำเอฟเฟกต์เลื่อนลง
        newLi.style.transition = 'all 0.5s ease';
        
        // กำหนดสีตามประเภทการแจ้งเตือน
        let timeColor = "#333";
        if (randomAlert.type === "danger") timeColor = "#e74c3c";
        if (randomAlert.type === "warning") timeColor = "#f39c12";
        if (randomAlert.type === "info") timeColor = "#3498db";

        newLi.innerHTML = `<strong style="color: ${timeColor};">${getCurrentTime()}</strong> ${randomAlert.text}`;

        // แทรกข้อความใหม่ไว้บนสุดของรายการ
        alertList.insertBefore(newLi, alertList.firstChild);

        // ให้บราวเซอร์วาด (Render) ก่อน แล้วค่อยสั่งแสดงผลให้เกิดแอนิเมชัน
        setTimeout(() => {
            newLi.style.opacity = '1';
            newLi.style.transform = 'translateY(0)';
        }, 50);

        // เลี้ยงจำนวนข้อความไว้ไม่ให้เกิน 5 บรรทัด (ลบอันเก่าสุดทิ้ง)
        if (alertList.children.length > 5) {
            const lastItem = alertList.lastChild;
            lastItem.style.opacity = '0'; // เฟดอันเก่าออก
            setTimeout(() => {
                if(alertList.contains(lastItem)) {
                    alertList.removeChild(lastItem);
                }
            }, 500);
        }
    }

    // สั่งให้ระบบดันข้อมูลใหม่เข้ามาทุกๆ 4-7 วินาที (สุ่มเวลาให้ดูเป็นธรรมชาติ)
    (function loopFeed() {
        const randomTime = Math.floor(Math.random() * 3000) + 4000;
        setTimeout(() => {
            addLiveAlert();
            loopFeed(); // เรียกตัวเองซ้ำ (Recursive)
        }, randomTime);
    })();

});