# Store Rating Platform

A high-performance, polished, full-stack implementation of a **Store Rating and Management Platform** built with **React**, **Express**, **TypeScript**, and **Prisma ORM**. 

This platform supports advanced role-based features (for Admins, Store Owners, and standard Users) with a unified search dynamic, active merchant analytics dashboards, live rating controls, and automatic dual-mode database synchronization.

---

## 🚀 Key Features

* **Multi-Role Experience (RBAC)**:
  * **Administrator Control Tower**: Oversee platform statistics, register/update merchants, assign store ownerships, and modify system credentials.
  * **Store Owner Dashboard**: Manage individual store branches, view aggregated customer ratings, see historical average ratings, and keep details updated.
  * **End-User Explorer**: Browse rated stores with fluid, beautiful search and category filters, register custom ratings, and read customer feedback.
* **Dual-State Database synchronization**: Intelligent sync engine checks for Neon/generic Postgres credentials (`DATABASE_URL`). If available, it automatically seeds data, runs standard migrations, and syncs status updates asynchronously. If unavailable or set to `localhost`, it falls back seamlessly to a high-speed local filesystem JSON database (`database.json`).
* **Sleek Neo-Brutalist Layouts**: Styled using clean Google Inter/JetBrains design elements, rounded thick borders, deep tactile shadows, dynamic visual status labels, and frame motion layout animations.

---

## 🛠️ Tech Stack & Architecture

```text
├── backend/            # Express.js REST APIs and Prisma logic
│   ├── middleware/     # Secure JWT bearer Authentication guards
│   ├── utils/          # JWT tokens & utility libraries
│   ├── prisma.ts       # Database Sync engine & client configurations 
│   └── server.ts       # Main bundle server & asset-serving router
├── frontend/           # React 19 SPA
│   ├── components/     # UI elements, dashboards & auth cards
│   ├── types.ts        # Shared TypeScript schemas and enums
│   └── main.tsx        # Client entry rendering file
├── prisma/             # Database ORM Schemas
│   └── schema.prisma   # PostgreSQL structures and cascading relations
```

* **Client**: React 19, TypeScript, Tailwind CSS, Lucide Icons, and Motion dynamic layouts.
* **Backend**: Node.js, Express, tsx (typescript execution engine), JWT cookies/headers, and bcrypt.js.
* **Database & ORM**: Prisma ORM, Neon PostgreSQL (production cloud), or standard structured local JSON storage bypass.

---

## ⚙️ Initial Project Setup / Installation

Follow these steps to download, install dependencies, and run the platform locally or in your container environment:

### 1. Install Dependencies
Run npm install in the root folder to pull in all client, server, dev, and build dependencies:
```bash
npm install
```

### 2. Configure Environment Secrets
Create a `.env` file in the root directory by copying the sample structure (or update it directly):
```bash
cp .env.example .env
```
Populate your configuration values inside `.env`:
```env
# Server details
PORT=3000

# PostgreSQL connection string (e.g. Neon, Cloud SQL, etc.)
# If left empty, the application runs automatically using local `database.json`
DATABASE_URL="postgresql://username:password@hostname/databasename?sslmode=require"

# Gemini API Key (Required for interactive AI extensions)
GEMINI_API_KEY="your_api_key_here"
```

### 3. Initialize Prisma Client
If you have set a valid external PostgreSQL connection string in `DATABASE_URL`, execute the following command to load schemas and deploy tables directly inside your instance:
```bash
# Push schema structure to remote db tables
npx prisma db push

# Generate Prisma Client node_modules binding files
npx prisma generate
```

---

## 🏃 Running the Application

### Development Mode
To boot the full-stack server on port `3000` with hot-reloading for TypeScript server files and automatic client-side bundling, run:
```bash
npm run dev
```
Open your browser to `http://localhost:3000` to interact with the application.

### Production Build & Deployment
To perform a highly optimized production asset build:
1. Compile the server to a self-contained CommonJS target file (`dist/server.cjs`) to prevent ES Module path resolution errors.
2. Compile and compress React frontend assets static output inside the `/dist` directory.

Run:
```bash
npm run build
```

To run the unified server:
```bash
npm run start
```

---

## 🔑 Demo Seed Accounts
The startup database engine automatically initializes beautiful sandbox data. Use any of the pre-loaded profiles to log in and preview system views:

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@platform.com` | `AdminP@ss123!` | Oversee metrics & manage users |
| **Store Owner A** | `owner1@stores.com` | `OwnerP@ss123!` | Manage Book Nook |
| **Standard User A** | `jane.doe@example.com` | `UserP@ss123!` | Browse, review stores, save feedback |


---

## ⚠️ Notes for Windows & Workspace Environments
* **Quote Normalization**: The database manager includes a robust normalizer utility in `backend/prisma.ts`. This filters out unwanted double (`"`) or single (`'`) quotes sometimes added automatically inside environment loaders in Windows terminal systems.
* **Auto-Fallback Engine**: If database connection strings are misconfigured or offline, checkout logs will report initialization warnings and fallback to caching files safely in local directories without crashing the process. This maintains an uninterrupted sandbox experience for local previews.
