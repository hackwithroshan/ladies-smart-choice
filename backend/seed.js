
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
        name: 'Ayushree Admin',
        email: 'admin@ayushree.com',
        password: 'password123',
        role: 'Super Admin',
    });
    
    // --- Ayurvedic Product Data ---
    const productsData = [
      { name: 'Organic Ashwagandha Powder', slug: 'organic-ashwagandha-powder', category: 'Supplements', price: 499.00, mrp: 650, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?q=80&w=400&auto=format&fit=crop', description: 'Pure organic Ashwagandha root powder to support stress relief and energy.', shortDescription: 'Stress relief and vitality support.', status: 'Active' },
      { name: 'Brahmi & Amla Hair Oil', slug: 'brahmi-amla-hair-oil', category: 'Personal Care', price: 350.00, mrp: 450, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=400&auto=format&fit=crop', description: 'Traditional Ayurvedic blend for strong, shiny hair and scalp health.', shortDescription: 'Nourishing herbal hair oil.', status: 'Active' },
      { name: 'Kesar & Kumkumadi Facial Oil', slug: 'kesar-kumkumadi-facial-oil', category: 'Beauty', price: 1200.00, mrp: 1500, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=400&auto=format&fit=crop', description: 'Premium facial oil with saffron for glowing skin and anti-aging benefits.', shortDescription: 'Luxury saffron face elixir.', status: 'Active' },
      { name: 'Herbal Detox Tea Blend', slug: 'herbal-detox-tea-blend', category: 'Supplements', price: 299.00, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1544787210-282bbd479140?q=80&w=400&auto=format&fit=crop', description: 'Refreshing detox tea with Tulsi, Ginger, and Turmeric.', shortDescription: 'Daily immunity booster tea.', status: 'Active' },
    ];
    await Product.insertMany(productsData);
    
    await Category.insertMany([
      { name: 'Supplements', subcategories: [{ name: 'Powders' }, { name: 'Capsules' }] },
      { name: 'Personal Care', subcategories: [{ name: 'Hair Care' }, { name: 'Oral Care' }] },
      { name: 'Beauty', subcategories: [{ name: 'Face Care' }, { name: 'Body Care' }] },
    ]);

    await Collection.insertMany([
      { title: 'Immunity Boosters', slug: 'immunity-boosters', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop', isActive: true },
      { title: 'Organic Skincare', slug: 'organic-skincare', imageUrl: 'https://images.unsplash.com/photo-1590156221122-c748e7898b0a?q=80&w=800&auto=format&fit=crop', isActive: true },
      { title: 'Herbal Oils', slug: 'herbal-oils', imageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop', isActive: true },
    ]);

    await Slide.insertMany([
      { imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1920&auto=format&fit=crop", title: "Holistic Healing", subtitle: "Traditional Ayurvedic wisdom for modern wellness.", buttonText: "Shop All Herbs" },
      { imageUrl: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1920&auto=format&fit=crop", title: "Nature's Secret to Radiance", subtitle: "Chemical-free skincare infused with ancient ingredients.", buttonText: "Explore Beauty" },
    ]);

    await HeaderSetting.create({
      logoText: 'Ayushree Ayurveda',
      phoneNumber: '+91 987 654 3210',
      brandColor: '#16423C',
      topBarLinks: [{ text: 'Our Story', url: '/pages/about' }, { text: 'Ayurvedic Guide', url: '/blogs' }, { text: 'Contact Us', url: '/contact' }],
      mainNavLinks: [{ text: 'Supplements', url: '#' }, { text: 'Oils', url: '#' }, { text: 'Skincare', url: '#' }]
    });

    await FooterSetting.create({
        backgroundColor: '#16423C',
      brandDescription: 'Ayushree Ayurveda is committed to bringing you the purest herbal remedies crafted with tradition and care.',
      copyrightText: '© 2024 Ayushree Ayurveda. Pure. Traditional. Ethical.',
      socialLinks: [{ platform: 'Instagram', url: '#' }, { platform: 'Facebook', url: '#' }],
      columns: [
          { title: 'Wellness', links: [{ text: 'Immunity', url: '#' }, { text: 'Digestion', url: '#' }, { text: 'Stress Relief', url: '#' }] },
          { title: 'Support', links: [{ text: 'Track Order', url: '/track-order' }, { text: 'Shipping Policy', url: '/pages/shipping' }] },
          { title: 'Legal', links: [{ text: 'Terms of Service', url: '#' }, { text: 'Privacy Policy', url: '#' }] }
      ]
    });

    await SiteSettings.create({
        currency: 'INR',
        taxRate: 12,
        shippingCharge: 40,
        whatsappNumber: '919876543210',
        whatsappMessage: 'Namaste! I have a question about Ayushree products.',
        fontFamily: 'Playfair Display'
    });

    await HomePageSetting.create({
        seoTitle: 'Ayushree Ayurveda | Authentic Herbal Wellness & Supplements',
        seoDescription: "Discover the healing power of nature with Ayushree's authentic Ayurvedic oils, powders, and skincare."
    });

    await ShoppableVideo.insertMany([
      { title: 'Nourishing Hair Ritual', videoUrl: 'https://videos.pexels.com/video-files/4434240/4434240-hd_720_1280_25fps.mp4', price: '₹350' },
    ]);

    await Testimonial.insertMany([
      { name: 'Kavita Iyer', rating: 5, comment: 'The Ashwagandha powder has significantly improved my sleep quality. Highly recommended!', role: 'Yoga Instructor' },
    ]);
    
    console.log('Ayurvedic Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

importData();
