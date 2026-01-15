
const mongoose = require('mongoose');

const PageLayoutSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true }, // 'global' or ObjectId
    isGlobal: { type: Boolean, default: false },
    sections: [{
        id: String,
        type: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        content: mongoose.Schema.Types.Mixed,
        settingsJson: { type: String, default: '' },
        settings: mongoose.Schema.Types.Mixed,
        style: {
            paddingTop: Number,
            paddingBottom: Number,
            paddingLeft: Number,
            paddingRight: Number,
            marginTop: Number,
            marginBottom: Number,
            marginLeft: Number,
            marginRight: Number,
            backgroundColor: String,
            textColor: String,
            titleFontSize: Number,
            priceFontSize: Number,
            shortDescFontSize: Number,
            imageWidth: String,
            // Fix: Added imageHeight to schema
            imageHeight: String,
            imageAlign: String,
            containerMaxWidth: String,
            textAlign: String,
            customClasses: String
        },
        children: [mongoose.Schema.Types.Mixed],
        code: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('PageLayout', PageLayoutSchema);
