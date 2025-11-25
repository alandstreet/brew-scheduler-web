# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Brew Scheduler** application built with Quasar Framework v2 (Vue 3 + Vite). It's a brewery scheduling web application in early development stage.

## Technology Stack

- **Framework**: Quasar v2.16+ (Vue 3.5+)
- **Build Tool**: Vite via @quasar/app-vite
- **Router**: Vue Router v4 (history mode)
- **Authentication**: AWS Amplify v6 with Cognito OAuth
- **API Client**: Axios for HTTP requests
- **Backend**: Rust API (http://localhost:9999)
- **Language**: JavaScript (ES2022+)
- **Package Manager**: npm or yarn
- **Linting**: ESLint v9 (flat config)

## Development Commands

### Start Development Server
```bash
quasar dev
# or
npm run dev
```
Opens browser automatically with hot-reload enabled.

### Build for Production
```bash
quasar build
# or
npm run build
```

### Linting
```bash
npm run lint
# Lints all .js, .cjs, .mjs, and .vue files in src directory
```

### Testing
Currently no tests configured (test script exits with 0).

## Project Structure

```
src/
├── boot/          # Boot files (auth.js initializes Amplify)
├── composables/   # Reusable composition functions (useAuth.js)
├── components/    # Reusable Vue components
├── config/        # Configuration files (auth.js, api.js)
├── layouts/       # Page layouts (MainLayout.vue)
├── pages/         # Route-level page components
├── router/        # Vue Router configuration (index.js, routes.js)
├── services/      # API service layer (beerTemplates.js, etc.)
├── assets/        # Static assets
├── css/           # Global styles (app.scss)
└── App.vue        # Root component
```

## Architecture Notes

### Authentication System
The application uses **AWS Cognito OAuth** with AWS Amplify v6 for authentication.

**Configuration:**
- User Pool ID: `ap-southeast-2_hyHAlZnZv`
- App Client ID: `djs4o25tq4q0qmramo44tji2t`
- Region: `ap-southeast-2`
- OAuth Domain: `ap-southeast-2hyhalznzv.auth.ap-southeast-2.amazoncognito.com`
- Config file: `src/config/auth.js`

**Key Files:**
- `src/boot/auth.js` - Initializes Amplify on app startup
- `src/composables/useAuth.js` - Composable providing auth functions and reactive state
- `src/router/index.js:30-52` - Navigation guard protecting routes with `meta.requiresAuth`

**Using Authentication:**

1. **In Components:**
   ```javascript
   import { useAuth } from 'src/composables/useAuth'

   const { isAuthenticated, isLoading, userEmail, username, login, logout } = useAuth()
   ```

2. **Protecting Routes:**
   Add `meta: { requiresAuth: true }` to route definitions in `src/router/routes.js`:
   ```javascript
   {
     path: 'dashboard',
     component: () => import('pages/DashboardPage.vue'),
     meta: { requiresAuth: true }
   }
   ```

3. **Getting Tokens:**
   ```javascript
   const { getAccessToken, getIdToken } = useAuth()
   const accessToken = await getAccessToken()
   const idToken = await getIdToken()
   ```

**Auth Flow:**
- Clicking "Login" redirects to Cognito Hosted UI
- After authentication, Cognito redirects back to `http://localhost:9000/`
- Amplify automatically handles token exchange and storage
- `useAuth().checkAuthState()` verifies authentication status

### Backend API Integration
The application communicates with a Rust backend API for data management.

**Configuration:**
- Base URL: Configured via `VITE_API_URL` environment variable (default: `http://localhost:9999`)
- API Client: `src/config/api.js` - Axios instance with interceptors
- Authentication: Access tokens automatically added to requests via interceptors

**API Services:**
- `src/services/beerTemplates.js` - CRUD operations for beer templates

**BeerTemplate Model:**
```javascript
{
  beer_template_id: string (UUID),
  beer_name: string,
  volume_hl: number,
  min_fermentation_days: number,
  min_maturation_days: number
}
```

**Using API Services:**
```javascript
import { beerTemplatesService } from 'src/services/beerTemplates'

// Get all templates
const templates = await beerTemplatesService.getAll()

// Create template
await beerTemplatesService.create({
  beer_name: 'IPA',
  volume_hl: 100,
  min_fermentation_days: 14,
  min_maturation_days: 21
})

// Update template
await beerTemplatesService.update(id, updatedData)

// Delete template
await beerTemplatesService.delete(id)
```

**Environment Variables:**
Create a `.env` file based on `.env.example`:
```bash
VITE_API_URL=http://localhost:9999
```

### Router Configuration
- Uses **history mode** for clean URLs
- Routes defined in `src/router/routes.js`
- Layout-based routing: pages are children of layouts
- Lazy-loaded route components using dynamic imports
- **Authentication guard** at `src/router/index.js:30-52` checks `meta.requiresAuth`

### Layout System
- Primary layout: `MainLayout.vue` with header and router-view
- Uses Quasar's QLayout with view string: `hHh Lpr fFf`
- Top navigation bar with menu items: Schedule, Templates, Dashboard
- Navigation items only visible when authenticated

### Quasar Configuration
- Config file: `quasar.config.js`
- Build targets: ES2022, modern browsers (Firefox 115+, Chrome 115+, Safari 14+)
- SSR port: 3000 (when using SSR mode)
- Electron app ID: 'brewery-scheduler-web'
- Currently using Material Icons and Roboto font

### ESLint Configuration
- Uses **flat config** (eslint.config.js)
- Vue essential rules enabled
- Integrated into Vite dev server via vite-plugin-checker
- Custom rules: allows debugger in development, disables prefer-promise-reject-errors

## Important Conventions

### Component Imports
- Quasar components are auto-imported (no explicit imports needed)
- Custom components use relative paths without extensions: `'components/ComponentName.vue'`

### Styling
- Global styles in `src/css/app.scss`
- Component styles use scoped or module CSS within .vue files

### Boot Files
Boot files (in `src/boot/`) run before app instantiation. Register them in `quasar.config.js` under the `boot` array.

### Multi-Platform Support
Quasar supports multiple build modes (configured in quasar.config.js):
- SPA (default)
- SSR (Server-Side Rendering)
- PWA (Progressive Web App)
- Electron (Desktop)
- Cordova/Capacitor (Mobile)
- BEX (Browser Extension)
