document.addEventListener('DOMContentLoaded', function() {
    console.log("C-VAFAS: Authentication module loaded.");

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
        loginForm.classList.add('form-hidden');
        registerForm.classList.add('form-hidden');
        forgotForm.classList.add('form-hidden');
    }

    btnShowRegister.addEventListener('click', () => {
        btnShowLogin.classList.remove('active');
        btnShowRegister.classList.add('active');
        hideAllForms();
        registerForm.classList.remove('form-hidden');
    });

    btnShowLogin.addEventListener('click', () => {
        btnShowRegister.classList.remove('active');
        btnShowLogin.classList.add('active');
        hideAllForms();
        loginForm.classList.remove('form-hidden');
    });

    linkForgotPassword.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        toggleHeader.classList.add('form-hidden');
        forgotForm.classList.remove('form-hidden');
    });

    linkBackToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        toggleHeader.classList.remove('form-hidden');
        loginForm.classList.remove('form-hidden');
        btnShowRegister.classList.remove('active');
        btnShowLogin.classList.add('active');
    });

    // ==========================================
    // 2. ระบบ API: สมัครสมาชิก (Register)
    // ==========================================
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // ป้องกันเว็บรีเฟรช
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.textContent = "กำลังสร้างบัญชี...";
        submitBtn.disabled = true;

        const username = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        try {
            const response = await fetch('http://127.0.0.1:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                alert("🎉 " + result.message);
                // สมัครเสร็จ สลับกลับไปหน้า Login อัตโนมัติ
                btnShowLogin.click(); 
                registerForm.reset();
            } else {
                alert("❌ สมัครไม่สำเร็จ: " + result.error);
            }
        } catch (error) {
            alert("❌ เซิร์ฟเวอร์ไม่ตอบสนอง กรุณาตรวจสอบว่ารัน backend ไว้หรือไม่");
        } finally {
            submitBtn.textContent = "สมัครสมาชิกและเริ่มใช้งาน";
            submitBtn.disabled = false;
        }
    });

    // ==========================================
    // 3. ระบบ API: เข้าสู่ระบบ (Login)
    // ==========================================
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
                // 🔑 ล็อกอินสำเร็จ! เก็บข้อมูลผู้ใช้ไว้ในเครื่อง (localStorage)
                localStorage.setItem('cvafas_user', JSON.stringify(result.user));
                
                alert(`✅ ยินดีต้อนรับคุณ ${result.user.username}`);
                
                // พาไปหน้าแรก (Home)
                window.location.href = 'index.html'; 
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
    // ==========================================
    // 4. ระบบเปิด/ปิด หน้าต่างข้อตกลงความเป็นส่วนตัว
    // ==========================================
    const linkTerms = document.getElementById('linkTerms');
    const termsModal = document.getElementById('termsModal');
    const closeTerms = document.getElementById('closeTerms');
    const btnAcceptTerms = document.getElementById('btnAcceptTerms');
    const regTermsCheckbox = document.getElementById('regTermsCheckbox');

    if (linkTerms && termsModal) {
        // กดลิงก์เพื่อเปิดหน้าต่าง
        linkTerms.addEventListener('click', (e) => {
            e.preventDefault();
            termsModal.style.display = 'flex';
        });

        // กดปุ่มกากบาทเพื่อปิด
        closeTerms.addEventListener('click', () => {
            termsModal.style.display = 'none';
        });

        // กดยอมรับเงื่อนไข (ปิดหน้าต่าง + ติ๊กถูกที่ Checkbox ให้อัตโนมัติ)
        btnAcceptTerms.addEventListener('click', () => {
            termsModal.style.display = 'none';
            if (regTermsCheckbox) {
                regTermsCheckbox.checked = true; // ติ๊กถูกให้อัตโนมัติ!
            }
        });

        // กดพื้นที่ว่างสีดำด้านนอกเพื่อปิด
        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) {
                termsModal.style.display = 'none';
            }
        });
    }
});