const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({limit: '200mb'}));

// Canvas fallback function
function generateFallbackImageDataURL(prompt) {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Word wrap the prompt
        const words = prompt.split(' ');
        const lines = [];
        let currentLine = words[0] || '';
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < 450) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Draw text lines
        const lineHeight = 30;
        const startY = 256 - (lines.length * lineHeight) / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, 256, startY + (index * lineHeight));
        });
        
        // Add decorative elements
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(256, 256, 200, 0, Math.PI * 2);
        ctx.stroke();
        
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Canvas fallback failed:', error);
        throw new Error('Canvas fallback not available. Please install canvas: npm install canvas');
    }
}

// Hugging Face API function
async function generateImageWithHuggingFace(prompt) {
    // ลองใช้ model อื่นที่แน่ใจว่าทำงาน
    const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    const response = await fetch(API_URL, {
        headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                num_inference_steps: 20,
                guidance_scale: 7.5,
                width: 512,
                height: 512
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.log('Full Hugging Face response:', response.status, errorText);
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
}

// Simple text-based idea enhancement (without Gemini)
function enhancePrompt(prompt, style = 'Realistic') {
    const stylePrompts = {
        'Realistic': 'photorealistic, high quality, detailed, professional photography',
        'Cartoon': 'cartoon style, colorful, animated, cute, whimsical',
        'Abstract': 'abstract art, geometric, modern, artistic, creative',
        'Oil Painting': 'oil painting style, classical, artistic, textured brushstrokes',
        'Watercolor': 'watercolor painting, soft colors, delicate, artistic',
        'Digital Art': 'digital art, modern, clean, vibrant colors, high resolution'
    };
    
    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts['Realistic']}, masterpiece, best quality, detailed`;
    return enhancedPrompt;
}

app.post('/generate-idea', async (req, res) => {
    try {
        const { prompt, style = 'Realistic' } = req.body;
        
        // Generate enhanced prompt without Gemini
        const enhancedIdea = enhancePrompt(prompt, style);
        
        res.json({ 
            idea: enhancedIdea,
            note: 'Enhanced using built-in style templates'
        });
    } catch (error) {
        console.error("Error generating idea:", error);
        res.status(500).json({ error: 'Failed to generate idea', details: error.message });
    }
});

app.post('/generate-art', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('Prompt received for art generation:', prompt);

        if (!process.env.HUGGINGFACE_API_KEY) {
            console.log('No Hugging Face API key, using canvas fallback...');
            const fallbackImage = generateFallbackImageDataURL(prompt);
            return res.json({
                image: fallbackImage,
                note: 'Generated using local canvas fallback (no Hugging Face API key)',
                source: 'canvas',
                fallbackUsed: true
            });
        }

        try {
            console.log('Trying Hugging Face API...');
            const imageDataURL = await generateImageWithHuggingFace(prompt);
            res.json({
                image: imageDataURL,
                note: 'Generated using Stable Diffusion 2.1 via Hugging Face API',
                source: 'huggingface'
            });
        } catch (hfError) {
            console.error("Hugging Face API failed:", hfError.message);
            
            // ถ้า API busy หรือ loading model, รอแล้วลองใหม่
            if (hfError.message.includes('loading') || hfError.message.includes('busy') || hfError.message.includes('503')) {
                console.log('Model is loading, waiting 15 seconds...');
                await new Promise(resolve => setTimeout(resolve, 15000));
                
                try {
                    const imageDataURL = await generateImageWithHuggingFace(prompt);
                    res.json({
                        image: imageDataURL,
                        note: 'Generated using Stable Diffusion 2.1 via Hugging Face API (after retry)',
                        source: 'huggingface'
                    });
                    return;
                } catch (retryError) {
                    console.error("Retry failed:", retryError.message);
                }
            }
            
            // ถ้าล้มเหลว ใช้ fallback
            console.log('Falling back to canvas...');
            try {
                const fallbackImage = generateFallbackImageDataURL(prompt);
                res.json({
                    image: fallbackImage,
                    note: 'Generated using local canvas fallback (Hugging Face API failed)',
                    source: 'canvas',
                    fallbackUsed: true,
                    error: hfError.message
                });
            } catch (fallbackError) {
                console.error("Canvas fallback failed:", fallbackError);
                res.status(500).json({ 
                    error: 'Both Hugging Face API and canvas fallback failed', 
                    details: fallbackError.message,
                    hfError: hfError.message
                });
            }
        }

    } catch (error) {
        console.error("Error generating art:", error.message);
        res.status(500).json({ 
            error: 'Failed to generate art. Please check server logs.', 
            details: error.message 
        });
    }
});

app.post('/generate-art-native', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('Prompt received for native art generation:', prompt);

        if (!process.env.HUGGINGFACE_API_KEY) {
            console.log('No Hugging Face API key, using canvas fallback...');
            const fallbackImage = generateFallbackImageDataURL(prompt);
            return res.json({
                image: fallbackImage,
                note: 'Generated using local canvas fallback (no Hugging Face API key)',
                source: 'canvas',
                fallbackUsed: true
            });
        }

        // Enhance prompt using built-in templates instead of Gemini
        const enhancedPrompt = enhancePrompt(prompt);
        console.log('Enhanced prompt:', enhancedPrompt);

        try {
            const imageDataURL = await generateImageWithHuggingFace(enhancedPrompt);
            res.json({
                image: imageDataURL,
                note: 'Generated using enhanced prompt + Stable Diffusion 2.1',
                source: 'huggingface',
                enhancedPrompt: enhancedPrompt
            });
        } catch (hfError) {
            console.error("Hugging Face with enhanced prompt failed:", hfError.message);
            
            // ลองใช้ original prompt
            try {
                const imageDataURL = await generateImageWithHuggingFace(prompt);
                res.json({
                    image: imageDataURL,
                    note: 'Generated using original prompt + Stable Diffusion 2.1',
                    source: 'huggingface'
                });
            } catch (originalError) {
                console.error("Hugging Face with original prompt failed:", originalError.message);
                
                // Canvas fallback
                const fallbackImage = generateFallbackImageDataURL(prompt);
                res.json({
                    image: fallbackImage,
                    note: 'Generated using canvas fallback (Hugging Face API failed)',
                    source: 'canvas',
                    fallbackUsed: true,
                    error: hfError.message
                });
            }
        }

    } catch (error) {
        console.error("Error in native art generation:", error.message);
        res.status(500).json({ 
            error: 'Failed to generate art natively.', 
            details: error.message 
        });
    }
});

const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log('Available APIs:');
    console.log('- Hugging Face:', process.env.HUGGINGFACE_API_KEY ? '✓ Configured' : '✗ Not configured');
    console.log('- Canvas Fallback: Available');
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying ${port + 1}`);
        const nextPort = port + 1;
        app.listen(nextPort, () => {
            console.log(`Server listening at http://localhost:${nextPort}`);
        });
    } else {
        console.error('Server error:', err);
    }
});