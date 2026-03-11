# CMSC129 Lab 1 – Tap Tap Travel

A full-stack RPG travel game built with React + Vite on the frontend and Express + MongoDB on the backend. It supports JWT auth, autosave, and a light quest system.

## Requirements
- Node.js 18+
- MongoDB (Atlas or local)

## Setup

### 1) Install dependencies
```bash
npm run install-all
```

### 2) Environment variables
Create a `.env` file in `server`:
```
JWT_SECRET=your-secret
JWT_EXPIRES_IN=24h        # optional
MONGO_URI=your-mongo-uri
PORT=5000                 # optional
```

Create a `.env` file in `client`:
```
VITE_API_BASE_URL=http://localhost:5000
```

### 3) Run the app
```bash
npm run dev
```

## API Endpoints
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `DELETE /api/auth/delete`
- `GET /api/player`
- `PUT /api/player`

## Backup + DR (Manual for Atlas Free Tier)
Atlas Free tier does not support PITR/automated backups. Use the included scripts to dump the primary cluster and restore into the backup cluster.

### Requirements
Install MongoDB Database Tools so `mongodump` and `mongorestore` are on PATH.

### Script environment variables
Set these in your shell when running the scripts:
- `MONGO_URI_PRIMARY` (or reuse `MONGO_URI`)
- `MONGO_URI_BACKUP`
- `BACKUP_DIR` (optional, defaults to `backup_dumps/`)

### Run a manual sync (hourly recommended)
```powershell
./scripts/backup/sync_backup.ps1
```

### Run dump or restore separately
```powershell
./scripts/backup/backup_primary.ps1
./scripts/backup/restore_to_backup.ps1
```

## Failover runbook
1. Restore latest dump to backup cluster (or run the sync script).
2. Update `MONGO_URI` to the backup cluster URI.
3. Restart the server.

## Notes
- Auth uses JWT with a required `JWT_SECRET`.
- Player state is auto-saved and can also be saved manually from the UI.
- The shop rotates stock every 6 hours.
