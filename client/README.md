# SenseGrid Frontend (React + Vite)

Frontend web application for the **SenseGrid** TRONIX365 Indianiiot platform.

## 🚀 Environment Configuration

The frontend dynamically targets either local or hosted backend environments.

- **`client/.env`**:
  ```ini
  # Target Render Production API (Default)
  VITE_API_URL=https://mq-gas-censor-sensegrid-api-tronix.onrender.com

  # Or target Local FastAPI Backend
  # VITE_API_URL=http://localhost:8000
  ```

## 📦 Installed Packages

- `axios` → API client for HTTP communication with backend routers.
- `react-router-dom` → Routing and protected routes.
- `recharts` → Live sensor telemetry charts and visual data graphs.
- `framer-motion` → Smooth UI animations and modal transitions.
- `lucide-react` → Vector icon set for dashboard widgets.
- `tailwindcss` / `@tailwindcss/postcss` → Responsive Bento UI layout styling.
- `clsx` & `tailwind-merge` → Dynamic utility class merging.
- `agentation` → AI developer visual feedback component (Dev dependency).

## 🛠️ Local Development Commands

```bash
# Install dependencies
npm install

# Run local development server (with Vite proxy for /api and /auth)
npm run dev

# Build for production deployment
npm run build
```
