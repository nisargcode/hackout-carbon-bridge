# Carbon Bridge

**Carbon Bridge** is a B2B marketplace that turns captured CO₂ into a traceable, discoverable, and tradeable industrial resource. It connects industrial emitters with CO₂ buyers, logistics providers, and regulators in one workflow—from a verified listing through matching, contracting, delivery, and auditability.

## Production

**Live application:** [https://hackout-carbon-bridge.vercel.app/](https://hackout-carbon-bridge.vercel.app/)

## Screenshots

<p align="center">
  <img src="assets/screenshots/Screenshot%20(2158).png" width="800">
  <img src="assets/screenshots/Screenshot%20(2159).png" width="800">
  <img src="assets/screenshots/Screenshot%20(2160).png" width="800">
  <img src="assets/screenshots/Screenshot%20(2161).png" width="800">
  <img src="assets/screenshots/Screenshot%20(2162).png" width="800">
  <img src="assets/screenshots/Screenshot%20(2163).png" width="800">
</p>

## Why Carbon Bridge

Captured carbon is often treated as a cost or waste stream because suppliers, end users, transporters, and oversight bodies operate separately. Carbon Bridge creates a shared marketplace that helps organizations discover compatible supply, make a commercial agreement, arrange compliant transport, and preserve the supporting evidence.

## Product capabilities

- **Role-based experience** for emitters, CO₂ buyers, logistics providers, regulators, and administrators.
- **CO₂ supply listings** with quantity, purity, physical state, capture method, source industry, availability, price, and certification details.
- **Buyer demand requests** with required volume, purity, application, delivery location, deadline, and target price.
- **Intelligent matching** that scores purity, quantity, price, availability, distance, and certification compatibility.
- **Flexible commercial models:** Buy Now, Request Quote, Bid, Negotiate, and Long-Term Contract.
- **Contract and bid management** for marketplace transactions.
- **Logistics job board and carrier bidding**, plus shipment tracking across `MATCHED → BOOKED → PICKED_UP → IN_TRANSIT → DELIVERED → VERIFIED`.
- **Verification and trust layer** for certificates, lab reports, audit records, and company reputation dimensions (reliability, quality, delivery, and documentation).
- **Role-specific dashboards** for marketplace, operational, and regulatory insight.
- **Carbon-tracking and regulator views** for traceability and marketplace oversight.

## User roles

| Role | Main workflow |
| --- | --- |
| Emitter | List captured CO₂, receive bids, manage contracts, verification, and revenue. |
| CO₂ buyer | Create demand requests, browse supply, assess matches, bid, and monitor deliveries. |
| Logistics provider | Review open transport jobs, submit carrier bids, and progress shipments. |
| Regulator | Monitor entities, certificates, transactions, audit records, and compliance data. |
| Administrator | Access oversight capabilities and manage marketplace operations. |

## Architecture

```text
Next.js frontend (Vercel)
        │
        ├── Supabase Auth + PostgreSQL
        │
        └── Express REST API (Render)
                ├── Matching engine
                ├── Pricing engine
                └── Logistics engine
```

The frontend uses Supabase for authentication and profile data. The Express API provides marketplace, matching, pricing, logistics, verification, analytics, and regulator endpoints backed by Supabase PostgreSQL.

## Technology

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand, Recharts
- **Backend:** Node.js, Express, TypeScript, Zod, JSON Web Tokens
- **Database and authentication:** Supabase (PostgreSQL and Supabase Auth)
- **Deployment:** Vercel (frontend) and Render (backend)
- **Code quality:** Biome

## Repository layout

```text
.
├── src/                 # Next.js application, UI, auth, dashboard routes
├── backend/             # Express REST API and marketplace engines
├── supabase/            # PostgreSQL schema, seed data, and RLS helper
├── public/assets/       # Public application assets
├── DEPLOYMENT.md        # Full deployment instructions
└── .env.example         # Frontend environment-variable template
```

## Run locally

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project

### 1. Configure Supabase

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). It creates the database types, tables, relationships, and demo seed data.
3. For hackathon/demo access, run [`supabase/fix-rls.sql`](./supabase/fix-rls.sql). Before a real production launch, replace these permissive settings with least-privilege Row Level Security policies.
4. Enable Email authentication in Supabase Auth. Enable Google as an OAuth provider too if Google sign-in is required.

### 2. Start the API

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, then set:

```dotenv
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=use-a-long-random-secret
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Run the service:

```bash
npm run dev
```

The health endpoint is available at [http://localhost:4000/health](http://localhost:4000/health).

### 3. Start the frontend

From the repository root:

```bash
npm install
```

Copy `.env.example` to `.env.local`, then set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API overview

The backend has a health endpoint at `GET /health` and exposes its REST API under `/api`.

| Area | Base route | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Register and sign in users. |
| Companies | `/api/companies` | Retrieve marketplace companies. |
| CO₂ supply | `/api/co2/supplies` | List, view, and create captured-CO₂ listings. |
| CO₂ requirements | `/api/co2/requirements` | List and create buyer demand requests. |
| Marketplace | `/api/marketplace` | Browse filtered active supply listings. |
| Matching | `/api/matches` | Return scored supply-demand compatibility results. |
| Bids and contracts | `/api/bids`, `/api/contracts` | Create, manage, and review commercial agreements. |
| Logistics | `/api/logistics`, `/api/routes`, `/api/shipments` | View jobs, quote, route, and track shipments. |
| Trust | `/api/certificates`, `/api/verification` | Manage certificates and reputation data. |
| Insights | `/api/analytics`, `/api/carbon-tracking`, `/api/ai`, `/api/regulator` | Provide dashboard metrics, carbon data, recommendations, and regulatory overview. |

Authenticated mutations require a bearer token and enforce the relevant marketplace role where applicable.

## Matching model

The matching engine produces a 100-point compatibility score from six implemented dimensions:

| Dimension | Weight |
| --- | ---: |
| Purity compatibility | 25 |
| Quantity compatibility | 20 |
| Price compatibility | 20 |
| Availability window | 15 |
| Distance and logistics proximity | 10 |
| Certification and traceability | 10 |

Matches scoring at least 60 are marked compatible. The score breakdown is returned with each match so commercial teams can understand the recommendation.

## Deployment

The frontend production deployment is available at [hackout-carbon-bridge.vercel.app](https://hackout-carbon-bridge.vercel.app/). For a full repeatable deployment procedure, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Deployment order:

1. Provision Supabase and execute the schema.
2. Deploy `backend/` to Render with `npm install && npm run build` and `npm run start`.
3. Set the Render service URL as `NEXT_PUBLIC_API_URL` in Vercel.
4. Deploy the repository root to Vercel with `npm run build`.
5. Set Render's `FRONTEND_URL` to the final Vercel URL for CORS.

### Production environment variables

| Service | Required variables |
| --- | --- |
| Vercel / frontend | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
| Render / API | `PORT`, `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `FRONTEND_URL` |

Never commit `.env.local`, `backend/.env`, Supabase keys, or the API service-role key. The service-role key must remain backend-only.

## Quality checks

Run the frontend quality check before shipping changes:

```bash
npm run check
npm run build
```

Validate the API separately:

```bash
cd backend
npm run build
```

## License

This project was created for a hackathon. Add a license before redistributing or using it commercially.
