document.addEventListener('DOMContentLoaded', () => {
    const homeContent = document.getElementById('content-home');
    const aboutContent = document.getElementById('content-about');
    const generateContent = document.getElementById('content-generate');
    const startBtn = document.getElementById('start-create-btn');
    const navHome = document.getElementById('nav-home');
    const navGenerate = document.getElementById('nav-generate');
    const promptInput = document.getElementById('prompt-input');
    const generateIdeaBtn = document.getElementById('generate-idea-btn');
    const generateArtBtn = document.getElementById('generate-art-btn');
    const imageOutput = document.getElementById('image-output');
    const statusMessage = document.getElementById('status-message');
    const styleBtns = document.querySelectorAll('.style-btn');

    let selectedStyle = 'Realistic';

    // Navigation active state
    const setActiveNav = (activeNav) => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeNav.classList.add('active');
    };

    // Show generate page
    const showGeneratePage = () => {
        homeContent.classList.add('hidden');
        aboutContent.classList.add('hidden');
        generateContent.classList.remove('hidden');
        setActiveNav(navGenerate);
    };

    // Show home page
    const showHomePage = () => {
        homeContent.classList.remove('hidden');
        aboutContent.classList.remove('hidden');
        generateContent.classList.add('hidden');
        setActiveNav(navHome);
    };

    startBtn.addEventListener('click', showGeneratePage);
    
    navGenerate.addEventListener('click', (e) => {
        e.preventDefault();
        showGeneratePage();
    });

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        showHomePage();
    });

    // Style selection
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.style-btn.active').classList.remove('active');
            btn.classList.add('active');
            selectedStyle = btn.getAttribute('data-style');
            console.log('Selected Style:', selectedStyle);
        });
    });

    // Enhance prompt (ใช้แทน Generate Idea)
    generateIdeaBtn.addEventListener('click', async () => {
        statusMessage.textContent = 'กำลังปรับปรุง prompt ให้เหมาะกับ Stable Diffusion...';
        statusMessage.classList.remove('hidden');
        statusMessage.style.backgroundColor = 'lightblue';

        const userPrompt = promptInput.value.trim();

        if (!userPrompt) {
            statusMessage.textContent = 'กรุณาพิมพ์คำสั่ง Prompt ก่อน';
            statusMessage.style.backgroundColor = 'lightcoral';
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/generate-idea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: userPrompt, style: selectedStyle })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            promptInput.value = data.idea;
            statusMessage.textContent = `✅ ปรับปรุง prompt สำเร็จ! (${data.note || 'สไตล์: ' + selectedStyle})`;
            statusMessage.style.backgroundColor = 'lightgreen';

        } catch (error) {
            console.error("Error enhancing prompt:", error);
            statusMessage.textContent = '❌ เกิดข้อผิดพลาดในการปรับปรุง prompt';
            statusMessage.style.backgroundColor = 'lightcoral';
        }
    });

    // Generate art with Stable Diffusion
    generateArtBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('กรุณาพิมพ์ Prompt ก่อน');
            return;
        }

        // แสดงสถานะเริ่มต้น
        statusMessage.textContent = '🎨 กำลังสร้างภาพด้วย Stable Diffusion 2.1... (อาจใช้เวลา 15-30 วินาที)';
        statusMessage.classList.remove('hidden');
        statusMessage.style.backgroundColor = 'lightblue';
        imageOutput.innerHTML = '<div style="text-align: center; padding: 40px; font-size: 18px;">⏳ กำลังโหลด...<br><small style="color: #666;">กรุณารอสักครู่</small></div>';

        try {
            const response = await fetch('http://localhost:3000/generate-art', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.image) {
                const imageURL = data.image;
                imageOutput.innerHTML = `
                    <img src="${imageURL}" alt="Generated Art" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <div style="margin-top: 10px; font-size: 12px; color: #666; text-align: center;">
                        Prompt: "${prompt}"
                    </div>
                `;
                
                // แสดงสถานะขึ้นอยู่กับแหล่งที่มา
                if (data.source === 'huggingface') {
                    statusMessage.textContent = '🎉 สร้างภาพสำเร็จด้วย Stable Diffusion 2.1 via Hugging Face!';
                    statusMessage.style.backgroundColor = 'lightgreen';
                } else if (data.source === 'canvas' || data.fallbackUsed) {
                    statusMessage.textContent = '⚠️ ใช้ระบบสำรอง - Hugging Face API ไม่พร้อมใช้งาน';
                    statusMessage.style.backgroundColor = 'lightyellow';
                } else {
                    statusMessage.textContent = '✅ สร้างภาพเสร็จสมบูรณ์!';
                    statusMessage.style.backgroundColor = 'lightgreen';
                }

                // เพิ่มข้อมูลเพิ่มเติม
                if (data.note) {
                    const noteDiv = document.createElement('div');
                    noteDiv.style.cssText = 'margin-top: 5px; font-size: 11px; color: #888; text-align: center;';
                    noteDiv.textContent = data.note;
                    imageOutput.appendChild(noteDiv);
                }

            } else {
                throw new Error('ไม่ได้รับภาพจาก server');
            }

        } catch (error) {
            console.error("Error generating art:", error);
            statusMessage.textContent = `❌ เกิดข้อผิดพลาด: ${error.message}`;
            statusMessage.style.backgroundColor = 'lightcoral';
            imageOutput.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    ❌ ไม่สามารถสร้างภาพได้<br>
                    <small>กรุณาลองใหม่อีกครั้ง</small>
                </div>
            `;
        }
    });

    // เพิ่มฟังก์ชันสำหรับ Enter key ใน prompt input
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateArtBtn.click();
        }
    });

    // เพิ่มฟังก์ชันเคลียร์ข้อความสถานะเมื่อเริ่มพิมพ์ใหม่
    promptInput.addEventListener('input', () => {
        if (statusMessage.textContent.includes('เกิดข้อผิดพลาด') || 
            statusMessage.textContent.includes('สร้างภาพเสร็จ') ||
            statusMessage.textContent.includes('สำเร็จ')) {
            statusMessage.classList.add('hidden');
            statusMessage.style.backgroundColor = '';
        }
    });

    // เพิ่ม tooltip สำหรับปุ่มต่างๆ
    generateIdeaBtn.title = "ปรับปรุง prompt ให้เหมาะกับ Stable Diffusion";
    generateArtBtn.title = "สร้างภาพด้วย Stable Diffusion 2.1 ผ่าน Hugging Face API";
});