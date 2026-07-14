# ⚙️ CodeWithShub - API Gateway Server

> The secure backend REST API engine for CodeWithShub. It manages user authentication, aggregates data worksheets, handles resume file parsing (PDF/DOCX), coordinates AI grading panels, and schedules revision queues.

---

## 🛠️ Technology Stack

*   **Runtime Environment:** [Node.js](https://nodejs.org/) (built with ES Module standard)
*   **Web Framework:** [Express.js](https://expressjs.com/) (handling router mapping and async error catch bounds)
*   **Database & Core Auth:** [Supabase SDK](https://supabase.com/) (interacting with PostgreSQL instance via service role authorizations)
*   **Security & Headers:** [Helmet](https://helmetjs.github.io/) (securing HTTP headers) and [CORS](https://github.com/expressjs/cors) (cross-origin resource sharing management)
*   **File Upload & Parsing:** [Multer](https://github.com/expressjs/multer) (binary multi-part parsing), [pdf-parse](https://github.com/.gitlab/pdf-parse) (reading resume text from PDFs), and [Mammoth](https://github.com/mwilliamson/python-mammoth) (compiling text contents from DOCX files)
*   **PDF Generation:** [PDFKit](https://pdfkit.org/) (for generating score sheets/reports)
*   **Daemon Monitor:** [Nodemon](https://nodemon.io/) (hot-reloading code daemon for local execution)

---

## 📂 Directory Layout

```directory
server/
├── config/              # Server configs and environment linking
│   └── supabase.js      # Supabase Client Client initialization
├── controllers/         # Core business logic handlers
│   ├── authController.js     # JWT session and session management
│   ├── progressController.js # Mark questions solved and record user scores
│   ├── sheetController.js    # Data worksheet queries
│   └── revisionController.js # Spaced repetitions scheduling engine
├── db/                  # SQL Schemas, seeds, and migrations
│   ├── schema.sql       # Database schema structures
│   └── seeds/           # Initial data seeding scripts
├── middleware/          # Express routing middleware
│   ├── authMiddleware.js     # Bearer JWT token validations
│   ├── errorMiddleware.js    # Unified global error catch trap
│   └── logger.js             # HTTP request logs
├── routes/              # Route map declarations
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── progressRoutes.js     # /api/progress endpoints
│   ├── sheetRoutes.js        # /api/sheets endpoints
│   └── revisionRoutes.js     # /api/revision endpoints
├── package.json         # Scripts, modules, and dependencies
└── server.js            # Express listener boot file
```

---

## ⚡ Development Setup

### Prerequisites

Ensure you have [Node.js (v18+)](https://nodejs.org/) and `npm` installed.

### 1. Environment Configurations

Copy the environment template in the server directory and populate your keys:
```bash
cp .env.example .env
```

Your `.env` should contain:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-auth-session-signing-secret
```

### 2. Dependency Installation

Install the package modules:
```bash
npm install
```

### 3. Running Local Server

Start Nodemon hot-reloading development daemon:
```bash
npm run dev
```
The REST API server will launch and listen at `http://localhost:5000/`.

---

## 📡 API Reference Gateway

All routes except `/api/health` require a valid bearer JWT token passed in the Authorization header.

### System Utilities
*   **`GET /api/health`**: Verifies database connectivity and server status.

### Authentication (`/api/auth`)
*   **`POST /api/auth/logout`**: Invalidates the current user token session.

### DSA Practice Sheets (`/api/sheets`)
*   **`GET /api/sheets`**: Lists all active worksheets.
*   **`GET /api/sheets/:id/topics`**: Retrives problems grouped by category for a specific worksheet.

### User Progress Tracking (`/api/progress`)
*   **`GET /api/progress/:sheetId`**: Calculates percent completion and lists solved problem indices.
*   **`POST /api/progress`**: Records a problem as solved, updates stats, and returns allocated XP points.

### Spaced Repetitions (`/api/revision`)
*   **`GET /api/revision/due`**: Returns topic cards due for active recall review today.
*   **`POST /api/revision/schedule`**: Updates spacing intervals based on review scoring history.
