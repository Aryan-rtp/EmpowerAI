# Employee Management with AI Recommendations (MERN)

A modular full-stack MERN application with JWT authentication, employee management, filtering, and AI-powered recommendations using OpenRouter (`openai/gpt-oss-120b:free`).

## 1) Project Structure

```text
End_OLD/
  server.js
  package.json
  .env.example
  src/
    app.js
    db/
      db.js
    controllers/
      auth.controller.js
      employee.controller.js
      ai.controller.js
    middleware/
      auth.middleware.js
      error.middleware.js
    models/
      user.model.js
      employee.model.js
    routes/
      auth.routes.js
      employee.routes.js
      ai.routes.js
    service/
      ai.service.js
    utils/
      asyncHandler.js
  client/
    package.json
    .env.example
    tailwind.config.js
    postcss.config.js
    src/
      App.jsx
      index.css
      main.jsx
      components/
        Navbar.jsx
        ProtectedRoute.jsx
        EmployeeForm.jsx
        EmployeeList.jsx
        SearchSection.jsx
        AIRecommendationView.jsx
      pages/
        LoginPage.jsx
        RegisterPage.jsx
        DashboardPage.jsx
        AIRecommendationPage.jsx
      services/
        api.js
        auth.service.js
        employee.service.js
        ai.service.js
      utils/
        auth.js
```

## 2) Backend Setup

1. Install backend dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Start backend server:
   ```bash
   npm start
   ```

Server starts at `http://localhost:3000`.

## 3) Frontend Setup

1. Move to client folder:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start frontend:
   ```bash
   npm run dev
   ```

Frontend runs at `http://localhost:5173`.

## 4) API Endpoints

### Auth
- `POST /api/auth/register`
  - Body:
    ```json
    {
      "name": "Admin",
      "email": "admin@example.com",
      "password": "password123"
    }
    ```

- `POST /api/auth/login`
  - Body:
    ```json
    {
      "email": "admin@example.com",
      "password": "password123"
    }
    ```

### Employees (Protected)
Use header: `Authorization: Bearer <token>`

- `POST /api/employees`
  - Body:
    ```json
    {
      "name": "Jane",
      "email": "jane@example.com",
      "dept": "Engineering",
      "skills": ["React", "Node.js"],
      "performanceScore": 88,
      "experience": 4
    }
    ```

- `GET /api/employees?department=Engineering&search=react`

### AI Recommendations (Protected)
- `POST /api/ai/recommend`
  - Body (optional):
    ```json
    {
      "employeeIds": ["id1", "id2"]
    }
    ```
  - If `employeeIds` is not sent, top employees are auto-selected.

## 5) Validation Rules

- Unique emails for users and employees.
- Required fields for employee creation:
  - `name`
  - `email`
  - `dept`
  - `performanceScore`
  - `experience`
- `performanceScore` must be between 0 and 100.
- JWT required for employee and AI routes.

## 6) Render Deployment Guide

### Backend (Render Web Service)
1. Push your backend code to GitHub.
2. In Render, click **New +** -> **Web Service**.
3. Connect the repository.
4. Configure:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables in Render:
   - `PORT`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `OPENROUTER_API_KEY`
   - `CLIENT_URL` (frontend deployed URL)
6. Deploy and copy backend URL, e.g. `https://your-backend.onrender.com`.

### Frontend (Render Static Site)
1. Create another Render service -> **Static Site**.
2. Set root directory to `client`.
3. Configure:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add env var:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
5. Deploy.

### CORS Note
Make sure backend `CLIENT_URL` matches your frontend deployed URL.

## 7) AI Provider Note

The app uses OpenRouter through:
- Model: `openai/gpt-oss-120b:free`
- Key: `OPENROUTER_API_KEY`

Update this value in `src/service/ai.service.js` if you want to switch to another model.
