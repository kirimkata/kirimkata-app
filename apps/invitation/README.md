# Invitation Fadli

Digital wedding invitation built with Next.js, React, and Framer Motion.

## Features

- Interactive swipe-based navigation
- Smooth animations with Framer Motion
- Responsive design optimized for mobile devices
- iOS Safari compatibility
- Image optimization with Next.js Image component

## Getting Started

### Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### Run Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
invitation-fadli-new/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── invitation-fadli.tsx
├── lib/
│   └── utils.ts
├── public/
│   ├── cover_fadli.jpg
│   ├── bg_padang2.webp
│   ├── gate_padang.webp
│   ├── pengantin_fadli.png
│   ├── grass_pengantin.png
│   ├── grass.webp
│   └── cloudsmall.webp
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## Technologies Used

- **Next.js 15** - React framework
- **React 19** - UI library
- **Framer Motion** - Animation library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Image Optimization

This project uses Next.js Image component for automatic image optimization. All images are placed in the `public/` folder and referenced with absolute paths (e.g., `/cover_fadli.jpg`).

## License

Private project

