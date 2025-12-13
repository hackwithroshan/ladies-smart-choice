
const cron = require('node-cron');
const { generateFeedFiles } = require('./utils/feedGenerator');
const Order = require('./models/Order');
const { syncOrderStatus } = require('./services/shippingService');
const { createNotification } = require('./utils/createNotification');

console.log('Cron job scheduler initialized.');

// 1. Hourly Product Feed Generation
cron.schedule('0 * * * *', () => {
    console.log('Running hourly product feed generation...');
    generateFeedFiles();
});

// 2. Hourly Order Status Sync (Logistics)
// Runs every hour. Checks orders that are 'Shipped' but not 'Delivered'
cron.schedule('30 * * * *', async () => {
    console.log('Running hourly order status sync...');
    try {
        const activeOrders = await Order.find({ 
            status: 'Shipped',
            'trackingInfo.trackingNumber': { $exists: true } 
        });

        console.log(`Found ${activeOrders.length} active shipments to sync.`);

        for (const order of activeOrders) {
            const syncResult = await syncOrderStatus(order);
            
            if (syncResult) {
                let updated = false;

                // Update Status if changed (e.g. Shipped -> Delivered)
                if (syncResult.status && syncResult.status !== order.status) {
                    order.status = syncResult.status;
                    updated = true;
                    
                    // Notify Admin if Delivered
                    if (syncResult.status === 'Delivered') {
                        await createNotification({
                            type: 'NEW_ORDER', // Reusing type for generic update
                            message: `Order #${order._id.toString().substring(0,6)} has been DELIVERED.`,
                            link: `/admin?view=orders&id=${order._id}`
                        });
                    }
                }

                // Update History (always, to show movement)
                if (syncResult.history && syncResult.history.length > order.trackingHistory.length) {
                    order.trackingHistory = syncResult.history;
                    updated = true;
                }

                if (updated) {
                    order.lastTrackingSync = new Date();
                    await order.save();
                    console.log(`Updated Order #${order._id} status to ${order.status}`);
                }
            }
        }
    } catch (error) {
        console.error("Error in Order Sync Cron:", error);
    }
});

// Run once on startup after 10s
setTimeout(() => {
    // console.log('Running initial feed generation on startup...');
    // generateFeedFiles();
}, 10000);
