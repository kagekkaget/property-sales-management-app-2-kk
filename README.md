# Kavlingo Palembang - Property Sales Management App

Aplikasi manajemen penjualan properti (kavling/rumah/apartemen) untuk tim sales real estate. Dibangun dengan Next.js 16, PostgreSQL (Neon), Drizzle ORM, dan Tailwind CSS.

## Fitur Utama

- **Dashboard** - Statistik properti, pelanggan, pesanan, pendapatan, aktivitas terbaru
- **Inventori Properti** - CRUD properti (rumah, apartemen, ruko, tanah, villa, gudang, kantor) dengan stok, harga, status, kadaluarsa listing
- **Manajemen Pelanggan** - Data lengkap pelanggan (NIK, pekerjaan, budget, preferensi, alamat)
- **Manajemen Pesanan** - Buat/edit pesanan, status (pending/confirmed/processing/completed/cancelled), status pembayaran, komisi
- **Notifikasi & Peringatan** - Alert stok rendah & listing akan kadaluarsa
- **Laporan** - Ekspor CSV/PDF untuk inventori, penjualan, pelanggan
- **Kelola Pengguna** - Role-based access (Owner, Manager, Staff)
- **Autentikasi** - JWT-based session dengan httpOnly cookies

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Auth**: JWT (jose) + bcryptjs
- **Styling**: Tailwind CSS 4
- **Charts**: Native HTML tables (PDF via jsPDF + autoTable)
- **Icons**: Lucide React
- **Toast**: Custom react-hot-toast wrapper

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/property-sales-management-app.git
cd property-sales-management-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan DATABASE_URL dan NEXTAUTH_SECRET

# Push schema to database
npm run db:push

# Seed default users
npm run db:seed

# Development
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

### Default Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@kavlingo.com | owner123 |
| Manager | manager@kavlingo.com | manager123 |
| Staff | staff@kavlingo.com | staff123 |

## Deployment (Vercel)

1. Push ke GitHub
2. Import di Vercel
3. Set Environment Variables:
   - `DATABASE_URL` (Neon pooler URL)
   - `NEXTAUTH_SECRET` (generate di https://generate-secret.vercel.app/32)
4. Deploy
5. Jalankan seed: `POST https://your-app.vercel.app/api/seed`

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Protected routes (dashboard, properties, etc.)
│   ├── api/            # API routes
│   ├── login/          # Login page
│   └── layout.tsx      # Root layout with auth guard
├── components/         # Reusable UI components
├── db/
│   ├── index.ts        # Drizzle client (singleton pool)
│   └── schema.ts       # Database schema
├── lib/
│   ├── auth.ts         # JWT auth utilities
│   └── utils.ts        # Formatters, generators, helpers
└── middleware.ts       # Auth middleware (optional)
```

## Scripts

```bash
npm run dev         # Development server (webpack on Windows)
npm run build       # Production build
npm run start       # Production server
npm run lint        # ESLint
npm run typecheck   # TypeScript check
npm run db:push     # Push schema to database
npm run db:seed     # Seed default data
```

## License

Open Source oleh **MZF - 2026**

Web app ini gratis & bebas iklan. Dukungan kecil sangat berarti untuk biaya server & pengembangan berkelanjutan.

---

*Dibangun dengan ❤️ untuk komunitas real estate Indonesia*