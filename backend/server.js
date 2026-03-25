const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json());

// 1. เชื่อมต่อฐานข้อมูล MySQL ของเราเอง (สำหรับข้อมูลมิจฉาชีพไทย)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cvafas_db'
});

db.connect((err) => {
    if (err) console.error('❌ ไม่สามารถเชื่อมต่อ MySQL ได้:', err.message);
    else console.log('✅ เชื่อมต่อฐานข้อมูล MySQL (cvafas_db) สำเร็จแล้ว!');
});

// 2. 🚀 API ค้นหาอัจฉริยะแบบ Hybrid (MySQL + VirusTotal)
app.get('/api/search/:query', (req, res) => {
    const searchQuery = req.params.query;
    
    // --- สเต็ปที่ 1: ค้นหาในฐานข้อมูล MySQL ของเราก่อน ---
    const sql = "SELECT * FROM blacklist WHERE threat_data = ?";
    db.query(sql, [searchQuery], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        if (results.length > 0) {
            // ✅ เจอใน MySQL (บัญชีม้า/เบอร์โทรไทย) -> ส่งกลับไปให้หน้าเว็บเลย
            return res.json({ found: true, data: results[0] });
        } else {
            // --- สเต็ปที่ 2: ถ้าไม่เจอใน MySQL ให้เช็กว่าเป็น URL ไหม ---
            // เช็กง่ายๆ ว่ามีจุด (.) และไม่ได้เป็นตัวเลขล้วนๆ
            const isUrl = searchQuery.includes('.') && !/^\d+$/.test(searchQuery);
            
            if (isUrl) {
                try {
                    // 🔑 ใส่ API KEY ของ VirusTotal แล้ว
                    const VIRUSTOTAL_API_KEY = '979a9c3e9e2440ae7478dafb7f7d18dc934d919437f97beabd28d0b9f702b5c0';
                    
                    // แปลง URL ให้เป็นฟอร์แมตที่ VirusTotal ต้องการ (base64url)
                    const encodedUrl = Buffer.from(searchQuery).toString('base64url');
                    
                    console.log(`🔍 กำลังส่งลิงก์ [${searchQuery}] ไปตรวจที่ VirusTotal...`);
                    
                    // สั่ง Node.js วิ่งไปถาม VirusTotal
                    const vtResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${encodedUrl}`, {
                        method: 'GET',
                        headers: { 
                            'x-apikey': VIRUSTOTAL_API_KEY,
                            'Accept': 'application/json'
                        }
                    });
                    if (vtResponse.ok) {
                        const vtData = await vtResponse.json();
                        const stats = vtData.data.attributes.last_analysis_stats;
                        const maliciousCount = stats.malicious + stats.suspicious; // ยอดแอนตี้ไวรัสที่บอกว่าอันตราย

                        if (maliciousCount > 0) {
                            // 🚨 เจอว่าลิงก์อันตรายในระดับโลก! แปลงข้อมูลให้หน้าเว็บเรารู้จัก
                            return res.json({
                                found: true,
                                data: {
                                    risk_level: "high",
                                    threat_type: "🌐 ลิงก์เว็บไซต์อันตราย (Phishing / Malware)",
                                    suspect_name: "ยืนยันโดย VirusTotal API",
                                    behavior: `ดึงข้อมูลจาก Cloud: ตรวจพบความเสี่ยงจาก ${maliciousCount} ค่ายแอนตี้ไวรัสชั้นนำของโลก (เช่น Kaspersky, BitDefender) ห้ามคลิกเด็ดขาด!`,
                                    report_count: maliciousCount
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error("VT API Error:", error.message);
                }
            }
            
            // ❌ ถ้าไม่เจอใน MySQL และ VirusTotal ก็บอกว่าปลอดภัย (ไม่เจอในทั้งคู่)
            return res.json({ found: false });
        }
    });
});
// ==========================================
// 3. 🚨 API สำหรับรับแจ้งเบาะแส (Save & Update MySQL)
// ==========================================
app.post('/api/report', (req, res) => {
    const { threatType, threatData, behavior } = req.body;

    if (!threatType || !threatData || !behavior) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    let typeName = "ไม่ระบุ";
    if (threatType === "bank") typeName = "บัญชีธนาคาร (บัญชีม้า)";
    if (threatType === "phone") typeName = "เบอร์โทรศัพท์";
    if (threatType === "link") typeName = "ลิงก์เว็บไซต์ปลอม (Phishing)";

    // 🔍 สเต็ปที่ 1: เช็กก่อนว่ามี "เบอร์/บัญชี" นี้ในฐานข้อมูลหรือยัง?
    const checkSql = "SELECT * FROM blacklist WHERE threat_data = ?";
    
    db.query(checkSql, [threatData], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length > 0) {
            // 🟢 สเต็ปที่ 2A: ถ้า "มีข้อมูลอยู่แล้ว" -> สั่งให้อัปเดตยอดรีพอร์ต +1
            const updateSql = "UPDATE blacklist SET report_count = report_count + 1 WHERE threat_data = ?";
            
            db.query(updateSql, [threatData], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "อัปเดตยอดรีพอร์ตไม่สำเร็จ" });
                
                console.log(`📈 อัปเดตยอดรีพอร์ตของ: ${threatData} (+1)`);
                res.json({ success: true, message: "ข้อมูลนี้มีในระบบแล้ว ระบบได้ทำการเพิ่มยอดรีพอร์ตให้ครับ!" });
            });
            
        } else {
            // 🔵 สเต็ปที่ 2B: ถ้า "ยังไม่มีข้อมูลเลย" -> สั่งให้เพิ่มข้อมูลใหม่เป็นสีเหลือง (med)
            const insertSql = `INSERT INTO blacklist (risk_level, report_count, threat_type, threat_data, suspect_name, behavior) 
                               VALUES ('med', 1, ?, ?, 'ข้อมูลใหม่ (รอทีมงานตรวจสอบ)', ?)`;
                               
            db.query(insertSql, [typeName, threatData, behavior], (insertErr) => {
                if (insertErr) return res.status(500).json({ error: "บันทึกข้อมูลใหม่ไม่สำเร็จ" });
                
                console.log(`📥 ได้รับแจ้งเบาะแสใหม่: [${typeName}] ${threatData}`);
                res.json({ success: true, message: "บันทึกข้อมูลใหม่ลงฐานข้อมูลเรียบร้อยแล้ว!" });
            });
        }
    });
});
// 3. รันเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 C-VAFAS Backend Server รันอยู่ที่ http://localhost:${PORT}`);
    console.log(`🌐 Hybrid Search API พร้อมทำงาน (MySQL + VirusTotal)`);
});