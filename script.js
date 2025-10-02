document.addEventListener('DOMContentLoaded', () => {
    const homeContent = document.getElementById('content-home');
    const generateContent = document.getElementById('content-generate');
    const startBtn = document.getElementById('start-create-btn');
    const navGenerate = document.getElementById('nav-generate');
    const promptInput = document.getElementById('prompt-input');
    const generateIdeaBtn = document.getElementById('generate-idea-btn');
    const generateArtBtn = document.getElementById('generate-art-btn');
    const imageOutput = document.getElementById('image-output');
    const statusMessage = document.getElementById('status-message');
    const styleBtns = document.querySelectorAll('.style-btn');

    let selectedStyle = 'Realistic'; // สไตล์เริ่มต้น

    // 1. การเปลี่ยนหน้า
    const showGeneratePage = () => {
        homeContent.classList.add('hidden');
        generateContent.classList.remove('hidden');
    };

    startBtn.addEventListener('click', showGeneratePage);
    navGenerate.addEventListener('click', (e) => {
        e.preventDefault();
        showGeneratePage();
    });

    // 2. การเลือกสไตล์
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.style-btn.active').classList.remove('active');
            btn.classList.add('active');
            selectedStyle = btn.getAttribute('data-style');
            console.log('Selected Style:', selectedStyle);
        });
    });

    // 3. ฟังก์ชันสร้างไอเดีย (ใช้ Gemini - โทเค็นต่ำ)
    generateIdeaBtn.addEventListener('click', async () => {
        statusMessage.textContent = 'กำลังคิดไอเดียให้... (ใช้ Gemini 2.5 Flash)';
        statusMessage.classList.remove('hidden');

        const userPrompt = promptInput.value.trim();
        const fullPrompt = `สร้างไอเดียสำหรับภาพศิลปะสไตล์ ${selectedStyle} จากคำว่า "${userPrompt}" โดยใช้คำศัพท์ที่น่าสนใจ`;

        // *** นี่คือส่วนที่ต้องใช้ Backend Server จริง ***
        // ในโค้ด Frontend นี้ เราจะจำลองการตอบกลับ
        await new Promise(resolve => setTimeout(resolve, 1500)); // จำลองเวลา API
        
        // สมมติว่า AI สร้าง Prompt ที่ดีขึ้นมา
        const newIdea = `A majestic, hyper-realistic, neon-lit cityscape at dusk, focusing on deep reflections in wet pavement. Style: ${selectedStyle}`;
        promptInput.value = newIdea;

        statusMessage.textContent = 'ได้ไอเดียใหม่แล้ว! ลองกด Generate Art';
        statusMessage.style.backgroundColor = 'lightyellow';
        
    });

    // 4. ฟังก์ชันสร้างรูปภาพ (ใช้ Imagen - ประหยัดค่าใช้จ่ายด้วยความละเอียดต่ำ)
    generateArtBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('กรุณาพิมพ์ Prompt ก่อน');
            return;
        }

        statusMessage.textContent = 'กำลังสร้างสรรค์ภาพ... (ใช้ Imagen 3 ความละเอียด 512x512px เพื่อประหยัด)';
        statusMessage.classList.remove('hidden');
        imageOutput.innerHTML = ''; // ล้างพื้นที่รูปภาพ

        // ในโค้ด Frontend นี้ เราจะจำลองการแสดงรูปภาพ
        await new Promise(resolve => setTimeout(resolve, 3000)); // จำลองเวลา API
        
        // สมมติว่าได้ Base64 Image มาจาก Backend
        // const placeholderImageURL = 'https://via.placeholder.com/512x512?text=' + encodeURIComponent(prompt.substring(0, 20) + '... (Low Res)');
        const placeholderImageURL = 'https://picsum.photos/512';

        imageOutput.innerHTML = `<img src="${placeholderImageURL}" alt="Generated Art">`;
        
        statusMessage.textContent = 'สร้างภาพเสร็จสมบูรณ์!';
        statusMessage.style.backgroundColor = 'lightgreen';
    });
});