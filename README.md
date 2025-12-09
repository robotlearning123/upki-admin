# UPKI Admin Dashboard

Standalone admin dashboard for monitoring UPKI video generation platform.

**Live Dashboard**: https://upki-admin.vercel.app

## Features

### Overview Tab
- Real-time data sync (10-second auto-refresh)
- User statistics from Supabase Auth
- Video generation monitoring (video_jobs + legacy)
- Daily activity charts

### Users Tab
- User detail modal with video history
- User activity tracking
- Email and authentication provider info

### Realtime Tab
- Live task queue monitoring
- Worker status and metrics
- Processing/queued tasks display
- Recent submission tracking

### System Status Tab ⭐ NEW
- Version tracking (Production, Built, Frontend)
- System health scores (6 metrics: Overall, Stability, Scalability, Reliability, Resource Efficiency, High Availability)
- Kubernetes cluster information (nodes, pods, Redis status)
- Performance metrics (avg processing time, success rate, task counts)
- Maintenance window alerts (DigitalOcean scheduled maintenance)

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

## API Endpoints

The dashboard fetches data from two sources:

- **Admin Data**: `https://www.upki.ai/api/admin/data` (Overview, Users, Videos)
- **Analytics**: `/api/admin/analytics` (Vercel serverless - GA4 metrics)
- **Realtime**: `https://api.upki.ai/api/v1/admin/realtime` (Live task queue)
- **System Status**: `https://api.upki.ai/api/v1/admin/system-status` (with static fallback)

All admin endpoints require `X-Admin-API-Key` header authentication.
