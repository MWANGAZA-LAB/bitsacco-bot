# Admin Dashboard Deployment Guide

## GitHub Pages Deployment

The admin dashboard is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Deployment URL
Once deployed, the dashboard will be available at:
```
https://mwangaza-lab.github.io/bitsacco-bot/
```

### Manual Deployment
To manually trigger deployment:
1. Go to the GitHub repository
2. Navigate to Actions tab
3. Select "Deploy Admin Dashboard to GitHub Pages"
4. Click "Run workflow"

### Local Development
```bash
cd admin-dashboard
npm install
npm run dev
```

### Build for Production
```bash
cd admin-dashboard
npm run build
```

## Configuration

The dashboard is configured to:
- Use the repository name as the base path (`/bitsacco-bot/`)
- Proxy API calls to the backend during development
- Build optimized production assets

## Troubleshooting

If the deployment fails:
1. Check the GitHub Actions logs
2. Ensure all dependencies are properly installed
3. Verify the build process completes successfully
4. Check that the repository has GitHub Pages enabled

## Environment Variables

The dashboard uses the following environment variables:
- `VITE_API_BASE_URL`: Backend API base URL (defaults to localhost:8000)
- `VITE_APP_NAME`: Application name (defaults to "Bitsacco Admin Dashboard")
