# pyrite.rocks

Marketing site for Pyrite Consulting LLC. Vite + React, deployed to GitHub Pages.

## Local dev

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # outputs dist/
npm run preview # serves dist/ locally
```

## Deploy

Every push to `main` triggers `.github/workflows/deploy.yml`, which runs `npm run build` and publishes `dist/` to GitHub Pages.

## First-time setup

1. **Create the GitHub repo** (public) and push this directory:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial site"
   git remote add origin git@github.com:taschuk/pyriteship.git
   git push -u origin main
   ```
2. **Enable Pages**: Repo → Settings → Pages → Source: **GitHub Actions**.
3. **Custom domain**: Repo → Settings → Pages → Custom domain → `pyrite.rocks` → Save. Check "Enforce HTTPS" once the cert provisions (can take ~15 min after DNS is live).
   - `public/CNAME` already contains `pyrite.rocks` so it survives rebuilds.

## GoDaddy DNS configuration

In GoDaddy → **My Products → pyrite.rocks → DNS**:

### Apex (`pyrite.rocks`) — four A records

| Type | Name | Value            | TTL      |
|------|------|------------------|----------|
| A    | @    | 185.199.108.153  | 600 sec  |
| A    | @    | 185.199.109.153  | 600 sec  |
| A    | @    | 185.199.110.153  | 600 sec  |
| A    | @    | 185.199.111.153  | 600 sec  |

Delete any GoDaddy-default `A @ → Parked` record first.

### `www` subdomain — one CNAME

| Type  | Name | Value                 | TTL     |
|-------|------|-----------------------|---------|
| CNAME | www  | taschuk.github.io.    | 1 hour  |

(Replace `taschuk` with your actual GitHub username if different.)

### Email (optional, later)

If you want `greg@pyrite.rocks` to actually receive mail, you'll need MX records pointing at a mail provider (Google Workspace, Fastmail, Proton, Zoho, etc.). Until then, the `mailto:` link on the site will open the user's mail client but nothing will deliver. Easiest cheap option: Fastmail or Zoho Mail — both give you MX/SPF/DKIM records to paste into GoDaddy.

## Verification

After DNS propagates (usually 15–60 min for a fresh domain):

```bash
dig pyrite.rocks +short          # should list the four 185.199.x.153 IPs
dig www.pyrite.rocks +short      # should CNAME to taschuk.github.io
curl -I https://pyrite.rocks     # 200 OK once cert is provisioned
```

## Structure

```
.
├── index.html              # Vite entry
├── src/
│   ├── main.jsx
│   ├── App.jsx             # all page content lives here
│   └── styles.css
├── public/
│   ├── CNAME               # custom domain — do not delete
│   └── favicon.svg
└── .github/workflows/deploy.yml
```
