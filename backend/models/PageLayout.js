
const mongoose = require('mongoose');

const PageLayoutSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true }, 
    isGlobal: { type: Boolean, default: false },
    sections: [{
        id: String,
        type: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        content: {
            shippingPolicy: String,
            blocks: [{
                title: String,
                text: String,
                img: String
            }],
            faqs: [{
                q: String,
                a: String
            }],
            customHtml: String
        },
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
            minHeight: String,
            backgroundColor: String,
            textColor: String,
            titleFontSize: Number,
            titleFontWeight: Number,
            titleFontStyle: String,
            priceFontSize: Number,
            priceFontWeight: Number,
            priceFontStyle: String,
            shortDescFontSize: Number,
            shortDescFontWeight: Number,
            shortDescFontStyle: String,
            imageWidth: String,
            imageHeight: String,
            imageAlign: String,
            containerMaxWidth: String,
            mobileMaxWidth: String,
            imageBorderRadius: Number,
            imageBorderWidth: Number,
            imageBorderColor: String,
            imageShadow: String,
            radius: Number,
            textAlign: String,
            customClasses: String
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('PageLayout', PageLayoutSchema);
