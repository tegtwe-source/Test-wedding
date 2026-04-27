# Wedding Website

A Next.js wedding site with RSVP (Firebase Firestore) and photo gallery (Firebase Storage).

## Pages

| Route | Description |
|---|---|
| `/` | Home — countdown, venue details, registry link |
| `/rsvp` | RSVP form — saved to Firestore `rsvps` collection |
| `/gallery` | Photo gallery — loads from Firebase Storage `gallery/` |
| `/upload` | Guest photo upload — optional password gate |

## Setup

### 1. Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**
2. Enable **Firestore** (production or test mode)
3. Enable **Storage** → create a bucket
4. Register a **Web app** and copy the config values

### 2. Firebase Storage rules (paste in Firebase Console → Storage → Rules)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /gallery/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 20 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 3. Firestore rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rsvps/{doc} {
      allow create: if true;
      allow read, update, delete: if false; // only you via the console
    }
  }
}
```

### 4. Environment variables

```bash
cp .env.local.example .env.local
# Fill in your Firebase values
```

### 5. Customize wedding details

Open `pages/index.js` and edit the constants at the top of the file:

```js
const WEDDING_DATE = new Date('2026-09-05T16:00:00')
const COUPLE_NAME1 = 'Sarah'
const COUPLE_NAME2 = 'James'
// ...
```

Also update the couple name in `components/Nav.js`.

### 6. Run locally

```bash
npm install
npm run dev       # http://localhost:3000
```

### 7. Self-host on your server

```bash
npm install
npm run build
npm start         # runs on port 3000 by default
```

Use **nginx** as a reverse proxy or **pm2** to keep the process alive:

```bash
npm install -g pm2
pm2 start "npm start" --name wedding
pm2 save && pm2 startup
```

nginx example (proxy on port 80/443):

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

## Viewing RSVPs

Go to **Firebase Console → Firestore → rsvps** to see all responses. You can also export the collection to CSV from there.
