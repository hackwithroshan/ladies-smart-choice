
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Order = require('./models/Order');
const HeaderSetting = require('./models/HeaderSetting');
const FooterSetting = require('./models/FooterSetting');
const SiteSettings = require('./models/SiteSettings');
const HomePageSetting = require('./models/HomePageSetting');
const Slide = require('./models/Slide');
const Collection = require('./models/Collection');
const ShoppableVideo = require('./models/ShoppableVideo');
const Testimonial = require('./models/Testimonial');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Order.deleteMany();
    await HeaderSetting.deleteMany();
    await FooterSetting.deleteMany();
    await SiteSettings.deleteMany();
    await HomePageSetting.deleteMany();
    await Slide.deleteMany();
    await Collection.deleteMany();
    await ShoppableVideo.deleteMany();
    await Testimonial.deleteMany();
    console.log('Data Cleared!');

    // Create Admin User
    const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'Super Admin',
    });
    
    // --- Sample Data based on old mockData.ts ---
    const productsData = [
      { id: '1', name: 'Floral Summer Maxi Dress', slug: 'floral-summer-maxi-dress', category: 'Clothing', price: 1499.00, mrp: 1999, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=400&auto=format&fit=crop', description: 'Elegant floral print maxi dress, perfect for summer outings. Breathable fabric and comfortable fit.', shortDescription: 'A light and breezy floral maxi dress.', status: 'Active' },
      { id: '2', name: 'Classic Leather Tote Bag', slug: 'classic-leather-tote-bag', category: 'Accessories', price: 2999.00, mrp: 3499, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=400&auto=format&fit=crop', description: 'Premium leather tote bag with ample space for your essentials. Timeless design for every occasion.', shortDescription: 'A timeless and spacious leather tote.', status: 'Active' },
      { id: '3', name: 'Rose Gold Plated Necklace', slug: 'rose-gold-plated-necklace', category: 'Accessories', price: 899.00, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=400&auto=format&fit=crop', description: 'Delicate rose gold plated necklace with a minimalist pendant. Adds a touch of sophistication to any outfit.', shortDescription: 'A delicate rose gold minimalist necklace.', status: 'Active' },
      { id: '4', name: 'Red Stiletto Heels', slug: 'red-stiletto-heels', category: 'Footwear', price: 2499.00, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=400&auto=format&fit=crop', description: 'Bold and beautiful red stiletto heels. Perfect for parties and evening events.', shortDescription: 'Bold red stiletto heels for a night out.', status: 'Active' },
      { id: '5', name: 'Denim Jacket with Embroidery', slug: 'denim-jacket-with-embroidery', category: 'Clothing', price: 1850.00, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=400&auto=format&fit=crop', description: 'Stylish denim jacket featuring intricate floral embroidery. A versatile layer for any season.', shortDescription: 'A stylish denim jacket with floral embroidery.', status: 'Active' },
      { id: '6', name: 'Matte Liquid Lipstick Set', slug: 'matte-liquid-lipstick-set', category: 'Beauty', price: 999.00, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=400&auto=format&fit=crop', description: 'Long-lasting matte liquid lipstick set in 3 stunning shades. Smudge-proof and highly pigmented.', shortDescription: 'A set of 3 long-lasting matte lipsticks.', status: 'Active' },
      { id: '7', name: 'Silk Scarf - Vintage Print', slug: 'silk-scarf-vintage-print', category: 'Accessories', price: 450.00, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?q=80&w=400&auto=format&fit=crop', description: 'Luxurious silk scarf with a vintage print. Soft, smooth, and adds a chic flair to your look.', shortDescription: 'A luxurious silk scarf with a vintage print.', status: 'Active' },
      { id: '8', name: 'White Casual Sneakers', slug: 'white-casual-sneakers', category: 'Footwear', price: 1299.00, stock: 35, imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=400&auto=format&fit=crop', description: 'Comfortable white sneakers for everyday wear. Pairs perfectly with jeans or dresses.', shortDescription: 'Comfortable and versatile white sneakers.', status: 'Active' },
    ];
    await Product.insertMany(productsData);
    
    await Category.insertMany([
      { name: 'Clothing', subcategories: [{ name: 'Dresses' }, { name: 'Tops & Blouses' }] },
      { name: 'Footwear', subcategories: [{ name: 'Heels & Pumps' }, { name: 'Flats & Sandals' }] },
      { name: 'Accessories', subcategories: [{ name: 'Handbags' }, { name: 'Jewelry' }] },
      { name: 'Beauty', subcategories: [{ name: 'Makeup' }, { name: 'Skincare' }] },
    ]);

    await Collection.insertMany([
      { title: 'Summer Collection', slug: 'summer-collection', imageUrl: 'https://images.unsplash.com/photo-1509315355483-c2415d86e82a?q=80&w=800&auto=format&fit=crop', isActive: true },
      { title: 'Ethnic Wear', slug: 'ethnic-wear', imageUrl: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?q=80&w=800&auto=format&fit=crop', isActive: true },
      { title: 'Accessories', slug: 'accessories', imageUrl: 'https://images.unsplash.com/photo-1590858971932-e070f6199988?q=80&w=800&auto=format&fit=crop', isActive: true },
    ]);

    await Slide.insertMany([
      { imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop", title: "New Season Arrivals", subtitle: "Discover the latest trends in women's fashion.", buttonText: "Shop Collection" },
      { imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop", title: "Elegance Redefined", subtitle: "Explore our exclusive range of dresses and evening wear.", buttonText: "View Dresses" },
      { imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1920&auto=format&fit=crop", title: "Beauty & Glow", subtitle: "Premium skincare and makeup essentials for a radiant you.", buttonText: "Shop Beauty" }
    ]);

    await HeaderSetting.create({
      logoText: 'Ladies Smart Choice',
      phoneNumber: '+91 987 654 3210',
      topBarLinks: [{ text: 'About Us', url: '/pages/about' }, { text: 'Order Tracking', url: '#' }, { text: 'Contact Us', url: '/pages/contact' }, { text: 'Blog', url: '/blogs' }],
      mainNavLinks: [{ text: 'New Arrivals', url: '#' }, { text: 'Clothing', url: '#' }, { text: 'Sale', url: '#' }]
    });

    await FooterSetting.create({
      brandDescription: 'Your ultimate destination for trendy women\'s fashion, accessories, and lifestyle products.',
      copyrightText: '© 2024 Ladies Smart Choice. All rights reserved.',
      socialLinks: [{ platform: 'Facebook', url: '#' }, { platform: 'Instagram', url: '#' }, { platform: 'Twitter', url: '#' }],
      columns: [
          { title: 'Shop', links: [{ text: 'Clothing', url: '#' }, { text: 'Footwear', url: '#' }, { text: 'Accessories', url: '#' }] },
          { title: 'Support', links: [{ text: 'Contact Us', url: '/pages/contact' }, { text: 'FAQs', url: '/pages/faq' }] },
          { title: 'Company', links: [{ text: 'About Us', url: '/pages/about' }, { text: 'Privacy Policy', url: '/pages/privacy-policy' }] }
      ]
    });

    await SiteSettings.create({
        currency: 'INR',
        taxRate: 18,
        shippingCharge: 50,
        videoAutoplay: true,
    });

    await HomePageSetting.create({
        seoTitle: 'Ladies Smart Choice | Fashion & Lifestyle',
        seoDescription: "The premier online destination for women's fashion, clothing, accessories, and lifestyle products."
    });

    await ShoppableVideo.insertMany([
      { title: 'Summer Dress Twirl', videoUrl: 'https://videos.pexels.com/video-files/4434240/4434240-hd_720_1280_25fps.mp4', thumbnailUrl: 'https://images.pexels.com/videos/4434240/pexels-photo-4434240.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', price: '₹1,499' },
      { title: 'City Walk Sneakers', videoUrl: 'https://videos.pexels.com/video-files/8122283/8122283-hd_720_1366_25fps.mp4', thumbnailUrl: 'https://images.pexels.com/videos/8122283/pexels-photo-8122283.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', price: '₹1,299' },
    ]);

    await Testimonial.insertMany([
      { name: 'Priya Sharma', rating: 5, comment: 'Absolutely in love with my new dress! The quality is amazing and it fits perfectly.', imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg', role: 'Fashion Blogger' },
      { name: 'Anjali Mehta', rating: 4, comment: "The handbag I ordered is so stylish and spacious. It's my new favorite accessory for work and weekends.", imageUrl: 'https://randomuser.me/api/portraits/women/47.jpg', role: 'Verified Customer' },
    ]);
    
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
    // Optional: add a destroy data function
} else {
    importData();
}