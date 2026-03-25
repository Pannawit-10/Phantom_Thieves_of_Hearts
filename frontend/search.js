document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Smart Search module loaded (Connected to MySQL DB).");

    const searchInput = document.getElementById('searchInput');
    const btnSearch = document.getElementById('btnSearch');
    const searchResult = document.getElementById('searchResult');
    
    const threatHeader = searchResult.querySelector('.threat-header');
    const statusTitle = searchResult.querySelector('.threat-status h2');
    const statusDesc = searchResult.querySelector('.threat-status p');
    const scoreNumber = searchResult.querySelector('.score-number');
    
    const dataSearched = searchResult.querySelector('.data-row:nth-child(1) .data-value');
    const dataType = searchResult.querySelector('.data-row:nth-child(2) .data-value');
    const dataName = searchResult.querySelector('.data-row:nth-child(3) .data-value');
    const dataBehavior = searchResult.querySelector('.data-row:nth-child(4) .data-value');
    const behaviorRow = searchResult.querySelector('.data-row:nth-child(4)');

    if (searchResult) searchResult.style.display = 'none';

    // ผูก Event ค้นหา
    btnSearch.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    // 🚀 เปลี่ยนฟังก์ชันเป็น async เพื่อรอข้อมูลจาก Server จริงๆ
    async function performSearch() {
        const rawInput = searchInput.value.trim();
        
        if (rawInput === "") {
            alert("กรุณากรอกเลขบัญชี เบอร์โทร หรือลิงก์ที่ต้องการตรวจสอบ");
            return;
        }

        // ระบบ Data Extraction (ตัดคำอัจฉริยะเหมือนเดิม)
        let cleanQuery = rawInput;
        if (rawInput.includes("http://") || rawInput.includes("https://") || rawInput.includes(".com")) {
            const urlMatch = rawInput.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+)/);
            if (urlMatch) cleanQuery = urlMatch[1]; 
        } else {
            const onlyNumbers = rawInput.replace(/[-\s]/g, "");
            const numberMatch = onlyNumbers.match(/\d{10,12}/);
            if (numberMatch) {
                cleanQuery = numberMatch[0];
            } else {
                cleanQuery = onlyNumbers;
            }
        }

        btnSearch.textContent = "กำลังดึงข้อมูลจากฐานข้อมูล...";
        btnSearch.disabled = true;

        try {
            // 🌐 ส่งคำขอ (Request) ไปหา Backend API ที่ Port 3000
            const response = await fetch(`http://localhost:3000/api/search/${cleanQuery}`);
            const result = await response.json(); // แปลงสิ่งที่ได้กลับมาเป็น JSON

            btnSearch.textContent = "ตรวจสอบข้อมูล";
            btnSearch.disabled = false;

            if (result.found) {
                // ถ้า API ตอบกลับมาว่าเจอ (found: true) ให้ส่งข้อมูลไปแสดงผล
                showResult(cleanQuery, result.data);
            } else {
                // ถ้าไม่เจอ
                showSafeResult(cleanQuery);
            }

        } catch (error) {
            console.error("🔍 สายลับ C-VAFAS พบข้อผิดพลาด:", error);
            // ให้กล่อง Alert ฟ้องเลยว่า Error ชื่ออะไร จะได้แก้ถูกจุด!
            alert(`❌ ระบบขัดข้อง: ${error.message}\n\n(กด F12 แล้วไปที่แท็บ Console เพื่อดูรายละเอียด)`);
            
            btnSearch.textContent = "ตรวจสอบข้อมูล";
            btnSearch.disabled = false;
        }
    }

// 🟢 ฟังก์ชันแสดงผลเมื่อ "ไม่พบข้อมูล" (ปลอดภัย)
    function showSafeResult(query) {
        dataSearched.textContent = query;
        dataType.textContent = "ไม่ระบุ";
        dataName.textContent = "ไม่พบในฐานข้อมูลส่วนกลาง";
        dataBehavior.textContent = "ยังไม่มีผู้ใช้งานรายงานพฤติกรรมการโกงของข้อมูลนี้";

        // ล้างคลาสสีแดง/เหลืองของเก่าทิ้ง
        threatHeader.classList.remove('threat-high', 'threat-med', 'threat-low');
        threatHeader.style.backgroundColor = ""; 
        behaviorRow.classList.remove('highlight-warning', 'highlight-danger');
        behaviorRow.style.backgroundColor = "";
        dataBehavior.style.color = "";

        // เปลี่ยนเป็นสีเขียว (ปลอดภัย)
        threatHeader.classList.add('threat-low');
        threatHeader.style.backgroundColor = "#27ae60";
        statusTitle.textContent = "✅ ไม่พบประวัติการฉ้อโกง";
        statusDesc.textContent = "ข้อมูลนี้ยังไม่เคยถูกรายงานในระบบ C-VAFAS (แต่โปรดใช้ความระมัดระวังในการโอนเงินเสมอ)";
        
        scoreNumber.textContent = "0";

        searchResult.style.display = 'block';
        searchResult.classList.add('fade-in');
    }

    // 🚀 ฟังก์ชันแสดงผล 
    function showResult(query, dbData) {
        dataSearched.textContent = query;
        dataType.textContent = dbData.threat_type; 
        dataName.textContent = dbData.suspect_name; 
        dataBehavior.textContent = dbData.behavior; 

        // ล้างคลาสและ Inline Style สีเก่าออกให้หมด 🚨 (เพิ่มตรงนี้ครับ)
        threatHeader.classList.remove('threat-high', 'threat-med', 'threat-low');
        threatHeader.style.backgroundColor = ""; // เคลียร์สีเขียวที่ตกค้าง!
        behaviorRow.classList.remove('highlight-warning', 'highlight-danger');
        behaviorRow.style.backgroundColor = "";
        dataBehavior.style.color = "";

        if (dbData.risk_level === "high") { 
            threatHeader.classList.add('threat-high');
            statusTitle.textContent = "⚠️ ระดับความเสี่ยง: สูงมาก (มิจฉาชีพ)";
            statusDesc.textContent = "พบข้อมูลตรงกับฐานข้อมูล หรือได้รับการยืนยันจากระบบสากล ควรงดทำธุรกรรมทันที!";
            behaviorRow.classList.add('highlight-danger');
            behaviorRow.style.backgroundColor = "#fdf2f0";
            dataBehavior.style.color = "#c0392b";
        } else if (dbData.risk_level === "med") {
            threatHeader.classList.add('threat-med');
            statusTitle.textContent = "⚡ ระดับความเสี่ยง: ปานกลาง (เฝ้าระวัง)";
            statusDesc.textContent = "พบประวัติพฤติกรรมน่าสงสัย โปรดใช้ความระมัดระวังเป็นพิเศษ";
            behaviorRow.classList.add('highlight-warning');
            behaviorRow.style.backgroundColor = "#fdf2e9";
            dataBehavior.style.color = "#d35400";
        }

        scoreNumber.textContent = dbData.report_count; 
        
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

    if (btnOpenReportModal && reportModal) {
        btnOpenReportModal.addEventListener('click', () => {
            const currentSearchValue = searchInput.value.trim();
            if (currentSearchValue !== "") {
                document.getElementById('reportData').value = currentSearchValue;
            }
            reportModal.style.display = 'flex';
        });

        btnCloseModal.addEventListener('click', () => {
            reportModal.style.display = 'none';
            reportForm.reset();
        });

        window.addEventListener('click', (e) => {
            if (e.target === reportModal) {
                reportModal.style.display = 'none';
                reportForm.reset();
            }
        });

        // ระบบส่งข้อมูลจริงไปยัง MySQL (ผ่าน API)
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช

            const submitBtn = reportForm.querySelector('button[type="submit"]');
            submitBtn.textContent = "กำลังอัปโหลดข้อมูลลงฐานข้อมูล...";
            submitBtn.disabled = true;

            // 1. ดึงข้อมูลจากฟอร์ม
            const threatType = document.getElementById('reportType').value;
            const threatData = document.getElementById('reportData').value.trim();
            const behavior = document.getElementById('reportBehavior').value.trim();

            try {
                // 2. ยิงข้อมูลไปหา Node.js ด้วยวิธี POST
                const response = await fetch('http://127.0.0.1:3000/api/report', {
                    method: 'POST', // ระบุว่านี่คือการส่งข้อมูล
                    headers: {
                        'Content-Type': 'application/json' // บอกเซิร์ฟเวอร์ว่าส่งไปเป็น JSON
                    },
                    body: JSON.stringify({
                        threatType: threatType,
                        threatData: threatData,
                        behavior: behavior
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // ถ้าบันทึกสำเร็จ
                    alert("🎉 ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ C-VAFAS! ข้อมูลของคุณถูกส่งเข้าฐานข้อมูลส่วนกลางแล้ว (คุณได้รับ +50 Trust Score)");
                    reportModal.style.display = 'none';
                    reportForm.reset();
                } else {
                    // ถ้าเซิร์ฟเวอร์ฟ้อง Error
                    alert("❌ เกิดข้อผิดพลาด: " + result.error);
                }

            } catch (error) {
                console.error("Error reporting:", error);
                alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่ารัน 'node server.js' ไว้หรือไม่");
            } finally {
                // คืนค่าปุ่มให้กดใหม่ได้
                submitBtn.textContent = "ส่งข้อมูลเข้าฐานข้อมูลส่วนกลาง";
                submitBtn.disabled = false;
            }
        });
    }
});