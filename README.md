# Wedding Website

A Next.js wedding site with RSVP (SQLite on your server) and photo gallery (Cloudflare R2).

## Pages

| Route | Description |
|---|---|
| `/` | Home — countdown, venue details, registry link, photo preview |
| `/rsvp` | RSVP form — saved to SQLite on your server |
| `/gallery` | Photo gallery — loads from Cloudflare R2 |
| `/upload` | Guest photo upload — optional password gate, uploads directly to R2 |

## Architecture

- **Photos**: Cloudflare R2 (10 GB free, zero egress fees)
- **RSVPs**: SQLite file on your server (`wedding.db`) — zero cost, zero config
- **Hosting**: Your own server running Next.js via pm2 + nginx

Guests upload photos directly to R2 via presigned URLs (your server generates the URL but never handles the file bytes — R2 does).

---

## Setup

### 1. Cloudflare R2 bucket

1. Sign in to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**
2. Click **Create bucket** → name it `wedding-photos`
3. Open the bucket → **Settings** → **Public access** → **Allow access** — copy the `r2.dev` URL shown (e.g. `https://pub-abc123.r2.dev`)
4. Go to **R2 Overview** → **Manage R2 API Tokens** → **Create API Token**
   - Permissions: **Object Read & Write** on your bucket
   - Copy the **Access Key ID** and **Secret Access Key**
5. Your **Account ID** is in the top-right of the Cloudflare dashboard

### 2. R2 CORS (required for browser uploads)

In the bucket → **Settings** → **CORS Policy**, paste:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace `https://yourdomain.com` with your actual domain. For local dev, add `"http://localhost:3000"` too.

### 3. Environment variables

```bash
cp .env.local.example .env.local
# Fill in your values
```

| Variable | Where to find it |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare dashboard top-right |
| `R2_ACCESS_KEY_ID` | R2 API Token you created |
| `R2_SECRET_ACCESS_KEY` | R2 API Token you created |
| `R2_BUCKET_NAME` | `wedding-photos` (or whatever you named it) |
| `R2_PUBLIC_URL` | The `r2.dev` URL from public access settings |
| `NEXT_PUBLIC_UPLOAD_PASSWORD` | Any password you choose for guests |

### 4. Customize wedding details

Open `pages/index.js` and edit the constants at the top:

```js
const WEDDING_DATE = new Date('2026-09-05T16:00:00')
const COUPLE_NAME1 = 'Sarah'
const COUPLE_NAME2 = 'James'
// ...
```

Also update the couple name in `components/Nav.js`.

### 5. Run locally

```bash
npm install
npm run dev       # http://localhost:3000
```

### 6. Self-host on your server

```bash
npm install
npm run build
npm start         # runs on port 3000 by default
```

Use **pm2** to keep it alive and restart on reboot:

```bash
npm install -g pm2
pm2 start "npm start" --name wedding
pm2 save && pm2 startup
```

nginx reverse proxy (port 80/443):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### 7. Viewing RSVPs

RSVPs are stored in `wedding.db` (SQLite) in the project root. View them with any SQLite client:

```bash
sqlite3 wedding.db "SELECT * FROM rsvps ORDER BY submitted_at DESC;"
```

Or use a GUI like [DB Browser for SQLite](https://sqlitebrowser.org) or [TablePlus](https://tableplus.com).

To export to CSV:
```bash
sqlite3 -header -csv wedding.db "SELECT * FROM rsvps;" > rsvps.csv
```
