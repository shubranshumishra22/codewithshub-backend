# Deploy backend to Render

Repo: https://github.com/shubranshumishra22/codewithshub-backend

## 1. Create the Render service

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect `codewithshub-backend`.
4. Use these settings:

| Setting | Value |
|---------|-------|
| Name | `codewithshub-api` |
| Region | closest to you |
| Branch | `main` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance type | **Free** |

5. Add environment variables (from your Supabase dashboard → Project Settings → API):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://YOUR-APP.vercel.app` (set after frontend deploy) |
| `SUPABASE_URL` | `https://brhgcqlyjuhfuhnsmliu.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | your publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key (keep secret) |

6. Click **Create Web Service** and wait for the deploy to finish.

7. Copy your API URL, e.g. `https://codewithshub-api.onrender.com`.

## 2. Verify

```bash
curl https://YOUR-RENDER-URL.onrender.com/api/health
```

Expected: `{"status":"ok"}`

## 3. After frontend is live

Update `CLIENT_URL` on Render to your exact Vercel URL (no trailing slash), then redeploy or restart the service.

## Notes

- Free tier sleeps after ~15 minutes of inactivity; the first request may take 30–60 seconds.
- Do not commit `.env` files. Set secrets only in the Render dashboard.
