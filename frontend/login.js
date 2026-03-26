document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Authentication module loaded (No CAPTCHA).");

    // ==========================================
    // 1. ระบบ UI: สลับหน้าต่าง (Login / Register / Forgot)
    // ==========================================
    const btnShowLogin = document.getElementById('btnShowLogin');
    const btnShowRegister = document.getElementById('btnShowRegister');
    const toggleHeader = document.getElementById('formToggleHeader');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    
    const linkForgotPassword = document.getElementById('linkForgotPassword');
    const linkBackToLogin = document.getElementById('linkBackToLogin');

    function hideAllForms() {
        if (loginForm) loginForm.classList.add('form-hidden');
        if (registerForm) registerForm.classList.add('form-hidden');
        if (forgotForm) forgotForm.classList.add('form-hidden');
    }

    if (btnShowRegister) {
        btnShowRegister.addEventListener('click', () => {
            if (btnShowLogin) btnShowLogin.classList.remove('active');
            btnShowRegister.classList.add('active');
            hideAllForms();
            if (registerForm) registerForm.classList.remove('form-hidden');
        });
    }

    if (btnShowLogin) {
        btnShowLogin.addEventListener('click', () => {
            if (btnShowRegister) btnShowRegister.classList.remove('active');
            btnShowLogin.classList.add('active');
            hideAllForms();
            if (loginForm) loginForm.classList.remove('form-hidden');
        });
    }

    if (linkForgotPassword) {
        linkForgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllForms();
            if (toggleHeader) toggleHeader.classList.add('form-hidden');
            if (forgotForm) forgotForm.classList.remove('form-hidden');
        });
    }

    if (linkBackToLogin) {
        linkBackToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllForms();
            if (toggleHeader) toggleHeader.classList.remove('form-hidden');
            if (loginForm) loginForm.classList.remove('form-hidden');
            if (btnShowRegister) btnShowRegister.classList.remove('active');
            if (btnShowLogin) btnShowLogin.classList.add('active');
        });
    }

    // ==========================================
    // 2. ระบบ API: สมัครสมาชิก (ระบบ OTP)
    // ==========================================
    const otpModal = document.getElementById('otpModal');
    const btnVerifyOtp = document.getElementById('btnVerifyOtp');
    const btnCancelOtp = document.getElementById('btnCancelOtp');
    const otpInput = document.getElementById('otpInput');
    const otpPhoneDisplay = document.getElementById('otpPhoneDisplay');
    
    // ตัวแปรเก็บเบอร์โทรที่กำลังรอ OTP
    let pendingPhone = ""; 

    if (registerForm) {
        // จังหวะที่ 1: กดปุ่มสมัคร เพื่อขอ OTP
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.textContent = "กำลังส่งรหัส OTP...";
            submitBtn.disabled = true;

            const username = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : "";
            const password = document.getElementById('regPassword').value;

            // ตรวจสอบเบอร์โทรศัพท์
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(phone)) {
                alert("❌ กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0)");
                submitBtn.textContent = "สมัครสมาชิกและเริ่มใช้งาน";
                submitBtn.disabled = false;
                return;
            }

            try {
                // ยิง API ขอ OTP แทนการสมัครทันที
                const response = await fetch('http://127.0.0.1:3000/api/request-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, phone }) 
                });

                const result = await response.json();

                if (response.ok) {
                    // เปิดหน้าต่างกรอก OTP
                    pendingPhone = phone;
                    if (otpPhoneDisplay) otpPhoneDisplay.textContent = phone;
                    if (otpInput) otpInput.value = ""; // ล้างช่องเก่า
                    if (otpModal) otpModal.style.display = 'flex';
                } else {
                    alert("❌ ไม่สามารถส่ง OTP ได้: " + result.error);
                }
            } catch (error) {
                alert("❌ เซิร์ฟเวอร์ไม่ตอบสนอง");
            } finally {
                submitBtn.textContent = "สมัครสมาชิกและเริ่มใช้งาน";
                submitBtn.disabled = false;
            }
        });
    }

    // จังหวะที่ 2: กดปุ่มยืนยัน OTP
    if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', async () => {
            const otpCode = otpInput.value.trim();
            if (otpCode.length !== 6) {
                alert("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
                return;
            }

            const originalText = btnVerifyOtp.innerHTML;
            btnVerifyOtp.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
            btnVerifyOtp.disabled = true;

            try {
                // ยิง API ตรวจสอบ OTP เพื่อสร้างบัญชีจริง
                const response = await fetch('http://127.0.0.1:3000/api/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: pendingPhone, otp: otpCode }) 
                });

                const result = await response.json();

                if (response.ok) {
                    alert("🎉 " + result.message);
                    otpModal.style.display = 'none'; // ปิดกล่อง OTP
                    if (btnShowLogin) btnShowLogin.click(); // สลับไปหน้าล็อกอิน
                    registerForm.reset();
                } else {
                    alert("❌ ยืนยันไม่สำเร็จ: " + result.error);
                    otpInput.value = ""; // เคลียร์ช่องให้พิมพ์ใหม่
                }
            } catch (error) {
                alert("❌ เซิร์ฟเวอร์ไม่ตอบสนอง");
            } finally {
                btnVerifyOtp.innerHTML = originalText;
                btnVerifyOtp.disabled = false;
            }
        });
    }

    // ปิดกล่อง OTP ถ้ายกเลิก
    if (btnCancelOtp) {
        btnCancelOtp.addEventListener('click', () => {
            if (otpModal) otpModal.style.display = 'none';
        });
    }

    // ==========================================
    // 3. ระบบ API: เข้าสู่ระบบ (Login)
    // ==========================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.textContent = "กำลังตรวจสอบ...";
            submitBtn.disabled = true;

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('http://127.0.0.1:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('cvafas_user', JSON.stringify(result.user));
                    alert(`✅ ยินดีต้อนรับคุณ ${result.user.username}`);
                    
                    if (result.user.role === 'admin') {
                        window.location.href = 'admin.html'; 
                    } else {
                        window.location.href = 'index.html'; 
                    }
                } else {
                    alert("❌ เข้าสู่ระบบไม่สำเร็จ: " + result.error);
                }
            } catch (error) {
                alert("❌ เซิร์ฟเวอร์ไม่ตอบสนอง กรุณาตรวจสอบว่ารัน backend ไว้หรือไม่");
            } finally {
                submitBtn.textContent = "เข้าสู่ระบบ";
                submitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 4. ระบบเปิด/ปิด หน้าต่างข้อตกลงความเป็นส่วนตัว
    // ==========================================
    const linkTerms = document.getElementById('linkTerms');
    const termsModal = document.getElementById('termsModal');
    const closeTerms = document.getElementById('closeTerms');
    const btnAcceptTerms = document.getElementById('btnAcceptTerms');
    const regTermsCheckbox = document.getElementById('regTermsCheckbox');

    if (linkTerms && termsModal) {
        linkTerms.addEventListener('click', (e) => {
            e.preventDefault();
            termsModal.style.display = 'flex';
        });

        closeTerms.addEventListener('click', () => {
            termsModal.style.display = 'none';
        });

        btnAcceptTerms.addEventListener('click', () => {
            termsModal.style.display = 'none';
            if (regTermsCheckbox) {
                regTermsCheckbox.checked = true; 
            }
        });

        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) {
                termsModal.style.display = 'none';
            }
        });
    }

    // ==========================================
    // 5. ระบบกู้คืนรหัสผ่าน (Forgot Password)
    // ==========================================
    const btnForgotPwd = document.getElementById('btnForgotPwd'); 
    const backToLogin = document.getElementById('backToLogin'); 

    if (btnForgotPwd) {
        btnForgotPwd.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.classList.add('form-hidden');
            if (registerForm) registerForm.classList.add('form-hidden');
            if (forgotForm) forgotForm.classList.remove('form-hidden');
            if (document.querySelector('.auth-toggle')) document.querySelector('.auth-toggle').style.display = 'none';
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (forgotForm) forgotForm.classList.add('form-hidden');
            if (loginForm) loginForm.classList.remove('form-hidden');
            if (document.querySelector('.auth-toggle')) document.querySelector('.auth-toggle').style.display = 'flex';
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('forgotUsername').value.trim();
            const email = document.getElementById('forgotEmail').value.trim();
            const newPassword = document.getElementById('forgotNewPassword').value.trim();
            const submitBtn = forgotForm.querySelector('button[type="submit"]');

            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังอัปเดตข้อมูล...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('http://127.0.0.1:3000/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, username, newPassword })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message); 
                    forgotForm.reset(); 
                    if (backToLogin) backToLogin.click(); 
                } else {
                    alert(result.error); 
                }
            } catch (error) {
                console.error("Error resetting password:", error);
                alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});