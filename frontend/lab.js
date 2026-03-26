document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Advanced Forensic & Security Lab loaded.");

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const resultCard = document.getElementById('resultCard');

    if (resultCard) resultCard.style.display = 'none';

    // ==========================================
    // 1. จัดการ Event อัปโหลดและลากวางไฟล์
    // ==========================================
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processFileReal(e.target.files[0]);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover')));
    ['dragleave', 'drop'].forEach(eventName => dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover')));

    dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length > 0) processFileReal(e.dataTransfer.files[0]);
    });

    // ==========================================
    // 2. ฐานข้อมูล Magic Bytes (อัปเดตให้ครอบคลุมขึ้น)
    // ==========================================
    const magicBytesDB = [
        // ต้องเอาตัวที่ยาวกว่าขึ้นก่อน เพื่อกันการจับคู่ผิดพลาด
        { hex: "25504446", type: "PDF Document", validExts: ["pdf"] },
        { hex: "D0CF11E0", type: "Microsoft Office (Legacy)", validExts: ["doc", "xls", "ppt", "msi"] },
        { hex: "504B0304", type: "ZIP Archive / Modern Doc / APK", validExts: ["zip", "apk", "docx", "xlsx", "pptx", "jar"] },
        { hex: "52617221", type: "RAR Archive", validExts: ["rar"] },
        { hex: "377ABCAF", type: "7-Zip Archive", validExts: ["7z"] },
        { hex: "89504E47", type: "PNG Image", validExts: ["png"] },
        { hex: "47494638", type: "GIF Image", validExts: ["gif"] },
        { hex: "FFD8FFE0", type: "JPEG Image", validExts: ["jpg", "jpeg"] },
        { hex: "FFD8FFE1", type: "JPEG Image (EXIF)", validExts: ["jpg", "jpeg"] },
        { hex: "FFD8FFE2", type: "JPEG Image", validExts: ["jpg", "jpeg"] },
        { hex: "4D5A", type: "Windows Executable", validExts: ["exe", "dll", "sys", "scr"] } // ความยาวแค่ 2 ไบต์ (4 ตัวอักษร)
    ];

    const cVafasThreatDB = {
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855": {
            status: "MALWARE",
            virusName: "Trojan.FakeDocument.Banker",
            details: "ไฟล์นี้ถูกรายงาน 142 ครั้งว่าเป็นแอปดูดเงินที่ปลอมตัวมา"
        }
    };

    // ==========================================
    // 3. ฟังก์ชันหลัก: ชันสูตรและตรวจจับความขัดแย้ง
    // ==========================================
    async function processFileReal(file) {
        const originalHTML = dropzone.innerHTML;
        dropzone.innerHTML = `
            <div class="dropzone-icon" style="animation: pulse 1.5s infinite;">🛡️</div>
            <h2>กำลังชันสูตรและสแกนความปลอดภัย...</h2>
            <p>1. ตรวจสอบโครงสร้างไฟล์และนามสกุล (Mismatch Check)</p>
            <p>2. ตรวจสอบประวัติไวรัสจากฐานข้อมูล</p>
        `;
        dropzone.style.pointerEvents = 'none';

        try {
            // 🚨 เพิ่มโค้ดดักจับไฟล์เปล่าตรงนี้
            if (file.size === 0) {
                alert("ไฟล์นี้เป็นไฟล์ว่างเปล่า (0 Bytes) ไม่มีข้อมูลโครงสร้างให้ตรวจสอบครับ กรุณาอัปโหลดไฟล์ที่มีข้อมูล");
                // คืนค่าหน้าตากล่องกลับเหมือนเดิมแล้วหยุดการทำงาน
                dropzone.innerHTML = originalHTML;
                dropzone.style.pointerEvents = 'auto';
                return; 
            }

            const fileName = file.name;
            const claimedExt = fileName.split('.').pop().toLowerCase();;

            // ขั้นที่ 1: ตรวจ Magic Bytes (อ่านมา 4 ไบต์)
            const headerHex = await readMagicBytes(file);
            
            // --- ลอจิกใหม่: ค้นหา Magic Bytes แบบยืดหยุ่น ---
            let magicInfo = null;
            // วนลูปหาในฐานข้อมูลว่า Hex ที่อ่านมา "ขึ้นต้นด้วย" รหัสไหนใน DB บ้าง
            for (const dbEntry of magicBytesDB) {
                if (headerHex.startsWith(dbEntry.hex)) {
                    magicInfo = dbEntry;
                    break; // เจอแล้วหยุดหา
                }
            }
            
            // เตรียมชื่อประเภทไฟล์ที่จะเอาไปแสดง
            let realFileType = magicInfo ? `${magicInfo.type}` : "Unknown / ไม่ทราบประเภท (Plain Text หรือไฟล์ที่ระบบไม่รู้จัก)";

            // ขั้นที่ 2: คำนวณ Hash
            const fileHash = await calculateSHA256(file);

            // 🌐 ขั้นที่ 2.5: วิ่งไปถามฐานข้อมูลชุมชน (C-VAFAS MySQL) ว่าเคยมีคนรีพอร์ตไหม!
            let communityReport = null;
            try {
                // ส่งชื่อไฟล์ไปค้นหาผ่าน API ที่เราเคยสร้างไว้
                const searchResponse = await fetch(`http://127.0.0.1:3000/api/search/${fileName}`);
                const searchResult = await searchResponse.json();
                if (searchResult.found) {
                    communityReport = searchResult.data; // เก็บข้อมูลคนที่เคยรีพอร์ตไว้
                }
            } catch (e) {
                console.log("ไม่สามารถเชื่อมต่อฐานข้อมูลส่วนกลางได้");
            }

            // ขั้นที่ 3: เช็กความขัดแย้ง (Mismatch) และประเมินความเสี่ยง
            let isDangerous = false;
            let isMismatch = false;
            let isWarning = false; 
            let warningMessage = "✅ ไฟล์นี้โครงสร้างตรงปก (นามสกุลและไส้ในตรงกัน) และไม่พบประวัติไวรัส";

            // 3.1 ตรวจการปลอมแปลงนามสกุล
            if (magicInfo && !magicInfo.validExts.includes(claimedExt)) {
                isDangerous = true;
                isMismatch = true;
                warningMessage = `🚨 อันตราย: ไฟล์ปลอมแปลงนามสกุล! ไฟล์แอบอ้างว่าเป็น <strong>.${claimedExt}</strong> แต่โครงสร้างภายในคือ <strong>${magicInfo.type}</strong> นี่คือกลอุบายหลักของมิจฉาชีพ`;
            } 
            
            // 3.2 ตรวจสอบกับฐานข้อมูลไวรัส (Local DB)
            const dbCheck = cVafasThreatDB[fileHash];
            if (dbCheck) {
                isDangerous = true;
                warningMessage = `🚨 อันตราย: ตรวจพบมัลแวร์สายพันธุ์ <strong>${dbCheck.virusName}</strong><br>รายละเอียด: ${dbCheck.details}`;
            }

            // 🚨 3.3 ใหม่! ตรวจสอบจากฐานข้อมูลชุมชน (Community Database)
            if (communityReport) {
                if (communityReport.risk_level === 'high') {
                    isDangerous = true;
                    warningMessage = `🚨 อันตรายมาก: ไฟล์นี้ถูกรายงานเข้าสู่ระบบส่วนกลางแล้วว่าเป็นมิจฉาชีพ! (ยอดรีพอร์ต: ${communityReport.report_count})<br><strong>พฤติการณ์:</strong> ${communityReport.behavior}`;
                } else {
                    isWarning = true;
                    warningMessage = `⚠️ เฝ้าระวัง: ไฟล์นี้มีผู้ต้องสงสัยและแจ้งเบาะแสเข้าระบบชุมชนแล้ว (ยอดรีพอร์ต: ${communityReport.report_count})<br><strong>พฤติการณ์:</strong> ${communityReport.behavior}`;
                }
            }

            // 3.4 เช็กกลุ่มไฟล์เสี่ยง (Container/Executable)
            const riskyExts = ['zip', 'apk', 'exe', 'rar', '7z', 'scr', 'dll', 'msi', 'jar'];
            // ถ้าไม่เป็นอันตราย ไม่ได้โดนรีพอร์ต แต่เป็นนามสกุลเสี่ยง
            if (!isDangerous && !isWarning && riskyExts.includes(claimedExt)) {
                isWarning = true;
                warningMessage = `⚠️ ข้อควรระวัง: ไฟล์ประเภท <strong>.${claimedExt}</strong> มักถูกมิจฉาชีพใช้เป็นกล่องบรรจุมัลแวร์ซ่อนไว้ข้างใน (Container) แม้โครงสร้างไฟล์จะถูกต้อง แต่โปรดระมัดระวังในการแตกไฟล์หรือติดตั้งแอปพลิเคชันครับ!`;
            }

            // 🚨 3.5 ไฟล์ที่ไม่รู้จักโครงสร้าง (Unknown Magic Bytes)
            if (!magicInfo && !isDangerous && !isWarning) {
                 isWarning = true; // เปลี่ยนสถานะเป็นเฝ้าระวังทันที!
                 warningMessage = "⚠️ เฝ้าระวัง: ระบบไม่รู้จักโครงสร้างไฟล์นี้ (Unknown Magic Bytes) อาจเป็นไฟล์ข้อความธรรมดา หรืออาจเป็นไฟล์ที่ถูกดัดแปลงโครงสร้างเพื่อหลบเลี่ยงการตรวจจับ โปรดตรวจสอบแหล่งที่มาอย่างระมัดระวัง!";
            }

            // แสดงผล (ส่งค่า isWarning เพิ่มเข้าไปด้วย)
            displayResults(fileName, claimedExt, headerHex, realFileType, fileHash, isDangerous, isMismatch, isWarning, warningMessage);
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการตรวจสอบไฟล์");
        } finally {
            dropzone.innerHTML = originalHTML;
            dropzone.style.pointerEvents = 'auto';
        }
    }

    // ==========================================
    // 4. ฟังก์ชันย่อย
    // ==========================================
    function readMagicBytes(file) {
        return new Promise((resolve, reject) => {
            const blob = file.slice(0, 4); // อ่านแค่ 4 Bytes แรก
            const reader = new FileReader();
            reader.onloadend = function(e) {
                if (e.target.readyState === FileReader.DONE) {
                    const uint8Array = new Uint8Array(e.target.result);
                    let hexString = "";
                    for (let i = 0; i < uint8Array.length; i++) {
                        hexString += uint8Array[i].toString(16).padStart(2, '0').toUpperCase();
                    }
                    resolve(hexString);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });
    }

    async function calculateSHA256(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 📌 อย่าลืมเติม isWarning ตรงวงเล็บรับค่าด้วยนะครับ
    function displayResults(fileName, claimedExt, headerHex, realFileType, fileHash, isDangerous, isMismatch, isWarning, warningMessage) {
        const fileNameDisplay = resultCard.querySelector('.data-row:nth-child(1) .data-value');
        const fileExtDisplay = resultCard.querySelector('.data-row:nth-child(2) .data-value');
        const realTypeDisplay = resultCard.querySelector('.data-row:nth-child(3) .data-value');
        const hashDisplay = resultCard.querySelector('.data-row:nth-child(4) .data-value');
        const warningBox = resultCard.querySelector('.result-footer p');
        
        const resultHeader = resultCard.querySelector('.result-header .badge');
        const extRow = resultCard.querySelector('.data-row:nth-child(2)');
        const typeRow = resultCard.querySelector('.data-row:nth-child(3)');

        fileNameDisplay.textContent = fileName;
        fileExtDisplay.textContent = `.${claimedExt}`;
        realTypeDisplay.textContent = `${realFileType} (Hex: ${headerHex})`;
        hashDisplay.textContent = fileHash;
        warningBox.innerHTML = `<strong>ผลการสแกนความปลอดภัย:</strong><br><br>${warningMessage}`;

        // รีเซ็ต Style เก่าก่อน
        resultHeader.style.backgroundColor = ""; 
        resultHeader.style.color = "";

        if (isDangerous) {
            // 🔴 สถานะอันตราย (สีแดง)
            resultHeader.textContent = "🚨 ตรวจพบความเสี่ยงสูง / มัลแวร์";
            resultHeader.className = "badge badge-danger";
            warningBox.parentElement.style.backgroundColor = "#fdf2f0";
            warningBox.parentElement.style.color = "#c0392b";
            
            if (isMismatch) {
                extRow.classList.add('highlight-danger');
                typeRow.classList.add('highlight-danger');
            } else {
                extRow.classList.remove('highlight-danger');
                typeRow.classList.add('highlight-danger');
            }
        } else if (isWarning) {
            // 🟠 สถานะเฝ้าระวัง (สีส้ม) ใหม่!
            resultHeader.textContent = "⚠️ เฝ้าระวัง (มีความเสี่ยงแฝง)";
            resultHeader.className = "badge"; // ใช้ class กลาง
            resultHeader.style.backgroundColor = "#f39c12"; // ระบายสีส้ม
            resultHeader.style.color = "white";
            
            extRow.classList.remove('highlight-danger');
            typeRow.classList.remove('highlight-danger');
            warningBox.parentElement.style.backgroundColor = "#fdf2e9";
            warningBox.parentElement.style.color = "#d35400";
        } else {
            // 🟢 สถานะปลอดภัย (สีเขียว)
            resultHeader.textContent = "✅ ปลอดภัย (เบื้องต้น)";
            resultHeader.className = "badge badge-safe";
            extRow.classList.remove('highlight-danger');
            typeRow.classList.remove('highlight-danger');
            warningBox.parentElement.style.backgroundColor = "#eafaf1";
            warningBox.parentElement.style.color = "#27ae60";
        }

        resultCard.style.display = 'block';
        resultCard.classList.add('fade-in');
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // ==========================================
    // 5. ระบบรายงานไฟล์ (Event Delegation)
    // ==========================================
    // ดักจับการคลิกทั้งหน้าจอแทนการดักจับปุ่มโดยตรง
    document.addEventListener('click', async function(e) {
        
        // ตรวจสอบว่าสิ่งที่ถูกคลิก มี id เป็น btnReportFile หรือไม่
        if (e.target && e.target.id === 'btnReportFile') {
            e.preventDefault();
            
            const btnReportFile = e.target;

            // 1. ตรวจสอบล็อกอิน
            const savedUser = localStorage.getItem('cvafas_user');
            if (!savedUser) {
                alert("🔒 กรุณาเข้าสู่ระบบก่อนรายงานไฟล์เข้าสู่ระบบส่วนกลางครับ");
                window.location.href = "login.html"; 
                return;
            }

            const userObj = JSON.parse(savedUser);
            const userId = userObj.id;

            // 2. ดึงชื่อไฟล์จากหน้าจอ (ดึงจาก Elements ที่เราแสดงผลไว้)
            const fileNameDisplay = resultCard.querySelector('.data-row:nth-child(1) .data-value');
            const fileName = fileNameDisplay ? fileNameDisplay.textContent : "ไฟล์ต้องสงสัยจากการสแกน_TheLab";

            const originalText = btnReportFile.textContent;
            btnReportFile.textContent = "กำลังอัปโหลด...";
            btnReportFile.disabled = true;

            try {
                // 3. ส่งข้อมูลไปให้หลังบ้าน
                const response = await fetch('http://127.0.0.1:3000/api/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        threatType: "file",
                        threatData: fileName, // ส่งชื่อไฟล์จริงๆ ไป
                        behavior: "ตรวจพบโครงสร้างไฟล์ผิดปกติและเสี่ยงเป็นมัลแวร์ จากระบบสแกน The Lab",
                        userId: userId
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // 4. บวกคะแนนในเครื่อง
                    userObj.trust_score = (userObj.trust_score || 0) + 50;
                    localStorage.setItem('cvafas_user', JSON.stringify(userObj));

                    alert("🎉 รายงานไฟล์สำเร็จ! ข้อมูลถูกส่งเข้าฐานข้อมูลส่วนกลางแล้ว (คุณได้รับ +50 Trust Score)");
                    window.location.reload(); 
                } else {
                    alert("❌ เกิดข้อผิดพลาด: " + result.error);
                    btnReportFile.textContent = originalText;
                    btnReportFile.disabled = false;
                }
            } catch (error) {
                console.error("Error reporting file:", error);
                alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
                btnReportFile.textContent = originalText;
                btnReportFile.disabled = false;
            }
        }
    });

// ปิดฟังก์ชัน DOMContentLoaded ตัวหลัก (ที่เปิดไว้ตั้งแต่บรรทัดแรก)
});