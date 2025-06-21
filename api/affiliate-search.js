export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { niche } = req.body;
    const serpApiKey = 'ba7c0cea122b912337854c445cb98713564f0d71f2b1eb20f252ed215558a6a7';

    if (!niche) {
        return res.status(400).json({ error: 'Niche is required' });
    }

    try {
        // Search Amazon for affiliate products
        const amazonResponse = await fetch(`https://serpapi.com/search?engine=amazon&q=${encodeURIComponent(niche)}&api_key=${serpApiKey}`);
        const amazonData = await amazonResponse.json();

        // Search Google Shopping for comparison
        const shoppingResponse = await fetch(`https://serpapi.com/search?engine=google_shopping&q=${encodeURIComponent(niche)}&api_key=${serpApiKey}`);
        const shoppingData = await shoppingResponse.json();

        // Process and combine results
        const products = [];
        let productId = 1;

        // Process Amazon results
        if (amazonData.products) {
            amazonData.products.slice(0, 8).forEach(product => {
                if (product.title && product.price) {
                    products.push({
                        id: productId++,
                        title: product.title,
                        price: parseFloat(product.price.value || product.price.raw || product.price),
                        original_price: product.original_price ? parseFloat(product.original_price.value || product.original_price) : null,
                        rating: product.rating,
                        reviews: product.reviews_count,
                        thumbnail: product.thumbnail,
                        source: 'Amazon',
                        link: product.link,
                        delivery: product.delivery,
                        out_of_stock: product.stock_status === 'Out of stock'
                    });
                }
            });
        }

        // Process Google Shopping results
        if (shoppingData.shopping_results) {
            shoppingData.shopping_results.slice(0, 8).forEach(product => {
                if (product.title && product.price) {
                    products.push({
                        id: productId++,
                        title: product.title,
                        price: parseFloat(product.price.value || product.price.replace(/[^0-9.]/g, '')),
                        original_price: product.compare_at_price ? parseFloat(product.compare_at_price.value || product.compare_at_price.replace(/[^0-9.]/g, '')) : null,
                        rating: product.rating,
                        reviews: product.reviews,
                        thumbnail: product.thumbnail,
                        source: product.source,
                        link: product.link,
                        delivery: product.delivery,
                        out_of_stock: false
                    });
                }
            });
        }

        // Remove duplicates based on title similarity
        const uniqueProducts = products.filter((product, index, array) => {
            return array.findIndex(p => 
                p.title.toLowerCase().substring(0, 30) === product.title.toLowerCase().substring(0, 30)
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
}
