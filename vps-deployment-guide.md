
# 🚀 Multi-Site Production Deployment Guide (Hostinger/Ubuntu)

Use this guide to run **Ayushree Ayurveda** and **Ladies Smart Choice** on the same server without SSL conflicts.

---

### 1. Port Allocation
- **Ladies Smart Choice:** Port `5000` (`backend/.env` -> `PORT=5000`)
- **Ayushree Ayurveda:** Port `5001` (`backend/.env` -> `PORT=5001`)

### 2. Nginx Site Isolation
Create two separate configuration files in `/etc/nginx/sites-available/`.

#### For Ladies Smart Choice (`/etc/nginx/sites-available/ladiessmartchoice.com`):
```nginx
server {
    listen 80;
    server_name ladiessmartchoice.com www.ladiessmartchoice.com;

    root /var/www/ladies-smart-choice/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:5000; # Points to port 5000
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

#### For Ayushree (`/etc/nginx/sites-available/ayushreeayurveda.in`):
```nginx
server {
    listen 80;
    server_name ayushreeayurveda.in www.ayushreeayurveda.in;

    root /var/www/ayushree/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:5001; # Points to port 5001
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

### 3. SSL Configuration (Critical)
Run Certbot individually for each domain to ensure separate certificates:
```bash
# Site 1
sudo certbot --nginx -d ladiessmartchoice.com -d www.ladiessmartchoice.com
# Site 2
sudo certbot --nginx -d ayushreeayurveda.in -d www.ayushreeayurveda.in
```

### 4. PM2 Management
```bash
# Ladies Choice
cd /var/www/ladies-smart-choice/backend
pm2 start server.js --name "ladies-choice"

# Ayushree
cd /var/www/ayushree/backend
pm2 start server.js --name "ayushree"
```
