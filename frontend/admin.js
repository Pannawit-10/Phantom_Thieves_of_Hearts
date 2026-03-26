document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Admin Control Center Loaded.");

    // 1. 🚨 การป้องกันสิทธิ์ (Access Control)
    const savedUser = localStorage.getItem('cvafas_user');
    if (!savedUser) {
        alert("🔒 ไม่มีสิทธิ์เข้าถึง: กรุณาเข้าสู่ระบบ");
        window.location.href = 'login.html';
        return;
    }

    const userObj = JSON.parse(savedUser);
    if (userObj.role !== 'admin') {
        alert("⛔ ไม่มีสิทธิ์เข้าถึง: พื้นที่นี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น!");
        window.location.href = 'index.html'; // เตะคนธรรมดากลับหน้าโฮม!
        return;
    }

    // แสดงชื่อแอดมิน
    document.getElementById('adminName').textContent = userObj.username;

    // ระบบออกจากระบบ
    document.getElementById('btnAdminLogout').addEventListener('click', () => {
        if(confirm("ต้องการออกจากระบบ Admin ใช่หรือไม่?")) {
            localStorage.removeItem('cvafas_user');
            window.location.href = 'login.html';
        }
    });

    // 2. 📊 ดึงข้อมูลเบาะแสรอตรวจสอบ (Pending Reports)
    async function fetchPendingReports() {
        const tableBody = document.getElementById('tableBody');
        const pendingCount = document.getElementById('pendingCount');

        try {
            const response = await fetch('http://127.0.0.1:3000/api/admin/pending-reports');
            const data = await response.json();

            if (data.success) {
                pendingCount.textContent = data.data.length;
                tableBody.innerHTML = ''; // ล้างข้อความโหลด

                if (data.data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #27ae60;"><i class="fa-solid fa-circle-check"></i> เยี่ยมมาก! ไม่มีเบาะแสตกค้างรอตรวจสอบ</td></tr>';
                    return;
                }

                data.data.forEach(item => {
                    const tr = document.createElement('tr');
                    const date = new Date(item.created_at).toLocaleDateString('th-TH');
                    
                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><span class="badge" style="background:#f39c12;">${item.threat_type}</span></td>
                        <td style="font-weight: bold; color: #e74c3c;">${item.threat_data}</td>
                        <td style="font-size: 0.9rem; color: #555;">${item.behavior}</td>
                        <td style="text-align: center;"><b>${item.report_count}</b></td>
                        <td>
                            <button class="btn-sm btn-approve" onclick="updateReportStatus(${item.id}, 'approve')"><i class="fa-solid fa-ban"></i> ยืนยันว่าอันตราย</button>
                            <button class="btn-sm btn-reject" onclick="updateReportStatus(${item.id}, 'reject')"><i class="fa-solid fa-check"></i> ปลอดภัย (ล้างมลทิน)</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">❌ เกิดข้อผิดพลาดในการดึงข้อมูลจากเซิร์ฟเวอร์</td></tr>';
        }
    }

    // โหลดข้อมูลครั้งแรก
    fetchPendingReports();

    // 3. 🎯 ฟังก์ชันจัดการ (อัปเดตสถานะกลับไปที่ Server)
    // ทำให้เป็น Global Function เพื่อให้ปุ่มในตารางเรียกใช้ได้
    window.updateReportStatus = async function(id, action) {
        const actionText = action === 'approve' ? "ยืนยันว่าข้อมูลนี้คือ 'มิจฉาชีพ/อันตราย'" : "ยืนยันว่าข้อมูลนี้ 'ปลอดภัย'";
        
        if(confirm(`คุณแน่ใจหรือไม่ที่จะ ${actionText} ?`)) {
            try {
                const response = await fetch('http://127.0.0.1:3000/api/admin/update-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id, action: action })
                });

                const result = await response.json();
                if (response.ok) {
                    // ลบแถวที่จัดการแล้วออกไป หรือโหลดตารางใหม่
                    fetchPendingReports(); 
                } else {
                    alert("❌ อัปเดตไม่สำเร็จ: " + result.error);
                }
            } catch (error) {
                alert("❌ เซิร์ฟเวอร์ไม่ตอบสนอง");
            }
        }
    };
    // ==========================================
    // 4. 📊 ดึงสถิติรวมของระบบมาโชว์ในกล่องด้านบน
    // ==========================================
    async function fetchAdminStats() {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/admin/stats');
            const data = await response.json();

            if (data.success) {
                document.getElementById('confirmedCount').textContent = data.confirmedCount;
                document.getElementById('usersCount').textContent = data.usersCount;
            }
        } catch (error) {
            document.getElementById('confirmedCount').textContent = "Error";
            document.getElementById('usersCount').textContent = "Error";
        }
    }

    // เรียกใช้งานฟังก์ชันดึงสถิติทันทีที่เปิดหน้า Admin
    fetchAdminStats();
});