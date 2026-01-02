
# 🚀 Ladies Smart Choice - Architecture & Documentation

Ladies Smart Choice ek premium Ayurvedic eCommerce platform hai jo **MERN (MongoDB, Express, React, Node.js)** stack par bana hai. Isme advanced features jaise **Razorpay Magic Checkout**, **Admin Dashboard**, aur **Real-time Analytics** shamil hain.

---

## 🏗️ Architecture Overview

Yeh application ek **Client-Server Architecture** ko follow karti hai:

1.  **Frontend (React + Vite + TailwindCSS):** Ek Single Page Application (SPA) jo user interface aur user experience ko handle karti hai.
2.  **Backend (Node.js + Express):** RESTful API server jo database communication, authentication, aur payment verification ko sambhalta hai.
3.  **Database (MongoDB):** NoSQL database jo products, users, orders, aur settings ko JSON-like format mein store karta hai.
4.  **Integrations:** 
    *   **Razorpay:** Payment processing aur Magic Checkout UI ke liye.
    *   **Cloudinary:** Images aur videos ki storage ke liye.
    *   **Meta Pixel & CAPI:** Marketing aur user tracking ke liye.

---

## 📂 Folder Structure

### Frontend (`/src` - Root)
- `index.tsx`: React application ka entry point.
- `App.tsx`: Routing aur global providers (Auth, Cart, SiteData) ka setup.
- `pages/`: Har route ke liye main components (e.g., `HomePage.tsx`, `CheckoutPage.tsx`).
- `components/`: Reusable UI elements (Buttons, Header, Footer).
- `components/admin/`: Admin panel ke specific components (Analytics, Product Editor).
- `contexts/`: Global state management (Cart, Wishlist, Toast notifications).
- `utils/`: Helper functions (API call logic, SEO helpers).

### Backend (`/backend`)
- `server.js`: Server startup aur middleware configuration.
- `models/`: Mongoose Schemas (User, Product, Order, SiteSettings).
- `routes/`: API Endpoints (Auth, Products, Orders, Analytics).
- `middleware/`: Authentication protection (`protect`, `admin` checks).
- `utils/`: Server-side logic (Invoice generation, Email service, Feed generator).

---

## ✨ Magic Checkout Kaise Kaam Karta Hai?

Standard checkout mein user ko lamba form bharna padta hai. **Magic Checkout** ise bypass karta hai:

1.  **Direct Trigger:** Jab user "Pay Securely Now" par click karta hai, frontend backend se `razorpay_key` maangta hai.
2.  **Razorpay Modal:** Frontend `checkout.js` (Razorpay SDK) ka use karke ek popup kholta hai. Hum is popup ko sirf `amount` aur `notes` (items) bhejte hain.
3.  **User Identity:** Razorpay popup ke andar hi user apna mobile number daalta hai. 
    - Agar user ne pehle kabhi Razorpay use kiya hai, toh wo **OTP** se verify ho jata hai.
    - User ka **Address** automatic populate ho jata hai ya user popup ke andar hi naya address dalta hai.
4.  **Payment Capture:** Payment hone ke baad Razorpay ek `payment_id` deta hai.
5.  **Backend Fetch:** Frontend is ID ko hamare backend `/api/orders/verify` par bhejta hai. Hamara backend Razorpay API ka use karke us `payment_id` se user ka **confirmed address** aur **contact details** fetch karta hai.
6.  **Database Sync:** Backend us address aur user ki detail ko MongoDB mein `Order` document mein save kar deta hai.

---

## 📦 Order Creation Flow

Orders do tareeke se ban sakte hain:

### 1. Online Purchase (Automatic)
- **Step A:** User cart mein items add karta hai aur Checkout page par jata hai.
- **Step B:** Razorpay payment successful hone par backend payment verify karta hai.
- **Step C:** `Order` model mein status `Paid` set ho jata hai aur database mein entry ho jati hai.
- **Step D:** Admin dashboard mein real-time notification jati hai aur user ko email confirm hota hai.

### 2. Manual Order (Admin Panel)
- Admin `Create Order` tab mein jaakar customer ki details manually fill kar sakta hai.
- Admin products search karke add karta hai aur manual discount apply kar sakta hai.
- Order create hote hi status `Pending` hota hai, jise baad mein `Shipped` ya `Delivered` kiya ja sakta hai.

---

## 🛠️ Admin Dashboard Capabilities

Admin ke paas poori website ka control hai:
- **Product Management:** Bulk actions (delete, status change) ke saath naye products add karna.
- **Visual Builder:** Homepage ke sections (Hero, Best Sellers) ko drag-and-drop/reorder karna.
- **Branding:** Website ke colors, fonts, aur logos dashboard se bina code badle change karna.
- **Analytics:** Real-time visitors aur conversion rates dekhna (Meta Pixel integration ke saath).
- **Logistics:** Orders ke liye tracking numbers aur carrier details update karna.

---

## ⚙️ Environment Setup (.env)

Application ko chalane ke liye backend folder mein `.env` file hona zaroori hai:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_password
```

---
*Developed with ❤️ by Ladies Smart Choice Engineering Team.*
