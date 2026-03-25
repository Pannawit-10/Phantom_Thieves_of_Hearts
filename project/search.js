document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Smart Search module loaded.");

    // 1. ดึง Elements ที่ต้องใช้งาน
    const searchInput = document.getElementById('searchInput');
    const btnSearch = document.getElementById('btnSearch');
    const searchResult = document.getElementById('searchResult');
    
    // Elements สำหรับอัปเดตข้อมูลในการ์ดผลลัพธ์
    const threatHeader = searchResult.querySelector('.threat-header');
    const statusTitle = searchResult.querySelector('.threat-status h2');
    const statusDesc = searchResult.querySelector('.threat-status p');
    const scoreNumber = searchResult.querySelector('.score-number');
    
    const dataSearched = searchResult.querySelector('.data-row:nth-child(1) .data-value');
    const dataType = searchResult.querySelector('.data-row:nth-child(2) .data-value');
    const dataName = searchResult.querySelector('.data-row:nth-child(3) .data-value');
    const dataBehavior = searchResult.querySelector('.data-row:nth-child(4) .data-value');
    const behaviorRow = searchResult.querySelector('.data-row:nth-child(4)');

    // ซ่อนผลลัพธ์ไว้ก่อนเมื่อเริ่มโหลดหน้า
    if (searchResult) searchResult.style.display = 'none';

    // ==========================================
    // 2. ฐานข้อมูลจำลอง (Mock Blacklist Database)
    // ==========================================
    // ในระบบจริง ข้อมูลนี้จะถูกดึงมาจาก MySQL ผ่าน Node.js API
    const blacklistDB = {
        "0987654321": {
            risk: "high", score: 142, type: "เบอร์โทรศัพท์",
            name: "ไม่ทราบชื่อ (แก๊งคอลเซ็นเตอร์)", 
            behavior: "แอบอ้างเป็นเจ้าหน้าที่รัฐ, ข่มขู่ให้โอนเงินเพื่อตรวจสอบบัญชี"
        },
        "1234567890": {
            risk: "high", score: 58, type: "บัญชีธนาคาร (ธ.สีเหลือง)",
            name: "นาย สมชาย ม****", 
            behavior: "หลอกขายสินค้าออนไลน์ (โมเดลฟิกเกอร์) แล้วไม่ยอมส่งของ"
        },
        "shopee-vip-claim.com": {
            risk: "high", score: 12, type: "ลิงก์เว็บไซต์ปลอม (Phishing)",
            name: "เว็บไซต์อันตราย", 
            behavior: "หลอกให้กรอกข้อมูลบัตรเครดิตและรหัส OTP โดยอ้างว่าได้รับรางวัล"
        },
        "0811111111": {
            risk: "med", score: 3, type: "เบอร์โทรศัพท์",
            name: "รอการยืนยันข้อมูล", 
            behavior: "โทรมาแล้วตัดสายทิ้งบ่อยครั้ง อาจเป็นเบอร์สำหรับเช็กสถานะการใช้งาน"
        }
    };

    // ==========================================
    // 3. ระบบค้นหาอัจฉริยะ (Smart Search & Regex)
    // ==========================================
    
    // ผูก Event การกดปุ่มคลิก และ การกดปุ่ม Enter บนคีย์บอร์ด
    btnSearch.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    function performSearch() {
        const rawInput = searchInput.value.trim();
        
        if (rawInput === "") {
            alert("กรุณากรอกเลขบัญชี เบอร์โทร หรือลิงก์ที่ต้องการตรวจสอบ");
            return;
        }

        // --- ระบบ Data Extraction (สกัดข้อมูลอัจฉริยะ) ---
        let cleanQuery = rawInput;
        
        // ถ้าเป็นลิงก์ (URL)
        if (rawInput.includes("http://") || rawInput.includes("https://") || rawInput.includes(".com")) {
            // ใช้ Regex ดึงเฉพาะตัวโดเมนเนมออกมา
            const urlMatch = rawInput.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+)/);
            if (urlMatch) cleanQuery = urlMatch[1]; 
        } else {
            // ถ้าเป็นข้อความทั่วไป ให้สกัดเอาเฉพาะ "ตัวเลข" ที่ติดกันยาวๆ (เช่น เลขบัญชีหรือเบอร์โทร)
            // ลบช่องว่าง และ ขีด (-) ออกให้หมดก่อน
            const onlyNumbers = rawInput.replace(/[-\s]/g, "");
            const numberMatch = onlyNumbers.match(/\d{10,12}/); // หาตัวเลขที่ยาว 10-12 หลัก
            if (numberMatch) {
                cleanQuery = numberMatch[0];
            } else {
                cleanQuery = onlyNumbers; // ถ้าหาไม่เจอ ให้ใช้ตัวเลขทั้งหมดที่กรอกมา
            }
        }

        // เปลี่ยนปุ่มเป็นสถานะกำลังค้นหา
        btnSearch.textContent = "กำลังตรวจสอบ...";
        btnSearch.disabled = true;

        // จำลองความหน่วงของเซิร์ฟเวอร์ (Loading delay) 1 วินาที
        setTimeout(() => {
            btnSearch.textContent = "ตรวจสอบข้อมูล";
            btnSearch.disabled = false;
            
            // ค้นหาในฐานข้อมูลจำลอง
            const result = blacklistDB[cleanQuery];

            if (result) {
                // กรณี: เจอประวัติอาชญากรรม!
                showResult(cleanQuery, result);
            } else {
                // กรณี: ไม่พบข้อมูล (แต่ต้องเตือนให้ระวังอยู่ดี)
                showSafeResult(cleanQuery);
            }
        }, 1000);
    }

    // ==========================================
    // 4. ฟังก์ชันแสดงผลลัพธ์ (UI Update)
    // ==========================================
    
    function showResult(query, data) {
        dataSearched.textContent = query;
        dataType.textContent = data.type;
        dataName.textContent = data.name;
        dataBehavior.textContent = data.behavior;

        // ล้างคลาสสีเก่าออกให้หมด
        threatHeader.classList.remove('threat-high', 'threat-med', 'threat-low');
        behaviorRow.classList.remove('highlight-warning', 'highlight-danger');

        if (data.risk === "high") {
            threatHeader.classList.add('threat-high');
            statusTitle.textContent = "⚠️ ระดับความเสี่ยง: สูงมาก (มิจฉาชีพ)";
            statusDesc.textContent = "พบข้อมูลตรงกับฐานข้อมูลบัญชีดำของ C-VAFAS ควรงดทำธุรกรรมทันที!";
            behaviorRow.classList.add('highlight-danger');
            behaviorRow.style.backgroundColor = "#fdf2f0";
            dataBehavior.style.color = "#c0392b";
        } else if (data.risk === "med") {
            threatHeader.classList.add('threat-med');
            statusTitle.textContent = "⚡ ระดับความเสี่ยง: ปานกลาง (เฝ้าระวัง)";
            statusDesc.textContent = "พบประวัติพฤติกรรมน่าสงสัย โปรดใช้ความระมัดระวังเป็นพิเศษ";
            behaviorRow.classList.add('highlight-warning');
            behaviorRow.style.backgroundColor = "#fdf2e9";
            dataBehavior.style.color = "#d35400";
        }

        scoreNumber.textContent = data.score;
        
        searchResult.style.display = 'block';
        searchResult.classList.add('fade-in');
    }

    function showSafeResult(query) {
        dataSearched.textContent = query;
        dataType.textContent = "ไม่ระบุ";
        dataName.textContent = "ไม่พบในฐานข้อมูลส่วนกลาง";
        dataBehavior.textContent = "ยังไม่มีผู้ใช้งานรายงานพฤติกรรมการโกงของข้อมูลนี้";

        threatHeader.classList.remove('threat-high', 'threat-med', 'threat-low');
        behaviorRow.classList.remove('highlight-warning', 'highlight-danger');
        behaviorRow.style.backgroundColor = "";
        dataBehavior.style.color = "";

        // เปลี่ยนเป็นสีเขียว
        threatHeader.classList.add('threat-low');
        threatHeader.style.backgroundColor = "#27ae60";
        statusTitle.textContent = "✅ ไม่พบประวัติการฉ้อโกง";
        statusDesc.textContent = "ข้อมูลนี้ยังไม่เคยถูกรายงานในระบบ C-VAFAS (แต่โปรดใช้ความระมัดระวังในการโอนเงินเสมอ)";
        
        scoreNumber.textContent = "0";

        searchResult.style.display = 'block';
        searchResult.classList.add('fade-in');
    }
    // ==========================================
    // 5. ระบบแจ้งเบาะแส (Report Modal)
    // ==========================================
    const btnOpenReportModal = document.getElementById('btnOpenReportModal');
    const reportModal = document.getElementById('reportModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const reportForm = document.getElementById('reportForm');

    // ถ้ามีปุ่มและ Modal อยู่ในหน้าเว็บ ให้ทำงาน
    if (btnOpenReportModal && reportModal) {
        
        // เปิด Modal
        btnOpenReportModal.addEventListener('click', () => {
            // ดึงค่าจากช่องค้นหา (ถ้าผู้ใช้พิมพ์ค้างไว้) มาใส่ในช่องแจ้งเบาะแสอัตโนมัติ
            const currentSearchValue = searchInput.value.trim();
            if (currentSearchValue !== "") {
                document.getElementById('reportData').value = currentSearchValue;
            }
            reportModal.style.display = 'flex';
        });

        // ปิด Modal เมื่อกดกากบาท
        btnCloseModal.addEventListener('click', () => {
            reportModal.style.display = 'none';
            reportForm.reset(); // ล้างฟอร์ม
        });

        // ปิด Modal เมื่อคลิกพื้นที่สีดำรอบนอก
        window.addEventListener('click', (e) => {
            if (e.target === reportModal) {
                reportModal.style.display = 'none';
                reportForm.reset();
            }
        });

        // จำลองการกดส่งข้อมูล (Submit)
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช
            
            const submitBtn = reportForm.querySelector('button[type="submit"]');
            submitBtn.textContent = "กำลังอัปโหลดข้อมูล...";
            submitBtn.disabled = true;

            // จำลองการเซฟลงฐานข้อมูล 1.5 วินาที
            setTimeout(() => {
                alert("🎉 ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ C-VAFAS! ข้อมูลของคุณถูกส่งให้ทีมงานตรวจสอบแล้ว (คุณได้รับ +50 Trust Score)");
                reportModal.style.display = 'none';
                reportForm.reset();
                submitBtn.textContent = "ส่งข้อมูลเข้าฐานข้อมูลส่วนกลาง";
                submitBtn.disabled = false;
            }, 1500);
        });
    }
});