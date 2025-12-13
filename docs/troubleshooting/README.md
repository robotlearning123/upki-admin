# Troubleshooting Documentation

This directory contains troubleshooting guides and incident reports for the UPKI Admin dashboard.

## Incidents

### 2025-12-13: Video Display Issue in User Details Modal

**Status:** ✅ Resolved
**Severity:** Medium
**Affected:** User Details Modal - Duration and video links not displaying

#### Documents

1. **[2025-12-13-video-display-fix.md](./2025-12-13-video-display-fix.md)** ⭐ **Start Here**
   - Quick summary of the issue and fix
   - Deployment information
   - Verification checklist
   - **Best for:** Quick reference

2. **[2025-12-13-diagnosis-report.md](./2025-12-13-diagnosis-report.md)**
   - Complete diagnostic process
   - Backend data verification
   - Frontend debugging (Console, Network, DOM)
   - **Best for:** Understanding the investigation process

3. **[2025-12-13-root-cause-analysis.md](./2025-12-13-root-cause-analysis.md)**
   - Deep code-level analysis
   - Bug explanations with code snippets
   - Fix strategy comparison
   - **Best for:** Technical implementation details

#### Summary

**Problem:** User details modal showed "-" for video duration and missing video links.

**Root Cause:** `getUserVideos()` function prioritized Redis realtime data which doesn't include `video_url` and `duration` fields.

**Solution:** Modified function to use Supabase complete data instead of Redis for user details modal.

**Files Changed:** `src/App.tsx` (-22 lines, +5 lines)

**Commit:** `30d36e1` - "Fix video display in user details modal"

**Deployed:** 2025-12-13 via Vercel

---

## Guidelines

### Adding New Troubleshooting Documents

When documenting a new issue:

1. Create files with date prefix: `YYYY-MM-DD-issue-name.md`
2. Include these sections:
   - Problem Description
   - Investigation Steps
   - Root Cause
   - Solution
   - Verification
   - Prevention (if applicable)
3. Update this README with a summary
4. Link related commits and PRs

### Document Retention

- Keep incident reports for at least 1 year
- Archive resolved issues older than 1 year to `archive/` subdirectory
- Critical incidents: Keep indefinitely

---

Last Updated: 2025-12-13
