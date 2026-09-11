# Carbon Bridge - Deployment Guide

This guide provides step-by-step instructions for deploying Carbon Bridge across **Supabase** (Database & Auth), **Render** (Backend API), and **Vercel** (Frontend Next.js App).

---

## 1. Supabase Setup (Database & Authentication)

### Step 1: Create a Project
1. Log in to [Supabase](https://supabase.com/).
2. Click **New Project** and choose a name (e.g. `carbon-bridge`).
3. Set a strong database password and select a region closest to your users (e.g., `Mumbai (ap-south-1)`).
4. Wait for database provisioning to finish.

### Step 2: Run Database Schema
1. Go to **SQL Editor** in the left sidebar of your Supabase dashboard.
2. Open the file `supabase/schema.sql` located in this repository.
3. Paste the entire SQL contents into the query box and click **Run**.
4. This will create:
   - All custom ENUM types (`company_type_enum`, `supply_status_enum`, etc.)
   - All core tables (`companies`, `co2_supplies`, `demand_requests`, `matches`, `bids`, `contracts`, `shipments`, `logistics_bids`, `certificates`, `reputation_scores`, `audit_logs`)
   - Initial verified seed records for demo testing.

### Step 3: Configure Authentication
1. Go to **Authentication** > **Providers** > **Email**.
2. Make sure **Email Provider** is enabled.
3. (Optional for development) Toggle **Confirm email** off under **Email Auth** if you want instant test account signups without email verification loops.

### Step 4: Collect Supabase Credentials
Go to **Project Settings** > **API**:
- **Project URL**: `https://<your-project-ref>.supabase.co`
- **Anon Public API Key**: `eyJhbG...` (for frontend)
- **Service Role Secret Key**: `eyJhbG...` (for backend only - keep private!)

---

## 2. Render Deployment (Backend API)

### Step 1: Create a New Web Service
1. Log in to [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository containing `hackout-carbon-bridge`.

### Step 2: Configure Service Settings
- **Name**: `carbon-bridge-backend`
- **Region**: Closest to your Supabase instance (e.g. `Singapore` or `Frankfurt`)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Plan**: `Free`

### Step 3: Set Environment Variables on Render
Under **Environment Variables**, add the following keys:
| Variable Name | Value |
|---|---|
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://<your-project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-secret-key>` |
| `JWT_SECRET` | `<random-secure-32-char-string>` |
| `FRONTEND_URL` | `https://<your-vercel-app>.vercel.app` (or `*` during initial testing) |

### Step 4: Deploy & Verify
1. Click **Create Web Service**.
2. Once the build completes and status shows **Live**, note your backend URL (e.g., `https://carbon-bridge-backend.onrender.com`).
3. Verify by opening `https://carbon-bridge-backend.onrender.com/health` in your browser. You should receive:
   ```json
   { "status": "ok", "service": "Carbon Bridge Backend API" }
   ```

---

## 3. Vercel Deployment (Frontend Next.js)

### Step 1: Import Repository
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Import your `hackout-carbon-bridge` repository.

### Step 2: Configure Project Settings
- **Framework Preset**: `Next.js`
- **Root Directory**: Leave as `./` (repository root)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables
Under **Environment Variables**, add:
| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<your-anon-public-key>` |
| `NEXT_PUBLIC_API_URL` | `https://carbon-bridge-backend.onrender.com` |

### Step 4: Deploy
1. Click **Deploy**.
2. Vercel will build the Next.js frontend, bundle the assets, and deploy to their edge network.
3. Once deployed, open your production URL.
4. Back in Render, update your backend's `FRONTEND_URL` environment variable to match your new production Vercel URL for CORS protection.

---

## 4. Local Development Verification

To run both locally:

### Start Backend:
```bash
cd backend
npm install
npm run dev
# Server listens on http://localhost:4000
```

### Start Frontend:
```bash
# In the root directory
npm install
npm run dev
# App listens on http://localhost:3000
```
