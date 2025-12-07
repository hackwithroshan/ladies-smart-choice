
const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all published posts
router.get('/', async (req, res) => {
    // Admin can see all, public sees only published
    const query = (req.query.admin === 'true' && req.user && req.user.isAdmin) ? {} : { status: 'Published' };
    const blogs = await BlogPost.find(query).sort({ createdAt: -1 });
    res.json(blogs);
});

// Get single post by slug
router.get('/:slug', async (req, res) => {
    const blog = await BlogPost.findOne({ slug: req.params.slug });
    if (blog && (blog.status === 'Published' || (req.user && req.user.isAdmin))) {
        res.json(blog);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

// Create new post
router.post('/', protect, admin, async (req, res) => {
    const newBlog = new BlogPost(req.body);
    const saved = await newBlog.save();
    res.status(201).json(saved);
});

// Update post
router.put('/:id', protect, admin, async (req, res) => {
    const updated = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

// Delete post
router.delete('/:id', protect, admin, async (req, res) => {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
});

module.exports = router;
