# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack Manufacturing Planning + Inventory Management ERP System.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Shadcn UI + Tailwind CSS
- **Auth**: Session-based (express-session + bcryptjs)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── erp-app/            # React + Vite frontend (main ERP app)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application Features

### Pages
- **Login** — Session-based authentication with role-based access
- **Dashboard** — Summary cards (materials, products, locations, low stock, recent transactions)
- **Materials** — Materials master data (CRUD)
- **Products & BOM** — Products and Bill of Materials management
- **Locations** — Warehouse locations (CRUD)
- **Manufacturing Plan** — BOM explosion with quantity input, shows required vs available vs shortage
- **Stock In** — Add inventory to any location with auto-fill material details
- **Transfer** — Transfer stock between locations with availability check
- **Audit / Count** — Inventory counting with variance calculation and ADJUST transactions
- **Reports** — Transaction history, inventory by location, CSV export
- **Admin Users** — User management (admin only): create, edit, activate/deactivate, roles

### Roles
- **admin** — Full access to all pages
- **manager** — Dashboard, materials, products, locations, manufacturing plan, inventory, reports
- **storekeeper** — Stock in, transfer, audit/count
- **viewer** — Dashboard, reports (read-only)

## Default Login Credentials
- `admin` / `admin123` (Admin role)
- `manager` / `manager123` (Manager role)
- `storekeeper` / `store123` (Storekeeper role)

## Database Schema

Tables:
- `users` — User accounts with password hashes, roles
- `materials` — Materials master (code, name, unit)
- `locations` — Warehouse locations
- `products` — Product codes
- `bom_items` — Bill of Materials (product → material with qty_per_unit)
- `inventory_balances` — Current stock by material+location (unique constraint)
- `inventory_transactions` — Audit log of all movements (IN, OUT, TRANSFER, ADJUST)

## API Routes

Base: `/api`

- `POST /auth/login` — Login
- `POST /auth/logout` — Logout
- `GET /auth/me` — Current user
- `GET/POST /users` — List/create users (admin only)
- `PATCH/DELETE /users/:id` — Update/delete user (admin only)
- `GET/POST /materials` — List/create materials
- `PATCH/DELETE /materials/:id` — Update/delete material
- `GET/POST /locations` — List/create locations
- `DELETE /locations/:id` — Delete location
- `GET/POST /products` — List/create products
- `GET/DELETE /products/:id` — Get with BOM/delete product
- `POST /products/:id/bom` — Add BOM item
- `DELETE /products/:id/bom/:bomId` — Delete BOM item
- `POST /manufacturing/plan` — BOM explosion calculation
- `POST /inventory/stock-in` — Add stock to location
- `GET /inventory/balances` — List inventory with material+location details
- `POST /inventory/transfer` — Transfer between locations
- `POST /inventory/adjust` — Stock count adjustment
- `GET /transactions` — Transaction history with filters
- `GET /dashboard/stats` — Dashboard summary stats

## Seed Data

Locations: Main Warehouse, Production Floor, Quality Control, Shipping Dock, Cold Storage

Materials: MAT-001 through MAT-010 (Steel Rod, Aluminum Sheet, Copper Wire, etc.)

Products:
- `PROD-MOTOR-01` — Electric Motor Assembly (BOM: MAT-001 x4, MAT-005 x2, MAT-008 x1, MAT-007 x8)
- `PROD-CTRL-01` — Control Panel Assembly (BOM: MAT-006 x1, MAT-009 x2, MAT-010 x10, MAT-003 x50)
- `PROD-PUMP-01` — Water Pump Unit (no BOM yet)
