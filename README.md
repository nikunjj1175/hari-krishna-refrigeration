# Hari Krishna Refrigeration

Customer management and WhatsApp campaign system for Hari Krishna Refrigeration.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- JWT auth (365-day httpOnly token, no auto logout)
- WhatsApp Cloud API (Meta) behind a provider abstraction
- Photos/media stored on Cloudinary (swap-ready for local/S3)

## Setup

```bash
npm install
copy .env.example .env.local
```

Edit `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/hari-krishna-refrigeration
JWT_SECRET=change-this-to-a-long-random-string
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SEED_ADMIN_EMAIL=admin@harikrishnarefrigeration.com
SEED_ADMIN_PASSWORD=Admin@123456
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

Seed the admin user and default categories (AC, Chiller, Fridge, Cold Room, Water Cooler):

```bash
npm run seed
```

Run locally:

```bash
npm run dev
```

Open http://localhost:3000 and sign in with the seed admin credentials.

Production build:

```bash
npm run build
npm start
```

## WhatsApp webhook

Point Meta to:

`https://your-domain/api/webhooks/whatsapp`

Use the same verify token as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Delivery events update message logs from Pending → Sent → Delivered (or Failed).

## Notes

- Large campaigns send in the background with delays (`WHATSAPP_RATE_DELAY_MS`, default 250ms).
- Failed recipients can be retried from the campaign detail page.
- Media files are uploaded to Cloudinary. MongoDB stores only the Cloudinary URL/public ID.
