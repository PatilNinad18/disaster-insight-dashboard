# Alert Feature — Steps from Start (Hackathon)

Your project: **Disaster Early Warning + Damage Estimator (DM-2 + DM-4)**  
This doc gives you **steps from start** to add: **Warning SMS** + **AI Red Team Warning**.

---

## Step 1 — Understand what you’re adding

- **Warning SMS**: Send disaster alerts to phone numbers (officials, citizens).
- **AI Red Team Warning**: Use your existing Red Team analysis (AI vs user decision, conflict level) to **generate and send** the warning message. When Red Team says “High conflict” or “Evacuate”, the system can push that as an SMS.

So the flow is: **Risk/Red Team → Generate warning text → Send as SMS (mock for hackathon).**

---

## Step 2 — Backend / API (mock for hackathon)

1. **Add alert types** in `src/services/api.ts`:
   - `SendAlertRequest`: `{ phoneNumber, message, source?: "manual" | "red_team" }`
   - `AlertRecord`: `{ id, phoneNumber, message, source, timestamp, status }`

2. **Add `sendAlert()`** in `api.ts`:
   - Accept phone + message (+ optional source).
   - Simulate network delay, return success.
   - (Later: replace with real SMS API — Twilio, MSG91, etc.)

3. **Optional**: `getAlertHistory()` to list recent alerts for the Alerts page.

---

## Step 3 — Alerts page (UI)

1. **Create `src/pages/Alerts.tsx`**:
   - **Send SMS form**: phone number input, message textarea (or “Use AI Red Team warning” to prefill from last Red Team result).
   - **Button**: “Send warning SMS”.
   - **List**: Recent alerts (phone, message snippet, time, status).

2. **Wire Red Team into the message**:
   - If `redTeamAnalysis` exists (from store), show “Use AI Red Team warning” to prefill message with: district, disaster type, AI recommendation, conflict level, impact message.

---

## Step 4 — Navigation and routing

1. **Add route** in `App.tsx`: `/alerts` → `<Alerts />`.
2. **Add nav item** in `Layout.tsx`: e.g. “Alerts” with Bell icon linking to `/alerts`.

---

## Step 5 — Red Team → Alert (AI Red Team warning)

1. On **Red Team page**, when analysis is done and **Conflict Level = High** (or AI = Evacuate):
   - Show a clear callout: “AI Red Team recommends immediate action.”
   - Add button: **“Send AI warning via SMS”** that:
     - Opens Alerts page with message prefilled from Red Team, or
     - Opens a small modal to enter phone and send (using same `sendAlert` API).

This ties **AI Red Team warning** directly to **Warning SMS** for the hackathon demo.

---

## Step 6 — Hackathon demo flow

1. **Dashboard**: Select district, set disaster type, run simulation → risk score.
2. **Red Team**: Evaluate decision → get AI recommendation + conflict level.
3. If **High conflict** → click “Send AI warning via SMS” (or go to Alerts).
4. **Alerts**: Enter phone (or use prefilled AI message), send → show “SMS sent” + history.

For judges: *“We predict risk, Red Team validates the decision, and we push AI-backed warnings via SMS.”*

---

## Step 7 — After hackathon (real SMS)

- Replace mock `sendAlert()` with:
  - **Twilio** (global), or
  - **MSG91 / AWS SNS** (India) for real SMS.
- Add env vars for API keys; keep same `SendAlertRequest` / `AlertRecord` interfaces.

---

## Files touched (summary)

| File | Change |
|------|--------|
| `src/services/api.ts` | Add alert types, `sendAlert()`, optional `getAlertHistory()` |
| `src/pages/Alerts.tsx` | **New** — SMS form, AI warning prefill, alert history |
| `src/App.tsx` | Route `/alerts` → Alerts |
| `src/components/Layout.tsx` | Nav item “Alerts” |
| `src/pages/RedTeam.tsx` | “Send AI warning via SMS” when High conflict |

You can implement in the order above; Steps 2 → 3 → 4 give you a working Alerts + SMS flow; Step 5 makes the AI Red Team warning visible in one click.
