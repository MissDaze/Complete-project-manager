export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { niche, products, contentType, businessType } = req.body;
    const openaiApiKey = 'a2118de46ea40aa3b7ad67c381bf645d2d4be359';

    if (!niche || !products) {
        return res.status(400).json({ error: 'Niche and products are required' });
    }

    try {
        let content = {};

        switch (contentType) {
            case 'articles':
                content = await generateAIArticles(niche, products, businessType, openaiApiKey);
                break;
            case 'social':
                content = await generateAISocialPosts(niche, products, businessType, openaiApiKey);
                break;
            case 'ads':
                content = await generateAIAdCampaigns(niche, products, business
