
const express = require('express');
const router = express.Router();
const ContactSubmission = require('../models/ContactSubmission');
const { sendContactFormEmail } = require('../utils/emailService');
const { protect, admin } = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/createNotification');

// PUBLIC: Submit the form
router.post('/send', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Save submission to the database
        const submission = new ContactSubmission({ name, email, subject, message });
        await submission.save();

        // Send email notification to admin
        await sendContactFormEmail(name, email, subject, message);
        
        // Create a notification for admins
        await createNotification({
            type: 'NEW_MESSAGE',
            message: `New message from ${name} regarding "${subject}".`,
            link: `/admin?view=contact-messages&id=${submission._id}`
        });
        
        res.status(200).json({ message: "Thank you for your message! We'll get back to you shortly." });
    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({ message: 'Sorry, there was an issue sending your message. Please try again later.' });
    }
});

// ADMIN: Get all submissions
router.get('/', protect, admin, async (req, res) => {
    try {
        const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ADMIN: Update read status
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const submission = await ContactSubmission.findById(req.params.id);
        if (submission) {
            submission.read = req.body.read;
            const updatedSubmission = await submission.save();
            res.json(updatedSubmission);
        } else {
            res.status(404).json({ message: 'Submission not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ADMIN: Delete a submission
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const submission = await ContactSubmission.findById(req.params.id);
        if (submission) {
            await submission.deleteOne();
            res.json({ message: 'Submission removed' });
        } else {
            res.status(404).json({ message: 'Submission not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;