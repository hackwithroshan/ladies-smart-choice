
# 🚀 Ladies Smart Choice - Full Stack E-commerce

This project is a high-performance e-commerce platform built with React (Frontend) and Node.js/Express (Backend) using MongoDB.

---

## 1. Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account or Local MongoDB

### Installation
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd ladies-smart-choice
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```
   *(This will automatically install backend dependencies as well via the postinstall script)*

3. **Configure Environment Variables:**
   Create a `.env` file in the `backend` folder:
   ```ini
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_random_secret_key
   RAZORPAY_KEY_ID=your_key
   RAZORPAY_KEY_SECRET=your_secret
   ```

4. **Run the App:**
   - Terminal 1 (Frontend): `npm run dev`
   - Terminal 2 (Backend): `cd backend && npm run dev`

---

## 2. Deployment Guide: Railway (Easiest)

Railway is recommended for automatic builds and zero-config SSL.

1. **Connect GitHub:** Link your repository to a new project on Railway.
2. **Set Variables:** In the Railway dashboard, add these under "Variables":
   - `MONGO_URI`: (Your MongoDB connection string)
   - `JWT_SECRET`: (Any long random string)
   - `NODE_ENV`: `production`
   - `RAZORPAY_KEY_ID`: (Your key)
   - `RAZORPAY_KEY_SECRET`: (Your secret)
3. **Build Settings:** 
   - Railway will automatically detect the root `package.json`.
   - It will run `npm run build` (to create `/dist`) and then `npm start`.
   - **No further config needed.**

---

## 3. Deployment Guide: Hostinger VPS (Ubuntu)

For full control using Nginx and PM2.

### Step 1: Server Prep
```bash
sudo apt update
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### Step 2: Code Setup
```bash
cd /var/www
git clone <your-repo-url>
cd ladies-smart-choice
npm install
npm run build
```

### Step 3: PM2 Process Management
Create the `.env` file in `backend/` and then start the server:
```bash
pm2 start backend/server.js --name "ladies-choice"
pm2 save
```

### Step 4: Nginx Configuration
Create a config file: `sudo nano /etc/nginx/sites-available/ladiessmartchoice.com`
```nginx
server {
    listen 80;
    server_name ladiessmartchoice.com;

    root /var/www/ladies-smart-choice/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/ladiessmartchoice.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Why this works on both?
1. **Dynamic Paths:** The backend uses `path.resolve(__dirname, '..', 'dist')`, making it compatible with both Railway's root execution and PM2's folder-based execution.
2. **Unified Port:** It detects `process.env.PORT` (Railway) or defaults to `5000` (VPS).
3. **Automated Build:** The root `package.json` contains a `postinstall` script that ensures backend dependencies are always ready.
