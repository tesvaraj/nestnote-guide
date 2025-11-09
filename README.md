# Hack for Social Impact 2025

_Problem Statement:_

The California Homeless Youth Project seeks an intelligent, compassionate intake system that replaces traditional, one-size-fits-all intake processes. Current systems often force youth to repeatedly share traumatizing stories across multiple disconnected agencies. The ideal solution will personalize and simplify intake through adaptive, trauma-informed, AI-driven interactions—helping young people to identify the critical services they need but might not be aware of, and understand and control what information they share throughout the intake processes.

## Getting Started

Clone the repo and install dependencies:

```sh
git clone <YOUR_GIT_URL>
cd nestnote-guide
npm i
npm run dev
```

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn-ui

## Deployment

### GitHub Pages

The app is configured to deploy to GitHub Pages at `https://tesvaraj.github.io/nestnote-guide/`

**Setup Steps:**

1. **Set Environment Variables in GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: GitHub Actions
   - Save

3. **Deploy:**
   - Push to `main` branch (automatic deployment)
   - Or manually trigger: Actions → Deploy to GitHub Pages → Run workflow

The workflow will:
- Install dependencies
- Build the app with production environment variables
- Deploy the `dist/` folder to GitHub Pages

**Local Testing:**
```sh
npm run build
npm run preview
```

This will build and preview the production build locally.
