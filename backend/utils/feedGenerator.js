
const fs = require('fs').promises;
const path = require('path');
const { create } = require('xmlbuilder2');
const Product = require('../models/Product');
const SyncLog = require('../models/SyncLog');

const generateFeedFiles = async () => {
    console.log('Starting product feed generation...');
    const log = new SyncLog({ service: 'feed-generation', status: 'in_progress' });
    await log.save();

    try {
        const products = await Product.find({ status: 'Active' });
        const baseUrl = process.env.FRONTEND_URL || 'https://ladiessmartchoice.com';

        // --- Generate XML (Meta RSS 2.0 Format) ---
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
                .ele('channel')
                    .ele('title').txt('Ladies Smart Choice Official Product Catalog').up()
                    .ele('link').txt(baseUrl).up()
                    .ele('description').txt('Premium Ayurvedic Health & Beauty Products for Meta Advertising').up();

        products.forEach(p => {
            const item = root.ele('item');
            item.ele('g:id').txt(p.sku || p._id.toString()).up();
            item.ele('g:title').txt(p.name).up();
            item.ele('g:description').dat(p.shortDescription || p.description || 'Premium Ayurvedic Formulation').up();
            item.ele('g:link').txt(`${baseUrl}/product/${p.slug}`).up();
            item.ele('g:image_link').txt(p.imageUrl).up();
            item.ele('g:condition').txt('new').up();
            item.ele('g:availability').txt(p.stock > 0 ? 'in stock' : 'out of stock').up();
            item.ele('g:brand').txt(p.brand || 'Ladies Smart Choice').up();
            item.ele('g:google_product_category').txt('Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements').up();
            
            // Pricing Logic: mrp is the 'price', price is the 'sale_price'
            if (p.mrp && p.mrp > p.price) {
                item.ele('g:price').txt(`${p.mrp} INR`).up();
                item.ele('g:sale_price').txt(`${p.price} INR`).up();
            } else {
                item.ele('g:price').txt(`${p.price} INR`).up();
            }

            if (p.hasVariants && p.variants && p.variants[0]?.options?.length > 0) {
                item.ele('g:item_group_id').txt(p._id.toString()).up();
            }
        });

        const xmlContent = root.end({ prettyPrint: true });

        // Save to public folder
        const feedDir = path.join(__dirname, '..', 'public', 'feeds');
        await fs.mkdir(feedDir, { recursive: true });
        
        await fs.writeFile(path.join(feedDir, 'meta-products.xml'), xmlContent);
        
        log.status = 'success';
        log.processedCount = products.length;
        console.log(`Feed Sync Successful: ${products.length} assets mapped.`);
    } catch (error) {
        log.status = 'failed';
        log.error = error.message;
        console.error('Meta Feed Error:', error);
    } finally {
        await log.save();
    }
};

module.exports = { generateFeedFiles };
