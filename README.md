# AI Symptom Triage App

An MVP mobile app where users describe symptoms in a chat interface and get
back an urgency level (EMERGENCY / SEE_DOCTOR_SOON / SELF_CARE_OK / MONITOR)
plus plain-language guidance -- never a diagnosis.

## Important disclaimer

This is a triage/education tool, not a diagnostic one. Before letting real
users near it: get a licensed physician to review `backend/prompts/systemPrompt.js`
and `backend/services/redFlagCheck.js`, and add a proper privacy policy and
terms of service. See the legal notes at the bottom of this file.

---

## Part 1: Backend setup

The backend is a small Express server that:
1. Checks every message against a hard-coded emergency keyword list first
2. If nothing red-flags, sends the conversation to Groq's API with a
   triage-focused system prompt
3. Returns structured JSON the app can render

### Steps

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and paste in your real Groq API key:

```
GROQ_API_KEY=gsk_your_actual_key_here
```

Then start the server:

```bash
npm start
```

You should see `Symptom triage backend running on port 3000`.

Test it's alive:

```bash
curl http://localhost:3000/health
```

Test the triage endpoint directly:

```bash
curl -X POST http://localhost:3000/api/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "I have had a mild headache for 2 hours", "history": []}'
```

### Find your local IP (needed for the phone to reach your laptop)

- Mac: `ipconfig getifaddr en0`
- Windows: `ipconfig` (look for IPv4 Address)
- Linux: `hostname -I`

You'll need this for the mobile app's `config.js`.

---

## Part 2: Mobile app setup

```bash
cd mobile
npm install
```

Open `config.js` and set `API_BASE_URL` to your computer's local IP from
above, e.g.:

```js
export const API_BASE_URL = "http://192.168.1.42:3000";
```

### Option A: Run in a web browser

Make sure `config.js` has `API_BASE_URL = "http://localhost:3000"` (the
default), then:

```bash
npm run web
```

This opens the app at `http://localhost:8081` (or similar) in your default
browser. No phone or Expo Go needed -- this is the fastest way to iterate
while building.

### Option B: Run on your phone with Expo Go

Open `config.js` and change `API_BASE_URL` to your computer's local
network IP (not localhost -- see the comment in the file for how to find
it), then:

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (same WiFi network
as your laptop). The app should load with the disclaimer screen first.

> If the app can't reach the backend: make sure your phone and laptop are
> on the same WiFi network, your firewall isn't blocking port 3000, and
> you used your local IP (not `localhost`) in config.js.

Both options run the exact same code -- Expo compiles the same React
Native components to web via `react-native-web` under the hood, so you
don't maintain two separate versions of the app.

---

## How the safety layer works

Every message passes through `redFlagCheck.js` BEFORE it ever reaches the
AI. If it matches an emergency pattern (chest pain, stroke symptoms,
suicidal language, etc.), the app immediately shows an emergency message
and never calls the AI at all. This is intentional -- it's faster and more
reliable than trusting the LLM to always catch emergencies correctly.

**Expand this list before launch.** The patterns in the file are a
starting point, not a complete clinical list.

## What to do before any real user touches this

1. Get a licensed physician to review the system prompt and red-flag list
2. Add a privacy policy + terms of service (don't skip this even for a beta)
3. Decide what you're logging/storing and encrypt any stored health data
4. Test against a range of scenarios: benign, ambiguous, and emergency
5. Look into whether your region's health-software regulations apply
   (e.g. FDA Clinical Decision Support rules in the US, MDR in the EU)
6. Deploy the backend somewhere real (Render, Railway, Fly.io all have
   simple free/cheap tiers to start) instead of your laptop

## New features added

- **Renamed to "Your Doctor"** -- shown in the header and the welcome message
- **History** -- every conversation auto-saves to the device (AsyncStorage) as you chat. Tap "History" in the top-right of the chat screen to see past sessions and reopen one.
- **Attach photo / file buttons** (📷 and 📎 next to the text box) -- lets the user attach a photo or document. Important honesty note: the current AI model (Groq's `llama-3.3-70b-versatile`) is **text-only** -- it cannot actually see the image. When something is attached, the app tells the AI it exists so it can ask the user to describe what's in it, rather than pretending to analyze it. If you want real image analysis (e.g. a rash photo), switch to a vision-capable model in `.env` (Groq has some, e.g. `llama-3.2-90b-vision-preview` -- check console.groq.com for current vision models) and update `aiService.js` to send the image data along with the message.
- **Temperature 0** -- the AI now gives the same answer every time for the same input, instead of varying phrasing/reasoning between runs. Good for consistency; the tradeoff is slightly more repetitive wording.
- **Blue watermark background** -- a tiled medical cross (⚕) pattern behind the chat, light blue, low opacity, built with plain React Native views/text (no image files needed, so it renders identically on web and mobile).

After pulling these changes, re-run `npm install` inside `mobile/` to pick up the two new packages (`expo-image-picker`, `expo-document-picker`) before running the app again.

---

## Making it reachable from any phone/laptop (not just your computer)

Right now, both the backend and the app only run on your machine -- that's why `localhost` works. To make this usable from **any device, anywhere**, you need to actually host it somewhere public. This is a different step from writing code -- it's about putting your code on a server.

### Step 1: Deploy the backend

Pick a host with a free/cheap tier -- **Render** is a good beginner option:

1. Push your `backend` folder to a GitHub repository
2. Go to render.com, sign up, click **New → Web Service**, connect your GitHub repo
3. Set the root directory to `backend`
4. Build command: `npm install` — Start command: `npm start`
5. In Render's dashboard, add your environment variables (`GROQ_API_KEY`, `GROQ_MODEL`) under **Environment** -- don't put your real key in GitHub
6. Deploy. You'll get a public URL like `https://your-doctor-backend.onrender.com`

### Step 2: Point the app at the deployed backend

In `mobile/config.js`, change:

```js
export const API_BASE_URL = "https://your-doctor-backend.onrender.com";
```

### Step 3: Deploy the web app itself

```bash
cd mobile
npx expo export --platform web
```

This creates a `dist` folder with a static website. Deploy that folder to:

- **Vercel** or **Netlify** (drag-and-drop the `dist` folder in their dashboard, or connect the GitHub repo), or
- **Render** as a static site, same account as your backend

You'll get a public URL like `https://your-doctor-app.vercel.app` -- open that from **any phone or laptop's browser**, anywhere, no local network or Expo Go needed.

### Optional: make it installable like a real app (PWA)

Once it's deployed as a website, phones can "Add to Home Screen" from the browser menu and it'll behave like an installed app icon, even though it's just a website under the hood.

---

## Next features to consider once the MVP works

- Save conversation history per user (needs auth -- Supabase or Firebase)
- Let users select their country so emergency numbers are localized
- Add a "find nearby urgent care" step using a maps API
- Rate limiting on the backend to control Groq API costs
