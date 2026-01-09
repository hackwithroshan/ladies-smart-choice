
const fs = require('fs').promises;
const path = require('path');
const { create } = require('xmlbuilder2');
const Product = require('../models/Product');
const SyncLog = require('../models/SyncLog');

/**
 * Generates valid RSS 2.0 Catalog Feed for Meta and Google Merchant Center
 */
const generateFeedFiles = async () => {
    const log = new SyncLog({ service: 'feed-generation', status: 'in_progress' });
    await log.save();

    try {
        const products = await Product.find({ status: 'Active' });
        const baseUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
                .ele('channel')
                    .ele('title').txt('Ayushree Ayurveda Master Catalog').up()
                    .ele('link').txt(baseUrl).up()
                    .ele('description').txt('Premium Ayurvedic Wellness and Skincare Feed').up();

        products.forEach(p => {
            const retailerId = p.sku || p._id.toString();
            const item = root.ele('item');
            
            item.ele('g:id').txt(retailerId).up();
            item.ele('g:title').txt(p.name.substring(0, 150)).up();
            
            // Clean description for RSS compatibility
            const cleanDesc = (p.shortDescription || p.description || p.name)
                .replace(/<[^>]*>?/gm, '')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 4900);
                
            item.ele('g:description').dat(cleanDesc).up();
            item.ele('g:link').txt(`${baseUrl}/product/${p.slug}`).up();
            
            let img = p.imageUrl;
            if (img && !img.startsWith('http')) img = `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
            item.ele('g:image_link').txt(img).up();
            
            item.ele('g:condition').txt('new').up();
            item.ele('g:availability').txt(p.stock > 0 ? 'in stock' : 'out of stock').up();
            item.ele('g:price').txt(`${Math.round(p.price)} INR`).up();
            item.ele('g:brand').txt(p.brand || 'Ayushree').up();
            item.ele('g:google_product_category').txt('Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements').up();
            item.ele('g:item_type').txt('PRODUCT_ITEM').up(); // 🔥 CRITICAL FOR META ECOMMERCE
            item.ele('g:status').txt('active').up();
            
            if (p.category) {
                item.ele('g:product_type').txt(p.category).up();
            }
        });

        const xmlContent = root.end({ prettyPrint: true });
        const publicDir = path.join(__dirname, '..', 'public');
        const feedDir = path.join(publicDir, 'feeds');
        
        await fs.mkdir(feedDir, { recursive: true });
        await fs.writeFile(path.join(feedDir, 'meta-products.xml'), xmlContent);
        
        log.status = 'success';
        log.processedCount = products.length;
        await log.save();
        
    } catch (error) {
        console.error("Feed Generator Failed:", error);
        log.status = 'failed';
        log.error = error.message;
        await log.save();
    }
};

module.exports = { generateFeedFiles };
