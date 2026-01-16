
const cron = require('node-cron');
const { generateFeedFiles } = require('./utils/feedGenerator');
const Order = require('./models/Order');
const { syncOrderStatus } = require('./services/shippingService');

const { createNotification } = require('./utils/createNotification');
const AbandonedCart = require('./models/AbandonedCart');
const AutomationLog = require('./models/AutomationLog');
const { triggerAutomation } = require('./services/emailService');

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
                            message: `Order #${order._id.toString().substring(0, 6)} Delivered.`,
                            link: `/app/orders`
                        });
                    }
                }
                if (updated) await order.save();
            }
        }
    } catch (error) { console.error("Order Sync Cron Error:", error); }
});

// 3. Abandoned Checkout Automation (Every 30 mins)
cron.schedule('*/30 * * * *', async () => {
    console.log('Running abandoned checkout recovery run...');
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find abandoned carts eligible for recovery
        const carts = await AbandonedCart.find({
            status: 'Abandoned',
            updatedAt: { $lt: oneHourAgo, $gt: twentyFourHoursAgo },
            email: { $exists: true, $ne: '' }
        });

        for (const cart of carts) {
            // Check if we already sent an email for this specific cart
            // We can match by recipientEmail + triggerType + approx time, or better:
            // The automation log might not link to Cart ID directly unless we store it.
            // But we can check if an ABANDONED_CHECKOUT email was sent to this email in the last 24h.
            const sentLog = await AutomationLog.findOne({
                triggerType: 'ABANDONED_CHECKOUT',
                recipientEmail: cart.email,
                sentAt: { $gt: twentyFourHoursAgo }
            });

            if (!sentLog) {
                console.log(`Triggering Recovery Email for ${cart.email}`);
                await triggerAutomation('ABANDONED_CHECKOUT',
                    { email: cart.email },
                    {
                        customer_name: cart.name || 'Shopper',
                        cart_total: cart.total,
                        checkout_url: `${process.env.FRONTEND_URL}/checkout` // Deep link if possible
                    },
                    { context: { sessionId: cart._id.toString() } } // Using Cart ID as Session ID proxy
                );
            }
        }
    } catch (e) { console.error("Abandoned Cron Error:", e); }
});

module.exports = cron;
