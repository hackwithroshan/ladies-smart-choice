# 🚀 Ladies Smart Choice - Full Stack E-commerce

This project is a full-stack e-commerce website, built with a React frontend (TypeScript, TailwindCSS) and a Node.js backend (Express, MongoDB). It includes features like user/admin roles, product management, order processing with Razorpay, and a complete admin dashboard.

---

## 1. Local Development Setup

You will need to run two separate processes for the frontend and backend.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (a local instance or a free MongoDB Atlas account)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install backend dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:**
    Create a `.env` file in the `backend` directory by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and fill in your details, especially your `MONGO_URI` and `JWT_SECRET`. The `RAZORPAY` keys are optional if you don't need payment processing during development.

4.  **Seed the database (Optional but Recommended):**
    To populate your database with initial sample data (including an admin user: `admin@example.com` / `password123`), run the seed script.
    ```bash
    npm run seed
    ```

5.  **Start the backend server:**
    ```bash
    npm run dev
    ```
    The backend API will be running on `http://localhost:5000`.

### Frontend Setup

1.  **Open a new terminal** in the project's root directory.

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`. The Vite server is configured to proxy API requests from `/api` to the backend on port 5000.

---

## 2. Production Deployment (VPS Guide)

This guide outlines the steps to deploy the application on a Linux-based Virtual Private Server (VPS).

### Step 1: Build the Frontend

On your local machine or build server, create an optimized production build of the React frontend.
```bash
npm run build
```
This command will generate a `dist` folder in the project's root directory containing the static HTML, CSS, and JavaScript files.

### Step 2: Deploy Code to VPS

Transfer your entire project folder to the VPS. You can use tools like `scp` or `rsync`. Make sure to include:
- The entire `backend` directory.
- The newly created `dist` directory.
- The root `package.json` and `node_modules` are not needed on the server, but `backend/package.json` is.

### Step 3: Configure the Backend on VPS

1.  **Install Node.js and npm** on your server.
2.  **Install PM2**, a process manager to keep your Node.js app running:
    ```bash
    npm install pm2 -g
    ```
3.  **Navigate to the `backend` directory** on your VPS.
4.  **Install production dependencies:**
    ```bash
    npm install --production
    ```
5.  **Create the production `.env` file:**
    Create a `.env` file in the `backend` directory. Copy the contents from `.env.example` and fill it with your **production** values:
    - `NODE_ENV=production`
    - `MONGO_URI`: Your production MongoDB connection string.
    - `JWT_SECRET`: A long, random, secret string.
    - `FRONTEND_URL`: Your public domain name (e.g., `https://www.ladiessmartchoice.com`).
    - Production `RAZORPAY` keys.

### Step 4: Start the Application

From within the `backend` directory, use PM2 to start your server:
```bash
pm2 start server.js --name "ladies-choice-app"
```
Your application is now running, but it's only accessible on `localhost:5000` on the server.

### Step 5: Set up Nginx as a Reverse Proxy

Nginx will expose your application to the internet securely.

1.  **Install Nginx:**
    ```bash
    sudo apt-get update
    sudo apt-get install nginx
    ```

2.  **Configure Nginx:**
    Create a new Nginx configuration file:
    ```bash
    sudo nano /etc/nginx/sites-available/your_domain
    ```
    Paste the following configuration, replacing `your_domain.com` with your actual domain name:
    ```nginx
    server {
        listen 80;
        server_name your_domain.com www.your_domain.com;

        location / {
            proxy_pass http://localhost:5000; # Forwards requests to your Node app
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable the configuration:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/your_domain /etc/nginx/sites-enabled/
    sudo nginx -t # Test for syntax errors
    sudo systemctl restart nginx
    ```

Your site should now be live at your domain. For HTTPS, you can use Certbot to easily get a free SSL certificate from Let's Encrypt.
