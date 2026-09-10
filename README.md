# SigmaGPT

A full-stack ChatGPT clone built with React and Node.js. Supports user authentication, persistent chat threads, and real-time AI responses powered by the OpenAI API.

---

## Features

- **JWT Authentication** — Signup, login, and logout with secure cookie-based tokens
- **Authenticated Chat API** — All chat/thread endpoints require a valid session cookie
- **Persistent Chat Threads** — Conversations are saved to MongoDB and restored on reload
- **Thread Sidebar** — Browse, switch between, and delete previous conversations
- **OpenAI Integration** — Messages are sent to the OpenAI API and streamed back as markdown
- **Syntax Highlighting** — Code blocks in responses are rendered with `rehype-highlight`
- **Dark Theme UI** — ChatGPT-style dark interface with animated backgrounds
- **Automated Test Suites** — Jest/Supertest on the backend, Vitest/React Testing Library on the frontend

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| React Router v7 | Client-side routing and protected routes |
| Axios | HTTP requests with cookie support |
| React Toastify | Success / error notifications |
| React Markdown + Rehype Highlight | Render AI responses as formatted markdown |
| React Spinners | Loading indicator while awaiting AI reply |
| UUID | Generate unique thread IDs client-side |

### Backend
| Package | Purpose |
|---|---|
| Express 5 | REST API server |
| Mongoose | MongoDB ODM for threads and users |
| OpenAI SDK | Chat completion requests |
| JSON Web Token | Auth token generation and verification |
| bcryptjs | Password hashing (12 rounds) |
| cookie-parser | Read JWT from request cookies |
| CORS | Allow credentialed requests from the frontend |
| dotenv | Environment variable management |

---

## Live Demo

Deployed on AWS EC2: [http://ec2-16-171-18-152.eu-north-1.compute.amazonaws.com](http://ec2-16-171-18-152.eu-north-1.compute.amazonaws.com)

**Demo account** (feel free to use this to log in and try the app):

| Field | Value |
|---|---|
| Email | `recruiter.demo@sigmagpt.dev` |
| Password | `SigmaDemo@2026` |

---

## CI/CD

This project uses **GitHub Actions** with **self-hosted runners** on AWS EC2 for continuous integration and deployment:

- On every push to `main`, two jobs run in sequence:
  - **Backend job** — installs dependencies, builds (if applicable), and restarts the Express server via `pm2`
  - **Frontend job** — installs dependencies and builds the React app with Vite, which is then served via **nginx**
- Environment variables (`.env`) are preserved across deployments and excluded from version control
- Runner labels ensure jobs execute on the correct EC2 instance where the app is hosted

Workflow file: [`.github/workflows/cicd.yml`](.github/workflows/cicd.yml)

## Project Structure

```
SigmaGPT/
├── backend/
│   ├── controllers/
│   │   └── AuthController.js      # Signup / Login handlers
│   ├── middlewares/
│   │   └── AuthMiddleware.js      # JWT verification middleware
│   ├── models/
│   │   ├── UserModel.js           # User schema (email, username, password)
│   │   └── Thread.js              # Thread + Message schema
│   ├── routes/
│   │   ├── AuthRoute.js           # /login  /signup  / (verify)
│   │   └── chat.js                # /api/chat  /api/thread
│   ├── utils/
│   │   ├── SecretToken.js         # JWT creation helper
│   │   └── openai.js              # OpenAI API call wrapper
│   ├── tests/                      # Jest + Supertest test suite
│   ├── app.js                      # Express app (middleware + routes), imported by tests
│   ├── server.js                  # app.listen() + DB connection, entry point
│   └── .env                       # Environment variables (not committed)
│
└── Frontend/
    └── src/
        ├── App.jsx                # Routes + auth gate + context provider
        ├── MyContext.jsx          # Global context definition
        ├── Login.jsx              # Login page
        ├── Signup.jsx             # Signup page
        ├── ChatWindow.jsx         # Main chat UI + navbar + logout
        ├── Chat.jsx               # Message list with typing animation
        ├── Sidebar.jsx            # Thread list, new chat, delete
        ├── *.test.jsx             # Vitest + React Testing Library tests
        └── *.css                  # Per-component stylesheets
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- An OpenAI API key

### 1. Clone the repo

```bash
git clone https://github.com/Patramanish141/SigmaGPT.git
cd SigmaGPT
```

### 2. Configure the backend

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=SigmaGPT
TOKEN_KEY=your_strong_jwt_secret_here
```

Install dependencies and start the server:

```bash
cd backend
npm install
node server.js
# Server running on http://localhost:8080
```

### 3. Start the frontend

```bash
cd Frontend
npm install
npm run dev
# App running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/signup` | `{ email, username, password }` | Register a new user, sets JWT cookie |
| POST | `/login` | `{ email, password }` | Authenticate user, sets JWT cookie |
| POST | `/` | — | Verify JWT from cookie, returns `{ status, user }` |

### Chat

All chat/thread routes require a valid `token` session cookie — requests without one get a `401`.

| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| POST | `/api/chat` | `{ threadId, message }` | Send a message, get AI reply |
| GET | `/api/thread` | — | Get all threads (sorted by latest) |
| GET | `/api/thread/:threadId` | — | Get all messages in a thread |
| DELETE | `/api/thread/:threadId` | — | Delete a thread |

---

## Auth Flow

```
User submits login/signup form
        │
        ▼
Backend verifies credentials → signs JWT → sets httpOnly cookie
        │
        ▼
Frontend receives { success: true, user: username }
        │
        ▼
setUsername() updates context → route guard allows access to "/"
        │
        ▼
ChatWindow + Sidebar render

On page refresh → App.jsx calls POST / with cookie
              → if valid: restore username, render chat
              → if invalid: redirect to /login
```

---

## Testing

### Backend (`backend/`)

Jest + Supertest, with `mongodb-memory-server` for an isolated in-memory MongoDB (no real DB needed) and the OpenAI client mocked (no real API calls).

```bash
cd backend
npm install
npm test              # run the suite
npm run test:coverage # run with a coverage report
```

Covers:
- **Auth** (`tests/auth.test.js`) — signup creates a user with a hashed password, duplicate emails are rejected, login issues a verifiable JWT cookie, wrong password / unknown email are rejected
- **Chat** (`tests/chat.test.js`) — chat/thread routes reject unauthenticated requests with `401`; authenticated requests create/list/fetch threads and call the mocked OpenAI client with the right arguments

### Frontend (`Frontend/`)

Vitest + React Testing Library, with all network calls (`axios`, `fetch`) mocked.

```bash
cd Frontend
npm install
npm test              # run the suite
npm run test:coverage # run with a coverage report
```

Covers:
- **Login** — renders the form, submits credentials and calls the login API with the right payload, shows the error message on failed login
- **Chat** — renders the empty-state prompt vs. user/assistant message bubbles
- **ChatWindow** — sends the typed prompt to `/api/chat` and stores the returned reply

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `TOKEN_KEY` | Yes | Secret used to sign/verify JWTs |

---

## Author

Built by **Manish Patra**
