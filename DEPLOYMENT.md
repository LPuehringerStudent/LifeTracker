# Deployment Guide

## Hosting: Render.com (Free Tier)

### 1. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/lifetracker.git
git push -u origin working
```

Then open a PR from `working` → `main` and merge it. The pipeline triggers on `main`.

### 2. Connect Render (Blueprint)

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click **New Blueprint Instance**
3. Connect your GitHub repo
4. Render reads `render.yaml` and provisions:
   - Free PostgreSQL database (`lifetracker-db`)
   - Free web service (`lifetracker-api`)
5. Wait for the first build (~3-5 minutes)

### 3. Set up Deploy Hook (optional but recommended)

For explicit GitHub Actions control over deployments:

1. In Render Dashboard → your web service → **Settings**
2. Scroll to **Deploy Hook**
3. Copy the URL (looks like `https://api.render.com/deploy/srv-xxx?key=yyy`)
4. In GitHub → your repo → **Settings → Secrets and variables → Actions**
5. Add a new repository secret:
   - Name: `RENDER_DEPLOY_HOOK_URL`
   - Value: your deploy hook URL

Now every push to `main` will:
1. Run CI (build backend + frontend)
2. Trigger Render deploy automatically

### 4. Access your app

- **App URL**: `https://lifetracker-api.onrender.com` (or your chosen name)
- **API Health**: `https://lifetracker-api.onrender.com/api/health`

### Local Docker (alternative)

```bash
docker-compose up -d
# App: http://localhost:3000
# PostgreSQL: localhost:5432
```

### First login

Use the demo account created on startup:
- Username: `demo`
- Password: `demo123`
