# Brightloop Software - Subscription Management System

A subscription management system built for **Brightloop Software** covering the end-to-end lifecycle of recurring software sales:
**Products, Variants, Plans, Quotation Templates, Subscriptions, Invoicing Engine, Payments, and Revenue Analytics.**

---

## Architecture & Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State & Data Fetching:** TanStack Query (React Query) + Axios
- **Charts:** Recharts
- **Forms & Validation:** React Hook Form + Zod

### Backend
- **Runtime & Framework:** Node.js 20+ & Express.js (ES Modules)
- **Database:** PostgreSQL 15 via Docker Compose
- **ORM:** Prisma ORM
- **Auth & Security:** JWT, bcrypt, Helmet, CORS, Express Rate Limit
- **Validation:** Zod schemas on all endpoints
- **Scheduled Jobs:** node-cron (Daily billing run, auto-close expired plans/subscriptions)
- **Documents & Mail:** PDFKit for server-side PDF invoice generation, Nodemailer with console fallback in development

---

## Directory Structure

```
/
├── backend/
│   ├── prisma/             # Prisma schema & seed script
│   ├── src/
│   │   ├── config/         # env and database configuration
│   │   ├── middleware/     # auth, rbac, validation, and error middlewares
│   │   ├── modules/        # domain modules (auth, products, plans, subscriptions, invoices, etc.)
│   │   ├── jobs/           # cron jobs (billing run, expiry checks)
│   │   ├── utils/          # money math, pdf generation, mailer, numbering
│   │   ├── app.js          # Express app configuration & middleware
│   │   └── server.js       # HTTP server entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # configured axios instance & API client functions
│   │   ├── components/     # reusable UI elements, badges, modals
│   │   ├── context/        # auth and session context
│   │   ├── hooks/          # custom React hooks
│   │   ├── pages/          # Admin, Staff, Customer Portal, and Public auth pages
│   │   ├── routes/         # role-based route guards
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml       # PostgreSQL 15 container
└── README.md
```

---

## Quickstart

### 1. Start the Database
```bash
docker compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
Health Check: `http://localhost:5000/api/v1/health`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
