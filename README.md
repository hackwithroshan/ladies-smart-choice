
# 🚀 Ladies Smart Choice - Full Stack E-commerce

This project is built with React (Frontend) and Node.js/Express (Backend) using MongoDB.

---

## 1. Local Development Setup
1. `npm install` (Installs frontend and backend deps)
2. Create `backend/.env` with your `MONGO_URI` and `JWT_SECRET`.
3. `npm run build`
4. `npm start`

---

## 2. Deployment: Railway (Fixing Build Issues)

If you see an error like "dist folder not found":

1. **Build Command:** Go to Railway Project Settings > Build & Deploy.
2. Set **Build Command** to: `npm run build`
3. Set **Start Command** to: `npm start`
4. Railway will now run the Vite build and then start the Express server which serves the `dist` folder.

---

## 3. Deployment: Hostinger VPS
1. **Clone Repo:** `git clone <url> && cd ladies-smart-choice`
2. **Install:** `npm install`
3. **Build:** `npm run build` (This creates the `/dist` folder)
4. **Environment:** Create `backend/.env` file.
5. **Run with PM2:** `pm2 start backend/server.js --name "ladies-choice"`
6. **Nginx:** Point your `root` to `/var/www/ladies-smart-choice/dist`.

---

## Why this works on both?
1. **Relative Paths:** Backend uses `path.resolve(__dirname, '..', 'dist')` which is robust.
2. **Post-Install:** `npm install` at root now automatically installs backend dependencies.
3. **Dynamic Port:** Works with Railway's dynamic ports and VPS fixed ports.
