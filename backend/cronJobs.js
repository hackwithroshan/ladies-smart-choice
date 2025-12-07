
const cron = require('node-cron');
const { generateFeedFiles } = require('./utils/feedGenerator');

console.log('Cron job scheduler initialized.');

// Schedule the feed generation to run at the top of every hour.
cron.schedule('0 * * * *', () => {
    console.log('Running hourly product feed generation...');
    generateFeedFiles();
});

// Optional: Run once on startup if needed, after a short delay
setTimeout(() => {
    console.log('Running initial feed generation on startup...');
    generateFeedFiles();
}, 10000); // 10-second delay
