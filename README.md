This is a Next.js project bootstrapped with create-next-app.

## Getting Started

From the project root, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser to see the result. Edit app/page.tsx to update the landing page; changes hot-reload automatically.

For a production build:

```bash
npm run build
npm start
```

## Learn More

- Next.js docs: https://nextjs.org/docs
- Interactive tutorial: https://nextjs.org/learn
- Next.js repository: https://github.com/vercel/next.js

## Admin access

Visit /admin once the dev server is running to reach the lightweight admin console. The landing route redirects to /admin/login, where entering the current code (`VANDERO-ADMIN` by default) opens /admin/manage. Override the code in development by setting NEXT_PUBLIC_ADMIN_CODE in your .env.local, then restart the server to pick up the new secret.

Authorized users can add shops or services from /admin/manage: each entry stores a URL, banner, title, and description. Paste a link and use the "Add shop"/"Add service" buttons to pull the site's metadata; the form then builds an admin card that mirrors the homepage. The homepage now shows a combined "Our Shops & Services" section powered by the shared portfolio, so every new link instantly creates a card with the site's name, slogan, and banner.
