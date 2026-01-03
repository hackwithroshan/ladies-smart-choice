
# 🚀 Multi-Site VPS Setup Guide (Zero Conflict)

### 1. Install Project Dependencies
Run from `/var/www/ladies-smart-choice`:
```bash
npm install
cd backend && npm install && cd ..
```

### 2. Environment Setup (Isolated Database)
Create the `.env` file: `nano backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ladies_choice_db
JWT_SECRET=YourSecretHere
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
# ... other vars
```

### 3. Build & PM2 Start
```bash
npm run build
cd backend
pm2 start server.js --name "ladies-choice"
```

### 4. Nginx Configuration (Subdomain Support)
Create/Edit the file: `sudo nano /etc/nginx/sites-available/ladiessmartchoice.com`

**Copy-Paste this EXACTLY:**
```nginx
server {
    listen 80;
    # Add dashboard subdomain here
    server_name ladiessmartchoice.com www.ladiessmartchoice.com dashboard.ladiessmartchoice.com;

    location / {
        root /var/www/ladies-smart-choice/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Activate and SSL (Subdomain Coverage)
```bash
# Link the site (if not already linked)
sudo ln -sf /etc/nginx/sites-available/ladiessmartchoice.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Generate SSL for BOTH main domain AND dashboard subdomain
sudo certbot --nginx -d ladiessmartchoice.com -d www.ladiessmartchoice.com -d dashboard.ladiessmartchoice.com
```

### Important Notes:
1. **DNS**: Make sure an 'A' record for `dashboard` is pointing to your VPS IP.
2. **Reload**: Always run `sudo systemctl restart nginx` after changing config files.
3. **CORS**: If the backend blocks the dashboard, ensure your backend allows `https://dashboard.ladiessmartchoice.com`.
