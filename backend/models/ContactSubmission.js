
const mongoose = require('mongoose');

const ContactSubmissionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
}, { timestamps: true });

ContactSubmissionSchema.set('toJSON', { virtuals: true });

const ContactSubmission = mongoose.model('ContactSubmission', ContactSubmissionSchema);
module.exports = ContactSubmission;
