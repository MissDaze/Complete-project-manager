module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { niche, products, contentType, businessType } = req.body;
    const openaiApiKey = process.env.OPENAI_API_KEY || 'a2118de46ea40aa3b7ad67c381bf645d2d4be359';

    if (!niche || !products) {
        return res.status(400).json({ error: 'Niche and products are required' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        
        async function callOpenAI(prompt, maxTokens = 1500) {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert digital marketing copywriter and content strategist. Create high-converting, engaging content that drives sales and builds trust with audiences.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response
