# Environment Setup Guide

## البيئة 🌍

The application supports multiple environment configurations:

### Environments

| Environment     | File               | Usage                                 |
| --------------- | ------------------ | ------------------------------------- |
| **development** | `.env.development` | Development mode with `npm run dev`   |
| **local**       | `.env.local`       | Local overrides (git-ignored)         |
| **production**  | `.env.production`  | Production build with `npm run build` |

---

## Configuration Variables

### API Configuration

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

- **Purpose**: Base URL for all API requests
- **Default**: `http://localhost:5000/api`
- **Examples**:
  - Development: `http://localhost:5000/api`
  - Production: `https://api.yourdomain.com`

### Gemini API

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

- **Purpose**: API key for Google Gemini AI
- **How to get**: Visit [AI Studio](https://ai.studio)
- **Keep secret**: Never commit to version control

### App Configuration

```env
VITE_APP_ENV=development
VITE_APP_MODE=development
APP_URL=http://localhost:3000
```

- `VITE_APP_ENV`: Current environment (development, production)
- `VITE_APP_MODE`: App mode for feature flags
- `APP_URL`: Full URL where app is hosted

---

## Setup Instructions ⚙️

### 1. Copy Configuration Template

```bash
cp .env.example .env.local
```

### 2. Update .env.local

Edit `.env.local` with your settings:

```env
# Your API Server URL
VITE_API_BASE_URL=http://localhost:5000/api

# Your Gemini API Key
GEMINI_API_KEY=abc123xyz...

# App Settings
VITE_APP_ENV=development
VITE_APP_MODE=development
APP_URL=http://localhost:3000
```

### 3. Run Application

```bash
npm install
npm run dev
```

---

## API Integration 🔌

### Current Setup

The app is configured to use Axios with automatic fallback:

```javascript
// From src/services/api.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.example.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});
```

### Behavior

- **If API_BASE_URL is set**: Tries to fetch real data from API
- **If API fails or not configured**: Falls back to mock data
- **Timeout**: 5 seconds

### Available Endpoints

The app currently makes requests to:

- `GET /products` - Fetch all products
- Other endpoints as needed

---

## Example Configurations

### Development (Local Backend)

```env
VITE_API_BASE_URL=http://localhost:5000/api
GEMINI_API_KEY=your_key_here
VITE_APP_ENV=development
```

### Mock Mode (No Backend)

```env
VITE_API_BASE_URL=
GEMINI_API_KEY=your_key_here
VITE_APP_ENV=development
```

The app will use mock data automatically.

### Production (Remote Server)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
GEMINI_API_KEY=your_prod_key_here
VITE_APP_ENV=production
```

---

## Troubleshooting 🔧

### API Not Responding

1. Check `VITE_API_BASE_URL` is correct
2. Verify your backend server is running
3. Check network tab in browser DevTools
4. App will fall back to mock data automatically

### API Key Issues

1. Verify `GEMINI_API_KEY` is set in `.env.local`
2. Keys are loaded at build time - restart dev server after changes
3. Never commit real keys to git

### Changes Not Applied

1. Restart dev server: `npm run dev`
2. Clear browser cache
3. Rebuild: `npm run build`

---

## Security Notes 🔒

- **Never commit** `.env.local` to git (already in `.gitignore`)
- **Never share** API keys or sensitive credentials
- **Use** `.env.example` as template for team members
- **Rotate** API keys regularly in production

---

## Additional Resources

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google Gemini API](https://ai.google.dev/)
- [Axios Documentation](https://axios-http.com/)
