# 📦 All-in-One Telegram Bot & Mini App on Cloudflare Worker

A complete, production-ready system with **both the Telegram Bot and the Web App hosted in the EXACT same Cloudflare Worker codebase**. No separate frontend server or Cloudflare Pages deployment required!

---

## 🌟 Architecture (Single Unified Cloudflare Worker)

```
                                  ┌────────────────────────────────┐
                                  │         Telegram User          │
                                  └───────────────┬────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │                                                                 │
      (1) Launches Mini App inside TG                                     (2) Sends Bot Commands
      or opens Worker URL in browser                                      (/start, /addpost, files)
                 │                                                                 │
                 ▼                                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SINGLE CLOUDFLARE WORKER                                     │
│                                                                                                 │
│   • GET / & GET /app    ➔ Serves Full Glassmorphic Web App (HTML/CSS/JS + Telegram SDK)         │
│   • POST /webhook       ➔ Telegraf Webhook Handler (/start, /addpost, folder delivery)           │
│   • GET /api/posts      ➔ REST API for fetching published posts & social counts                 │
│   • POST /api/likes     ➔ REST API for toggling post likes                                      │
│   • POST /api/comments  ➔ REST API for adding comments                                          │
│   • scheduled()         ➔ Cloudflare Cron Trigger (Auto-publishes scheduled posts every 5 min)  │
└────────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          │                                      │                                      │
          ▼                                      ▼                                      ▼
┌───────────────────┐                  ┌───────────────────┐                  ┌───────────────────┐
│     Supabase      │                  │     Firebase      │                  │  Private Channel  │
│  (PostgreSQL DB)  │                  │   (Realtime DB)   │                  │  (File Storage)   │
│ Posts, Folders,   │                  │ User Profiles &   │                  │ Permanent Storage │
│  Files, Comments  │                  │     Activity      │                  │  for Media Files  │
└───────────────────┘                  └───────────────────┘                  └───────────────────┘
```

---

## 📁 Project Structure

```
.
├── src/
│   ├── index.js          # Unified Worker entry point (fetch + cron scheduled handler)
│   ├── frontend.js       # Self-contained Web App SPA (HTML, CSS, JS with Telegram WebApp SDK)
│   ├── bot.js            # Telegraf Bot logic (/start deep-links, /addpost flow, folder delivery)
│   ├── api.js            # Unified itty-router (serves Web App, REST API, & Telegram Webhook)
│   ├── db.js             # Supabase & Firebase REST API database clients
│   └── session.js        # Multi-step session manager (Workers KV + memory fallback)
├── supabase_schema.sql   # SQL schema ready to execute in Supabase SQL editor
├── wrangler.toml         # Cloudflare Worker configuration & Cron triggers
├── package.json          # Project dependencies and scripts
└── .env.example          # Reference for environment variables and secrets
```

---

## 🚀 Quick Setup & Deployment (Termux / Linux)

### 1. Database Setup

#### A. Supabase (Content Database)
1. Go to [Supabase](https://supabase.com) and create a free project.
2. Go to **SQL Editor**, paste the contents of [`supabase_schema.sql`](file:///storage/emulated/0/termux/ai/bot/supabase_schema.sql), and click **Run**.
3. Under **Project Settings ➔ API**, copy your **Project URL** and **`service_role` secret key**.

#### B. Firebase (User Tracking)
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In the sidebar, create a **Realtime Database**.
3. Note your Database URL (e.g. `https://your-app-default-rtdb.firebaseio.com`).
4. In **Project Settings ➔ Service Accounts ➔ Database Secrets**, copy your Secret key.

#### C. Telegram Bot & File Storage Channel
1. Create a bot using [@BotFather](https://t.me/BotFather) and copy your **Bot Token**.
2. Create a **Private Telegram Channel** for storing files.
3. Add your Bot as an **Administrator** in this channel with post message rights.
4. Get your numeric Telegram User ID (`ADMIN_ID`) and Channel ID (`CHANNEL_ID`) from [@userinfobot](https://t.me/userinfobot) or [@JsonDumpBot](https://t.me/JsonDumpBot).

---

### 2. Deploy the Worker (1 Single Command!)

#### Step 1: Install Dependencies in Termux
```bash
npm install --no-bin-links
```

#### Step 2: Set Secrets in Cloudflare
```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put ADMIN_ID
npx wrangler secret put CHANNEL_ID
npx wrangler secret put FIREBASE_URL
npx wrangler secret put FIREBASE_SECRET
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
```

#### Step 3: Deploy
```bash
npx wrangler deploy
```

Once deployed, Wrangler will output your live URL, e.g.:
`https://telegram-bot-hub.<your-subdomain>.workers.dev`

#### Step 4: Register Telegram Webhook
Open in your browser or run:
```bash
curl "https://telegram-bot-hub.<your-subdomain>.workers.dev/set-webhook"
```

---

## 🎮 How Everything Works

### 1. The Web App (`/` and `/app`)
- Open `https://telegram-bot-hub.<your-subdomain>.workers.dev` in your browser or inside Telegram!
- Features:
  - Responsive dark glassmorphic feed.
  - Live Likes & Comments.
  - Folder preview for each post.
  - **"Open in Bot"** button deep-linking directly to that post.

### 2. Admin Flow (`/addpost`)
1. In Telegram, send `/addpost` to the bot.
2. **Step 1:** Enter the post title.
3. **Step 2:** Send preview image URL (or photo), or type `skip`.
4. **Step 3:** Send one or more files, then type a **Folder Name** (e.g. `PDF Books`). Repeat for additional folders.
5. Send `/done` when finished.
6. Choose **🚀 Publish Now**, **📅 Schedule** (with UTC time), or **📝 Save as Draft**.

### 3. User Flow (`/start`)
1. Users send `/start` to open the interactive Mini App with one tap.
2. Clicking **"Open in Bot"** on any post loads the post's folders.
3. Clicking a folder forwards all files in that folder directly from the private channel to the user!
