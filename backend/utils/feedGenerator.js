
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
        const baseUrl = process.env.FRONTEND_URL || 'https://your-store.com';

        // --- 1. Generate CSV Content ---
        const csvHeaders = 'id,title,description,availability,condition,price,sale_price,link,image_link,brand';
        const csvRows = products.map(p => {
            // Handle price vs sale_price
            const price = p.mrp && p.mrp > p.price ? `${p.mrp} INR` : `${p.price} INR`;
            const salePrice = p.mrp && p.mrp > p.price ? `${p.price} INR` : '';
            
            // Basic CSV escaping for description
            const description = `"${(p.shortDescription || p.description || '').replace(/"/g, '""')}"`;
            const link = `${baseUrl}/product/${p.slug}`;
            
            return [
                p.sku || p._id.toString(),
                p.name,
                description,
                p.stock > 0 ? 'in stock' : 'out of stock',
                'new',
                price,
                salePrice,
                link,
                p.imageUrl,
                p.brand || 'Ladies Smart Choice'
            ].join(',');
        });
        const csvContent = [csvHeaders, ...csvRows].join('\n');

        // --- 2. Generate XML (RSS) Content ---
        const root = create({ version: '1.0' })
            .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
                .ele('channel')
                    .ele('title').txt('Ladies Smart Choice Product Feed').up()
                    .ele('link').txt(baseUrl).up()
                    .ele('description').txt('Product feed for Meta Commerce and Google Merchant Center').up();

        products.forEach(p => {
            const item = root.ele('item');
            item.ele('g:id').txt(p.sku || p._id.toString()).up();
            item.ele('g:title').txt(p.name).up();
            item.ele('g:description').dat(p.shortDescription || p.description || '').up();
            item.ele('g:link').txt(`${baseUrl}/product/${p.slug}`).up();
            item.ele('g:image_link').txt(p.imageUrl).up();
            item.ele('g:availability').txt(p.stock > 0 ? 'in stock' : 'out of stock').up();
            
            if (p.mrp && p.mrp > p.price) {
                item.ele('g:price').txt(`${p.mrp} INR`).up();
                item.ele('g:sale_price').txt(`${p.price} INR`).up();
            } else {
                item.ele('g:price').txt(`${p.price} INR`).up();
            }
            
            item.ele('g:condition').txt('new').up();
            item.ele('g:brand').txt(p.brand || 'Ladies Smart Choice').up();
        });

        const xmlContent = root.end({ prettyPrint: true });

        // --- 3. Save Files ---
        const feedDir = path.join(__dirname, '..', 'public', 'facebook');
        await fs.mkdir(feedDir, { recursive: true });
        
        await fs.writeFile(path.join(feedDir, 'products.csv'), csvContent);
        await fs.writeFile(path.join(feedDir, 'products.xml'), xmlContent);
        
        log.status = 'success';
        log.processedCount = products.length;
        console.log(`Feed generation successful. ${products.length} products processed.`);
    } catch (error) {
        log.status = 'failed';
        log.error = error.message;
        console.error('Feed generation failed:', error);
    } finally {
        await log.save();
    }
};

module.exports = { generateFeedFiles };
