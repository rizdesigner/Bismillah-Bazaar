# Deploying Bismillah Bazaar to Vercel

## What I've Done For You

✅ Installed Git  
✅ Created deployment configuration (`vercel.json`)  
✅ Created comprehensive README  
✅ Created deployment checklist  
✅ Initialized Git repository  
✅ Committed all code (83 files)  
✅ Set up environment variable templates  

## What You Need To Do

### Step 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com
2. Sign up or log in
3. Click **"New repository"**
4. Name: `bismillah-bazaar`
5. Make it **Public** or **Private** (your choice)
6. Click **"Create repository"**
7. Copy the repository URL (looks like: `https://github.com/YOUR_USERNAME/bismillah-bazaar.git`)

### Step 2: Push Code to GitHub (2 minutes)

Open PowerShell in your project folder and run:

```powershell
# Set Git identity (change to your info)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/bismillah-bazaar.git
git branch -M main
git push -u origin main
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Create Neon Database (5 minutes)

1. Go to https://neon.tech
2. Click **"Sign Up"** → choose **"Continue with GitHub"**
3. Click **"New Project"**
4. Project name: `bismillah-bazaar`
5. Database name: `bismillah_bazaar`
6. Region: Choose closest to your customers (e.g., US East)
7. Click **"Create Project"**
8. **Copy the connection string** (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/bismillah_bazaar?sslmode=require
   ```

### Step 4: Deploy to Vercel (10 minutes)

1. Go to https://vercel.com
2. Click **"Sign Up"** → choose **"Continue with GitHub"**
3. Click **"Add New..."** → **"Project"**
4. Find and import your `bismillah-bazaar` repository
5. Framework Preset: **Next.js** (should auto-detect)
6. Click **"Deploy"**

### Step 5: Add Environment Variables (3 minutes)

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these three variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Paste your Neon connection string from Step 3 |
| `AUTH_SECRET` | Run this command and paste the output: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g., `https://bismillah-bazaar.vercel.app`) |

3. Click **"Save"**

### Step 6: Redeploy (2 minutes)

1. Go to **Deployments** tab in Vercel
2. Click the three dots (⋮) on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for deployment to complete

### Step 7: Run Database Migrations (5 minutes)

Install Vercel CLI and run migrations:

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull

# Run database migrations
npx prisma migrate deploy

# Seed database with test data
npx prisma db seed
```

### Step 8: Test Your App (5 minutes)

1. Open your Vercel URL
2. Log in as admin: `admin@bismillahbazaar.com` / `admin123`
3. Check if inventory loads
4. Log out and log in as customer: `purchasing@spicegrill.com` / `customer123`
5. Try placing an order
6. Test notifications

## Total Time: ~35 minutes

## Cost: $0/month (Free tier)

- Vercel Hobby: Free
- Neon Free Tier: Free (0.5 GB database)
- GitHub: Free

## Optional: Custom Domain ($12/year)

1. Buy domain from Namecheap/GoDaddy (e.g., `bismillah-bazaar.com`)
2. In Vercel: **Settings** → **Domains**
3. Add your domain
4. Update DNS records as instructed
5. Wait 10-30 minutes

## Troubleshooting

### "Build failed"
- Check Vercel deployment logs
- Ensure all environment variables are set
- Try running `npm run build` locally first

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check Neon database is not paused
- Ensure SSL mode is set to `require`

### "AUTH_SECRET missing"
- Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add to Vercel environment variables
- Redeploy

## Need Help?

If you get stuck on any step, let me know which step and what error you're seeing. I'll provide specific guidance!

---

**Your app is production-ready!** 🚀
