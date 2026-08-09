# Bismillah Bazaar - B2B Wholesale Halal Meat PWA

A Progressive Web App for B2B halal meat suppliers serving restaurant clients. Features inventory management, order negotiation, and real-time notifications.

## 🚀 Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed database with test data
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 Test Accounts

### Admin
- Email: `admin@bismillahbazaar.com`
- Password: `admin123`

### Customer
- Email: `purchasing@spicegrill.com`
- Password: `customer123`

### Pending Customer
- Email: `owner@tandoorinights.com`
- Password: `customer123`

## 🌐 Deploy to Production (Vercel)

### Prerequisites
- GitHub account
- Vercel account
- Neon database account (free tier)

### Step 1: Create Neon Database
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project: `bismillah-bazaar`
4. Copy connection string

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import this repository
4. Add environment variables:
   - `DATABASE_URL` (from Neon)
   - `AUTH_SECRET` (run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
5. Click Deploy

### Step 3: Run Migrations
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link
vercel login
vercel link

# Pull env vars
vercel env pull

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### Step 4: Test
- Open your Vercel URL
- Log in as admin
- Test order flow
- Test notifications

##  Features

### Customer App
- Browse catalog (Poultry, Meat, Dried)
- Add items to cart with quantity controls
- Place purchase orders
- Receive notifications for order updates
- Accept modified orders
- Install as PWA (iOS/Android)

### Admin Dashboard
- Manage inventory (CRUD)
- View all orders
- Modify order quantities and pricing
- Set delivery ETA
- Approve/suspend customer accounts
- Real-time notifications

### Technical Features
- Next.js 16 (App Router)
- PostgreSQL with Prisma ORM
- NextAuth authentication
- Serwist PWA (offline support)
- Real-time notifications (3s polling)
- Mobile-first responsive design
- Toast notifications

## 🛠 Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL (Neon/Vercel Postgres)
- **ORM:** Prisma 6
- **Auth:** NextAuth.js v4
- **PWA:** Serwist
- **Hosting:** Vercel

##  Project Structure

```
src/
├── app/
│   ├── (app)/          # Customer app routes
│   │   ├── catalog/
│   │   ├── orders/
│   │   ├── cart/
│   │   └── account/
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   ├── login/
│   ├── register/
│   └── serwist/        # Service worker
── components/
│   ├── admin/          # Admin components
│   └── ...             # Shared components
├── lib/                # Utilities
└── types/              # TypeScript types

prisma/
├── schema.prisma       # Database schema
├── seed.ts             # Seed data
└── migrations/         # Database migrations
```

##  Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run icons        # Regenerate PWA icons
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## 📱 PWA Installation

### Android (Chrome)
1. Open app in Chrome
2. Tap menu (⋮) → "Install app"
3. App icon appears on home screen

### iOS (Safari 16.4+)
1. Open app in Safari
2. Tap Share → "Add to Home Screen"
3. App icon appears on home screen

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | $0/month |
| Neon | Free | $0/month (0.5 GB) |
| Domain | Optional | ~$12/year |
| **Total** | | **~$1/month** |

## 📈 Scaling

- **10-300 restaurants:** Free tier sufficient
- **300-2000 restaurants:** Vercel Pro ($20/month)
- **2000+ restaurants:** Enterprise plan

## 🔐 Security

- Password hashing with bcryptjs
- JWT-based authentication
- Role-based access control (admin/customer)
- Server-side validation
- Environment variable protection

## 🐛 Troubleshooting

### Database connection failed
- Check `DATABASE_URL` in Vercel env vars
- Ensure Neon database is active
- Check IP allowlist

### Build failed
- Check build logs in Vercel
- Verify all env vars are set
- Run `npm run build` locally first

### Notifications not working
- Check browser console for errors
- Verify polling is active (DevTools → Console)
- Check server logs for notification creation

## 📄 License

MIT

## 👨‍ Author

Built with Next.js and ❤️

---

**Need help?** Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed deployment steps.
