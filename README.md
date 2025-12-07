
# 🚀 Ladies Smart Choice - Full Stack E-commerce

This project is a full-stack e-commerce website, built with a React frontend (TypeScript, TailwindCSS) and a Node.js backend (Express, MongoDB). It includes features like user/admin roles, product management, order processing with Razorpay, and a complete admin dashboard.

---

## 1. Local Development Setup

You will need to run two separate processes for the frontend and backend.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (a local instance or a free MongoDB Atlas account)
- A code editor like VS Code

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
    Create a `.env` file in the `backend` directory. You can copy the example file (`.env.example`) as a template. Fill in your details, especially your `MONGO_URI` and `JWT_SECRET`.

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

## 2. Production Deployment

This application is designed to be deployed on a Linux VPS (e.g., Hostinger, DigitalOcean) running Ubuntu. The deployment strategy involves:
-   **Nginx** as a reverse proxy and for serving static frontend files.
-   **PM2** as a process manager to keep the Node.js backend running.
-   **Certbot** for obtaining a free SSL certificate (HTTPS).

For a complete, copy-paste guide with real commands, please refer to the official deployment documentation:

➡️ **[VPS Deployment Guide](./vps-deployment-guide.md)**
