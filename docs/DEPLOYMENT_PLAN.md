# Daily Pot — deployment plan (VPS)

Status: **draft**. Server layout confirmed (19 Oct 2026): each app lives in
`/var/www/<app>`, its backend runs as a systemd service `<app>.service`
(uvicorn on `127.0.0.1:800x`), and nginx serves `/var/www/<app>/frontend/dist`.
Ports 8000–8004 are taken, so **Daily Pot uses 8005**. Server Python is 3.12.3.
Phase 2 (database) and Phase 3 (backend) are done: code cloned to
`/var/www/dailypot` via a read-only deploy key (`github-dpot` SSH alias),
`dailypot.service` runs as the limited `dailypot` user on 127.0.0.1:8005.
The first admin is made by registering normally, then promoting that user to
`super_admin` in the database.
Phases 1, 4 and 5 are done (19 Oct 2026): DNS points at the VPS, the frontend
is built on the server, and nginx sites `dailypot` + `dailypot-api` (in
sites-available, symlinked) serve https://dailypot.online and
https://api.dailypot.online with Let's Encrypt certificates (expire
2027-01-17, auto-renew). Live checks passed: HTTP→HTTPS redirects, security
headers, docs/.env/.git return 404, CORS allows only dailypot.online.
Remaining: first admin, email (Phase 7), update script, SSL Labs check.

Target layout (same pattern as EEB):

| What | Address | Served by |
|---|---|---|
| Website (React) | https://dailypot.online and www | nginx, static files from the `dist` build |
| API (FastAPI) | https://api.dailypot.online | nginx → backend on a local port |
| Server | 69.62.124.214 (srv1612220) | same VPS as EEB, ROSCA, VIRMP |

Country versions (gh., uk. …) are **not** part of this first launch — see the
note at the end.

---

## Phase 0 — Code changes before going live (on your PC)

These are small edits in this repo. Nothing on the server yet.
✅ Items 1–6 are done on branch `chore/production-readiness` (not yet
committed). New settings are listed in `backend/.env.example`; the allowed
websites setting is called `ALLOWED_ORIGINS`.

1. **Secret key must be required.** `backend/app/core/config.py` falls back to
   `"fallback-secret"` when no `SECRET_KEY` is set. Anyone who knows that can
   forge logins. Change it so the app refuses to start in production without a
   real key.
2. **Allowed websites (CORS) from settings.** `backend/app/main.py` only allows
   `localhost`. Read the allowed list from an env setting so production can
   allow `https://dailypot.online` and `https://www.dailypot.online`.
3. **Hide the API docs in production** (`/docs`, `/redoc`, `/openapi.json`),
   like EEB. Done in the code *and* with the existing nginx snippet.
4. **Re-save `backend/requirements.txt` as normal UTF-8 text.** It's currently
   UTF-16, which `pip` on Linux can't read.
5. **Frontend production setting.** Create `frontend/.env.production` with
   `VITE_API_BASE_URL=https://api.dailypot.online` (same idea as EEB's).
6. Small tidy-up: duplicate import line in `main.py`.
7. Commit, merge `develop` into `main`, push to GitHub. The server deploys
   from `main`.

## Phase 1 — DNS (Hostinger panel)

In Hostinger → dailypot.online → DNS records:

| Type | Name | Points to | TTL | Action |
|---|---|---|---|---|
| A | `@` | `69.62.124.214` | 300 | **Edit** the existing record (it now points to `2.57.91.91`, Hostinger's parking page) |
| CNAME | `www` | `dailypot.online` | 300 | Keep as it is |
| A | `api` | `69.62.124.214` | 300 | **Add** |

Check it worked (from PowerShell on your PC, after ~5–15 minutes):

```powershell
Resolve-DnsName api.dailypot.online -Type A
```

It should show `69.62.124.214`. Don't start Phase 5 (certificates) until both
names show the VPS address.

## Phase 2 — Database (on the server)

Confirmed: Postgres runs directly on the server (one shared cluster). Other
apps follow the `<app>_db` / `<app>_user` naming (eebapp_db, rosca_db, vimp_db…).

1. Create a separate database user and database just for Daily Pot, with its
   own strong password. Never reuse EEB's or ROSCA's.
2. The connection string becomes
   `postgresql://dailypot_user:<password>@localhost:5432/dailypot_db`.

## Phase 3 — Backend (on the server)

1. Get the code onto the server: ⏳ same method as EEB (probably `git clone`
   of `github.com/joaduuk/dpot`, branch `main`) into the same kind of folder
   the other apps use (e.g. `/var/www/dailypot`).
2. Create a Python virtual environment there and `pip install -r requirements.txt`.
3. Create `backend/.env` **on the server** (never copied from your PC, never in git):
   - `DATABASE_URL` — from Phase 2
   - `SECRET_KEY` — a new long random value
   - `ENVIRONMENT=production`
   - `FRONTEND_URL=https://dailypot.online` (used in password-reset emails)
   - allowed origins — `https://dailypot.online,https://www.dailypot.online`
   - SMTP settings — see Phase 7
4. Run `alembic upgrade head` to create the tables.
5. Run the backend as a background service that restarts on its own: ⏳ same
   method as EEB (likely a systemd service running uvicorn/gunicorn) on a
   **free local port** (e.g. 8003; ⏳ checked against ports already in use),
   listening on `127.0.0.1` only, so it's reachable only through nginx.
6. Create the first admin account (script or one-off command).

## Phase 4 — Frontend (build + upload)

1. Build: `npm ci` then `npm run build` (on the server, or on your PC and upload
   the `dist` folder ⏳ whichever EEB uses).
2. Put the `dist` contents where nginx will serve them, e.g.
   `/var/www/dailypot/frontend/dist`.

## Phase 5 — nginx + HTTPS

Two new site files, written in the same style as EEB's:

- `dailypot` — `dailypot.online` + `www.dailypot.online`
  - serves `dist`, with `try_files $uri /index.html` so page links like
    `/pots/123` work after a refresh
  - long caching for js/css/images (same block as EEB)
- `dailypot-api` — `api.dailypot.online`
  - forwards everything to `127.0.0.1:<port>`
  - includes `eeb-api-protect.conf` (blocks docs, `.env`, `.git`)

Both include `eeb-security-headers.conf`. Then:

1. `sudo nginx -t` (checks the config, changes nothing) → `sudo systemctl reload nginx`
2. `sudo certbot --nginx -d dailypot.online -d www.dailypot.online`
3. `sudo certbot --nginx -d api.dailypot.online`
4. `sudo certbot renew --dry-run` to confirm automatic renewal.

## Phase 6 — Checks

- https://dailypot.online loads; refresh on an inner page still works
- https://api.dailypot.online/health returns `{"status":"healthy"}`
- https://api.dailypot.online/docs returns **404** (hidden)
- Register, log in, create a pot, record a payment
- SSL Labs test on both names (aim for A+, like EEB)
- The other apps (EEB, ROSCA, VIRMP) still load

## Phase 7 — Email

Password reset needs real email. Options: create `noreply@dailypot.online` in
Hostinger email (then add the MX/SPF/DKIM records Hostinger gives you) and put
its SMTP details in the server `.env`. Until then, reset links are only
printed in the server log.

## Updating later (each new release)

`git pull` → `pip install -r requirements.txt` → `alembic upgrade head` →
restart the service → rebuild frontend. ⏳ to be written as a short script
matching how EEB is updated.

---

## Note: country versions (Ghana, UK, …)

The code already has `country` on users/agents and `currency` on pots/wallets,
but Ghana (`GH`/`GHS`) is the default and is hardcoded in one place
(`payments.py`, wallet lookup). Before adding `gh.dailypot.online` /
`uk.dailypot.online`, decide the **core vs country-module** design:
one shared system with per-country settings (currency, payment methods,
fee rules, phone formats, compliance), or separate deployments per country
(like EEB's `gh.` / `gh-api.`). That decision changes DNS, databases and
nginx, so it's a separate piece of work. The plan above launches one
instance first; adding country subdomains later is just extra DNS
records, nginx files and certificates.
