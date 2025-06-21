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

    const { niche, keywords } = req.body;
    const serpApiKey = process.env.SERPAPI_KEY || 'ba7c0cea122b912337854c445cb98713564f0d71f2b1eb20f252ed215558a6a7';

    if (!niche) {
        return res.status(400).json({ error: 'Niche is required' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        
        // Analyze top competitors for main keywords
        const competitorAnalysis = [];
        const keywordsToAnalyze = keywords || [`best ${niche}`, `${niche} review`, `top ${niche}`];

        for (const keyword of keywordsToAnalyze.slice(0, 3)) {
            try {
                const searchUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(keyword)}&api_key=${serpApiKey}`;
                const response = await fetch(searchUrl);
                
                if (!response.ok) {
                    throw new Error(`Search API error: ${response.status}`);
                }
                
                const data = await response.json();

                if (data.organic_results && Array.isArray(data.organic_results)) {
                    data.organic_results.slice(0, 5).forEach((result, index) => {
                        if (result.link && result.title) {
                            try {
                                const url = new URL(result.link);
                                const domain = url.hostname.replace('www.', '');
                                
                                competitorAnalysis.push({
                                    domain: domain,
                                    title: result.title,
                                    position: index + 1,
                                    keyword: keyword,
                                    snippet: result.snippet || '',
                                    link: result.link
                                });
                            } catch (urlError) {
                                console.error('Invalid URL:', result.link);
                            }
                        }
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`Error analyzing keyword ${keyword}:`, error);
            }
        }

        // Group by domain and calculate competitor strength
        const competitorMap = {};
        competitorAnalysis.forEach(comp => {
            if (!competitorMap[comp.domain]) {
                competitorMap[comp.domain] = {
                    domain: comp.domain,
                    appearances: 0,
                    avgPosition: 0,
                    keywords: [],
                    strength: 0
                };
            }
            
            competitorMap[comp.domain].appearances++;
            competitorMap[comp.domain].avgPosition += comp.position;
            competitorMap[comp.domain].keywords.push({
                keyword: comp.keyword,
                position: comp.position,
                title: comp.title
            });
        });

        // Calculate final metrics
        const competitors = Object.values(competitorMap)
            .map(comp => ({
                ...comp,
                avgPosition: comp.avgPosition / comp.appearances,
                strength: Math.min(100, (comp.appearances * 20) + ((6 - (comp.avgPosition / comp.appearances)) * 10))
            }))
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 10);

        res.status(200).json({
            success: true,
            competitors,
            summary: {
                totalCompetitors: competitors.length,
                strongCompetitors: competitors.filter(c => c.strength > 70).length,
                averageStrength: competitors.length > 0 ? competitors.reduce((sum, c) => sum + c.strength, 0) / competitors.length : 0,
                topDomains: competitors.slice(0, 3).map(c => c.domain)
            }
        });

    } catch (error) {
        console.error('Error performing competitor analysis:', error);
        res.status(500).json({
            error: 'Failed to perform competitor analysis',
            details: error.message
        });
    }
};
