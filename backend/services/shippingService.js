
const ShippingProvider = require('../models/ShippingProvider');
const fetch = require('node-fetch');

/**
 * LOGISTICS ADAPTER
 * Connects to Shiprocket API to generate real AWBs and track shipments.
 */

// --- 1. Generate Tracking / Shipment (Send Data to Courier) ---
const createShipment = async (order) => {
    try {
        // 1. Get Active Provider Configuration
        const provider = await ShippingProvider.findOne({ isEnabled: true });
        
        // --- FALLBACK: SIMULATION MODE (If no provider is setup) ---
        if (!provider) {
            console.log(`[Shipping] No active provider. Simulating Shipment.`);
            return {
                success: true,
                carrier: 'BlueDart (Simulated)',
                trackingNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
                shippingLabelUrl: '#',
                estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            };
        }

        // --- REAL INTEGRATION: SHIPROCKET ---
        if (provider.slug === 'shiprocket') {
            const { email, password } = provider.credentials;

            // A. Authenticate
            const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const authData = await authRes.json();
            
            if(!authData.token) throw new Error("Shiprocket Auth Failed: Check Credentials");
            const token = authData.token;

            // B. Map MongoDB Order to Shiprocket Payload
            // Note: In production, billing_state/city needs exact mapping or loose string matching
            const orderPayload = {
                order_id: order._id.toString(),
                order_date: new Date(order.date).toISOString().split('T')[0] + ' 10:00',
                pickup_location: provider.settings.defaultPickupLocation || "Primary",
                billing_customer_name: order.customerName.split(' ')[0],
                billing_last_name: order.customerName.split(' ')[1] || "",
                billing_address: order.shippingAddress.address,
                billing_city: order.shippingAddress.city,
                billing_pincode: order.shippingAddress.postalCode,
                billing_state: "Maharashtra", // Hardcoded for demo, normally dynamic
                billing_country: "India",
                billing_email: order.customerEmail,
                billing_phone: order.customerPhone || "9876543210",
                shipping_is_billing: true,
                order_items: order.items.map(i => ({
                    name: i.name,
                    sku: i.productId.toString(),
                    units: i.quantity,
                    selling_price: i.price,
                    discount: "",
                    tax: "",
                    hsn: ""
                })),
                payment_method: "Prepaid",
                sub_total: order.total,
                length: 10, breadth: 10, height: 10, weight: 0.5 // Defaults if not in product
            };

            // C. Create Order in Shiprocket
            const shipRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });
            const shipData = await shipRes.json();
            
            if (!shipData.shipment_id) {
                console.error("Shiprocket Create Error:", shipData);
                throw new Error("Failed to push order to Shiprocket");
            }

            // D. Generate AWB (Tracking Number)
            const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ shipment_id: shipData.shipment_id })
            });
            const awbData = await awbRes.json();
            
            if (awbData.awb_assign_status === 1) {
                return {
                    success: true,
                    carrier: 'Shiprocket',
                    trackingNumber: awbData.response.data.awb_code,
                    shippingLabelUrl: awbData.response.data.label_url || '',
                    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                };
            } else {
                throw new Error("AWB Assignment Failed");
            }
        }

        throw new Error(`Provider ${provider.name} not implemented yet.`);

    } catch (error) {
        console.error("Create Shipment Error:", error.message);
        return { success: false, error: error.message };
    }
};

// --- 2. Sync Order Status (Check Real Status) ---
const syncOrderStatus = async (order) => {
    try {
        if (!order.trackingInfo || !order.trackingInfo.trackingNumber) return null;

        // --- SIMULATION MODE ---
        if (!order.trackingInfo.carrier || order.trackingInfo.carrier.includes('Simulated')) {
            const hoursSinceShipped = (Date.now() - new Date(order.lastTrackingSync || order.date).getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceShipped > 1 && order.status === 'Shipped') {
                return {
                    status: 'Delivered',
                    history: [...order.trackingHistory, {
                        status: 'Delivered',
                        location: order.shippingAddress.city,
                        message: 'Delivered to consignee',
                        date: new Date()
                    }]
                };
            }
            return null;
        }

        // --- REAL INTEGRATION: SHIPROCKET ---
        const provider = await ShippingProvider.findOne({ slug: 'shiprocket', isEnabled: true });
        if (provider) {
             // Login
             const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: provider.credentials.email, password: provider.credentials.password })
            });
            const authData = await authRes.json();
            const token = authData.token;

            // Track via AWB
            const trackRes = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${order.trackingInfo.trackingNumber}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const trackData = await trackRes.json();
            
            if (trackData.tracking_data && trackData.tracking_data.track_status === 1) {
                const shipmentTrack = trackData.tracking_data.shipment_track[0];
                const currentStatus = shipmentTrack.current_status; // e.g. "DELIVERED", "IN TRANSIT"
                
                let mappedStatus = order.status;
                if (currentStatus === 'DELIVERED') mappedStatus = 'Delivered';
                if (currentStatus === 'RTO INITIATED') mappedStatus = 'Returned';
                if (currentStatus === 'CANCELED') mappedStatus = 'Cancelled';
                if (currentStatus === 'SHIPPED') mappedStatus = 'Shipped';

                // Map activities to history
                const activities = trackData.tracking_data.shipment_track_activities || [];
                const history = activities.map(act => ({
                    date: new Date(act.date),
                    status: act.activity,
                    location: act.location,
                    message: act['sr-status-label'] || act.activity
                }));

                return { status: mappedStatus, history };
            }
        }

        return null;

    } catch (error) {
        console.error("Sync Status Error:", error.message);
        return null;
    }
};

module.exports = { createShipment, syncOrderStatus };
