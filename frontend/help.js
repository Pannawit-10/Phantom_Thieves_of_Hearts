document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Help & Support Center loaded.");
    // ==========================================
    // 0. ระบบตรวจสอบสถานะล็อกอิน (อัปเดต Navbar)
    // ==========================================
    const savedUserStr = localStorage.getItem('cvafas_user');
    if (savedUserStr) {
        const userObj = JSON.parse(savedUserStr);
        
        // ค้นหาปุ่ม Login บน Navbar (ค้นหาจากคำว่า Login หรือ href="login.html")
        const navLinks = document.querySelectorAll('nav a');
        let loginBtn = null;
        navLinks.forEach(link => {
            if (link.textContent.includes('Login') || link.getAttribute('href') === 'login.html') {
                loginBtn = link;
            }
        });

        // ถ้าเจอปุ่ม Login ให้แปลงร่างเป็นปุ่มชื่อผู้ใช้ + ปุ่มออกจากระบบ
        if (loginBtn) {
            loginBtn.outerHTML = `
                <a href="#" style="background-color: #27ae60; color: white; padding: 5px 15px; border-radius: 20px; text-decoration: none; margin-left: 15px;">
                    <i class="fa-solid fa-user-shield"></i> สวัสดี, ${userObj.username} <span style="color: #f1c40f;">(Trust: ${userObj.trust_score || 0})</span>
                </a>
                <a href="#" id="btnLogout" style="color: #e74c3c; margin-left: 10px; text-decoration: none; font-size: 0.9rem;">
                    <i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
                </a>
            `;

            // สั่งให้ปุ่ม "ออกจากระบบ" ทำงานได้จริง
            document.getElementById('btnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('cvafas_user'); // ลบความจำ
                window.location.reload(); // รีเฟรชหน้าเว็บ
            });
        }
    }

    // ==========================================
    // 1. ระบบ Chatbot "คุณอาทิตย์"
    // ==========================================
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const btnSendChat = document.getElementById('btnSendChat');

    // ฟังก์ชันเพิ่มข้อความลงในแชท
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg-bubble ${sender === 'bot' ? 'msg-bot' : 'msg-user'}`;
        msgDiv.innerHTML = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // เลื่อนจอลงล่างสุดอัตโนมัติ
    }

    // สมองกลคุณอาทิตย์ (Keyword Matching ง่ายๆ)
    function botReply(userText) {
        let reply = "ขออภัยครับ ผมยังไม่เข้าใจคำถามของคุณ ลองพิมพ์คำว่า <strong>'โดนโกง'</strong>, <strong>'บัญชีม้า'</strong> หรือ <strong>'โทร 1441'</strong> ให้ผมอธิบายเพิ่มเติมได้นะครับ";
        
        if (userText.includes("โกง") || userText.includes("หลอก") || userText.includes("โอนเงิน")) {
            reply = `<strong>ตั้งสติก่อนนะครับ! นี่คือ 3 ขั้นตอนฉุกเฉิน:</strong><br>
            1. 📞 <strong>โทร 1441 (AOC)</strong> ทันที เพื่อขออายัดบัญชีปลายทาง (โทรได้ 24 ชม.)<br>
            2. 📸 <strong>แคปเจอร์หลักฐาน</strong> แชทที่คุย, สลิปโอนเงิน, โปรไฟล์คนร้าย<br>
            3. 🚔 <strong>แจ้งความออนไลน์</strong> ที่เว็บ www.thaipoliceonline.go.th ภายใน 72 ชั่วโมงครับ`;
        } else if (userText.includes("บัญชีม้า")) {
            reply = `<strong>บัญชีม้าคือความผิดอาญานะครับ!</strong><br>หากคุณถูกหลอกให้เปิดบัญชี หรือรู้ตัวว่าบัญชีถูกเอาไปใช้ ให้รีบไปติดต่อธนาคารสาขาเพื่อปิดบัญชีทันที และไปลงบันทึกประจำวันที่สถานีตำรวจครับ โทษสูงสุดคือจำคุก 3 ปี ปรับ 3 แสนบาท!`;
        } else if (userText.includes("อาสา") || userText.includes("คุยกับคน")) {
            reply = `หากต้องการพูดคุยกับอาสาสมัคร หรือนักกฎหมายของ C-VAFAS กรุณาลงทะเบียนยืนยันตัวตน (KYC) ที่กล่องด้านขวามือได้เลยครับ ➡️`;
        }

        // ดีเลย์ 1 วินาทีให้ดูเหมือนบอทกำลังพิมพ์
        setTimeout(() => addMessage(reply, 'bot'), 1000);
    }

    // กดปุ่มส่งข้อความ
    function handleSend() {
        const text = chatInput.value.trim();
        if (text === "") return;
        
        addMessage(text, 'user'); // โชว์ข้อความเรา
        chatInput.value = ""; // ล้างช่องพิมพ์
        
        // ให้บอทตอบกลับ
        botReply(text);
    }

    btnSendChat.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // ==========================================
    // 2. ระบบยืนยันตัวตน (KYC Gatekeeper)
    // ==========================================
    const btnStartKyc = document.getElementById('btnStartKyc');
    const kycIntro = document.getElementById('kycIntro');
    const kycFormArea = document.getElementById('kycFormArea');
    const btnSubmitKyc = document.getElementById('btnSubmitKyc');
    let selectedRole = "";

    // เปิดฟอร์ม KYC (ต้องล็อกอินระบบหลักก่อนถึงจะเปิดได้)
    btnStartKyc.addEventListener('click', () => {
        const savedUser = localStorage.getItem('cvafas_user');
        if (!savedUser) {
            alert("🔒 กรุณาเข้าสู่ระบบ C-VAFAS (ระบบหลัก) ก่อนทำการยืนยันตัวตนครับ");
            window.location.href = "login.html";
            return;
        }
        
        kycIntro.style.display = 'none';
        kycFormArea.style.display = 'block';
    });

    // ฟังก์ชันเลือก Role (ผู้เสียหาย / อาสา) - ผูกไว้กับ HTML onclick="selectRole(this)"
    window.selectRole = function(element) {
        document.querySelectorAll('.role-card').forEach(card => card.classList.remove('selected'));
        element.classList.add('selected');
        selectedRole = element.getAttribute('data-role');
    };

    // ==========================================
    // 3. ระบบยืนยันตัวตนด้วยใบหน้า (Facial Recognition Mockup)
    // ==========================================
    const btnOpenCamera = document.getElementById('btnOpenCamera');
    const videoContainer = document.getElementById('videoContainer');
    const videoFeed = document.getElementById('videoFeed');
    const btnSnapFace = document.getElementById('btnSnapFace');
    const faceCanvas = document.getElementById('faceCanvas');
    const facePreview = document.getElementById('facePreview');
    
    let capturedFaceData = null; // เก็บภาพถ่าย
    let mediaStream = null; // เก็บสตรีมกล้อง

    // เปิดกล้อง
    if (btnOpenCamera) {
        btnOpenCamera.addEventListener('click', async () => {
            try {
                // ขออนุญาตใช้กล้องจากเบราว์เซอร์
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoFeed.srcObject = mediaStream;
                
                btnOpenCamera.style.display = 'none';
                videoContainer.style.display = 'block';
                btnSnapFace.style.display = 'block';
            } catch (error) {
                alert("❌ ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตให้เว็บเบราว์เซอร์ใช้กล้องของคุณครับ");
            }
        });
    }
    // ถ่ายภาพ (แบบจำลอง - ไม่เก็บไฟล์รูปจริงเพื่อแก้ปัญหา Payload)
    if (btnSnapFace) {
        btnSnapFace.addEventListener('click', () => {
            const context = faceCanvas.getContext('2d');
            faceCanvas.width = videoFeed.videoWidth;
            faceCanvas.height = videoFeed.videoHeight;
            
            // 1. วาดภาพจากวิดีโอลง Canvas เพื่อ "โชว์พรีวิว" บนหน้าเว็บเฉยๆ
            context.drawImage(videoFeed, 0, 0, faceCanvas.width, faceCanvas.height);
            facePreview.src = faceCanvas.toDataURL('image/png');
            
            // 🚨 2. ทริคระดับโปร: สับเปลี่ยนข้อมูลที่จะส่งไปหลังบ้าน ให้เป็นแค่ข้อความสั้นๆ แทน Base64 ของจริง!
            capturedFaceData = "mock_face_scanned_success"; 
            
            // 3. ปิดกล้องเพื่อประหยัดแบตเตอรี่
            mediaStream.getTracks().forEach(track => track.stop());
            
            videoContainer.style.display = 'none';
            btnSnapFace.style.display = 'none';
            facePreview.style.display = 'block';
            btnSubmitKyc.style.display = 'block'; // โชว์ปุ่มส่งข้อมูล!
            
            alert("📸 สแกนใบหน้าสำเร็จ ระบบพร้อมทำการวิเคราะห์แล้ว!");
        });
    }

    // ==========================================
    // 4. ส่งข้อมูล KYC + รูปถ่ายไปหาเซิร์ฟเวอร์
    // ==========================================
    const p2pChatArea = document.getElementById('p2pChatArea');

    if (btnSubmitKyc) {
        btnSubmitKyc.addEventListener('click', async () => {
            const idCard = document.getElementById('kycIdCard').value.trim();
            const savedUser = localStorage.getItem('cvafas_user');
            
            if (!savedUser) {
                alert("🔒 กรุณาเข้าสู่ระบบก่อนทำการยืนยันตัวตน"); return;
            }
            
            const userObj = JSON.parse(savedUser);

            if (!selectedRole || idCard.length !== 13 || isNaN(idCard)) {
                alert("❌ กรุณาเลือกสถานะ และกรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง"); return;
            }

            if (!capturedFaceData) {
                alert("📸 กรุณาเปิดกล้องและถ่ายภาพสแกนใบหน้าก่อนครับ!"); return;
            }

            const originalText = btnSubmitKyc.innerHTML;
            btnSubmitKyc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังวิเคราะห์ใบหน้าและตรวจข้อมูล...';
            btnSubmitKyc.disabled = true;

            try {
                const response = await fetch('http://127.0.0.1:3000/api/submit-kyc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: userObj.id, idCard: idCard, role: selectedRole, faceData: capturedFaceData 
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('cvafas_user', JSON.stringify(result.user));
                    
                    kycFormArea.style.display = 'none';
                    kycIntro.style.display = 'none';

                    const chatHeader = document.querySelector('#p2pChatArea h3');

                    if (selectedRole === 'volunteer') {
                        // 👨‍✈️ ฝั่งอาสาสมัคร: โชว์รายชื่อผู้เสียหาย
                        document.getElementById('volunteerDashboard').style.display = 'block';
                    } else {
                        // 👤 ฝั่งผู้เสียหาย: รออาสาสมัครมาช่วย
                        p2pChatArea.style.display = 'block';
                        liveChatMessages.innerHTML = '';
                        chatHeader.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังรออาสาสมัครตอบรับ...';
                        addLiveChatMessage('ระบบกำลังค้นหาอาสาสมัครที่ว่างเพื่อช่วยเหลือคุณ...', 'system');

                        // จำลองว่าอาสาสมัคร "คุณสมชาย" กดรับเคสใน 4 วินาที
                        setTimeout(() => {
                            chatHeader.innerHTML = '<i class="fa-solid fa-comments"></i> แชทกับ: อาสาสมัคร (คุณสมชาย)';
                            addLiveChatMessage('🎉 อาสาสมัครคุณสมชาย (ผู้เชี่ยวชาญกฎหมาย) รับเคสของคุณแล้ว', 'system');
                            setTimeout(() => {
                                addLiveChatMessage('สวัสดีครับ ผมอาสาสมัครสมชาย ยินดีให้คำปรึกษาครับ ไม่ทราบว่าโดนโกงในลักษณะไหนครับ?', 'partner', 'อาสาสมัครสมชาย');
                            }, 1500);
                        }, 4000);
                    }
                } else {
                    alert("❌ เกิดข้อผิดพลาด: " + result.error);
                }
            } catch (error) {
                alert("❌ เซิร์ฟเวอร์ไม่ตอบสนอง");
            } finally {
                btnSubmitKyc.innerHTML = originalText;
                btnSubmitKyc.disabled = false;
            }
        });
    }

    // ==========================================
    // 5. ระบบ Live Chat (ห้องแชทอาสาสมัคร)
    // ==========================================
    const liveChatMessages = document.getElementById('liveChatMessages');
    const liveChatInput = document.getElementById('liveChatInput');
    const btnSendLiveChat = document.getElementById('btnSendLiveChat');

    function addLiveChatMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.style.maxWidth = '80%';
        msgDiv.style.padding = '10px 15px';
        msgDiv.style.borderRadius = '15px';
        msgDiv.style.fontSize = '0.95rem';

        if (type === 'system') {
            msgDiv.style.alignSelf = 'center';
            msgDiv.style.background = '#f1c40f';
            msgDiv.style.color = '#2c3e50';
            msgDiv.style.fontWeight = 'bold';
            msgDiv.innerHTML = `<i class="fa-solid fa-robot"></i> ${text}`;
        } else if (type === 'me') {
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.style.background = '#27ae60';
            msgDiv.style.color = 'white';
            msgDiv.style.borderBottomRightRadius = '0';
            msgDiv.innerText = text;
        } else {
            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.background = 'white';
            msgDiv.style.color = '#2c3e50';
            msgDiv.style.border = '1px solid #e0e0e0';
            msgDiv.style.borderBottomLeftRadius = '0';
            msgDiv.innerHTML = `<i class="fa-solid fa-user-shield" style="color:#3498db;"></i> <strong>คู่สนทนา:</strong><br>${text}`;
        }

        liveChatMessages.appendChild(msgDiv);
        liveChatMessages.scrollTop = liveChatMessages.scrollHeight;
    }

    function sendLiveChat() {
        const text = liveChatInput.value.trim();
        if (text === "") return;
        
        addLiveChatMessage(text, 'me');
        liveChatInput.value = "";

        // จำลองให้มีคนตอบกลับมา (Mocking Real-time Response)
        setTimeout(() => {
            const replies = [
                "รับทราบครับ ผมเป็นอาสาด้านไอที ขอทราบรายละเอียดเพิ่มเติมได้ไหมครับ?",
                "รบกวนแคปหน้าจอแชทคนร้าย หรือสลิปโอนเงินส่งมาให้ตรวจสอบเบื้องต้นทีครับ",
                "อย่าเพิ่งโอนเงินเพิ่มเด็ดขาดนะครับ! รีบโทร 1441 ทันทีครับ"
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            addLiveChatMessage(randomReply, 'partner');
        }, 2000); // ดีเลย์ 2 วินาที
    }

    if (btnSendLiveChat) {
        btnSendLiveChat.addEventListener('click', sendLiveChat);
        liveChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendLiveChat();
        });
    }
    // ==========================================
    // ฟังก์ชันสำหรับ "อาสาสมัคร" เวลากดรับเคสผู้เสียหาย
    // ==========================================
    // เมื่ออาสาสมัครกดปุ่ม "รับเคสนี้"
    window.startHelpCase = function(victimName) {
        document.getElementById('volunteerDashboard').style.display = 'none';
        const p2pChatArea = document.getElementById('p2pChatArea');
        p2pChatArea.style.display = 'block';
        
        // เปลี่ยนหัวข้อแชทให้รู้ว่าคุยกับผู้เสียหายคนไหน
        const chatHeader = document.querySelector('#p2pChatArea h3');
        chatHeader.innerHTML = `<i class="fa-solid fa-comments"></i> กำลังช่วยเหลือ: ${victimName} (ผู้เสียหาย)`;
        
        const liveChatMessages = document.getElementById('liveChatMessages');
        liveChatMessages.innerHTML = '';
        addLiveChatMessage(`เชื่อมต่อกับผู้เสียหาย (${victimName}) สำเร็จ โปรดสอบถามรายละเอียดอย่างสุภาพ`, 'system');
        
        // จำลองผู้เสียหายพิมพ์มาหาทันที
        setTimeout(() => {
            addLiveChatMessage('สวัสดีครับคุณอาสา ช่วยด้วยครับ ผมโดนหลอกโอนเงินไปเมื่อกี้นี้เอง!', 'partner', victimName);
        }, 2000);
    };
    // แก้ไขฟังก์ชันแสดงข้อความแชทให้รองรับบทบาทที่ต่างกัน
    function addLiveChatMessage(text, type, partnerName = "คู่สนทนา") {
        const msgDiv = document.createElement('div');
        msgDiv.style.maxWidth = '80%';
        msgDiv.style.padding = '10px 15px';
        msgDiv.style.borderRadius = '15px';
        msgDiv.style.fontSize = '0.95rem';
        msgDiv.style.marginBottom = '5px';

        if (type === 'system') {
            msgDiv.style.alignSelf = 'center';
            msgDiv.style.background = '#f1c40f';
            msgDiv.style.color = '#2c3e50';
            msgDiv.style.fontWeight = 'bold';
            msgDiv.style.textAlign = 'center';
            msgDiv.innerHTML = `<i class="fa-solid fa-robot"></i> ${text}`;
        } else if (type === 'me') {
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.style.background = '#27ae60';
            msgDiv.style.color = 'white';
            msgDiv.style.borderBottomRightRadius = '0';
            msgDiv.innerText = text;
        } else {
            // 📌 ส่วนของคู่สนทนา (จะโชว์ชื่อว่าเป็นใคร)
            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.background = 'white';
            msgDiv.style.color = '#2c3e50';
            msgDiv.style.border = '1px solid #e0e0e0';
            msgDiv.style.borderBottomLeftRadius = '0';
            msgDiv.innerHTML = `<i class="fa-solid fa-user-shield" style="color:#3498db;"></i> <strong>${partnerName}:</strong><br>${text}`;
        }

        liveChatMessages.appendChild(msgDiv);
        liveChatMessages.scrollTop = liveChatMessages.scrollHeight;
    }
});