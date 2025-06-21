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

    const { niche } = req.body;
    const serpApiKey = process.env.SERPAPI_KEY || 'ba7c0cea122b912337854c445cb98713564f0d71f2b1eb20f252ed215558a6a7';

    if (!niche) {
        return res.status(400).json({ error: 'Niche is required' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        
        // Search Amazon for affiliate products
        const amazonUrl = `https://serpapi.com/search?engine=amazon&q=${encodeURIComponent(niche)}&api_key=${serpApiKey}`;
        const amazonResponse = await fetch(amazonUrl);
        
        if (!amazonResponse.ok) {
            throw new Error(`Amazon API error: ${amazonResponse.status}`);
        }
        
        const amazonData = await amazonResponse.json();

        // Search Google Shopping for comparison
        const shoppingUrl = `https://serpapi.com/search?engine=google_shopping&q=${encodeURIComponent(niche)}&api_key=${serpApiKey}`;
        const shoppingResponse = await fetch(shoppingUrl);
        
        if (!shoppingResponse.ok) {
            throw new Error(`Shopping API error: ${shoppingResponse.status}`);
        }
        
        const shoppingData = await shoppingResponse.json();

        // Process and combine results
        const products = [];
        let productId = 1;

        // Process Amazon results
        if (amazonData.products && Array.isArray(amazonData.products)) {
            amazonData.products.slice(0, 8).forEach(product => {
                if (product.title && product.price) {
                    let price = 0;
                    if (typeof product.price === 'object' && product.price.value) {
                        price = parseFloat(product.price.value);
                    } else if (typeof product.price === 'string') {
                        price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
                    } else if (typeof product.price === 'number') {
                        price = product.price;
                    }
                    
                    if (price > 0) {
                        products.push({
                            id: productId++,
                            title: product.title,
                            price: price,
                            original_price: product.original_price ? parseFloat(product.original_price.value || product.original_price) : null,
                            rating: product.rating || 4.0,
                            reviews: product.reviews_count || Math.floor(Math.random() * 500) + 50,
                            thumbnail: product.thumbnail || null,
                            source: 'Amazon',
                            link: product.link || '#',
                            delivery: product.delivery || 'Standard shipping',
                            out_of_stock: product.stock_status === 'Out of stock'
                        });
                    }
                }
            });
        }

        // Process Google Shopping results
        if (shoppingData.shopping_results && Array.isArray(shoppingData.shopping_results)) {
            shoppingData.shopping_results.slice(0, 8).forEach(product => {
                if (product.title && product.price) {
                    let price = 0;
                    if (typeof product.price === 'object' && product.price.value) {
                        price = parseFloat(product.price.value);
                    } else if (typeof product.price === 'string') {
                        price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
                    }
                    
                    if (price > 0) {
                        products.push({
                            id: productId++,
                            title: product.title,
                            price: price,
                            original_price: product.compare_at_price ? parseFloat(product.compare_at_price.value || product.compare_at_price.replace(/[^0-9.]/g, '')) : null,
                            rating: product.rating || 4.0,
                            reviews: product.reviews || Math.floor(Math.random() * 300) + 20,
                            thumbnail: product.thumbnail || null,
                            source: product.source || 'Google Shopping',
                            link: product.link || '#',
                            delivery: product.delivery || 'Standard shipping',
                            out_of_stock: false
                        });
                    }
                }
            });
        }

        // Remove duplicates based on title similarity
        const uniqueProducts = products.filter((product, index, array) => {
            return array.findIndex(p => 
                p.title.toLowerCase().substring(0, 20) === product.title.toLowerCase().substring(0, 20)
            ) === index;
        });

        // Sort by relevance (Amazon first, then by rating)
        uniqueProducts.sort((a, b) => {
            if (a.source === 'Amazon' && b.source !== 'Amazon') return -1;
            if (b.source === 'Amazon' && a.source !== 'Amazon') return 1;
            return (b.rating || 0) - (a.rating || 0);
        });

        res.status(200).json({
            success: true,
            products: uniqueProducts.slice(0, 20),
            total: uniqueProducts.length,
            niche: niche
        });

    } catch (error) {
        console.error('Error fetching affiliate products:', error);
        res.status(500).json({ 
            error: 'Failed to fetch products',
            details: error.message
        });
    }
};
