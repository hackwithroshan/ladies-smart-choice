
# 🚀 Ladies Smart Choice - Full Stack E-commerce

This project is built with React (Frontend) and Node.js/Express (Backend) using MongoDB.

---

## 1. Local Development Setup
1. `npm install` (Installs frontend and backend deps)
2. Create `backend/.env` with your `MONGO_URI` and `JWT_SECRET`.
3. `npm run build`
4. `npm start`

---

## 2. Deployment: Railway
1. Connect your GitHub repo.
2. Add Variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`.
3. Railway will automatically run `npm install`, `npm run build`, and `npm start`.

---

## 3. Deployment: Hostinger VPS
1. **Clone Repo:** `git clone <url> && cd ladies-smart-choice`
2. **Install:** `npm install`
3. **Build:** `npm run build`
4. **Environment:** Create `backend/.env` file.
5. **Run with PM2:** `pm2 start backend/server.js --name "ladies-choice"`
6. **Nginx:** Point your `root` to `/var/www/ladies-smart-choice/dist` and `proxy_pass` `/api` to `http://localhost:5000`.

---

## Why this works on both?
1. **Relative Paths:** Backend uses `path.resolve(__dirname, '..', 'dist')` which works regardless of where the app is installed.
2. **Post-Install:** `npm install` at root now automatically installs backend dependencies.
3. **Dynamic Port:** Works with Railway's dynamic ports and VPS fixed ports.
