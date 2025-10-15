const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({limit: '200mb'}));

// Initialize Gemini Pro model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Initialize Hugging Face (ใช้ฟรีไม่ต้อง API key หรือใส่ API key เพื่อความเร็วและไม่มี rate limit)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

app.post('/generate-idea', async (req, res) => {
    try {
        const { prompt, style } = req.body;
        const fullPrompt = `สร้างไอเดียสำหรับภาพศิลปะสไตล์ ${style} จากคำว่า "${prompt}" โดยใช้คำศัพท์ที่น่าสนใจและเขียนเป็นภาษาอังกฤษที่ละเอียดสำหรับใช้เป็น prompt ในการสร้างภาพ`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const newIdea = response.text();

        res.json({ idea: newIdea });
    } catch (error) {
        console.error("Error generating idea:", error);
        res.status(500).json({ error: 'Failed to generate idea', details: error.message });
    }
});

app.post('/generate-art', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('Prompt received for art generation:', prompt);

        // ใช้ Gemini ปรับปรุง prompt ให้เหมาะสำหรับการสร้างภาพ
        const enhancedPromptModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const enhancePrompt = `Convert this to a concise English image generation prompt (maximum 50 words, no explanations, just the visual description): "${prompt}"`;
        
        const result = await enhancedPromptModel.generateContent(enhancePrompt);
        const response = await result.response;
        let enhancedPrompt = response.text().trim();
        
        // ตัดข้อความที่ไม่ต้องการออก (markdown, คำอธิบายยาว)
        enhancedPrompt = enhancedPrompt
            .replace(/```[\s\S]*?```/g, '') // ลบ code blocks
            .replace(/\*\*/g, '') // ลบ markdown bold
            .replace(/\*/g, '') // ลบ markdown italic
            .split('\n')[0] // เอาแค่บรรทัดแรก
            .substring(0, 500); // จำกัดความยาว
        
        console.log('Enhanced prompt:', enhancedPrompt);

        // สร้างภาพด้วย Hugging Face 
        // ใช้ model: stabilityai/stable-diffusion-xl-base-1.0 (SDXL - คุณภาพสูง)
        const imageBlob = await hf.textToImage({
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            inputs: enhancedPrompt,
            parameters: {
                negative_prompt: 'blurry, bad quality, distorted, ugly, low resolution, deformed'
            }
        });

        // แปลง Blob เป็น Base64
        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const imageURL = `data:image/jpeg;base64,${base64Image}`;

        res.json({
            image: imageURL,
            enhancedPrompt: enhancedPrompt,
            note: 'Generated using Stable Diffusion XL via Hugging Face'
        });

    } catch (error) {
        console.error("Error generating art:", error.message);
        res.status(500).json({ 
            error: 'Failed to generate art. Please check server logs.', 
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});