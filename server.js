const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({limit: '200mb'}));

// Initialize Gemini Pro model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

        // 1. ใช้ชื่อฟังก์ชันที่ถูกต้อง 'getGenerativeModel'
        // 2. ใช้ชื่อโมเดลที่ถูกต้องและพร้อมใช้งาน 'gemini-1.5-flash-001'
        const imageModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });

        // สร้างภาพจาก prompt
        const result = await imageModel.generateContent(prompt);
        const response = await result.response;

        // ดึงข้อมูลภาพแบบ Base64 ออกจาก response
        const imagePart = response.candidates[0].content.parts.find(part => part.fileData);
        if (!imagePart) {
            throw new Error('No image data found in the API response.');
        }

        const imageBase64 = imagePart.fileData.data;
        const mimeType = imagePart.fileData.mimeType;

        // สร้าง Data URL เพื่อส่งกลับไปให้หน้าเว็บ
        const imageURL = `data:${mimeType};base64,${imageBase64}`;

        res.json({
            image: imageURL,
            note: 'Generated using Gemini 1.5 Flash model.'
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