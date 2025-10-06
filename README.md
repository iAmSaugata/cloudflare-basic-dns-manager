# 🌐 Cloudflare DNS Manager

A self-hosted web GUI to **view, add, edit, delete** Cloudflare DNS records (A, AAAA, CNAME, TXT, MX, PTR) — all in one container. Includes light/dark mode, error popups, and record protections.

---

## ✨ Features

- List DNS records (A, AAAA, CNAME, TXT, MX, PTR)
- Add / Edit / Delete records (except read-only Cloudflare-managed entries)
- Proxy toggle support (A / AAAA / CNAME)
- Comments on records (tooltip icon)
- Search / filter by type & free-text
- Bulk delete with “Delete Selected”
- Error handling via toast popups
- Dark mode toggle (persistent)
- Clean UI with modals, tooltips, hover effects
- Single container (React + Express), multi-stage Docker build
- Debug logging for all upstream API calls

---

## 📦 Requirements & Setup

### Cloudflare API Token & Zone Permissions

- Go to **My Profile → API Tokens → Create Custom Token**
- Grant **Zone:Read** + **DNS:Edit** permissions
- Restrict to specific zones if needed
- Copy the token (starts with `cf…`)
- Get your **Zone ID** from your domain’s Overview page

<img width="314" height="338" alt="Cloudflare API Setup" src="https://github.com/user-attachments/assets/60d4068f-1c5d-4320-9768-c187b31fb1aa" />


---

## ⚙️ Environment Variables

Create a `.env` file in the project root (or use `.env.example`):

| Name           | Required | Example         | Description |
|----------------|----------|-----------------|-------------|
| `APP_PASSWORD` | ✅       | `s3cr3tPass`     | Password for UI / API access |
| `CF_API_TOKEN` | ✅       | `cfabcd1234…`    | Cloudflare API token |
| `PORT`         | ❌       | `8080` (default) | Server port |

```env
APP_PASSWORD=your_ui_password
CF_API_TOKEN=your_cloudflare_api_token
PORT=8080
```

---

## 🛠️ Build & Run (Docker)

This uses a multi-stage Docker build to bundle backend and frontend.

### 🔧 Using Docker Compose

Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  cf-dns-manager:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cf-dns-manager
    ports:
      - "8080:8080"
    environment:
      - APP_PASSWORD=${APP_PASSWORD}
      - CF_API_TOKEN=${CF_API_TOKEN}
      - PORT=${PORT:-8080}
    env_file:
      - .env
    restart: unless-stopped
```

Then run:

```bash
docker-compose up --build -d
```

### 🐳 Using Docker Only

```bash
docker build -t cf-dns-manager .
docker run -d -p 8080:8080 \
  -e APP_PASSWORD=${APP_PASSWORD} \
  -e CF_API_TOKEN=${CF_API_TOKEN} \
  cf-dns-manager
```

Access the UI at: [http://localhost:8080](http://localhost:8080)

---

## 🧭 Usage & ScreenShots

### 🔐 Login Page  
<div align="center">
  <img width="361" height="323" alt="Login Page" src="https://github.com/user-attachments/assets/45e9c0ef-bc57-4830-991c-92416189464b" />
  <br/>
  <strong>Login screen with password field and submit button.</strong>
</div>

### 🌍 Zone Selection  
<div align="center">
  <img width="544" height="677" alt="Zone Selection" src="https://github.com/user-attachments/assets/51d2ca1e-864d-4284-90fa-d1a64d5b5fb3" />
  <br/>
  <strong>Zone cards showing domain name, plan, and Open button.</strong>
</div>

### 🛠️ DNS Management  

<div align="center">
  <img width="585" height="286" alt="DNS Management" src="https://github.com/user-attachments/assets/93d06056-1fb0-41e5-8b85-b9d8c61472b2" />
  <br/>
  <strong>DNS record table with search, filter, and action buttons.</strong>
</div>

<div align="center">
  <img width="511" height="541" alt="Add Record" src="https://github.com/user-attachments/assets/588a20e3-7670-4d9f-a3c8-069bd1f51e62" />
  <br/>
  <strong>Modal for adding a new DNS record with type, name, and content.</strong>
</div>

<div align="center">
  <img width="468" height="460" alt="Edit Record" src="https://github.com/user-attachments/assets/c10af46d-1450-4f52-a34a-3bd54f4d3bb4" />
  <br/>
  <strong>Edit modal for modifying an existing DNS record.</strong>
</div>

<div align="center">
  <img width="545" height="388" alt="Delete Record" src="https://github.com/user-attachments/assets/ba25df53-739f-4725-ae09-cab2e4bc2ae5" />
  <br/>
  <strong>Confirmation modal for deleting a DNS record.</strong>
</div>

<div align="center">
  <img width="585" height="382" alt="Bulk Delete" src="https://github.com/user-attachments/assets/b3cce708-4dcc-47dc-a0a0-521246a2601b" />
  <br/>
  <strong>Bulk delete toolbar with selectable records and delete button.</strong>
</div>

<div align="center">
  <img width="585" height="274" alt="Dark Mode" src="https://github.com/user-attachments/assets/6b474de1-e8cc-45c0-91cd-aea29fa946e3" />
  <br/>
  <strong>Dark mode theme with persistent toggle in footer.</strong>
</div>

---

## ⚙️ Developer Notes

- Logging: Express logs Cloudflare API calls via morgan + console
- CSS: No Tailwind/Bootstrap; uses CSS variables
- Theme: Toggle switch in footer, saved via localStorage
- Tooltips: Truncation + ellipsis for long fields

---

## 🧪 Troubleshooting

- Blank page / 401 → Check `APP_PASSWORD` in `.env`
- 403 / 9007 errors → Validate record fields (CNAME, TXT)
- Missing zones → Check token scope and zone access
- “Delete Selected” always enabled → Bug in selection logic

---

## 📁 Project Structure

```
.
├── backend/
│   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DnsManager.jsx
│   │   │   ├── ZoneSelect.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Toast.jsx
│   ├── styles.css
│   ├── package.json
│   └── vite.config.js
├── Dockerfile
├── docker-compose.yml
└── .env.example / README.md
```

---

## ⚖️ License & Acknowledgments

Powered by Cloudflare DNS API • © iAmSaugata  
Built with Node.js (Express) + React + Vite + CSS.
