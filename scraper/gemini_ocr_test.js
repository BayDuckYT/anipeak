import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function test() {
  const imagePath = 'C:/Users/Murathan/Desktop/mahorapeak manga/Solo Leveling/ENG/Bolum_4/03.png';
  const buffer = fs.readFileSync(imagePath);
  const img = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: 'image/png'
    }
  };

  const prompt = `Find all text bubbles in this manga page. Return a valid JSON array where each object has:
- "box": an array of 4 numbers [ymin, xmin, ymax, xmax] scaled 0-1000 representing the bounding box of the text.
- "tr_text": professional Turkish translation of the English text.
Only return JSON, no markdown formatting like \`\`\`json.`;

  try {
    const result = await model.generateContent([prompt, img]);
    console.log(result.response.text());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
