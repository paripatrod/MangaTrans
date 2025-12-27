// ========================================
// MangaTrans - Gemini Translation Engine (BEST TIER)
// Uses Google's Gemini 2.0 Flash for SOTA translation
// Features:
// - Professional manga localization prompts
// - Thai-only output enforcement
// - Batch processing with retry logic
// ========================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-2.0-flash-exp";
const API_KEY = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Translate texts using Gemini with Manga Context
 * @param {string[]} texts - Array of text strings from bubbles
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<string[]>} - Array of translated strings
 */
async function translateWithGemini(texts, sourceLang, targetLang) {
    if (!texts || texts.length === 0) return [];

    console.log(`🧠 Gemini is thinking... processing ${texts.length} bubbles.`);

    // Batch size: 10 bubbles (smaller for higher quality)
    const BATCH_SIZE = 10;
    const allTranslated = new Array(texts.length).fill(null);
    const batches = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        batches.push({
            index: i,
            chunk: texts.slice(i, i + BATCH_SIZE)
        });
    }

    console.log(`   📦 Split into ${batches.length} batches.`);

    for (const batch of batches) {
        try {
            console.log(`   🔄 Processing Batch ${Math.floor(batch.index / BATCH_SIZE) + 1}/${batches.length}...`);

            if (batch.index > 0) await new Promise(r => setTimeout(r, 3000));

            const translatedChunk = await processBatchWithRetry(batch.chunk, sourceLang, targetLang);

            for (let j = 0; j < translatedChunk.length; j++) {
                allTranslated[batch.index + j] = translatedChunk[j];
            }
        } catch (error) {
            console.error(`   ❌ Batch failed after retries:`, error.message);
            for (let j = 0; j < batch.chunk.length; j++) {
                allTranslated[batch.index + j] = batch.chunk[j];
            }
        }
    }

    return allTranslated;
}

async function processBatchWithRetry(texts, sourceLang, targetLang) {
    let attempt = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (attempt < maxAttempts) {
        attempt++;
        try {
            return await processBatch(texts, sourceLang, targetLang);
        } catch (error) {
            console.warn(`    ⚠️ Batch attempt ${attempt} failed: ${error.message}`);

            if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                const waitTime = 30000 + (attempt * 10000);
                console.log(`    ⏳ Quota exceeded. Waiting ${waitTime / 1000}s...`);
                await new Promise(r => setTimeout(r, waitTime));
            } else {
                lastError = error;
                if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    throw lastError || new Error("Max retries exceeded");
}

async function processBatch(texts, sourceLang, targetLang) {
    const inputs = texts.map((t, i) => ({ id: i + 1, text: t }));

    // PROFESSIONAL MANGA LOCALIZATION PROMPT
    const prompt = `คุณคือนักแปลมังงะมืออาชีพ ผู้เชี่ยวชาญด้าน Localization ภาษาไทย

## งานของคุณ
แปล ${texts.length} กล่องข้อความจาก${getSourceLabel(sourceLang)}เป็นภาษาไทย

## Input
${JSON.stringify(inputs)}

## กฎเหล็ก
1. ✅ ใช้อักษรไทยเท่านั้น (ก-ฮ, สระ, วรรณยุกต์)
2. ✅ แปลให้เป็นธรรมชาติ อ่านสนุก ไม่แข็งทื่อ
3. ✅ รักษาอารมณ์และน้ำเสียงของตัวละคร
4. ✅ ถ้าเป็น SFX ให้ใช้คำไทยที่เหมาะสม (เช่น ซู่ซ่า, ตูม, แคร็ก)
5. ✅ สรรพนาม: ให้ใช้ "ฉัน" เป็นหลัก (เป็นกลางทั้งชาย-หญิง) ยกเว้นบริบทชัดเจนว่าเป็นผู้ชายแมนๆ ค่อยใช้ "ผม"
6. ❌ ห้ามใส่คำอธิบาย ตอบเป็น JSON อย่างเดียว
7. ❌ ห้ามใช้ "/" เพื่อแสดงทางเลือก (เช่น ผม/หนู) - ให้เลือกคำเดียวที่เหมาะสมที่สุด
8. ❌ ห้ามใส่วงเล็บหรือคำอธิบายเพิ่มเติม

## การเลือกสรรพนาม
- 私/わたし/あたし → "ฉัน" (เป็นกลาง ใช้ได้ทั้งชาย-หญิง)
- 俺/おれ → "ฉัน" หรือ "ผม" (ถ้าบริบทแมนมาก)
- 僕/ぼく → "ฉัน" (เด็กผู้ชาย/ผู้ชายอ่อนโยน)
- あなた/君 → "เธอ" หรือ "นาย" ตามบริบท

## ตัวอย่างคำแปลที่ดี
- "なに!?" → "อะไรนะ!?"
- "ちょっと待って" → "เดี๋ยวก่อนสิ"
- "信じられない" → "ไม่อยากจะเชื่อเลย"
- "俺は..." → "ฉัน..."
- "私は..." → "ฉัน..."

## รูปแบบ Output (JSON เท่านั้น)
[{"id": 1, "translated": "คำแปลภาษาไทย"}, ...]

## Response:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Robust JSON Extraction
    const jsonStart = responseText.indexOf('[');
    const jsonEnd = responseText.lastIndexOf(']');

    if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON array found");

    const cleanJson = responseText.substring(jsonStart, jsonEnd + 1);
    let parsed;
    try {
        parsed = JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("JSON Parse Error: " + e.message);
    }

    if (!Array.isArray(parsed)) throw new Error("Parsed result is not an array");

    const resultMap = new Map();
    parsed.forEach(item => {
        if (item && item.id && item.translated) {
            resultMap.set(item.id, item.translated);
        }
    });

    return texts.map((original, index) => {
        const id = index + 1;
        if (resultMap.has(id)) return resultMap.get(id);

        console.warn(`    ⚠️ Missing translation for ID ${id}, using original.`);
        return original;
    });
}

function getSourceLabel(code) {
    const map = {
        'ko': 'ภาษาเกาหลี (มันฮวา)',
        'ja': 'ภาษาญี่ปุ่น (มังงะ)',
        'zh': 'ภาษาจีน (มันหัว)',
        'en': 'ภาษาอังกฤษ'
    };
    return map[code] || code;
}

module.exports = { translateWithGemini };
