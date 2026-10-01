const https = require('https');
const http = require('http');

const SYSTEM_PROMPT = `Kamu adalah JZ AI Assistant, sebuah asisten AI cerdas, ramah, dan serba bisa yang terintegrasi di website JZINJECTLINK.
Kamu BISA dan MAMPU menjawab pertanyaan tentang SEGALA HAL tanpa batas bidang, termasuk namun tidak terbatas pada:
1. Pengetahuan umum, sains, fisika, astronomi, biologi, sejarah, geografi, sosial, dan filsafat.
2. Pemrograman & Coding (JavaScript, Python, C++, PHP, HTML/CSS, database, debugging, dsb) lengkap dengan contoh kode.
3. Matematika, rumus, perhitungan, dan pemecahan masalah logika.
4. Bantuan tugas, pembuatan artikel, terjemahan multi-bahasa, ringkasan, dan penjelasan konsep rumit.
5. Obrolan santai, tips sehari-hari, produktivitas, hiburan, film, game, musik, dan teknologi terkini.
6. Seputar website JZINJECTLINK (cara bypass safelink, file hosting yang didukung seperti MediaFire/Google Drive/Mega, cara pakai, dsb).

Gaya jawaban:
- Gunakan bahasa Indonesia yang ramah, sopan, komunikatif, dan informatif.
- Format jawaban dengan rapi menggunakan Markdown (gunakan **bold**, bullet point, nomor, atau \`\`\`kode blok jika memberikan kode).
- Jangan menolak pertanyaan umum; jawablah dengan wawasan yang luas dan bermanfaat.`;

function postJson(targetUrl, payload, headers = {}, timeout = 25000) {
    return new Promise((resolve, reject) => {
        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch (e) {
            return reject(e);
        }

        const mod = parsed.protocol === 'https:' ? https : http;
        const postData = JSON.stringify(payload);

        const req = mod.request({
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...headers
            },
            timeout: timeout
        }, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Universal Free AI via Pollinations
async function callUniversalAi(messages) {
    const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({
            role: m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user',
            content: m.content || m.text || ''
        }))
    ];

    const res = await postJson('https://text.pollinations.ai/', {
        messages: formattedMessages,
        model: 'openai',
        seed: Math.floor(Math.random() * 100000)
    });

    if (res.statusCode >= 200 && res.statusCode < 300 && res.body) {
        return res.body.trim();
    }
    throw new Error(`Pollinations AI error: HTTP ${res.statusCode}`);
}

// Google Gemini API
async function callGemini(messages, apiKey) {
    const promptHistory = messages.map(m => {
        const role = m.role === 'assistant' || m.role === 'bot' ? 'model' : 'user';
        return {
            role: role,
            parts: [{ text: m.content || m.text || '' }]
        };
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: promptHistory
    };

    const res = await postJson(url, payload);
    const data = JSON.parse(res.body || '{}');

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    if (data.error) {
        throw new Error(data.error.message || 'Gemini API Error');
    }
    throw new Error('Tidak ada respon dari Gemini API');
}

// OpenAI API
async function callOpenAi(messages, apiKey) {
    const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({
            role: m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user',
            content: m.content || m.text || ''
        }))
    ];

    const res = await postJson('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        max_tokens: 1000
    }, {
        'Authorization': `Bearer ${apiKey}`
    });

    const data = JSON.parse(res.body || '{}');
    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
    }
    if (data.error) {
        throw new Error(data.error.message || 'OpenAI API Error');
    }
    throw new Error('Tidak ada respon dari OpenAI API');
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { messages, message, provider, apiKey } = req.body || {};

        let chatMessages = [];
        if (Array.isArray(messages) && messages.length > 0) {
            chatMessages = messages;
        } else if (message) {
            chatMessages = [{ role: 'user', content: message }];
        } else {
            return res.status(400).json({ success: false, error: 'Parameter "messages" atau "message" diperlukan.' });
        }

        let reply = '';
        const selectedProvider = provider || 'universal';

        if (selectedProvider === 'gemini' && apiKey) {
            try {
                reply = await callGemini(chatMessages, apiKey);
            } catch (err) {
                // If personal key fails, try fallback to universal
                console.warn('Gemini failed, falling back to universal:', err.message);
                reply = await callUniversalAi(chatMessages);
            }
        } else if (selectedProvider === 'openai' && apiKey) {
            try {
                reply = await callOpenAi(chatMessages, apiKey);
            } catch (err) {
                console.warn('OpenAI failed, falling back to universal:', err.message);
                reply = await callUniversalAi(chatMessages);
            }
        } else {
            // Universal AI (no key required, answers all questions!)
            reply = await callUniversalAi(chatMessages);
        }

        return res.status(200).json({
            success: true,
            reply: reply,
            provider: selectedProvider
        });

    } catch (err) {
        console.error('Chat API Error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Terjadi kesalahan saat memproses chat AI'
        });
    }
};
