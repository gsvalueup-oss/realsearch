# Cafe24 Deployment Guide

This project is deployed on a Cafe24 server only. Vercel and Railway are no longer used.

Do not commit real passwords, database URLs, API keys, or production `.env` files. Configure real values on the Cafe24 server.

## Deployment Files

The backend can be started directly with `uvicorn` or through a server process manager such as `systemd`, `supervisor`, or `pm2`, depending on the Cafe24 environment.

The repository still contains these generic backend startup helpers:

- `backend/start.sh`
- `backend/Dockerfile`
- `backend/Procfile`

Confirm the actual Cafe24 process manager before deleting or relying on these files.

## Required Environment Variables

Backend environment variables:

```env
ADMIN_PASSWORD=change_me_to_strong_admin_password
DATABASE_URL=postgresql://user:password@host:port/dbname
CORS_ORIGINS=https://realsearch.kr,https://www.realsearch.kr
VWORLD_API_KEY=your_vworld_api_key
```

Frontend environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://realsearch.kr
NEXT_PUBLIC_API_URL=https://realsearch.kr
INTERNAL_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_*` values are included in the browser bundle. Never put secrets in `NEXT_PUBLIC_*` variables.

`ADMIN_PASSWORD`, `DATABASE_URL`, and `VWORLD_API_KEY` are backend-only values. Never use them in frontend environment files.

## Cafe24 Deployment Steps

1. Connect to the Cafe24 server with SSH.

```bash
ssh user@server
```

2. Move to the project directory and pull the latest code.

```bash
cd /path/to/realsearch
git pull
```

Use the actual Cafe24 project path. Do not document real server paths if they contain sensitive information.

3. Back up the production database before applying schema changes.

```bash
pg_dump "$DATABASE_URL" > backup_before_deploy.sql
```

4. Apply the correction request table migration if it has not already been applied.

```bash
psql "$DATABASE_URL" -f backend/scripts/add_correction_requests.sql
```

This script creates the `correction_requests` table and indexes used by the information correction request feature.

5. Configure backend environment variables on the Cafe24 server.

Set real values for:

- `ADMIN_PASSWORD`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `VWORLD_API_KEY`

The exact location depends on the Cafe24 process manager. It may be a service file, shell profile, process manager config, or server-managed environment variable UI. Confirm the current server setup before editing.

6. Configure frontend environment variables before building.

Set real values for:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_URL`
- `INTERNAL_API_URL`

Frontend public variables are read during `npm run build`, so rebuild the frontend after changing them.

7. Install dependencies if needed.

```bash
cd backend
pip install -r requirements.txt
```

```bash
cd ../frontend
npm install
```

8. Build the frontend.

```bash
cd /path/to/realsearch/frontend
npm run build
```

9. Restart the backend.

Example direct command:

```bash
cd /path/to/realsearch/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

If Cafe24 uses `systemd`, `supervisor`, `pm2`, or another process manager, use the server-specific restart command instead.

10. Restart the frontend.

```bash
cd /path/to/realsearch/frontend
npm run start
```

If Cafe24 uses a process manager, use the server-specific restart command instead.

## Post-Deployment Checks

Check public pages:

- `https://realsearch.kr/`
- `https://realsearch.kr/search`
- `https://realsearch.kr/robots.txt`
- `https://realsearch.kr/sitemap.xml`
- `https://realsearch.kr/admin`

Check SEO:

- Open a person detail page and confirm metadata renders.
- Open an office detail page and confirm metadata renders.
- Confirm `robots.txt` blocks `/admin` and `/api`.
- Confirm `sitemap.xml` contains the main static routes.

Check correction requests:

- Submit a correction request from a person or office detail page.
- Confirm the request appears in the admin correction request section.
- Change status and save an admin note.

Check admin authentication:

- Confirm the correct `ADMIN_PASSWORD` can access admin APIs.
- Confirm a wrong password returns `401`.

## Notes

- There is no Alembic migration setup in the current project.
- The backend also runs `models.Base.metadata.create_all(bind=engine)` on startup, but production schema changes should still be applied explicitly with SQL after a database backup.
- If the Cafe24 server uses custom deployment scripts, document the exact non-secret commands here after confirming them on the server.
