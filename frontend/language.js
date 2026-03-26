// ==========================================
// i18n: ระบบแปลภาษา (TH / EN)
// ==========================================

const translations = {
    th: {
        "nav_home": "หน้าแรก",
        "nav_lab": "The Lab",
        "nav_search": "ค้นหาเบาะแส",
        "nav_news": "ข่าวไซเบอร์",
        "nav_help": "ศูนย์ช่วยเหลือ",
        "hero_title": "ระบบประเมินช่องโหว่และแจ้งเตือนภัยคุกคามทางไซเบอร์",
        "hero_desc": "แพลตฟอร์มส่วนกลางสำหรับการตรวจสอบไฟล์ต้องสงสัย ค้นหาประวัติอาชญากรรม และรับความช่วยเหลือจากเครือข่ายผู้เชี่ยวชาญ",
        "btn_start": "เริ่มต้นใช้งาน",
        "btn_report": "แจ้งเบาะแส",
        // เพิ่มคำอื่นๆ ที่นี่...
    },
    en: {
        "nav_home": "Home",
        "nav_lab": "The Lab",
        "nav_search": "Search Threats",
        "nav_news": "Cyber News",
        "nav_help": "Help Center",
        "hero_title": "Cyber-Vulnerability Assessment & Forensic Alert System",
        "hero_desc": "A centralized platform for scanning suspicious files, searching criminal records, and getting help from expert networks.",
        "btn_start": "Get Started",
        "btn_report": "Report Threat",
        // Add more words here...
    }
};

// เช็กว่าผู้ใช้เคยเลือกภาษาไว้ไหม (ถ้าไม่เคย ให้ใช้ 'th' เป็นค่าเริ่มต้น)
let currentLang = localStorage.getItem('cvafas_lang') || 'th';

// ฟังก์ชันสำหรับไล่แปลอักษรทั้งหน้าเว็บ
function applyTranslations() {
    // หา HTML ทุกตัวที่มีคำสั่ง data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key]; // เปลี่ยนข้อความ
        }
    });

    // เปลี่ยนข้อความบนปุ่มสลับภาษา
    const langBtnText = document.getElementById('langBtnText');
    if (langBtnText) {
        langBtnText.textContent = currentLang === 'th' ? 'EN' : 'TH';
    }
}

// ฟังก์ชันสลับภาษา
function toggleLanguage() {
    currentLang = currentLang === 'th' ? 'en' : 'th';
    localStorage.setItem('cvafas_lang', currentLang); // จำภาษาที่เลือกลงเครื่อง
    applyTranslations(); // สั่งแปลหน้าเว็บทันที
}

// เมื่อโหลดหน้าเว็บเสร็จ ให้ทำงานทันที
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();

    const btnLangToggle = document.getElementById('btnLangToggle');
    if (btnLangToggle) {
        btnLangToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleLanguage();
        });
    }
});