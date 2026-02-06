# Deployment Guide for GitHub Pages

This guide explains how to deploy the app to GitHub Pages with a custom domain while keeping sensitive data secure.

## Sensitive Data

The only sensitive data in this project is:
- **Google Calendar private iCal URL** - Contains a private token for accessing your calendar

## Setup Steps

### 1. Create GitHub Repository

1. Create a new repository on GitHub (e.g., `metro-hallway`)
2. Push your code to the `main` branch

### 2. Configure GitHub Secrets

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_CALENDAR_ICAL_URL`
4. Value: Your full Google Calendar iCal URL (e.g., `https://calendar.google.com/calendar/ical/.../private-.../basic.ics`)
5. Click **Add secret**

**Important:** This secret is only used during the build process. The URL will be baked into the built JavaScript bundle, but it won't be visible in your source code on GitHub.

### 3. Enable GitHub Pages

1. Go to repository → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
3. The workflow will automatically deploy when you push to `main`

### 4. Configure Custom Domain

1. In repository → **Settings** → **Pages**, scroll to **Custom domain**
2. Enter: `metro.vestin.dev`
3. Check **Enforce HTTPS** (recommended)

### 5. DNS Configuration

Configure your DNS provider (where `vestin.dev` is hosted) to point to GitHub Pages:

**Option A: CNAME Record (Recommended)**
```
Type: CNAME
Name: metro
Value: your-username.github.io
```

**Option B: A Records**
```
Type: A
Name: metro
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

### 6. Local Development

For local development, create a `.env.local` file (this file is gitignored):

```bash
VITE_CALENDAR_ICAL_URL=https://calendar.google.com/calendar/ical/.../private-.../basic.ics
```

Then run:
```bash
npm run dev
```

## How It Works

- **Development:** Uses Vite proxy (`/api/calendar.ics`) to avoid CORS issues
- **Production:** Fetches directly from Google Calendar URL (from env var)
- **Build:** GitHub Actions injects the secret as an environment variable during build
- **Deployment:** Built files are deployed to GitHub Pages

## Security Notes

⚠️ **Important:** The calendar URL will be visible in the built JavaScript bundle. This is normal for client-side apps. The URL is:
- Not visible in your GitHub repository source code
- Only accessible to people who visit your site
- A private calendar URL (not a password), so if someone has it, they can view your calendar

If you need stronger security, consider:
- Using a serverless proxy function (Netlify/Vercel) that stores the secret server-side
- Making the calendar public instead of private
- Using a different calendar service with API keys that can be rotated

## Troubleshooting

**Calendar not loading?**
- Check that `VITE_CALENDAR_ICAL_URL` secret is set correctly
- Verify the URL works by opening it in a browser
- **CORS Error?** Google Calendar private URLs may block direct browser access. If you see CORS errors, you have two options:
  1. **Use a proxy service** (recommended): Set up a simple serverless function (Netlify/Vercel) that proxies the request server-side
  2. **Make calendar public**: Change your Google Calendar sharing settings to "Make available to public" and use the public iCal URL instead

**Custom domain not working?**
- Wait 24-48 hours for DNS propagation
- Verify DNS records are correct
- Check GitHub Pages settings show your custom domain

**Build failing?**
- Check GitHub Actions logs
- Verify the secret is set correctly
- Ensure the calendar URL is a valid full URL starting with `https://`
