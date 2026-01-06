<!-- Project-specific Copilot / AI-agent guidance for contributors -->
# UNO64 — Copilot Instructions

Purpose: Short, practical rules to help AI coding agents be productive in this repository.

1. Project at-a-glance
- Framework: Next.js (App Router) using `app/` directory. See `app/layout.tsx` and `app/client-layout.tsx` for the root UI structure.
- Styling: Tailwind CSS (`app/globals.css`). Classes are applied inline on JSX elements.
- Auth & backend: Supabase client lives in `lib/supabase.ts` and uses public env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2. Key files and conventions (reference examples)
- `app/client-layout.tsx` — wraps children with `ModalProvider` and renders `Navbar` conditionally (homepage hides navbar).
- `app/context/ModalContext.tsx` — single source for modal state. API: `useModal()` returns `{ open, activeTab, openModal(tab?), closeModal(), setActiveTab() }`.
  - Important: `openModal` sets `activeTab` and then `open`, and it mutates `document.body.style.overflow` to lock scroll. Keep that ordering and cleanup when closing.
- `app/components/AuthModal.tsx` — uses `@supabase/auth-ui-react` and `supabase.auth.onAuthStateChange` to react to login/signup events and navigate to `/dashboard` on sign-in. It unsubscribes the listener in the effect cleanup.
- `lib/supabase.ts` — single client instance created with environment variables. Do not put server-only keys here; it's a client-side SDK instantiation.
- `app/components/*` — most components are client components and use the `"use client"` directive. Do not remove `"use client"` unless you intentionally migrate that component to a server component and update call sites.

3. Typical data flows and integration points
- Auth flow: UI -> `Auth` component (`AuthModal.tsx`) -> Supabase client (`lib/supabase.ts`) -> onAuthStateChange handler -> `router.replace('/dashboard')`.
- Modal flow: any component calls `openModal('login' | 'register')` from `useModal()` (example: `app/page.tsx`) -> `ModalProvider` updates state -> `AuthModal` opens.
- Navigation & layout: `app/layout.tsx` uses `ClientLayout` which decides whether to show `Navbar` by checking pathname; changing this logic affects the whole app.

4. Development & workflow commands
- Start dev server: `npm run dev` (alternatively `pnpm dev`/`yarn dev`).
- Build: `npm run build`.
- Start production server: `npm run start`.
- Lint: `npm run lint` runs `eslint`.
- Environment: local dev requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add them in your environment or Vercel project settings; restart the dev server after changes.

5. Practical guidance for AI edits (what to change and what to avoid)
- Preserving client/server boundaries: if a file contains `"use client"`, assume it reads/writes browser-only APIs (hooks, `document`, `window`, `next/navigation` client router). Converting to server could break behavior.
- Modal lifecycle: keep `openModal` order (`setActiveTab` then `setOpen`) and the `document.body.style.overflow` locking/unlocking — this is relied upon for scroll locking.
- Supabase usage: use the existing `supabase` exported from `lib/supabase.ts`. When adding server-side interactions, create server-only helpers separate from this client instance.
- Routing changes: `ClientLayout` controls navbar visibility using `usePathname`. Update carefully to avoid flipping the presence of global UI across routes.

6. Useful code snippets (copyable)
- Import supabase client:
```
import { supabase } from '@/lib/supabase';
```
- Open modal from a client component:
```
import { useModal } from '@/app/context/ModalContext';
const { openModal } = useModal();
openModal('login');
```

7. Actions the agent should ask before doing
- Adding or changing environment variables that affect runtime (ask for values or instructions for secure handling).
- Converting client components into server components (confirm intent and test paths that depend on client-only APIs).

8. Where to look next (quick links)
- Root layout: `app/layout.tsx`
- Client wrapper: `app/client-layout.tsx`
- Modal context: `app/context/ModalContext.tsx`
- Auth UI: `app/components/AuthModal.tsx`
- Supabase client: `lib/supabase.ts`

If anything here is unclear or you want the guidance tuned (more strict typing rules, testing instructions, or CI details), tell me which area to expand and I'll update this file.
