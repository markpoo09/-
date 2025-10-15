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

    // Generate idea
    generateIdeaBtn.addEventListener('click', async () => {
        statusMessage.textContent = 'กำลังคิดไอเดียให้... (ใช้ Gemini 2.5 Flash)';
        statusMessage.classList.remove('hidden');

        const userPrompt = promptInput.value.trim();

        try {
            const response = await fetch('http://localhost:3000/generate-idea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: userPrompt, style: selectedStyle })
            });

            const data = await response.json();
            promptInput.value = data.idea;
            statusMessage.textContent = 'ได้ไอเดียใหม่แล้ว! ลองกด Generate Art';
            statusMessage.style.backgroundColor = 'lightyellow';

        } catch (error) {
            console.error("Error fetching idea:", error);
            statusMessage.textContent = 'เกิดข้อผิดพลาดในการสร้างไอเดีย';
            statusMessage.style.backgroundColor = 'lightcoral';
        }
    });

    // Generate art
    generateArtBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('กรุณาพิมพ์ Prompt ก่อน');
            return;
        }

        statusMessage.textContent = 'กำลังสร้างสรรค์ภาพ... (ใช้ Stable Diffusion XL ผ่าน Hugging Face - อาจใช้เวลา 20-60 วินาที)';
        statusMessage.classList.remove('hidden');
        imageOutput.innerHTML = '';

        try {
            const response = await fetch('http://localhost:3000/generate-art', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();
            const imageURL = data.image;
            imageOutput.innerHTML = `<img src="${imageURL}" alt="Generated Art">`;
            statusMessage.textContent = 'สร้างภาพเสร็จสมบูรณ์!';
            statusMessage.style.backgroundColor = 'lightgreen';

        } catch (error) {
            console.error("Error fetching art:", error);
            statusMessage.textContent = 'เกิดข้อผิดพลาดในการสร้างภาพ';
            statusMessage.style.backgroundColor = 'lightcoral';
        }
    });
});