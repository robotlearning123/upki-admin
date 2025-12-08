# UPKI Admin Dashboard

Standalone admin dashboard for monitoring UPKI video generation platform.

## Features

- Real-time data sync (30-second polling)
- User statistics from Supabase Auth
- Video generation monitoring
- Daily activity charts

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to GitHub and connect to Vercel for automatic deployment.

## API Endpoint

Uses `https://www.upki.ai/api/admin/data` for fetching admin data.
