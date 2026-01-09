
const fs = require('fs').promises;
const path = require('path');
const { create } = require('xmlbuilder2');
const Product = require('../models/Product');
const SyncLog = require('../models/SyncLog');

/**
 * Generates Meta/Google RSS 2.0 Feed
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
                    .ele('title').txt('Ladies Smart Choice Catalog').up()
                    .ele('link').txt(baseUrl).up()
                    .ele('description').txt('Premium Collection').up();

        products.forEach(p => {
            const item = root.ele('item');
            item.ele('g:id').txt(p.sku || p._id.toString()).up();
            item.ele('g:title').txt(p.name).up();
            item.ele('g:description').dat((p.shortDescription || p.description || p.name).replace(/<[^>]*>?/gm, '').substring(0, 4900)).up();
            item.ele('g:link').txt(`${baseUrl}/product/${p.slug}`).up();
            item.ele('g:image_link').txt(p.imageUrl).up();
            item.ele('g:condition').txt('new').up();
            item.ele('g:availability').txt(p.stock > 0 ? 'in stock' : 'out of stock').up();
            item.ele('g:price').txt(`${Math.round(p.mrp || p.price)} INR`).up();
            
            if (p.mrp && p.mrp > p.price) {
                item.ele('g:sale_price').txt(`${Math.round(p.price)} INR`).up();
            }

            item.ele('g:brand').txt(p.brand || 'Ladies Smart Choice').up();
            item.ele('g:google_product_category').txt('Health & Beauty').up();
            item.ele('g:item_type').txt('PRODUCT_ITEM').up(); // Fixed for Meta
            item.ele('g:status').txt('active').up();
        });

        const xmlContent = root.end({ prettyPrint: true });
        const publicDir = path.join(__dirname, '..', 'public');
        const feedDir = path.join(publicDir, 'feeds');
        
        await fs.mkdir(feedDir, { recursive: true });
        await fs.writeFile(path.join(feedDir, 'meta-products.xml'), xmlContent);
        
        log.status = 'success';
        log.processedCount = products.length;
        await log.save();
        
        console.log(`RSS Feed generated: ${products.length} products.`);
    } catch (error) {
        console.error("Feed generation failed:", error);
        log.status = 'failed';
        log.error = error.message;
        await log.save();
    }
};

module.exports = { generateFeedFiles };
