export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { niche, products, businessType, duration = 30 } = req.body;
    const openaiApiKey = 'a2118de46ea40aa3b7ad67c381bf645d2d4be359';

    if (!niche || !products) {
        return res.status(400).json({ error: 'Niche and products are required' });
    }

    try {
        const calendarPrompt = `Create a detailed ${duration}-day marketing calendar for a ${businessType} business in the "${niche}" niche.

Products to promote:
${products.map(p => `- ${p.title} ($${p.price})`).join('\n')}

Generate a day-by-day breakdown including:
- Daily content themes and topics
- Platform-specific posting schedules (Facebook, Instagram, TikTok, Twitter, LinkedIn, Pinterest)
- Product promotion rotation
- Email marketing schedule
- Paid advertising campaign timing
- Influencer outreach dates
- Analytics and review periods
- Seasonal opportunities and trending topics
- Community engagement activities
- User-generated content campaigns

Format as a structured calendar with specific daily actions, content types, and platform recommendations.
Include time-saving tips and batch content creation suggestions.`;

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
                        content: 'You are an expert marketing strategist and content calendar specialist. Create detailed, actionable marketing calendars that drive engagement and sales.'
                    },
                    {
                        role: 'user',
                        content: calendarPrompt
                    }
                ],
                max_tokens: 3000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const calendar = data.choices[0].message.content;

        // Generate additional calendar insights
        const insights = {
            totalDays: duration,
            contentPieces: duration * 2, // Assuming 2 pieces per day
            platforms: ['Facebook', 'Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'Pinterest'],
            emailFrequency: 'Weekly',
            adSpend: `$${Math.floor(duration * 25)}-${Math.floor(duration * 50)}`,
            expectedReach: `${Math.floor(duration * 1000)}-${Math.floor(duration * 5000)} people`,
            estimatedEngagement: '3-8%',
            contentTypes: [
                'Educational posts',
                'Product showcases', 
                'Behind-the-scenes',
                'User testimonials',
                'Trending topics',
                'Interactive content'
            ]
        };

        res.status(200).json({
            success: true,
            calendar,
            insights,
            duration,
            niche,
            businessType
        });

    } catch (error) {
        console.error('Error generating marketing calendar:', error);
        res.status(500).json({
            error: 'Failed to generate marketing calendar',
            details: error.message
        });
    }
}
