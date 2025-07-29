#VaultFace

*A modern, privacy‑aware Personal Finance Assistant built with Next.js, Firebase, Tailwind CSS, and shadcn/ui.*

> **Goal:** Provide an extensible SaaS‑style web app for tracking income & expenses, extracting data from receipts/statements (OCR + AI), generating monthly insights, and visualizing financial health trends.

---

## 🚀 Live Demo


**🧪 Test Login:**  
- **Email:** `testuser@gmail.com`  
- **Password:** `123456`  

**🎥 Demo Video:** [Watch Demo Video]()

---



## Table of Contents

1. [Key Features](#key-features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Environment Variables](#environment-variables)
5. [Local Development](#local-development)
6. [Firebase Setup](#firebase-setup)
7. [License](#license)

---

## Key Features

* **Income & Expense Management**: Add, list, filter, paginate, and export transactions.
* **Receipt & Payslip**: Upload images or PDFs → Google Cloud Vision extracts raw text.
* **AI Amount & Category Extraction**: Gemini API → intelligent prefill for amount, source/category, date.
* **Bank Statement Bulk Import**: Upload PDF/CSV/XLS(X) → server route parses + classifies lines (Credit/Debit → Income/Expense).
* **Dynamic Dashboard**: Monthly filters, aggregated totals, income vs expense charts, savings trend, category breakdown pie charts.
* **Insight Summary Card**: AI‑generated monthly insights & improvement suggestions (Gemini prompt with aggregated stats).
* **Statistics Page**: Historical totals (multi‑year window), categorized expense analysis, savings analytics.
* **Secure Auth**: Firebase Authentication (email/password) gated routes; client context for session state.
* **Export Utilities**: Download CSV / XLS of filtered transactions; future PDF statement export.
* **Responsive & Accessible**: Adaptive layout, keyboard focus states, semantic structure.

---

## Tech Stack

| Layer                 | Technologies                                                        |
| --------------------- | ------------------------------------------------------------------- |
| Frontend              | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend (Edge/Server) | Next.js Route Handlers, Node APIs                                   |
| Database              | Firebase Firestore                                                  |
| Auth                  | Firebase Auth (email/password)                                      |
| AI / OCR              | Google Cloud Vision API, Google Gemini (AI Studio)                  |
| Deployment            | Netlify (build + hosting)                                           |
| Tooling               | ESLint, TypeScript, (optional) Prettier, UUID, xlsx                 |

---

## Architecture Overview
<img width="3840" height="2560" alt="Flow-Diagram" src="https://github.com/salonigoyal8887/VaultFace/blob/main/Screenshot%202025-07-29%20183840.png?raw=true" />


```
Browser (React Components)
   │
   ├─ AuthContext (Firebase Auth state)
   ├─ Dashboard / Income / Expense / Statistics pages
   │    │
   │    ├─ Data Hooks (Firestore queries, month/year filters)
   │    └─ UI Components (Charts, Forms, Tables)
   │
   ├─ Receipt / Statement Upload Components
   │    │
   │    └─ POST /api/amount-extract(amount/category extraction)
   │
   └─ Bulk Upload Page
           └─ POST /api/file-transaction (parse + classify lines via Gemini)

Server (Route Handlers)
   ├─ /api/amount-extract → Accepts file (image/pdf), runs Vision → structured JSON (amount, type, source/category, date)
   ├─ /api/file-transaction → Extracts tabular entries (CSV/XLS/PDF) → Gemini classification
   ├─ /api/insight → Summarize month stats with Gemini
   ├─ /api/stats/insights → Gives insights generated through Gemini.
   └─ /api/stats/summary → Summarize the data from a particular range of dates with Gemini

Firestore
   ├─ users/{uid}
   ├─ income/{doc}  (fields: uid, amount, source, date, createdAt)
   └─ expenses/{doc} (fields: uid, amount, category, date, createdAt)
```
---

## Environment Variables

Create a `.env.local` (never commit). Example:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxxxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxxxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxxxxx

# Google / Gemini
GOOGLE_CREDENTIALS_JSON=./google-credentials.json  # (Server-only, DO NOT COMMIT)
GEMINI_API_KEY=xxxxxxxx

```

## Local Development

```bash
# 1. Install deps
npm install  # or npm / yarn

# 2. Add .env.local and credentials
# 3. Run dev
npm dev

# 4. Open
http://localhost:3000
```
---
## Firebase Setup

1. Create Firebase project.
2. Enable **Authentication** (Email/Password).
3. Create **Firestore** (production mode with security rules referencing `request.auth.uid`).
5. Copy config → `.env.local` as `NEXT_PUBLIC_FIREBASE_*` variables.

---

## License

MIT (proposed). Add a `LICENSE` file if absent.

---

