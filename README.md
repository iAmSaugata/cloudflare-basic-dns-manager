# 🌐 Cloudflare DNS Manager

A single-page React app for managing Cloudflare DNS records (A, AAAA, CNAME, TXT, MX, PTR). The UI talks directly to the Cloudflare API, and gate-keeps access with a bcrypt-protected admin password plus signed session cookies.

---

## ✨ Features

- View DNS records with search, filtering, and record-level protections
- Add, edit, and delete records (except Cloudflare-managed read-only entries)
- Proxy toggle support for A / AAAA / CNAME
- Bulk delete with confirmation modals and toast-based error handling
- Dark/light mode toggle with local persistence
- Frontend-only deployment (React + Vite) with cookie-based sessions
- Admin authentication using a bcrypt hash (`AUTH_BCRYPT_HASH`) and HMAC-signed cookies (`SESSION_SECRET`)

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `frontend/` directory (see `frontend/.env.example`). Values are embedded at build time—keep them secret!

| Name | Required | Description |
|------|----------|-------------|
| `CF_API_TOKEN` | ✅ | Cloudflare API token with **Zone:Read** and **DNS:Edit** permissions |
| `AUTH_BCRYPT_HASH` | ✅ | Bcrypt hash of the admin password that unlocks the UI |
| `SESSION_SECRET` | ✅ | Random string used to sign the session cookie |
| `CF_API_BASE` | ❌ | Override the Cloudflare API base URL (defaults to `https://api.cloudflare.com/client/v4`) |

### Generate a bcrypt hash

```bash
# Using npx (installs bcrypt-cli temporarily)
npx bcrypt-cli "your-strong-password"

# or with node + bcryptjs
node -e "console.log(require('bcryptjs').hashSync('your-strong-password', 12))"
```

### Choose a session secret

Use any long random string, e.g. `openssl rand -base64 48` or an equivalent password generator.

---

## 🧑‍💻 Local Development

```bash
cd frontend
cp .env.example .env.local   # edit with your values
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) and log in with the password that matches your bcrypt hash. Sessions persist for 12 hours via signed cookies.

To build static assets:

```bash
npm run build
```

The compiled files live in `frontend/dist/`.

---

## 🐳 Docker

The Docker image serves the static build with [`serve`](https://www.npmjs.com/package/serve). Provide the secrets as build arguments so Vite can embed them during compilation.

```bash
docker build \
  --build-arg CF_API_TOKEN=$CF_API_TOKEN \
  --build-arg AUTH_BCRYPT_HASH=$AUTH_BCRYPT_HASH \
  --build-arg SESSION_SECRET=$SESSION_SECRET \
  -t cf-dns-manager .

docker run -d -p 4173:4173 cf-dns-manager
```

Using Docker Compose:

```yaml
version: "3.9"
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        CF_API_TOKEN: ${CF_API_TOKEN}
        AUTH_BCRYPT_HASH: ${AUTH_BCRYPT_HASH}
        SESSION_SECRET: ${SESSION_SECRET}
        CF_API_BASE: ${CF_API_BASE:-https://api.cloudflare.com/client/v4}
    ports:
      - "4173:4173"
    restart: unless-stopped
```

After building, access the app at [http://localhost:4173](http://localhost:4173).

> ⚠️ **Security note:** Because the Cloudflare token is embedded in the frontend bundle, host this app in trusted environments only.

---

## 🧭 Troubleshooting

- **"Missing configuration" error on the login screen** → Check that all required env vars are present.
- **API errors (403/9103/etc.)** → Verify the Cloudflare token scopes and zone permissions.
- **Session expires quickly** → Ensure your system clock is correct; cookies expire after 12 hours.
- **Build-time failures in Docker** → Confirm the build args are provided and the bcrypt hash contains no unescaped `$` (wrap in single quotes).

---

## 📁 Project Structure

```
.
├── Dockerfile
├── docker-compose.yml
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── auth.js
│   │   │   ├── api.js
│   │   │   ├── DnsManager.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ZoneSelect.jsx
│   │   │   └── Toast.jsx
│   │   └── styles.css
│   └── vite.config.js
└── sync.bat
```

---

## 🖼️ Screenshots

(See the original gallery above for a tour of the UI.)
