---
description: Frontend design conventions and component patterns for My SaaS — buttons, hero section, banners, and UI aesthetics
user-invocable: true
---

# Frontend Design Skill

Design and maintain the frontend UI for My SaaS (`apps/client/`). Follow these conventions when creating or modifying components.

## Button System

**File**: `libs/ui/src/variants/button.ts`

### Base classes
```
inline-flex select-none items-center justify-center rounded-md text-sm font-semibold tracking-wide
transition-all duration-200 ease-out
active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40
focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
```

### Variants
| Variant | Style |
|---------|-------|
| `primary` | Colored shadow + lifts on hover (`hover:-translate-y-0.5`), shadow deepens |
| `secondary` | Shadow reveal + lift on hover |
| `outline` | Border that fades on hover, shadow reveal |
| `ghost` | No shadow, background reveal on hover |
| `link` | Underline on hover, no padding |
| `error/warning/info/success` | Matching colored shadow (`shadow-{color}/25`) + lift |

### Sizes
| Size | Height | Padding | Text |
|------|--------|---------|------|
| `sm` | `h-8` | `px-4` | `text-xs` |
| `md` | `h-9` | `px-5` | `text-sm` |
| `lg` | `h-11` | `px-8` | `text-base` |
| `icon` | `size-9` | — | — |

### Rules
- Always use `rounded-md` (not `rounded-sm`)
- Primary buttons get colored drop shadows (`shadow-primary/30`)
- Lift effect (`hover:-translate-y-0.5`) on all solid variants
- Link variant always overrides height/padding to `h-auto px-0` via `compoundVariants`

---

## Hero Section

**File**: `apps/client/src/pages/home/sections/hero/index.tsx`

- No `Finally,` label above the headline — removed entirely
- Badge shows version: `Version 1.0`
- Link next to badge: `Source code` (links to `https://github.com/ziotech-devs/my-saas`) with `GithubLogoIcon` and `ArrowRightIcon`
- Headline uses `.hero-title` CSS class: animated shimmer gradient between `--foreground` and `--primary`
- Subheading: `prose prose-base prose-zinc max-w-2xl text-lg leading-8 dark:prose-invert`
- Animations: staggered `framer-motion` with `staggerChildren: 0.12`, `delayChildren: 0.1`

### CTA Buttons (`call-to-action.tsx`)
- **Primary**: `Build your SaaS` → links to `/auth/login`
- **Secondary**: `Explore features` + `CompassIcon` → links to docs (external, `noopener noreferrer nofollow`)
- Logged-in state: `Go to Dashboard` + `Logout` with `SignOutIcon`

---

## Donation Banner

**File**: `apps/client/src/pages/home/components/donation-banner.tsx`

- Icon: `StarIcon` (weight `bold`, size `14`)
- Text: `Unlock premium features and take your productivity to the next level. Start your free trial today.`
- Classes: `font-sans font-bold text-xs` on a `bg-zinc-800 text-zinc-50` bar
- Hover: animates height from `32` to `48` via `framer-motion`
- Links to `#pricing`

---

## Design Principles

- **Font**: `font-sans` for UI elements (set explicitly, never rely on browser default)
- **Buttons**: always lift on hover, colored shadows for primary actions
- **Motion**: use `framer-motion` for entrance animations; stagger children for sections
- **Icons**: `@phosphor-icons/react` — always pass `weight` and `size` explicitly
- **No default exports** — use named exports everywhere
- **Tailwind only** — no inline styles or CSS files for component styling
