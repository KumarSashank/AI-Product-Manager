const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      config: {
        systemInstruction: 'You are a helpful assistant',
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });
    console.log(response.text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
