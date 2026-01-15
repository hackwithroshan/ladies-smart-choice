
const cron = require('node-cron');
const { generateFeedFiles } = require('./utils/feedGenerator');
const Order = require('./models/Order');
const { syncOrderStatus } = require('./services/shippingService');
const { createNotification } = require('./utils/createNotification');

console.log('Cron job scheduler initialized.');

// 1. Hourly Product Feed Generation (Meta Catalog / Google Merchant)
cron.schedule('0 * * * *', async () => {
    console.log('Running hourly product feed generation...');
    try {
        await generateFeedFiles();
    } catch (e) { console.error("Feed generation failed", e); }
});

// 2. Hourly Order Status Sync (Real-time Logistics Update)
cron.schedule('30 * * * *', async () => {
    console.log('Running hourly order status sync...');
    try {
        const activeOrders = await Order.find({ 
            status: 'Shipped',
            'trackingInfo.trackingNumber': { $exists: true } 
        });

        for (const order of activeOrders) {
            const syncResult = await syncOrderStatus(order);
            if (syncResult) {
                let updated = false;
                if (syncResult.status && syncResult.status !== order.status) {
                    order.status = syncResult.status;
                    updated = true;
                    if (syncResult.status === 'Delivered') {
                        await createNotification({
                            type: 'NEW_ORDER',
                            message: `Order #${order._id.toString().substring(0,6)} Delivered.`,
                            link: `/app/orders`
                        });
                    }
                }
                if (updated) await order.save();
            }
        }
    } catch (error) { console.error("Order Sync Cron Error:", error); }
});

module.exports = cron;
