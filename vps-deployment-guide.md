
# 🚀 Production Deployment Guide for Hostinger VPS (Ubuntu)

This guide provides a complete, step-by-step process for deploying the "Ladies Smart Choice" full-stack application to a production server (like Hostinger, DigitalOcean, or any VPS) running **Ubuntu 20.04 or 22.04**.

Follow these steps exactly to ensure a successful deployment.

---

### **Step 1: Prerequisites**

Before you begin, make sure you have:
1.  **A VPS Server:** Running Ubuntu 20.04 or 22.04 with root access.
2.  **A Domain Name:** `ladiessmartchoice.com`, pointing to your VPS server's IP address.
3.  **A GitHub Repository:** Your entire project code pushed to a private GitHub repository.

---

### **Step 2: Connect & Prepare Your Server**

First, connect to your server via SSH. Replace `YOUR_SERVER_IP` with your actual server IP address.
```bash
ssh root@YOUR_SERVER_IP
```

Once connected, run these commands to install all necessary software.

1.  **Update Server Packages:**
    ```bash
    sudo apt-get update && sudo apt-get upgrade -y
    ```

2.  **Install Node.js (v18):**
    ```bash
    curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

3.  **Install Git:**
    ```bash
    sudo apt-get install -y git
    ```

4.  **Install PM2 (Process Manager):** This will keep your backend running forever.
    ```bash
    sudo npm install pm2 -g
    ```

5.  **Install Nginx (Web Server):** This will serve your website to the public.
    ```bash
    sudo apt-get install -y nginx
    ```

---

### **Step 3: Configure Firewall**

Allow web traffic (HTTP & HTTPS) and SSH through the firewall.
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```
Press `y` and `Enter` when prompted to proceed.

---

### **Step 4: Deploy Code from GitHub**

Clone your project repository into the `/var/www/` directory, which is the standard for web projects.

1.  **Create project directory and navigate into it:**
    ```bash
    sudo mkdir -p /var/www/ladies-smart-choice
    cd /var/www/ladies-smart-choice
    ```

2.  **Clone your repository:**
    Replace `YOUR_GITHUB_REPO_URL` with your repository's URL (e.g., `https://github.com/your_username/ladies-smart-choice.git`).
    ```bash
    sudo git clone YOUR_GITHUB_REPO_URL .
    ```
    *(The `.` at the end clones the repo into the current directory).*

---

### **Step 5: Set Up the Backend**

1.  **Navigate to the backend folder:**
    ```bash
    cd backend
    ```

2.  **Create the Production `.env` File:**
    This is a critical step. Use the `nano` text editor to create and paste your production secrets.
    ```bash
    sudo nano .env
    ```
    Copy the entire block below, **replace placeholder values with your real production data**, and paste it into the `nano` editor.

    ```ini
    NODE_ENV=production
    PORT=5000
    MONGO_URI=your_production_mongodb_uri_here
    JWT_SECRET=generate_a_very_long_random_secret_string_for_production
    FRONTEND_URL=https://ladiessmartchoice.com

    # Production Razorpay Keys (Live Mode)
    RAZORPAY_KEY_ID=your_live_key_id
    RAZORPAY_KEY_SECRET=your_live_key_secret

    # Production Email SMTP Details (e.g., from Hostinger or SendGrid)
    EMAIL_HOST=your_smtp_host
    EMAIL_PORT=your_smtp_port
    EMAIL_USER=your_smtp_user
    EMAIL_PASS=your_smtp_password
    ADMIN_EMAIL=your_admin_notification_email
    ```
    To save and exit, press `Ctrl+X`, then `Y`, then `Enter`.

3.  **Install Backend Dependencies:**
    This uses the `install-prod` script from `backend/package.json` to only install production dependencies.
    ```bash
    sudo npm run install-prod
    ```

---

### **Step 6: Build the Frontend**

The frontend needs to be built into static HTML, CSS, and JS files.

1.  **Navigate to the project root:**
    ```bash
    cd /var/www/ladies-smart-choice
    ```
2.  **Install all dependencies** (Vite is a dev dependency needed for the build):
    ```bash
    sudo npm install
    ```
3.  **Run the build script:**
    ```bash
    sudo npm run build
    ```
    This creates a `dist` folder containing your optimized frontend.

---

### **Step 7: Start the Backend with PM2**

1.  **Navigate to the project root directory:**
    ```bash
    cd /var/www/ladies-smart-choice
    ```

2.  **Start your server using PM2:**
    This command starts the backend and gives it a memorable name.
    ```bash
    pm2 start backend/server.js --name "ladies-smart-choice-app"
    ```

3.  **Save the process list:**
    This ensures your app will automatically restart if the server reboots.
    ```bash
    pm2 save
    ```

4.  **Check Status:**
    Confirm your app is running and `online`.
    ```bash
    pm2 list
    ```

---

### **Step 8: Configure Nginx as a Reverse Proxy**

Nginx will act as the public-facing web server. It will serve the React frontend and forward API requests to your backend (running on port 5000).

1.  **Create an Nginx Configuration File:**
    ```bash
    sudo nano /etc/nginx/sites-available/ladiessmartchoice.com
    ```

2.  **Paste the following configuration.** This is the most important step.

    ```nginx
    server {
        # Listen on both IPv4 and IPv6 for modern compatibility
        listen 80;
        listen [::]:80;
        
        server_name ladiessmartchoice.com www.ladiessmartchoice.com;

        # Main route serves the frontend build files
        root /var/www/ladies-smart-choice/dist;
        index index.html;

        # IMPORTANT CLARIFICATION:
        # The line below tells Nginx to forward API requests internally to your Node.js app,
        # which is running on the SAME server at port 5000. 
        # "localhost" is correct here and should NOT be changed to your domain name.
        location /api {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Handle feed requests by forwarding them to your backend on port 5000
        location /feeds {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Handle all other requests by serving the React app
        # This allows React Router to handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```
    Save and exit (`Ctrl+X`, `Y`, `Enter`).

3.  **Enable the new configuration by creating a symbolic link:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/ladiessmartchoice.com /etc/nginx/sites-enabled/
    ```

4.  **Test and Restart Nginx:**
    ```bash
    sudo nginx -t
    ```
    If you see `syntax is ok` and `test is successful`, you are good to go! If not, double-check the config file for typos.

    Once the test is successful, restart Nginx to apply the changes:
    ```bash
    sudo systemctl restart nginx
    ```

At this point, you should be able to visit `http://ladiessmartchoice.com` and see your website!

---

### **Step 9: Secure Your Site with SSL (HTTPS)**

1.  **Install Certbot:** This tool automates getting a free SSL certificate.
    ```bash
    sudo apt-get install certbot python3-certbot-nginx -y
    ```
2.  **Run Certbot:** It will automatically detect your domain from Nginx, get a certificate, and configure Nginx for you.
    
    ```bash
    sudo certbot --nginx -d ladiessmartchoice.com -d www.ladiessmartchoice.com
    ```
    Follow the on-screen prompts. When asked about redirecting traffic, choose the option to **redirect all HTTP traffic to HTTPS**.

---

### **Deployment Complete!**

Your site is now live, secure, and running robustly at `https://ladiessmartchoice.com`.

-   To check your backend logs, run: `pm2 logs ladies-smart-choice-app`
-   To restart your backend after an update, run: `pm2 restart ladies-smart-choice-app --update-env`

### **How to Update Your Live Application**

1.  **SSH into your server:** `ssh root@YOUR_SERVER_IP`
2.  **Navigate to your project directory:** `cd /var/www/ladies-smart-choice`
3.  **Pull the latest code from GitHub:** `sudo git pull`
4.  **Install any new dependencies:**
    -   For backend: `cd backend && sudo npm run install-prod && cd ..`
    -   For frontend: `sudo npm install`
5.  **Rebuild the frontend:** `sudo npm run build`
6.  **Restart the backend application with new environment variables:** `pm2 restart ladies-smart-choice-app --update-env`

Your changes will now be live.
