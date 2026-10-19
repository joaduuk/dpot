# Daily Pot — country versions design (shared core + country modules)

Status: **design only, nothing implemented yet.**
Scope: how Daily Pot should support Ghana first, then the UK and other
countries, without copying the whole app for each one.

---

## 1. The short answer

**Recommendation: approach (a) — one app, one deployment, one database, with
a "country profile" for each country.**

- There is **one copy of the code**, running once on the server, with **one
  database**. Every user, agent and pot already carries a country (`GH`) and a
  currency (`GHS`).
- Everything that differs between countries (currency, payment methods, fees,
  phone format, agent rules, legal text, language, time zone) lives in **one
  small file per country**, e.g. `backend/app/countries/gh.py`.
- The app decides which rules apply by looking at **the user's country stored
  on their account** — not at the web address.
- `gh.dailypot.online` / `uk.dailypot.online` can still exist later, but only
  as **friendly entry points** that pre-select the country on the sign-up page.
  They point at the same website and the same API.
- We keep a **way out**: because the code is country-neutral, if a regulator or
  partner ever *requires* UK data to live separately, the very same code can be
  started a second time with only `UK` switched on and its own database. You
  don't have to decide that now.

The launch in `docs/DEPLOYMENT_PLAN.md` stays almost exactly as written (see
section 8).

---

## 2. What the code looks like today

Good news first — the foundations are already there:

| Where | What's there |
|---|---|
| `users.country`, `agents.country` | default `"GH"` |
| `pots.currency`, `wallets.currency` | default `"GHS"` |
| `users.language` | default `"en"` (not used yet) |
| Register page | already has a Country field |

But Ghana is baked in, in a dozen small places. These are what the country
profile will replace:

**Backend**

| File | Hardcoded thing |
|---|---|
| [payments.py:356](../backend/app/routers/payments.py) | wallet lookup uses `"GHS"` instead of the user's currency |
| [pots.py:284](../backend/app/routers/pots.py) | platform fee = 1 × daily amount |
| [pots.py:291](../backend/app/routers/pots.py) | agent gets 50% of the fee |
| [pots.py](../backend/app/routers/pots.py), [payments.py](../backend/app/routers/payments.py) | `date.today()` / `utcnow()` — fine in Ghana (UTC all year), wrong in the UK in summer (BST) |
| `schemas/user.py`, `schemas/agent.py`, `schemas/admin.py`, `schemas/pot.py` | defaults `"GH"` / `"GHS"`, any country/currency string is accepted |
| `models/agent.py` | `mobile_money_provider` comment "MTN, Vodafone, AirtelTigo" |
| `models/user.py` | `phone` stored exactly as typed (`"024 123 4567"`), so `0241234567` and `+233241234567` count as different people |

**Frontend**

| File | Hardcoded thing |
|---|---|
| `pages/AgentApply.jsx:7`, `pages/AdminRegisterAgent.jsx:8` | `['MTN', 'Vodafone', 'AirtelTigo']` |
| `pages/Register.jsx:23`, `AgentApply.jsx`, `AdminRegisterAgent.jsx` | `country: 'GH'` |
| `pages/CreatePot.jsx:14` | `currency: 'GHS'`, and the saver can **type any currency** |
| Several pages | phone placeholder `"024 123 4567"`, "Makola Market", "Accra" |
| `components/Money.jsx:2` | number format fixed to `en-US`, shows `GHS 5.00` rather than `GH₵5.00` / `£5.00` |

None of this is hard to fix — it just needs one place to read the answers from.

---

## 3. The two approaches compared

### (a) One deployment, one database, per-country config — **recommended**

How it works: one backend service, one website build, one Postgres database.
A user's `country` decides which rules apply to them.

| Pros | Cons |
|---|---|
| One thing to deploy, update, back up and monitor — matters a lot for a solo developer | A bug can affect all countries at once |
| A bug fix or feature reaches every country the moment you deploy | All countries' data in one database (fine legally in most cases, but check — see section 9) |
| Adding a country = one new file + a few lines of text, not a new server setup | Must be careful that agents/admins only see their own country (simple filter, but must not be forgotten) |
| Super-admin reports across countries are a simple query | |
| Database migrations run once, not once per country | |

### (b) Separate deployment per country (like EEB's `gh.eebapp.com`)

How it works: `gh.dailypot.online` + `gh-api.dailypot.online` with their own
backend service, own database, own `.env`; `uk.` + `uk-api.` the same again.

| Pros | Cons |
|---|---|
| Strong separation: a UK problem can't touch Ghana | **Every** update has to be done N times: `git pull`, `pip install`, `alembic upgrade`, restart, rebuild frontend |
| Each country's data in its own database — easy answer if a regulator asks | N databases to back up, N services, N ports, 2×N nginx files, 2×N certificates |
| Can run different versions per country | Versions drift apart ("UK is still on last month's code") |
| | Cross-country reporting needs N database connections |
| | **It still needs the country profile work** — the code must still stop hardcoding GHS, or you end up with N forks of the code, which is the worst case |

### Why (a)

The deciding point: approach (b) **does not remove** the need for country
modules — the UK deployment still needs pounds, UK phone numbers and different
payment methods. So the country-profile work has to happen either way. Once
it exists, running it once (a) is far less work than running it N times (b).

EEB uses (b), and that's fine for EEB, but for Daily Pot there's no current
reason to pay that cost. If one appears later (a regulator or banking partner
demanding a separate UK system), the code from approach (a) can be deployed in
the (b) style **without rewriting anything** — just a second copy with
`ENABLED_COUNTRIES=UK` and its own database.

---

## 4. Where country-specific code and config live

### Rule of thumb

- **Core** = what Daily Pot *is*, the same everywhere: pots, the 30 saving days
  + day 31 fee day, the dot board, payments filling days, wallets, agents
  recording cash, payouts, logins.
- **Country profile** = the *settings and small differences* around the core:
  money, phones, payment methods, fees, rules, words.

### Backend layout

```
backend/app/
  core/                 (unchanged: config, database, security …)
  countries/
    __init__.py         get_country("GH") → the GH profile; list of enabled countries
    base.py             what a country profile contains (the "shape")
    gh.py               Ghana's values
    uk.py               UK's values (added later, switched off until ready)
  routers/ models/ schemas/   (core code; asks countries/ instead of hardcoding)
```

A country profile holds (Ghana values shown; they match today's behaviour
exactly, so step 1 changes nothing for users):

| Setting | Ghana (`gh.py`) | UK (`uk.py`, later — examples only) |
|---|---|---|
| code / name | `GH`, Ghana | `GB`*, United Kingdom |
| currency, symbol | `GHS`, `GH₵` | `GBP`, `£` |
| number format locale | `en-GH` | `en-GB` |
| time zone | `Africa/Accra` | `Europe/London` |
| phone country code, example | `+233`, `024 123 4567` | `+44`, `07700 900123` |
| payment methods allowed | cash, mobile money, bank transfer | bank transfer / card (cash agents: to be decided) |
| mobile money providers | MTN, Telecel (ex-Vodafone), AirtelTigo | none |
| min / max daily amount | e.g. 1 – 1,000 | to decide |
| platform fee | 1 day's amount per cycle | to decide |
| agent share of fee | 50% | to decide (maybe no agents) |
| agent cash hand-in deadline | e.g. 20:00 same day | n/a |
| languages | `en` (later maybe `tw`) | `en` |
| legal pages | Ghana terms, privacy | UK terms, privacy |
| sign-up open? | yes | no, until launch |

\* Use the ISO code `GB` for the UK in the data (that's what phone and
currency libraries expect); `uk.` is fine as the web address.

**Why in code files and not in the database?** For now, keeping these values
in code means every change is in git, reviewed, and tested — fees are money,
so you want that. An admin screen to edit them can come later if ever needed.

**Behaviour, not just values.** Where a country needs different *behaviour*
(e.g. how payouts are actually sent — Ghana mobile money vs UK bank payout),
the profile names a small "provider" piece of code, e.g.
`backend/app/payments_providers/` with one file per provider. Today there are
no automatic payment integrations (agents record cash by hand), so this is
just a reserved spot for later.

### Which country applies to a request?

The backend **always uses the country stored on the logged-in user**
(`current_user.country`). It never trusts a country sent by the browser, so a
saver can't switch to a cheaper fee by editing a request. The one exception is
**registration**, where the user picks a country — the backend checks it's in
the enabled list, then it's locked on the account.

Agents may only serve savers of their own country; admins see only their own
country; `super_admin` sees all.

### Frontend layout

```
frontend/src/
  context/CountryContext.jsx    which country we're in + its settings
  countries/
    gh/  terms.md, privacy.md, home-text.js
    uk/  …later
```

The frontend **gets the settings from the API** — a new public endpoint
`GET /countries/GH` returns currency, symbol, locale, phone example, payment
methods and providers. That way fees and lists exist in one place only (the
backend) and the website can never disagree with it. Long legal and marketing
text lives in the frontend `countries/<code>/` folders.

Then the hardcoded bits change, for example:

- `PROVIDERS = ['MTN', …]` → `country.mobileMoneyProviders`
- `currency: 'GHS'` in Create Pot → shown read-only from the saver's country
- `placeholder="024 123 4567"` → `country.phoneExample`
- `Money` → formats with `country.locale` and the right symbol

---

## 5. How the frontend picks the country

**Recommended: the user's account first, the web address only as a hint.**

In order:

1. **Logged in?** Use `user.country` from the account. Always wins.
2. **Not logged in, on `gh.dailypot.online` / `uk.dailypot.online`?** Use that
   country (pre-selects the Register page, shows the right home-page text).
3. **Not logged in, on plain `dailypot.online`?** Use the country the visitor
   last chose (remembered in the browser), otherwise the default (`GH`). Once a
   second country is live, show a small country picker on the home page.

Why not subdomain only (like EEB)? Because people share links, bookmark the
wrong one, or move. If a Ghanaian saver opens `uk.dailypot.online` and logs in,
they should still see cedis, their pots, their rules. Tying rules to the
account makes that automatic.

Login with a phone number: if a person types `024 123 4567` with no `+233`,
the backend reads it using the country from step 2/3 (the site sends it as a
hint for this one purpose only). Typing the full `+233…` / `+44…` always works.

---

## 6. Database changes

All done with normal Alembic migrations; existing data is filled in as Ghana.

1. **Phone numbers stored in one standard form** (international "E.164",
   e.g. `+233241234567`). Use the `phonenumbers` Python library to read
   whatever people type and store it standardised. A migration converts
   existing Ghana numbers. This also makes `phone` truly unique across
   countries. *Best done before launch*, while there are few real users.
2. **`pots.country`** (new, filled with `GH`). Copied from the saver when the
   pot is created, so reports and agent filtering don't need extra joins.
3. **Fee rules frozen onto each pot**: `pots.fee_days` (1) and
   `pots.agent_fee_share` (0.5), filled for existing pots. If you change
   Ghana's fees next year, pots already running keep the deal they signed up
   for. Payout calculation reads these instead of the hardcoded numbers.
4. **Pot currency set by the server** from the saver's country, not typed by
   the saver (no column change; the API just stops accepting a free-typed
   currency).
5. **Wallet currency** = the user's country currency (fixes
   `payments.py:356`). One wallet per user stays as is; a user's country is
   locked once they have a pot, so their wallet never needs two currencies.
6. **Indexes on `users.country`, `agents.country`, `pots.country`** so
   per-country admin lists stay fast.
7. **No `countries` table needed** — the list lives in code
   (`backend/app/countries/`), and which ones are switched on comes from a
   setting: `ENABLED_COUNTRIES=GH`, `DEFAULT_COUNTRY=GH`.

Not part of this design, but worth knowing: money columns are `Float`.
Before real money flows at scale (and especially before adding a second
currency), they should become `Numeric` (exact decimals) — floats can be off
by a fraction of a pesewa/penny. That's a separate piece of work.

---

## 7. Effect on nginx and DNS

### With the recommended approach (a)

**At launch: no change** to the plan — `dailypot.online`, `www` and `api`.

**When adding country addresses later (optional):**

| Step | What |
|---|---|
| DNS (Hostinger) | add `gh` and `uk` as `CNAME` → `dailypot.online` (or `A` → `69.62.124.214`) |
| nginx | add `gh.dailypot.online uk.dailypot.online` to the `server_name` line of the **existing** `dailypot` site file — no new file |
| HTTPS | `sudo certbot --nginx -d dailypot.online -d www.dailypot.online -d gh.dailypot.online -d uk.dailypot.online` (expands the existing certificate) |
| backend `.env` | add the new addresses to the allowed websites (CORS) list |
| API | **stays `api.dailypot.online` for every country** — no `gh-api` / `uk-api` |
| database, service, port | **no new ones** |

So a new country is: a code file, a few legal pages, two DNS records (only if
you want the subdomain), one line in nginx, and a certificate expand.

### For comparison, approach (b) per new country

2 DNS records, 2 nginx files, 2 certificates, a new database + user, a new
systemd service on a new port, a new `.env`, a separate frontend build with its
own `VITE_API_BASE_URL`, and the update script run once per country.

---

## 8. Changes to `docs/DEPLOYMENT_PLAN.md`

(Suggested — that file isn't edited by this design.)

1. **Phase 0, add:** fix the `"GHS"` in `payments.py:356` and do the phone
   number standardising (section 6, item 1) *before* launch — converting real
   users' data later is riskier than doing it now with test data.
   Everything else in section 10 can safely come after launch.
2. **Phase 3 `.env` list, add:** `ENABLED_COUNTRIES=GH` and
   `DEFAULT_COUNTRY=GH` (once step 1 of section 10 exists).
3. **The closing "Note: country versions" section:** replace with "Decided:
   one deployment with country profiles — see
   `docs/COUNTRY_MODULES_DESIGN.md`. Country subdomains, if wanted, are
   aliases of the main site (section 7)."
4. Nothing else changes: same DNS records, same two nginx files, same single
   database and service.

---

## 9. Things to check outside the code (not legal advice)

- **UK:** collecting and holding people's savings, and having agents handle
  cash, is very likely regulated by the FCA (e.g. payment services / e-money,
  possibly more). Most small apps do this by **partnering with an already
  regulated firm** that holds the money. Find out before building UK features —
  the answer may change the UK payment methods (probably no cash agents) and
  could be the one thing that makes a separate UK deployment (the "way out" in
  section 1) necessary.
- **Ghana:** the Bank of Ghana has rules for susu-style collection and mobile
  money; worth confirming Daily Pot's set-up fits them.
- **Data protection:** Ghana's Data Protection Act and UK GDPR both apply to
  their users. One database on one VPS is normally acceptable, but each
  country's privacy page must say where data is stored.

---

## 10. First implementation steps

In order; each is a small, separately testable change. Steps 1–4 are backend
only and change nothing users can see in Ghana.

1. **Create `backend/app/countries/`** with the profile shape and `gh.py`
   holding today's exact Ghana values. Add `ENABLED_COUNTRIES` and
   `DEFAULT_COUNTRY` to `core/config.py`.
2. **Replace the backend hardcoding** with lookups in the profile:
   `payments.py:356` (wallet currency), `pots.py:284` and `:291` (fee and
   agent share), `"GH"`/`"GHS"` defaults in the schemas (validate against
   enabled countries), pot currency set by the server from the saver's country.
3. **Standardise phone numbers**: add `phonenumbers` to `requirements.txt`,
   standardise on register, login, admin and agent lookups; migration to
   convert existing numbers.
4. **Migration for pots**: `country`, `fee_days`, `agent_fee_share` (filled
   from existing data), plus the country indexes. Payout reads the pot's own
   fee values.
5. **Public `GET /countries` and `GET /countries/{code}`** endpoints.
6. **Frontend `CountryContext`** (account → subdomain → remembered choice →
   default) and replace the hardcoded lists, placeholders, `'GH'`/`'GHS'` and
   the `Money` format.
7. **Country-local "today"**: one helper `today_in(country)` used wherever pot
   days and deadlines use `date.today()` / `utcnow()` now.
8. **Per-country filtering for agents and admins** (agents see only savers in
   their country; admins only their country; super-admin all).
9. **Tests** proving Ghana fees, commission and payouts are unchanged.

Later, when the UK is actually on the way: `uk.py` (switched off), UK legal
pages, the payment-provider spot from section 4, translations using
`users.language`, and the DNS/nginx aliases from section 7.
