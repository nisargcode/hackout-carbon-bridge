If this is first time of your reading this file edit this file(don't remove things) to help agents code this folder and build complete to-do list for all the features and stuff.
Problem statement for the hackathon is given in 'problem_statement.txt'.
For frontend strictly follow theme from theme-template folder this is just template not actual features, strictly follow all the color pallette , tooling and tech-stack and look and all for frontend from the theme template only.
Features needed in this project are given in 'raw-data.txt' file.
We are using vercel for frontend deployment, render for backend deployment and supabase for authentication and database (mysql), so build accordingly and after the build give me steps for those deployment.
For landing page:(groww)
It will give login/signup options in top-right corner,
Hero section: Large bold headline - "CO2 marketplace", short supporting text -"A marketplace that turns captured CO₂ into a
traceable, discoverable and tradeable industrial resource." , prominent rounded CTA -"Get started" that leads to login/signup popup, with a large clean visual/graphic on the opposite side, graphic is given in assets folder named 'graphic.png'.
Don't use dark mode in landing page give the dark mode switch only on other pages same as the theme from theme-template.
follow everything as theme-template.
Follow the dashboard theme elsewhere.
Navigation side bar(from theme-template):
use your ideas for the elements in nav bar - different for both buyers and sellers and all.

I have just given starting point go on and build the whole project with backend and all stuff.

---

## ⚠️ CRITICAL FRONTEND THEME COMPLIANCE (Added by Agent - 2026-09-12)

**Every agent working on the frontend MUST follow these rules without exception:**

1. **Copy all 61 UI components** from `theme-template/src/components/ui/` verbatim into project's `src/components/ui/`.
2. **Use exact CSS variable names and `oklch()` color values** from `theme-template/src/app/globals.css` — do NOT substitute hex/hsl.
3. **Root layout** (`layout.tsx`) must include all `data-*` HTML attributes: `data-theme-mode`, `data-theme-preset`, `data-content-layout`, `data-navbar-style`, `data-sidebar-variant`, `data-sidebar-collapsible`, `data-font`.
4. **Dashboard layout** uses `SidebarProvider` (width: `calc(var(--spacing) * 68)`), `AppSidebar`, `SidebarInset`, header with `h-12 border-b`.
5. **Preferences system**: Copy `src/lib/preferences/`, `src/stores/preferences/`, and `src/scripts/theme-boot.ts` verbatim.
6. **Sidebar structure**: `SidebarHeader` (logo) + `SidebarContent` (NavMain) + `SidebarFooter` (SupportCard + NavUser).
7. **Role-specific sidebar items** using the same `NavGroup[]` TypeScript types from `navigation/sidebar/sidebar-items.ts`.
8. **Landing page**: Standalone layout, NO dashboard layout, NO dark mode toggle, always light.
9. **Font**: Default is Geist via `var(--font-geist)`. Font switching via `html[data-font="..."]` attribute.
10. **Spacing**: Sidebar 272px, header 48px, page padding `p-4`/`p-6`. All Tailwind scale — no custom pixel values.
11. **ThemeSwitcher** cycles `light → dark → system` using `Button size="icon"` with `Moon/Sun/Monitor` from lucide-react.
12. **Linting**: Use Biome (not ESLint). Run `biome check` before committing.

## Project To-Do List

### Phase 1: Setup
- [ ] Copy theme-template files into main project (components, styles, lib, stores, scripts, config)
- [ ] Setup Supabase project + run SQL schema migrations
- [ ] Setup backend folder (`backend/`) with Node.js + Express + TypeScript

### Phase 2: Auth & Landing
- [ ] Supabase Auth integration (email signup/login)
- [ ] Role assignment on registration (EMITTER, CO2_BUYER, LOGISTICS_PROVIDER, REGULATOR, ADMIN)
- [ ] Landing page (light-mode only, hero section, Login/Signup dialog)

### Phase 3: Dashboard Shell
- [ ] Dashboard layout (sidebar + header + content)
- [ ] Role-based sidebar navigation (Emitter, Buyer, Logistics, Regulator nav items)
- [ ] Dark mode toggle (ThemeSwitcher) in header

### Phase 4: Emitter (Seller) Module
- [ ] Emitter dashboard (metrics: Captured, Sold, Revenue, Unused, Buyers)
- [ ] Create/Edit CO2 Supply form
- [ ] Manage listings page

### Phase 5: Buyer Module
- [ ] Buyer dashboard (metrics: Required, Suppliers, Avg Price, Savings, Deliveries)
- [ ] Create Demand Request form
- [ ] Browse marketplace / view AI matches

### Phase 6: Core Engines (Backend)
- [ ] Matching Engine (weighted score algorithm)
- [ ] Dynamic Pricing (BUY_NOW, QUOTE, BID, NEGOTIATE, CONTRACT)
- [ ] Contract creation & management

### Phase 7: Logistics Module
- [ ] Logistics provider dashboard (job board, bidding)
- [ ] Shipment tracking (status: MATCHED → BOOKED → PICKED_UP → IN_TRANSIT → DELIVERED → VERIFIED)

### Phase 8: Verification & Regulator
- [ ] Certificate upload/view
- [ ] Regulator oversight dashboard

### Phase 9: Reputation System
- [ ] Reputation score cards (Reliability, Quality, Delivery, Documentation)

### Phase 10: Deployment
- [ ] Deploy Supabase schema
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Write deployment guide for user
