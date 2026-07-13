# S.N.G Public School Website — Full Guide

This is a complete website WITH a real backend (server + database).
Notices, results, attendance, gallery photos, and contact messages
are now stored in a real database — visible to EVERY visitor, not
just the device that added them.

---

## 1. What's inside this folder

```
sng-fullstack/
├── server.js          ← The backend (runs everything)
├── package.json        ← List of tools the server needs
├── database.db          ← Auto-created on first run (your real database)
├── public/
│   ├── index.html       ← Main website
│   ├── admin.html       ← Admin login + dashboard
│   ├── style.css        ← All design/colors
│   ├── script.js        ← Public site logic (talks to server)
│   └── admin.js         ← Admin dashboard logic
└── uploads/             ← Uploaded photos are saved here
```

---

## 2. One-time setup on your computer

### Step 1: Install Node.js
Download and install from **https://nodejs.org** (choose the "LTS" version).
This is free. After installing, restart your computer once.

### Step 2: Open this folder in a terminal
- **Windows:** open the `sng-fullstack` folder, then right-click inside it → "Open in Terminal" (or "Open PowerShell window here")
- **Mac:** open Terminal, type `cd ` (with a space), then drag the `sng-fullstack` folder into the Terminal window, press Enter

### Step 3: Install the required tools
Type this and press Enter (only needed once, needs internet):
```
npm install
```
Wait for it to finish (downloads a few packages).

### Step 4: Start the website
```
npm start
```
You'll see:
```
S.N.G Public School website running!
Open in browser: http://localhost:3000
Admin panel:     http://localhost:3000/admin.html
Admin login ->   username: admin | password: sng@2026
```

### Step 5: Open the website
Open your browser and go to: **http://localhost:3000**

To manage notices/results/gallery, go to: **http://localhost:3000/admin.html**
Login with `admin` / `sng@2026` — **change this password immediately** from the Account tab after logging in.

---

## 3. How this is different from the earlier version

| Before (localStorage) | Now (real backend) |
|---|---|
| Data saved only on one device | Data saved in `database.db`, same for every visitor |
| No login needed to edit | Admin login required to add/edit/delete |
| Photos stored as text in browser | Photos saved as real files in `/uploads` |
| Worked by just opening the HTML file | Needs `npm start` running to work |

---

## 4. Editing content

- **Change design/colors** → edit `public/style.css`
- **Change page text/layout** → edit `public/index.html`
- **Change how things behave** → edit `public/script.js` (public site) or `public/admin.js` (admin panel)
- **Change database structure or backend logic** → edit `server.js`

Add notices, student results, attendance, and gallery photos through the
**Admin Panel** (`/admin.html`) — no code editing needed for daily updates.

---

## 5. Making it live on the internet (so parents can visit from anywhere)

Right now this only runs on YOUR computer (`localhost`). To make it a real
public website, you need to host it on a server that stays on 24/7. Free
options that work well for this exact kind of Node.js app:

1. **Render.com** (recommended, free tier available)
   - Create a free account
   - Click "New Web Service" → connect your code (upload to GitHub first, or use their manual deploy)
   - Set start command: `npm start`
   - Render gives you a free URL like `sngps.onrender.com`

2. **Railway.app** — similar process, free starter tier

3. Once live, you can also buy a real domain (like `sngpublicschool.in`, ~₹500–800/year)
   and point it to your Render/Railway link — then it becomes `www.sngpublicschool.in`

I can walk you through the Render deployment step-by-step whenever you're
ready — it takes about 15–20 minutes the first time.

---

## 6. Important notes

- **Change the default admin password** right after your first login.
- **Back up `database.db` and the `uploads` folder** occasionally (just copy them somewhere safe) — this is your real data.
- The contact form currently **saves messages to the database** (visible in Admin → Messages tab). It does not auto-send emails yet — that needs an email service (like Gmail SMTP) connected, which I can add if you want real email notifications too.
- WhatsApp button and QR payment work exactly as before — no backend needed for those, they're just links.
