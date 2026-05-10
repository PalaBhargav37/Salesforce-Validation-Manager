# SF Validation Manager 🚀

A React + Node.js web application to manage **Salesforce Account Validation Rules** via the Tooling API and OAuth 2.0.

**Live demo inspiration:** https://sfswitch.herokuapp.com/

---

## 📋 Assignment Checklist

- [x] Salesforce Developer Org signup
- [x] 4–5 Account Validation Rules created
- [x] Connected App (OAuth bridge)
- [x] OAuth 2.0 Web Server Flow
- [x] Login button to connect to Salesforce
- [x] Fetch all validation rules (Tooling API)
- [x] Display rules with Active/Inactive state
- [x] Toggle individual rule on/off
- [x] Activate All / Deactivate All
- [x] Deploy changes to Salesforce org
- [x] React frontend + Express backend

---

## 🗂 Project Structure

```
sf-validation-manager/
├── server.js              # Express backend (OAuth + API proxy)
├── server-package.json    # Backend dependencies
├── .env.example           # Environment variable template
├── package.json           # React frontend dependencies
├── public/
│   └── index.html
└── src/
    ├── App.js
    ├── index.js
    ├── index.css
    ├── hooks/
    │   └── useAuth.js
    ├── utils/
    │   └── api.js
    ├── pages/
    │   ├── LoginPage.js / .css
    │   └── Dashboard.js / .css
    └── components/
        ├── Navbar.js / .css
        ├── StatsBar.js / .css
        └── ValidationRuleCard.js / .css
```

---

## 🏗️ STEP-BY-STEP SETUP GUIDE

---

### STEP 1 — Create Salesforce Developer Org

1. Go to **https://developer.salesforce.com/signup**
2. Fill in: First Name, Last Name, Email, Role = Developer, Company, Country, Username (must be email format e.g. `yourname@devorg.com`)
3. Click **Sign me up**
4. Check your email → click **Verify Account**
5. Set your password and security question
6. You're in your **Developer Org** 🎉

---

### STEP 2 — Create 4–5 Account Validation Rules

1. In your org, click the **gear icon ⚙️** (top right) → **Setup**
2. In Setup search box, type **Object Manager** → click it
3. Click **Account** in the list
4. Click **Validation Rules** in the left sidebar
5. Click **New** and create these rules one by one:

---

**Rule 1: Phone_Required_for_Industry**
- Rule Name: `Phone_Required_for_Industry`
- Active: ✅ checked
- Error Condition Formula:
  ```
  AND(
    ISPICKVAL(Industry, 'Technology'),
    ISBLANK(Phone)
  )
  ```
- Error Message: `Phone number is required for Technology industry accounts.`
- Error Location: `Field` → Select `Phone`

---

**Rule 2: Website_Format_Validation**
- Rule Name: `Website_Format_Validation`
- Active: ✅ checked
- Error Condition Formula:
  ```
  AND(
    NOT(ISBLANK(Website)),
    NOT(
      OR(
        LEFT(Website, 7) = 'http://',
        LEFT(Website, 8) = 'https://'
      )
    )
  )
  ```
- Error Message: `Website must begin with http:// or https://`
- Error Location: `Field` → `Website`

---

**Rule 3: Annual_Revenue_Positive**
- Rule Name: `Annual_Revenue_Positive`
- Active: ✅ checked
- Error Condition Formula:
  ```
  AND(
    NOT(ISBLANK(AnnualRevenue)),
    AnnualRevenue < 0
  )
  ```
- Error Message: `Annual Revenue must be a positive number.`
- Error Location: `Field` → `Annual Revenue`

---

**Rule 4: Billing_State_Required**
- Rule Name: `Billing_State_Required`
- Active: ✅ checked
- Error Condition Formula:
  ```
  AND(
    NOT(ISBLANK(BillingCountry)),
    ISBLANK(BillingState)
  )
  ```
- Error Message: `Billing State is required when Billing Country is provided.`
- Error Location: `Field` → `Billing State/Province`

---

**Rule 5: Employee_Count_Validation**
- Rule Name: `Employee_Count_Validation`
- Active: ✅ checked
- Error Condition Formula:
  ```
  AND(
    NOT(ISBLANK(NumberOfEmployees)),
    NumberOfEmployees <= 0
  )
  ```
- Error Message: `Number of Employees must be greater than zero.`
- Error Location: `Field` → `Employees`

---

### STEP 3 — Create a Connected App (OAuth Bridge)

1. In Setup, search **App Manager** → click it
2. Click **New Connected App** (top right)
3. Fill in:
   - **Connected App Name:** `SF Validation Manager`
   - **API Name:** `SF_Validation_Manager` (auto-fills)
   - **Contact Email:** your email
4. Under **API (Enable OAuth Settings)**:
   - ✅ Check **Enable OAuth Settings**
   - **Callback URL:** `http://localhost:5000/auth/callback`
   - **Selected OAuth Scopes:** Add:
     - `Access and manage your data (api)`
     - `Perform requests on your behalf at any time (refresh_token, offline_access)`
   - ✅ Check **Require Secret for Web Server Flow**
5. Click **Save** → Click **Continue**
6. Wait ~2-10 minutes for the app to activate

**Get your credentials:**
1. Go back to **App Manager** → find `SF Validation Manager` → click dropdown → **View**
2. Click **Manage Consumer Details** (verify your identity if prompted)
3. Copy:
   - **Consumer Key** → this is your `SF_CLIENT_ID`
   - **Consumer Secret** → this is your `SF_CLIENT_SECRET`

---

### STEP 4 — Project Setup

#### Clone / Download the project
```bash
git clone <your-repo-url>
cd sf-validation-manager
```

#### Backend setup
```bash
# Copy server dependencies to a separate folder (or use root)
cp server-package.json package-server.json

# Install backend dependencies in root
npm install express axios cors express-session dotenv
```

#### Frontend setup
```bash
npm install   # installs React dependencies from package.json
```

#### Create `.env` file
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
SF_CLIENT_ID=3MVG9...your_consumer_key_here
SF_CLIENT_SECRET=ABC123...your_consumer_secret_here
SF_REDIRECT_URI=http://localhost:5000/auth/callback
SF_LOGIN_URL=https://login.salesforce.com
SESSION_SECRET=my-super-secret-random-string-123
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

---

### STEP 5 — Run Locally

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
node server.js
# → Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm start
# → React app on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

### STEP 6 — Test the App

1. Click **"Log In with Salesforce"**
2. You'll be redirected to Salesforce login
3. Enter your Developer Org credentials
4. Click **Allow** to grant access
5. You'll be redirected back to the dashboard
6. Click **"⚡ Fetch Validation Rules"**
7. Your 5 Account validation rules appear with Active/Inactive badges
8. Toggle individual rules using the **Activate / Deactivate** buttons
9. Use **Activate All** or **Deactivate All** for bulk operations
10. Click **"🚀 Deploy to Org"** to save all changes to Salesforce

---

## 🌐 Deployment to Render.com (Free)

### Option A: Deploy to Render

1. Push code to GitHub
2. Go to **https://render.com** → New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server.js`
5. Add **Environment Variables** (same as `.env` but update):
   - `SF_REDIRECT_URI` = `https://your-app.onrender.com/auth/callback`
   - `FRONTEND_URL` = `https://your-app.onrender.com`
   - `NODE_ENV` = `production`
6. Deploy!
7. **Update Salesforce Connected App** → Add the new callback URL

### Option B: Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option C: Deploy to Heroku

```bash
heroku create your-app-name
heroku config:set SF_CLIENT_ID=... SF_CLIENT_SECRET=... (all env vars)
git push heroku main
```

---

## 🔐 OAuth 2.0 Flow Explained

```
User clicks Login
      ↓
Browser → GET /auth/login (backend)
      ↓
Redirect to Salesforce: /oauth2/authorize?response_type=code&client_id=...
      ↓
User logs into Salesforce + grants permission
      ↓
Salesforce → GET /auth/callback?code=ABC123 (backend)
      ↓
Backend POST /oauth2/token { code, client_id, client_secret, redirect_uri }
      ↓
Salesforce returns { access_token, refresh_token, instance_url }
      ↓
Backend stores tokens in server session
      ↓
Frontend redirects to /dashboard ✅
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/login` | Initiate OAuth flow |
| GET | `/auth/callback` | OAuth callback handler |
| POST | `/auth/logout` | Clear session |
| GET | `/api/me` | Get current user info |
| GET | `/api/validation-rules` | Fetch all Account validation rules |
| PATCH | `/api/validation-rules/:id` | Toggle single rule active state |
| PATCH | `/api/validation-rules` | Bulk toggle rules |
| POST | `/api/deploy` | Deploy pending changes to org |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, react-hot-toast |
| Backend | Node.js, Express 4 |
| Auth | OAuth 2.0 Web Server Flow |
| Salesforce API | Tooling API v59.0 |
| Session | express-session |
| HTTP Client | axios |
| Styling | Custom CSS with CSS Variables |

---

## 📝 Notes

- **Tooling API** is used (not Metadata API) for reading validation rules, as it's simpler for querying/updating individual records
- Changes are **optimistically updated** in the UI and tracked as "pending" until you click Deploy
- The app uses **server-side sessions** so tokens never reach the browser
- For production, use a proper session store (Redis, MongoDB) instead of in-memory sessions

---

## 📧 Submission

Send to: **careers@cloudvandana.com**
Include: GitHub repo link + deployed app URL + updated resume
#   S a l e s f o r c e - V a l i d a t i o n - M a n a g e r  
 