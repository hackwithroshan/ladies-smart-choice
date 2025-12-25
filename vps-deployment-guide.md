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
MONGO_URI=mongodb://localhost:27017/ladies_choice_db  # Use a separate DB name
JWT_SECRET=YourSecretHere
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

### 3. Build & PM2 Start
```bash
npm run build
cd backend
pm2 start server.js --name "ladies-choice"
```

### 4. Separate Nginx Virtual Host (CRITICAL)
Create a dedicated file: `sudo nano /etc/nginx/sites-available/ladiessmartchoice.com`
Paste this EXACTLY (Port 5000):
```nginx
server {
    listen 80;
    server_name ladiessmartchoice.com www.ladiessmartchoice.com;

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

### 5. Activate and SSL (No Errors)
```bash
# Link the site
sudo ln -sf /etc/nginx/sites-available/ladiessmartchoice.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Generate independent SSL certificate
sudo certbot --nginx --cert-name ladiessmartchoice.com -d ladiessmartchoice.com -d www.ladiessmartchoice.com
```

### Why this fixes SSL issues?
By using `--cert-name ladiessmartchoice.com`, Certbot creates a separate folder for this domain. Nginx will then correctly present this certificate only for this domain, while Ayushree continues to use its own certificate on Port 5001.