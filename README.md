# 🚀 Ladies Smart Choice - Full Stack E-commerce

Authentic Ayurvedic wellness store with Admin and User dashboards.

---

## 🛠️ Razorpay Magic Checkout Setup (CRITICAL)

Magic Checkout standard checkout se alag hota hai. Ise sahi se chalane ke liye ye steps follow karein:

### 1. Razorpay Dashboard Settings
1.  **Login** karein [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  **Magic Checkout** activation: Razorpay team se "Magic Checkout" enable karne ki request karni padti hai. 
3.  **Shipping & COD Setup**: 
    *   Magic Checkout settings me jayein.
    *   **Shipping Info URL** field me ye URL dalein: `https://your-domain.com/api/orders/shipping-info`
    *   Isse Razorpay har address ke liye delivery charges aapke server se puchhega.

### 2. Environment Variables (.env)
Backend folder ke andar `.env` file banayein aur ye values daalein:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_random_string_for_security
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
FRONTEND_URL=http://localhost:3000
```
**Note:** `.env` file ko save karne ke baad backend server ko **restart** zaroor karein.

---

## 📦 Installation & Deployment

### Local Setup
1.  `npm install` (Root me)
2.  `cd backend && npm install`
3.  `.env` file setup karein.
4.  `npm run dev` (Frontend) aur `node backend/server.js` (Backend) start karein.