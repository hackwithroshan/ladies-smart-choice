
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates a notification for all admin-level users.
 * @param {object} data - The notification data.
 * @param {string} data.type - The type of notification (e.g., 'NEW_ORDER', 'NEW_MESSAGE').
 * @param {string} data.message - The notification message.
 * @param {string} data.link - The URL link for the notification.
 */
const createNotification = async ({ type, message, link }) => {
    try {
        // Find all users who are admins
        const admins = await User.find({ role: { $in: ['Super Admin', 'Manager', 'Editor', 'Staff'] } });
        
        if (admins.length > 0) {
            const notifications = admins.map(admin => ({
                user: admin._id,
                type,
                message,
                link,
            }));
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

module.exports = { createNotification };
