# Gacha — Next.js Codebase Analysis

> **Project:** `gacha` · Polkadot Hackathon  
> **Analyzed:** 2026-03-09

---

## 📦 Tech Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.1.6 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | ^4 (via PostCSS) |
| Animation | Motion (Framer Motion v12) | ^12.35.1 |
| Fonts | Geist Sans / Geist Mono | via `next/font/google` |
| Linting | ESLint (Next.js config) | ^9 |
| Compiler | React Compiler (experimental) | 1.0.0 |

> [!NOTE]
> The project uses **Next.js 16** with **React 19** and the **experimental React Compiler** (`reactCompiler: true` in [next.config.ts](file:///c:/Users/reyna/gacha/next.config.ts)), enabled via `babel-plugin-react-compiler`. This is a cutting-edge setup that auto-memoizes components, reducing the need for manual `useMemo`/`useCallback`.

---

## 🗂️ Project Structure

```
gacha/
├── docs/
│   └── CONTRIBUTING.md          # Contribution guidelines
├── public/
│   ├── assets/
│   │   ├── connect-wallet-btn.svg
│   │   ├── hamburger-btn.svg
│   │   └── profile-picture.png
│   └── *.svg                    # Default Next.js SVG assets
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── globals.css          # Global styles + Tailwind v4 theme
│   │   ├── layout.tsx           # Root layout (fonts, Navbar, metadata)
│   │   └── page.tsx             # Root page "/" → renders <Home>
│   ├── components/              # Shared/reusable UI components
│   │   └── navbar/
│   │       └── index.tsx        # Fixed top navigation bar
│   └── features/                # Feature-scoped view components
│       └── home/
│           └── index.tsx        # Hero / landing page section
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

### Architectural Pattern: Feature-Based Structure

The project uses a **components / features** split, which is a well-regarded pattern for scalable Next.js apps:

- **`src/components/`** — Generic, reusable UI pieces (e.g., `Navbar`) that can be shared across many pages/features.
- **`src/features/`** — Feature-specific views (e.g., `home`) that belong to a single route or domain.
- **`src/app/`** — Thin route entry points that simply import from `features/`.

This separation keeps pages clean and makes features easy to locate and scale independently.

---

## 📄 File-by-File Breakdown

### `src/app/layout.tsx` — Root Layout

The root server component wrapping every page.

- Loads **Geist Sans** and **Geist Mono** via `next/font/google` with CSS variables (`--font-geist-sans`, `--font-geist-mono`).
- Applies `suppressHydrationWarning` on `<html>` (likely for theme/dark-mode handling).
- Renders `<Navbar />` globally above all page content.
- Sets `metadata: title = "Create Next App"` — **still a placeholder**, should be updated to match the project's actual name.

### `src/app/page.tsx` — Root Page (`/`)

Minimal and clean. Delegates entirely to the `Home` feature component.

```tsx
import Home from "@/features/home";
export default function App() {
  return <Home />;
}
```

### `src/app/globals.css` — Global Styles

Uses **Tailwind CSS v4** syntax (`@import "tailwindcss"` + `@theme inline`).

- Defines `--background` / `--foreground` CSS variables.
- Supports **automatic dark mode** via `prefers-color-scheme: dark`.
- Maps Geist font variables to Tailwind's `--font-sans` / `--font-mono` theme tokens.
- Slight inconsistency: `body { font-family: Arial, Helvetica, sans-serif; }` falls back to system fonts instead of using `var(--font-sans)`.

### `src/components/navbar/index.tsx` — Navbar

A **fixed, full-width navigation bar** with a gradient background (`#2d3548` → `#030a30`).

**Sections:**
| Section | Description |
|---|---|
| Left | Profile avatar (`profile-picture.png`) + placeholder username "Lorem Ipsum" |
| Center | Navigation links (Home, Deck, Gacha, Marketplace, Tournament) — hidden on mobile (`hidden lg:flex`) |
| Right | "Connect Wallet" SVG button + hamburger menu SVG button |

**Observations:**
- Navigation links are hardcoded as a static array. Routes like `/deck`, `/gacha`, `/marketplace`, `/tournament` do **not yet exist** in the app router (only `/` is implemented).
- The "Connect Wallet" button and hamburger menu are **non-functional** (no `onClick` handlers).
- Username is a placeholder (`"Lorem Ipsum"`).
- Mobile hamburger menu has no associated drawer/sidebar logic.
- Uses `next/image` correctly with explicit `width`/`height` and `priority` on the wallet button.

### `src/features/home/index.tsx` — Home Page

A **`"use client"`** component (required for Motion animations).

Implements a visually rich **hero section** using animated glowing blobs for a dreamy, web3-aesthetic background:

| Element | Description |
|---|---|
| Top triangle | A large purple (`#4D00FF`) triangle, clipped with `clip-path: polygon()`, blurred and scaled in on mount |
| Right blob | A wide horizontal ellipse (`#2E00FF`), low opacity, positioned off-canvas right |
| Left blob | A large circular blob (`#6F74AC`), top-left, medium opacity |
| Content container | `z-10` layer, full-height, centered — currently **empty** (placeholder comment only) |

All blobs use Motion's `initial={{ scale: 0 }} → animate={{ scale: 1 }}` with staggered delays for a smooth entrance animation.

> [!IMPORTANT]
> The content container (`div` with `relative z-10`) is **empty** — no hero text, CTA buttons, or content has been added yet.

---

## ⚙️ Configuration

### `next.config.ts`

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
};
```

Minimal config. `reactCompiler: true` enables the experimental React Compiler for automatic memoization. No custom image domains, redirects, or rewrites have been configured yet.

### `tsconfig.json`

- **Strict mode** enabled (`"strict": true`) — good for catching type errors early.
- **Path alias** `@/*` → `./src/*` for clean imports.
- **Target:** ES2017 — a bit conservative; could be updated to `ES2020`+ given the modern stack.
- `"incremental": true` for faster type-checking rebuilds.

### `eslint.config.mjs`

Uses the flat ESLint config format (ESLint 9+) with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` — this is the recommended and strictest Next.js lint preset.

---

## 🤝 Contributing (docs/CONTRIBUTING.md)

The project has a mature contribution workflow documented:

- **Branch model:** `main → dev → <type>/description-#<issue>`
- **Commit convention:** Conventional Commits (`feat`, `fix`, `docs`, `refactor`, etc.)
- **PR flow:** All PRs target `dev`, squash-merged by maintainers; `dev → main` is maintainer-only.

This is well-structured for a team hackathon project.

---

## 🔍 Observations & Recommendations

### ✅ Strengths

- Clean feature-based folder structure that scales well.
- Modern, cutting-edge stack (React 19, Next.js 16, React Compiler, TW v4).
- Smooth animated hero background with Motion — strong visual foundation.
- Strict TypeScript and ESLint configuration.
- Well-documented contribution guidelines.

### ⚠️ Issues & TODOs

| Priority | Issue | Location |
|---|---|---|
| 🔴 High | Home content container is empty — no hero text or CTAs | `features/home/index.tsx` |
| 🔴 High | Routes `/deck`, `/gacha`, `/marketplace`, `/tournament` don't exist yet | `src/app/` |
| 🟡 Medium | "Connect Wallet" button has no logic — no wallet integration | `components/navbar/index.tsx` |
| 🟡 Medium | Hamburger menu has no drawer/mobile nav | `components/navbar/index.tsx` |
| 🟡 Medium | Page `metadata.title` is still `"Create Next App"` | `src/app/layout.tsx` |
| 🟡 Medium | Username is hardcoded as `"Lorem Ipsum"` | `components/navbar/index.tsx` |
| 🟢 Low | `body` font-family falls back to Arial instead of Geist | `globals.css` |
| 🟢 Low | TypeScript target is ES2017 — can be bumped to ES2020+ | `tsconfig.json` |

### 💡 Suggestions

1. **Wallet Integration** — Add Polkadot.js or `@polkadot/extension-dapp` for wallet connection, which is likely a core hackathon requirement.
2. **Implement Missing Routes** — Create `src/app/deck/`, `src/app/gacha/`, `src/app/marketplace/`, and `src/app/tournament/` pages under the App Router.
3. **Hero Content** — Populate the home content container with a hero heading, subheading, and CTA button.
4. **Mobile Menu** — Implement a slide-in drawer for the hamburger button on smaller screens.
5. **Update Metadata** — Change `title` and `description` in `layout.tsx` to reflect the actual product name and pitch.
