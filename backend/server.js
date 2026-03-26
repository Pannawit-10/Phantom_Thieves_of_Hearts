const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // เรียกใช้เครื่องมือเข้ารหัสผ่าน

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
    // 📌 รับ userId ที่หน้าเว็บส่งมาด้วย
    const { threatType, threatData, behavior, userId } = req.body;

    if (!threatType || !threatData || !behavior) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    let typeName = "ไม่ระบุ";
    if (threatType === "bank") typeName = "บัญชีธนาคาร (บัญชีม้า)";
    if (threatType === "phone") typeName = "เบอร์โทรศัพท์";
    if (threatType === "link") typeName = "ลิงก์เว็บไซต์ปลอม (Phishing)";
    if (threatType === "file") typeName = "ไฟล์อันตราย (Malware/APK)"; // 📌 เพิ่มบรรทัดนี้เข้าไปครับ!

    // 🚀 ฟังก์ชันผู้ช่วย: เอาไว้บวกคะแนนให้ผู้ใช้ใน Database
    const addScore = () => {
        if (userId) {
            db.query('UPDATE users SET trust_score = trust_score + 50 WHERE id = ?', [userId], (err) => {
                if (err) console.error("❌ บวกคะแนนไม่สำเร็จ:", err);
                else console.log(`⭐ บวก 50 แต้มให้ User ID: ${userId} เรียบร้อยแล้ว`);
            });
        }
    };

    const checkSql = "SELECT * FROM blacklist WHERE threat_data = ?";
    db.query(checkSql, [threatData], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length > 0) {
            const updateSql = "UPDATE blacklist SET report_count = report_count + 1 WHERE threat_data = ?";
            db.query(updateSql, [threatData], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "อัปเดตยอดรีพอร์ตไม่สำเร็จ" });
                
                addScore(); // เรียกใช้ฟังก์ชันบวกคะแนน!
                console.log(`📈 อัปเดตยอดรีพอร์ตของ: ${threatData} (+1)`);
                res.json({ success: true, message: "ข้อมูลนี้มีในระบบแล้ว ระบบได้ทำการเพิ่มยอดรีพอร์ตให้ครับ!" });
            });
        } else {
            const insertSql = `INSERT INTO blacklist (risk_level, report_count, threat_type, threat_data, suspect_name, behavior) 
                               VALUES ('med', 1, ?, ?, 'ข้อมูลใหม่ (รอทีมงาน C-VAFAS ตรวจสอบ)', ?)`;
            db.query(insertSql, [typeName, threatData, behavior], (insertErr) => {
                if (insertErr) return res.status(500).json({ error: "บันทึกข้อมูลใหม่ไม่สำเร็จ" });
                
                addScore(); // เรียกใช้ฟังก์ชันบวกคะแนน!
                console.log(`📥 ได้รับแจ้งเบาะแสใหม่: [${typeName}] ${threatData}`);
                res.json({ success: true, message: "บันทึกข้อมูลใหม่ลงฐานข้อมูลเรียบร้อยแล้ว!" });
            });
        }
    });
});
// ==========================================
// 4. 👤 API สมัครสมาชิก (ระบบ OTP Verification)
// ==========================================

// สร้างหน่วยความจำชั่วคราวเก็บ OTP (เวลาใช้งานจริงมักใช้ Redis แต่ตอนนี้ใช้ Map ไปก่อน)
const otpStorage = new Map();

// 4.1 จังหวะที่ 1: ขอรับรหัส OTP (พร้อมระบบกรองมิจฉาชีพและเช็กข้อมูลซ้ำ)
app.post('/api/request-otp', async (req, res) => {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password || !phone) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // 🛡️ เกราะชั้นที่ 1: เช็กว่าเบอร์นี้ติดแบล็คลิสต์ (ฐานข้อมูลมิจฉาชีพ) หรือไม่?
    // ตรวจสอบจากตาราง blacklist ตรงคอลัมน์ threat_data
    db.query('SELECT * FROM blacklist WHERE threat_data = ?', [phone], (errBlacklist, resultsBlacklist) => {
        if (errBlacklist) return res.status(500).json({ error: "Database error (Blacklist check)" });
        
        if (resultsBlacklist.length > 0) {
            // ถ้าเจอเบอร์นี้ในแบล็คลิสต์ ถีบออกทันที ไม่อนุญาตให้สร้างบัญชี!
            console.log(`🚨 ป้องกันการแฝงตัว: เบอร์มิจฉาชีพ (${phone}) พยายามสมัครสมาชิก!`);
            return res.status(403).json({ error: "ไม่อนุญาตให้สมัคร: เบอร์โทรศัพท์นี้ประวัติไม่ดีและอยู่ในฐานข้อมูลเฝ้าระวังมิจฉาชีพ \nหากคิดว่าเป็นข้อผิดพลาดให้ติดต่อผู้พัฒนาระบบ" });
        }

        // 🛡️ เกราะชั้นที่ 2: เช็กว่า อีเมล, ชื่อผู้ใช้ หรือ เบอร์โทร ซ้ำกับคนอื่นหรือไม่?
        db.query('SELECT * FROM users WHERE email = ? OR username = ? OR phone = ?', [email, username, phone], (errUser, resultsUser) => {
            if (errUser) return res.status(500).json({ error: "Database error (User check)" });
            
            if (resultsUser.length > 0) {
                // หาว่าอะไรที่ซ้ำ เพื่อเตือนผู้ใช้ให้ถูกจุด
                const duplicate = resultsUser[0];
                if (duplicate.phone === phone) return res.status(400).json({ error: "เบอร์โทรศัพท์นี้ ถูกใช้สมัครบัญชีไปแล้ว" });
                if (duplicate.email === email) return res.status(400).json({ error: "อีเมลนี้ มีผู้ใช้งานแล้ว" });
                if (duplicate.username === username) return res.status(400).json({ error: "ชื่อผู้ใช้นี้ มีผู้ใช้งานแล้ว" });
            }

            // ✅ ผ่านการตรวจสอบทุกด่าน! เข้าสู่กระบวนการสร้าง OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // บันทึกข้อมูลรอไว้ (หมดอายุใน 5 นาที)
            otpStorage.set(phone, {
                otp: otpCode,
                userData: { username, email, password, phone },
                expires: Date.now() + (5 * 60 * 1000) 
            });

            // 📱 ส่ง OTP จำลองไปที่ Terminal
            console.log(`\n=============================================`);
            console.log(`📡 [MOCK SMS GATEWAY] กำลังส่งข้อความ...`);
            console.log(`ถึงเบอร์: ${phone}`);
            console.log(`ข้อความ: รหัส OTP ของคุณคือ [ ${otpCode} ] (ห้ามบอกใคร)`);
            console.log(`=============================================\n`);

            res.json({ success: true, message: "ส่งรหัส OTP เรียบร้อยแล้ว" });
        });
    });
});

// 4.2 จังหวะที่ 2: ตรวจสอบ OTP และบันทึกลงฐานข้อมูลจริง
app.post('/api/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const record = otpStorage.get(phone);

    // เช็กว่ามีข้อมูลขอ OTP ไหม หรือหมดอายุหรือยัง
    if (!record) return res.status(400).json({ error: "รหัส OTP หมดอายุหรือไม่ถูกต้อง" });
    if (Date.now() > record.expires) {
        otpStorage.delete(phone);
        return res.status(400).json({ error: "รหัส OTP หมดอายุ กรุณาทำรายการใหม่" });
    }
    
    // เช็กว่ารหัสตรงไหม
    if (record.otp !== otp) {
        return res.status(400).json({ error: "รหัส OTP ไม่ถูกต้อง" });
    }

    // ✅ OTP ถูกต้อง! นำข้อมูลไปเข้ารหัสแล้วบันทึกลงฐานข้อมูล
    try {
        const { username, email, password } = record.userData;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = 'INSERT INTO users (username, email, password, phone, trust_score) VALUES (?, ?, ?, ?, 0)';
        db.query(sql, [username, email, hashedPassword, phone], (insertErr) => {
            if (insertErr) return res.status(500).json({ error: "สร้างบัญชีไม่สำเร็จ" });
            
            // ลบ OTP ทิ้งหลังใช้เสร็จ (ใช้ได้ครั้งเดียว)
            otpStorage.delete(phone); 
            
            console.log(`👤 บัญชีถูกยืนยันผ่าน OTP สำเร็จ: ${username}`);
            res.json({ success: true, message: "ยืนยันเบอร์โทรศัพท์และสมัครสมาชิกสำเร็จ!" });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});
// ==========================================
// 5. 🔑 API เข้าสู่ระบบ (Login)
// ==========================================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    // ค้นหาผู้ใช้จากอีเมล
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(400).json({ error: "ไม่พบอีเมลนี้ในระบบ" });

        const user = results[0];

        // 🔓 เปรียบเทียบรหัสผ่านที่พิมพ์มา กับรหัสผ่านที่เข้ารหัสไว้ใน Database
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ error: "รหัสผ่านไม่ถูกต้อง" });
        }

        console.log(`✅ ผู้ใช้ ${user.username} เข้าสู่ระบบสำเร็จ`);

        // ส่งข้อมูลผู้ใช้กลับไปให้หน้าเว็บ (แต่ *ห้าม* ส่งรหัสผ่านเด็ดขาด)
        res.json({ 
            success: true, 
            message: "เข้าสู่ระบบสำเร็จ!",
            user: { 
                id: user.id, 
                username: user.username, 
                trust_score: user.trust_score,
                role: user.role // 📌 แนบยศกลับไปให้หน้าเว็บรู้ด้วย!
            } 
        });
    });
});
// ==========================================
// 8. 🔑 API สำหรับกู้คืน/รีเซ็ตรหัสผ่าน (Forgot Password)
// ==========================================
app.post('/api/reset-password', async (req, res) => {
    const { email, username, newPassword } = req.body;

    if (!email || !username || !newPassword) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // 1. ตรวจสอบว่ามีอีเมลและชื่อผู้ใช้นี้ในระบบจริงหรือไม่
    db.query('SELECT * FROM users WHERE email = ? AND username = ?', [email, username], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res.status(404).json({ error: "❌ ไม่พบข้อมูลบัญชีนี้ หรือ ชื่อผู้ใช้/อีเมลไม่ตรงกัน" });
        }

        const userId = results[0].id;

        try {
            // 2. เข้ารหัส (Hash) รหัสผ่านตัวใหม่ เพื่อความปลอดภัย
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 3. อัปเดตรหัสผ่านใหม่ลงฐานข้อมูล
            db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "ไม่สามารถอัปเดตรหัสผ่านได้" });
                
                console.log(`🔑 เปลี่ยนรหัสผ่านสำเร็จสำหรับ User ID: ${userId}`);
                res.json({ success: true, message: "✅ รีเซ็ตรหัสผ่านสำเร็จ! คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย" });
            });
        } catch (hashError) {
            res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้ารหัสผ่าน" });
        }
    });
});
// ==========================================
// 6. 📊 API ดึงสถิติรวมของระบบ (Stats)
// ==========================================
app.get('/api/stats', (req, res) => {
    // นับจำนวนข้อมูลทั้งหมดในตาราง blacklist
    db.query('SELECT COUNT(*) AS total_blacklist FROM blacklist', (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        const totalBlacklist = results[0].total_blacklist;
        
        // ส่งตัวเลขจริงกลับไปให้หน้าเว็บ
        res.json({ 
            success: true, 
            total_blacklist: totalBlacklist,
            // (ถ้ามีตารางสถิติอื่น เช่น users หรือ lab_scans ก็เขียน Query เพิ่มแล้วส่งไปพร้อมกันได้เลยครับ)
        });
    });
});
// ==========================================
// 7. 🛡️ API สำหรับ Admin (ดึงข้อมูลรอตรวจสอบ & อนุมัติ)
// ==========================================

// 7.1 ดึงรายการที่รอตรวจสอบ (risk_level = 'med')
app.get('/api/admin/pending-reports', (req, res) => {
    const sql = "SELECT * FROM blacklist WHERE risk_level = 'med' ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true, data: results });
    });
});

// 7.2 อนุมัติ/ปฏิเสธ เบาะแส
app.post('/api/admin/update-report', (req, res) => {
    const { id, action } = req.body; 
    // action: 'approve' (เปลี่ยนเป็น high) หรือ 'reject' (เปลี่ยนเป็น low/ลบทิ้ง)

    if (!id || !action) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });

    let newRiskLevel = 'med';
    let newSuspectName = 'ผู้ต้องสงสัย';

    if (action === 'approve') {
        newRiskLevel = 'high';
        newSuspectName = 'มิจฉาชีพ (ยืนยันแล้ว)';
    } else if (action === 'reject') {
        newRiskLevel = 'low';
        newSuspectName = 'ปลอดภัย (ตรวจสอบแล้ว)';
    }

    const sql = "UPDATE blacklist SET risk_level = ?, suspect_name = ? WHERE id = ?";
    db.query(sql, [newRiskLevel, newSuspectName, id], (err) => {
        if (err) return res.status(500).json({ error: "อัปเดตไม่สำเร็จ" });
        console.log(`🛡️ Admin อัปเดตสถานะ Report ID: ${id} เป็น ${action}`);
        res.json({ success: true, message: "อัปเดตสถานะเรียบร้อย" });
    });
});
// 7.3 ดึงสถิติรวมสำหรับ Admin (นับจำนวน High Risk และ Users)
app.get('/api/admin/stats', (req, res) => {
    // นับจำนวนข้อมูลที่แอดมินยืนยันแล้วว่าเป็นมิจฉาชีพ (high)
    db.query("SELECT COUNT(*) AS count FROM blacklist WHERE risk_level = 'high'", (err1, results1) => {
        if (err1) return res.status(500).json({ error: "Database error" });
        
        // นับจำนวนผู้ใช้งานในระบบทั้งหมด
        db.query("SELECT COUNT(*) AS count FROM users", (err2, results2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            
            res.json({ 
                success: true, 
                confirmedCount: results1[0].count,
                usersCount: results2[0].count
            });
        });
    });
});
// ==========================================
// 9. 🛡️ API สำหรับยืนยันตัวตนขั้นสูง (KYC Gate + Face Scan)
// ==========================================
app.post('/api/submit-kyc', (req, res) => {
    // 📌 รับข้อมูลใบหน้า (faceData) มาเป็นตัวแปรแบบ let (เพื่อให้ลบค่าได้)
    let { userId, idCard, role, faceData } = req.body;

    if (!userId || !idCard || !role || !faceData) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลและสแกนใบหน้าให้ครบถ้วน" });
    }

    // 🛡️ เช็กเลขบัตรประชาชนซ้ำ
    db.query("SELECT id FROM users WHERE id_card = ? AND id != ?", [idCard, userId], (errCheck, resultsCheck) => {
        if (errCheck) return res.status(500).json({ error: "Database error (ID Check)" });
        
        if (resultsCheck.length > 0) {
            return res.status(400).json({ error: "ไม่อนุญาต: เลขบัตรประจำตัวประชาชนนี้ ถูกใช้ยืนยันตัวตนในระบบไปแล้ว!" });
        }

        // 🚨 สเต็ป PDPA: จำลองว่า AI สแกนหน้าเสร็จแล้ว -> สั่งล้างข้อมูลรูปภาพทิ้งทันที! ไม่เซฟลงฐานข้อมูล
        faceData = null; 
        console.log(`🗑️ ระบบได้ทำการล้างข้อมูลรูปภาพใบหน้า (Biometric Data) ออกจากหน่วยความจำแล้ว เพื่อความปลอดภัยตามหลัก PDPA`);

        // อัปเดตเฉพาะเลขบัตรและสถานะ
        const sql = "UPDATE users SET kyc_status = 'verified', id_card = ?, help_role = ? WHERE id = ?";
        db.query(sql, [idCard, role, userId], (err, results) => {
            if (err) return res.status(500).json({ error: "อัปเดตข้อมูล KYC ไม่สำเร็จ" });

            db.query("SELECT id, username, role, trust_score, kyc_status, help_role FROM users WHERE id = ?", [userId], (err2, userResults) => {
                 if (err2 || userResults.length === 0) return res.status(500).json({ error: "ดึงข้อมูลใหม่ไม่สำเร็จ" });
                 
                 console.log(`🛡️ ผู้ใช้ ID: ${userId} ผ่านการยืนยันตัวตนสำเร็จ!`);
                 res.json({ 
                     success: true, 
                     message: "ยืนยันตัวตนสำเร็จ! (รูปภาพของคุณถูกลบออกจากระบบแล้ว)", 
                     user: userResults[0] 
                 });
            });
        });
    });
});

// 3. รันเซิร์ฟเวอร์
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 C-VAFAS Backend Server รันอยู่ที่ http://localhost:${PORT}`);
    console.log(`🌐 Hybrid Search API พร้อมทำงาน (MySQL + VirusTotal)`);
});