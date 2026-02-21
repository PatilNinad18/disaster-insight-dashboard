# SentinelX — Deep Dive: Every Page & How Everything Works

This document explains **each page**, **every UI element**, and **how data flows** through the app.

---

## 1. App structure (routing & auth)

**File:** `src/App.tsx`

- **Providers:** `QueryClientProvider` (React Query), `AppProvider` (global state), `TooltipProvider`, two toasters, then `BrowserRouter`.
- **Public routes (no login):**
  - `/login` → **Login** page
  - `/register` → **Register** page
- **Protected routes (login required):**
  - Wrapped in `<Route element={<ProtectedRoute />}>`. If there is no `user` in the store, **ProtectedRoute** redirects to `/login`.
  - Inside it, **Layout** wraps all main pages. **Layout** renders a sidebar + header and an `<Outlet />` where the current child route is rendered.
- **Child routes under Layout:**
  - `/` (index) → redirects to `/dashboard`
  - `/dashboard` → **Dashboard**
  - `/red-team` → **RedTeam**
  - `/alerts` → **Alerts**
  - `/audit-log` → **AuditLog**
  - `/zone-analysis` → **ZoneAnalysis**
- **NotFound:** Any other path (`*`) → **NotFound** (404).

**AuthGuard** (`src/components/AuthGuard.tsx`): Reads `user` from `useAppStore()`. If `user` is null, returns `<Navigate to="/login" replace />`. Otherwise returns `<Outlet />` so the Layout and its child (Dashboard, Red Team, etc.) render.

---

## 2. Global state (store)

**File:** `src/store/appStore.tsx`

Single React Context + `useReducer` holds:

| State | Purpose |
|-------|--------|
| `user` | Logged-in user: `{ role: 'admin' \| 'user', name, phoneNumber? }` or null. |
| `selectedDistrict` | District name (e.g. "Pune") — set on Dashboard, used on Red Team, Alerts, Zone Analysis. |
| `disasterType` | `"flood" \| "earthquake"` — set on Dashboard. |
| `riskScore` | 0–100, derived on Dashboard from rainfall/magnitude + delay. |
| `lastSimulationResult` | Result of last **simulate()** run: affected population, fatalities, economic loss, time_series. |
| `isLoading` | Shared loading flag. |
| `zones` | Zone list for current district (Zone Analysis). |
| `selectedZone` | Currently selected zone ID. |
| `decisionLogs` | Audit log entries (Audit Log page). |
| `redTeamAnalysis` | Last Red Team result: AI recommendation, conflict level, impact message, etc. |

**Why it matters:** Dashboard sets district, disaster type, risk score, and simulation result. Red Team and Alerts **read** these to show context and to prefill messages. No page stores these in its own state only; they live in the store so the flow is consistent across the app.

---

## 3. Layout (sidebar + header)

**File:** `src/components/Layout.tsx`

- **Sidebar (left):**
  - Logo + "SentinelX"
  - Nav links: Dashboard, Red Team, Alerts, Audit Log, Zone Analysis. Active link is highlighted (orange).
  - Footer text: "Disaster Intelligence Platform", "Version 2.0"
  - On mobile: sidebar can be toggled; backdrop closes it.
- **Header (top):**
  - Menu button (mobile) toggles sidebar.
  - Title = current page name (from the nav item matching the URL).
  - Right side: **user badge** (name + role), **Log out** button, and "Government Disaster Response System" text.
- **Main area:** `<Outlet />` — the current route (Dashboard, Red Team, Alerts, etc.) renders here.

**Log out:** Calls `setUser(null)` and `navigate("/login", { replace: true })`. So the store is cleared and the user is sent to Login.

---

## 4. Login page

**File:** `src/pages/Login.tsx`  
**Path:** `/login`

**What you see:**

- Centered card: SentinelX logo, title "SentinelX", subtitle "Disaster Early Warning & Alerts".
- **Username or phone number** — can be:
  - Username: e.g. `admin`, `user`, or any registered username.
  - Phone number: e.g. `+91 9876500001` (must match a stored user’s phone; last 10 digits are used for matching).
- **Password** — trimmed before sending.
- **Sign in** button. While request is in progress, button shows "Signing in...".
- Links: "Don't have an account? Register", and demo hint "admin / admin · user / user".

**What happens:**

1. Submit → `login(username.trim(), password.trim())` in `src/services/api.ts`.
2. **API:** Loads users from `localStorage` (or initial list). Finds a user where:
   - Password matches, AND
   - Either username (case-insensitive) matches, OR phone number (normalized last 10 digits) matches.
3. If found: API returns `{ role, name, phoneNumber? }`. Login page calls `setUser(user)`, shows toast "Welcome, {name}", then:
   - **Admin** → `navigate("/alerts")`
   - **User** → `navigate("/dashboard")`
4. If not found: toast "Invalid username, phone or password".

So: **Login** is the only place that sets `user` in the store; after that, ProtectedRoute allows access to Dashboard, Red Team, Alerts, etc.

---

## 5. Register page

**File:** `src/pages/Register.tsx`  
**Path:** `/register`

**What you see:**

- **Full name** — required.
- **Username** — required; stored in lowercase; must be unique.
- **Phone number** — optional. If set, you can later log in with this number and see "Alerts sent to your number" on the Alerts page.
- **Register as:** **User** (receive alerts only) or **Admin** (send and broadcast alerts). One of these is selected before submitting.
- **Password** + **Confirm password** — must match; min 4 characters.
- **Register** button. On success, redirect to Login with toast "Account created. Please sign in."

**What happens:**

1. Submit → `register(name, username, password, role, phoneNumber)` in API.
2. **API:** Validates name/username/password; checks username not already taken; if phone given, checks phone not already registered. Then appends a new user to the in-memory `users` array and **saves to `localStorage`** so the account persists after refresh.
3. New users can log in with username (or phone, if they provided one) and password.

---

## 6. Dashboard page

**File:** `src/pages/Dashboard.tsx`  
**Path:** `/dashboard`

This is the **disaster simulation** and **risk** hub. It drives district, disaster type, risk score, and simulation result used elsewhere.

**Top row — summary cards:**

1. **Total Risk Score** — Value from store: `riskScore` (0–100). Badge: Critical / High / Medium / Low by score. Color (red/orange/yellow/green) by level.
2. **Estimated Fatalities** — From `lastSimulationResult.fatalities` (0 until you run a simulation).
3. **Economic Loss** — From `lastSimulationResult.economic_loss`, shown as ₹X M.
4. **Resource Efficiency** — Derived: affected population / (rescue teams + medical units + relief/100), capped at 100%.

**Risk score calculation (in Dashboard):**

- Runs in a `useEffect` when district, disaster type, rainfall/magnitude, or delay change.
- **Flood:** `score = (rainfall / 300) * 100`, capped at 100.
- **Earthquake:** `score = ((magnitude - 3) / 6) * 100`, capped at 100.
- **Delay:** adds up to 5 points per delay hour. Result is stored with `setRiskScore(...)`.

**Control Panel (collapsible):**

- **District** — Dropdown from `DISTRICT_LIST` (Pune, Mumbai, Chennai, etc.). On change → `handleDistrictChange(name)` → `setSelectedDistrict(name)`, `loadDistrict(name)` for lat/lng, map center/zoom updated, simulation result cleared.
- **Disaster type** — Flood or Earthquake. Stored with `setDisasterType`.
- **Rainfall** (flood) or **Magnitude** (earthquake) — Sliders; local state, used in risk score and simulation.
- **Rescue teams, Medical units, Relief camp capacity, Delay hours** — Inputs; local state.
- **Run simulation** button → `handleSimulate()`.

**handleSimulate():**

1. Calls `simulate({ district, disaster_type, rainfall or magnitude, rescue_teams, medical_units, relief_camp_capacity, delay_hours })` in API.
2. **API (mock):** Uses district population; for flood uses rainfall, for earthquake magnitude; applies resource factor and delay; returns `affected_population`, `fatalities`, `economic_loss`, and a small `time_series` (hours 0,2,4,6 with no_resources / with_resources).
3. Dashboard stores result in `lastSimulationResult` and sets a **risk overlay** on the map (lat/lng from current map center, type and intensity from disaster type and severity).

**Map:**

- **MapView** receives `center`, `zoom`, and `riskOverlay`. Shows India (or selected district); after simulation, overlay shows risk at the center. District change loads district lat/lng and zooms to 10.

**Results panel:**

- **ResultsPanel** receives `lastSimulationResult`. If null, shows "Run a simulation to see results". Otherwise shows:
  - Affected population, Fatalities, Economic loss (formatted).
  - A small line chart of `time_series`: "no resources" vs "with resources" over hours.

So: **Dashboard** = choose district & disaster → adjust params → run simulation → see risk score and damage estimates. All of that is stored so **Red Team** and **Alerts** can use the same context.

---

## 7. Red Team page

**File:** `src/pages/RedTeam.tsx`  
**Path:** `/red-team`

This page compares **your decision** (Evacuate / Monitor / Ignore) with an **AI recommendation** and shows conflict level.

**Left card — Decision configuration:**

- **Selected district** — From store (`selectedDistrict`). If empty, "None selected" (and Evaluate is disabled).
- **Disaster type** — From store (`disasterType`).
- **Risk score** — From store (`riskScore`).
- **User decision** — Three buttons: Evacuate, Monitor, Ignore. Local state `userDecision`; default "Monitor".
- **Evaluate Decision** — Calls `evaluateRedTeam({ district, disasterType, userDecision, riskScore })`.

**API `evaluateRedTeam` (mock):**

- Derives AI recommendation from risk: high → Evacuate, medium → Monitor, low → Ignore.
- Generates a random conflict percentage and maps it to Low/Medium/High.
- Returns: `aiRecommendation`, `userDecision`, `conflictPercentage`, `conflictLevel`, `impactMessage`. Stored in `redTeamAnalysis`.

**Right card — Analysis results:**

- If no analysis yet: message to configure and click "Evaluate Decision".
- If there is `redTeamAnalysis`:
  - **AI Recommendation** and **User Decision** badges.
  - **Conflict level** box (color by Low/Medium/High) with percentage and impact message.
  - Short text: agrees/disagrees and optional hint by conflict level.
  - **Only for admin:** If conflict is High or AI is Evacuate, an orange box appears: "AI Red Team recommends immediate action" and a button **"Send AI warning via SMS"** that navigates to `/alerts`. Users (non-admin) do **not** see this button.

So: **Red Team** = same district/risk as Dashboard, you pick a decision, get AI recommendation and conflict; admin can jump to Alerts to send that as an SMS.

---

## 8. Alerts page

**File:** `src/pages/Alerts.tsx`  
**Path:** `/alerts`

Behavior depends on **role**: **admin** sees send UI and history; **user** sees only received/broadcast alerts.

**If logged in as USER:**

- Title: "Alerts sent to you".
- Subtitle: if user has `phoneNumber`, explains alerts to that number + broadcasts; else explains they only see broadcasts.
- **Alerts sent to your number** — Only if `user.phoneNumber` exists. Calls `getAlertsSentToPhone(user.phoneNumber)` and lists those alerts (admin sent to that number). Each item: timestamp + message.
- **Broadcasts to everyone** — Lists `broadcastHistory`: each broadcast has timestamp, recipient count, and message. Data from `getBroadcastHistory()`.

**If logged in as ADMIN:**

- Title: "Alerts & Warning SMS".
- **New alert to broadcast** (orange banner) — Shown when there is Red Team data or (selected district + risk > 50). Suggests using "Use AI Red Team warning" and then sending to all.
- **Send warning SMS card:**
  - **Use AI Red Team warning** — Only if `redTeamAnalysis` exists. Fills the message textarea with a fixed format: district, disaster type, AI recommendation, conflict level, impact message, risk score. Stored in local `message` state.
  - **Message** — Textarea. Can be edited.
  - **Send to all users via SMS** — Calls `sendAlertToAll(message, source)`. **API:** Loops over a fixed list of subscribers (mock), pushes one alert record per subscriber into `alertHistory` and one record into `broadcastHistory`. Returns `{ sent: count }`. Toast shows how many users received it.
  - Divider "Or send to one number".
  - **Phone number** + **Send to this number** — Calls `sendAlert({ phoneNumber, message, source })`. **API:** Appends one record to `alertHistory`. Toast confirms.
- **Users who receive broadcast** — Lists `subscribers` from `getSubscribers()` (mock list of names + phone numbers).
- **Recent alerts sent** — Lists `history` from `getAlertHistory()`: each item shows phone, badge (Broadcast / AI Red Team / Manual), message snippet, timestamp, status.

**Data flow:**

- `sendAlert` / `sendAlertToAll` and `getAlertHistory` / `getBroadcastHistory` / `getAlertsSentToPhone` all use in-memory arrays (and in a real app would call a backend). Alerts sent to a specific number are matched to a user by **phone number** (normalized last 10 digits) so that when a user with that phone logs in, they see "Alerts sent to your number".

---

## 9. Audit Log page

**File:** `src/pages/AuditLog.tsx`  
**Path:** `/audit-log`

Shows a **read-only history of decisions** (mock data). No write from Red Team or Dashboard to this log in the current code; it’s loaded from API.

**On load:** `loadAuditLogs()` → `getAuditLogs()` in API. Returns mock `DecisionLog[]` (timestamp, district, disasterType, userDecision, aiWarning, overrideReason, predictedImpact). Stored in `decisionLogs` in the store.

**Filters card:**

- **Search** — Text filter on district, user decision, and AI warning (case-insensitive).
- **District** — Dropdown: All districts or a specific one from the logs.
- **Disaster type** — Dropdown: All types or flood/earthquake from the logs.
- **Refresh** — Calls `loadAuditLogs()` again.

Filtering is done in a `useEffect`: applies search + district + disaster type to `decisionLogs` and sets `filteredLogs`.

**Summary cards:** Counts of total logs, Evacuate, Monitor, Ignore (from `filteredLogs`).

**Table:** Rows = `filteredLogs`. Columns: Timestamp, District, Disaster Type, User Decision, AI Warning, Override Reason, Predicted Impact. Badges/colors by decision and disaster type.

So: **Audit Log** = view and filter historical decision records; data currently comes only from the mock API.

---

## 10. Zone Analysis page

**File:** `src/pages/ZoneAnalysis.tsx`  
**Path:** `/zone-analysis`

Shows **per-zone risk** for the **currently selected district** in the store.

**If no district selected:** Message: "Please select a district from the main dashboard to view zone analysis." So you must pick a district on Dashboard first.

**When district is selected:**

- **useEffect** runs when `selectedDistrict` or `disasterType` change → `loadZoneAnalysis()`.
- **loadZoneAnalysis()** calls `analyzeZones({ district, disasterType })`. **API (mock):** Returns a list of zones: id, name, riskScore, population, priority, recommendedRescueTeams, coordinates (polygon points). Stored in `zones` in the store. Map center is set from the first zone’s first coordinate.

**Left — Zone map:**

- **MapContainer** (Leaflet) with TileLayer. For each zone, a **Polygon** (color by risk: red/orange/yellow/green) and a **Marker** with **Popup** (zone name). Clicking a zone can set `selectedZone` (if wired) so the right panel can show details.

**Right — Zone list:**

- For each zone: name, risk score (badge by level), population (formatted), priority (colored dot), recommended rescue teams. So you see which sub-areas are highest risk and how many teams are suggested.

So: **Zone Analysis** = district + disaster type from store → load zones from API → map + table of risk and recommended resources per zone.

---

## 11. NotFound page

**File:** `src/pages/NotFound.tsx`  
**Path:** any path that doesn’t match (e.g. `/xyz`)

- Shows "404", "Oops! Page not found", and a link "Return to Home" (href="/"). Logs the path to console for debugging.

---

## 12. How the pages work together (flow)

1. **Login/Register** — Set or create `user` (and optionally phone). Only Login sets `user` in the store.
2. **Dashboard** — Sets `selectedDistrict`, `disasterType`, `riskScore`, `lastSimulationResult` (and map overlay). This is the source of “current scenario.”
3. **Red Team** — Reads district, disaster type, risk; you set a decision and get `redTeamAnalysis`. Admin can go to Alerts to send that as SMS.
4. **Alerts** — Admin: sends to one number or to all (broadcast); user: sees alerts for their phone + broadcasts. All alert data is from API (mock: in-memory + localStorage for users).
5. **Audit Log** — Reads `decisionLogs` from API (mock), filters and displays. Not written by other pages in current code.
6. **Zone Analysis** — Reads `selectedDistrict` and `disasterType`, loads `zones` from API, shows map and list.

**API layer** (`src/services/api.ts`): All of the above (login, register, loadDistrict, simulate, evaluateRedTeam, getAuditLogs, analyzeZones, sendAlert, sendAlertToAll, getAlertHistory, getBroadcastHistory, getAlertsSentToPhone, getSubscribers) are implemented as mock functions with delays. Users are persisted in `localStorage` under `sentinelx_users`; alert and broadcast history are in-memory only. Replacing these with real HTTP calls to a backend would not change how the pages or store work.

---

You now have a full picture of each page and how everything works end to end.
