
# 🚀 Ladies Smart Choice - Full Stack E-commerce

Authentic Ayurvedic wellness store with Admin and User dashboards.

---

## 🛠️ Razorpay Magic Checkout Setup (CRITICAL)

Magic Checkout standard checkout se alag hota hai. Ise sahi se chalane ke liye ye steps follow karein:

### 1. Razorpay Dashboard Settings
1.  **Login** karein [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  **Account & Settings** > **API Keys** me jayein aur `Key ID` aur `Key Secret` generate karein.
3.  **Magic Checkout** activation: Razorpay team se "Magic Checkout" enable karne ki request karni padti hai. 
4.  **Webhooks**: Order success verify karne ke liye `order.paid` webhook set karein (Production me).

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

### 3. Common Fixes
- **"No key passed" error**: Iska matlab backend se `RAZORPAY_KEY_ID` nahi aa raha ya `.env` file server load nahi kar paya.
- **400 Bad Request (extra_field_sent)**: Agar error bole ki `amount` bhej rahe ho aur zarurat nahi hai, to backend me `line_items` bhejte waqt top-level `amount` ko remove karein (ye fix ab code me implemented hai).
- **index.css 404**: Ye warning `index.html` se line hatane par chali jayegi (fixed in latest update).

---

## 📦 Installation & Deployment

### Local Setup
1.  `npm install` (Root me)
2.  `cd backend && npm install`
3.  `.env` file setup karein.
4.  `npm run dev` (Frontend) aur `node backend/server.js` (Backend) start karein.
