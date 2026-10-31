# LOOPFLOW — Autonomous Enterprise Subscription Management & Recurring Billing Platform

Built for **Brightloop Software** | Built to Win the Hackathon

---

## 🌟 Executive Summary

**LOOPFLOW** is an intelligent subscription business operating system that centralises the complete subscription lifecycle:
**Customer Registration → Product Catalogue → Plan Configuration → Quotation Generation → Subscription Activation → Automated Recurring Billing → Invoice Generation → Payment Collection → Multi-Invoice Reconciliation → Financial Intelligence.**

LOOPFLOW strictly eliminates spreadsheet-based tracking, forgotten renewals, manual invoice generation, tax inaccuracies, and duplicate billing risks with an idempotent, transaction-safe background engine.

---

## 🚀 Live Access & Quick Demo

* **Web Application:** `http://localhost:5173/`
* **API Server:** `http://localhost:5000/api/health`

### 🔑 Test & Demonstration Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.io` | `Admin@Brightloop123!` | Complete system & financial control, Staff provisioning, Billing Control Centre, Tax & Discount engines, Audit logs |
| **STAFF** | `sarah.ops@brightloop.io` | `Staff@Brightloop123!` | Quotation generation, Subscription activations, Invoice dispatch, Payment recording & allocation, Reconciliation |
| **STAFF** | `david.billing@brightloop.io` | `Staff@Brightloop123!` | Billing runs, Payment settlements, Collections |
| **CUSTOMER**| `alex@acmetech.io` | `Customer@Loopflow123!` | Self-service customer portal, Active subscriptions, Invoice & PDF downloads, Payment history |

> **Tip for Evaluators:** The UI includes a persistent **"Role Switch"** pill in the top header and 1-click credential buttons on the login screen, allowing judges to test all three role experiences effortlessly!

---

## 🏆 Signature Features

### 1. ⚡ Billing Control Centre (Signature Operations Hub)
* **Real-time visibility** into Subscriptions Due Today, Upcoming Renewals (next 7 days), Trapped Billing Failures, Overdue Invoices, and Unmatched Receipts.
* **Autonomous & Manual Trigger:** Direct 1-click execution of the recurring billing engine.
* **Safe Retries:** Trapped failure containment with idempotent recovery.

### 2. 🛡️ Mandatory Idempotent Billing & Duplicate Prevention
* Every billing period possesses a deterministic, calendar-aware idempotency key: `@@unique([subscriptionId, billingPeriodKey])`.
* If a worker crashes, retries, or scheduler fires repeatedly, **duplicate billing is mathematically impossible** at the database level.

### 3. 📊 Financial Intelligence Dashboard
* **Normalized MRR & ARR Calculations:** Accurate normalization across **Daily**, **Weekly**, **Monthly**, and **Yearly** billing cycles.
* **Revenue Realization Breakdown:** Clearly separates Invoiced Obligations, Cash Collected, and Outstanding Balances.
* **Visual Performance Trends:** Interactive Recharts graphs showing 6-month revenue trends, product line contributions, settlement method distributions, and cadence allocations.

### 4. 🤖 LOOPFLOW Intelligence (AI Financial Assistant)
* Direct natural language assistant querying verified backend financial endpoints.
* Answers questions like *"Which products generate the highest MRR?"*, *"How much revenue did we collect this month?"*, and *"Which invoices are overdue?"* with real database facts and zero hallucinations.

### 5. 📑 Itemized Invoice Explanations & PDF Generator
* Every invoice details its exact calculation breakdown: `Base Plan + Variant Add-on × Qty − Discounts + Taxes = Total`.
* High-resolution, printable PDF invoices generated dynamically using PDFKit.

### 6. 🎯 Hackathon Demonstration Scenario Runner
* A dedicated interactive page at `/demo` that executes all 9 steps of the PRD Hackathon Demonstration Scenario in live sequence, with real API calls, live outputs, and visual progress verification!

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router v7, TanStack Query, Recharts, Canvas Confetti.
* **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite / PostgreSQL-compatible architecture.
* **Financial Precision:** Integer minor units (cents/paise) avoiding IEEE-754 floating point drift.
* **Security & Auth:** JWT tokens, Argon2/Bcrypt password hashing (8+ chars, uppercase, lowercase, numbers, special characters), Backend Role-Based Access Control (RBAC), and Customer Data Isolation.
* **Testing:** Vitest, Supertest with comprehensive unit tests, concurrency benchmarks, and end-to-end business workflow test suites.

---

## 🧪 Automated Testing & Verification

Run the complete test suite:
```powershell
cd backend
npx vitest run
```

### Verified Test Suites:
1. `src/__tests__/financial.test.ts`:
   - Base + Variant pricing addition
   - Exclusive & inclusive GST calculations
   - Normalized MRR & ARR across daily, weekly, monthly, yearly
   - Calendar-aware billing dates (month-end anchor dates & leap year handling)
2. `src/__tests__/e2e-workflow.test.ts`:
   - Full 9-step business lifecycle test
   - Duplicate conversion prevention
   - Idempotent recurring billing engine execution
   - Partial payment allocation and settlement to PAID
3. `src/__tests__/concurrency.test.ts`:
   - Concurrent worker stress testing
   - Zero duplicate invoices under simultaneous execution

---

## 🏁 How to Run Locally

### Start Backend API:
```powershell
cd backend
pnpm install
npx prisma generate
npx prisma db push
npx tsx src/prisma/seed.ts
pnpm dev
```
*(Runs on port 5000)*

### Start Frontend Client:
```powershell
cd frontend
pnpm install
pnpm dev
```
*(Runs on port 5173)*
