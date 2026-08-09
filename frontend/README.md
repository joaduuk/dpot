# DailyPot — frontend

React + Vite + Tailwind frontend for the DailyPot daily-savings API.

## Setup

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies any request to
`/api/*` through to `http://localhost:8000` (your backend) — see the `proxy`
block in `vite.config.js`. Change the `target` there if your backend runs
somewhere else.

For a production build, set `VITE_API_BASE_URL` (copy `.env.example` to
`.env`) to your deployed backend's base URL, then:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  api/            axios client + one file per API resource (auth, pots, payments)
  context/        AuthContext — login/register/logout + token storage
  components/     Navbar, ProtectedRoute, PotBoard (the 31-dot board), Money, StatusPill, Spinner
  pages/          one file per route
```

## Auth flow

- `POST /auth/register` creates the account, then the app immediately calls
  `POST /auth/login` so a new saver lands straight in their dashboard.
- The bearer token from `/auth/login` is stored in `localStorage` and
  attached to every request by an axios interceptor
  (`src/api/client.js`). A 401 response clears the token and redirects to
  `/login`.
- `/auth/token` (the OAuth2 password-flow endpoint used by Swagger's
  "Authorize" button) isn't used by the app — `/auth/login` already returns
  a token plus the full user object, which is what the UI needs.

## Two endpoints to double-check

The Swagger doc shows a generic `"string"` example (rather than a real
schema) for:

- `GET /pots/{pot_id}/board`
- `GET /payments/wallet`

I built `PotBoard` (`src/components/PotBoard.jsx`) and `Wallet`
(`src/pages/Wallet.jsx`) to normalize a couple of likely response shapes,
with a fallback so the UI still renders sensibly either way. Once you can
see the real response from your backend, adjust `normalizeBoard()` in
`PotBoard.jsx` and the field lookups at the top of `Wallet.jsx` — everything
else downstream keeps working unchanged.

`normalizeBoard()` also runs each day's status through `STATUS_ALIASES` so
spelling differences (`"completed"` vs `"paid"`, `"pending"` vs `"unpaid"`,
etc.) still map to the right dot color. If dots still aren't coloring
correctly against your real backend, log the raw `board` response and add
whatever status string it's actually sending to `STATUS_ALIASES`.

## The board's interactions

- Each dot is mapped to a real calendar date via `src/utils/dates.js`
  (day 1 = the pot's `start_date`, day N = `start_date + N-1` days) — shown
  on hover and under each dot.
- When a pot has buffer days, they render as a separate tray of loose gold
  dots below the board. A buffer dot can be **dragged** onto any unpaid day,
  or **tapped** to arm it (it'll pulse) and then tapped again on the target
  day — both call `POST /payments/allocate` with that day number.

## Design notes

Palette and type live in `tailwind.config.js` (`ink`, `paper`, `gold`,
`teal`, `clay`) and are pulled in with a display serif (Fraunces) for
headings, Inter for UI text, and IBM Plex Mono for money/day numbers so
figures line up. The pot board is the one deliberately custom visual piece —
30 saving-day dots in a tapered barrel shape with day 31 (the platform fee
day) sitting apart like a lid.
