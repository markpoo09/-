AImagica — Local dev fallback for Text-to-Image

This project uses Google Gemini APIs to generate images. To make local development easier and ensure the web UI can still show an image when the Gemini Image API isn't available or returns quota errors, the server provides a local Text-to-Image fallback using the `canvas` package.

How it works

- Primary: `/generate-art-native` and `/generate-art` call Gemini models to produce images.
- Fallback: if the Gemini call fails (quota, network, or other errors), the server will try to generate a simple image locally using `node-canvas` and return a data URL.

Install

1. Install dependencies:

   npm install

2. On Windows, `canvas` requires native libraries. If installation fails, follow the `canvas` installation notes: https://www.npmjs.com/package/canvas

Quick start

1. Create a `.env` file with your Gemini API key:

   GEMINI_API_KEY="YOUR_KEY"

2. Start the server:

   npm start

3. Open `index.html` in a browser and use the Generate UI.

Notes

- The fallback produces a simple text-rendered PNG (not a photographic image). It's intended for local testing and demos only.
- If you don't want the fallback, remove the `canvas` dependency or uninstall it from your environment.

If you run into issues installing `canvas`, consider using WSL or Docker for an easier native dependency installation on Windows.
