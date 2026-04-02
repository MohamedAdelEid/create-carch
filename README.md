# carch

> Clean Architecture scaffold for Next.js — generate a full project, modules, CRUD, and i18n from the CLI.

[![npm version](https://img.shields.io/npm/v/carch)](https://www.npmjs.com/package/carch)
[![license](https://img.shields.io/npm/l/carch)](./LICENSE)
[![author](https://img.shields.io/badge/author-Mohamed%20Adel%20Eid-blue)](https://github.com/MohamedAdelEid)

---

## Quick start

```bash
npm create carch@latest
```

---

## Commands

### `npm create carch@latest`

Interactive project creation. Asks you:

| Prompt | Options |
|---|---|
| Project name | any |
| Architecture | **Modular Clean Architecture** · Clean Architecture |
| Modules | comma-separated (e.g. `admin, teacher, student`) |
| Locales | comma-separated codes (e.g. `ar, en, fr`) |
| Default locale | from your locales |
| Auth | next-auth (JWT + httpOnly cookie) |
| Data fetching | TanStack Query + Axios · SWR + Axios · Axios only |
| UI library | shadcn/ui + Tailwind v4 · Tailwind v4 · None |
| Extras | RHF + Zod · TanStack Table · Framer Motion · Sonner |
| Package manager | npm · pnpm · bun · yarn |

---

### `carch add:module <moduleName>`

Adds a new module with the full 4-layer clean architecture.

```bash
carch add:module exams
```

Creates:

```
src/modules/exams/
├── presentation/
│   ├── pages/
│   ├── components/
│   ├── assets/images/
│   └── icons/
├── domain/
│   ├── entities/
│   └── types/
├── application/
│   ├── hooks/
│   └── services/
├── infrastructure/
│   ├── api/
│   └── integrations/
├── i18n/
│   ├── ar/dashboard/index.json
│   └── en/dashboard/index.json
└── module.config.ts
```

Also creates `src/app/(exams)/` route group.

> After running, register the module in `src/config/modules.ts`.

---

### `carch add:crud <module> <entity>`

Generates a full CRUD stack for an entity inside a module.

```bash
carch add:crud teacher course
```

| File | Layer |
|---|---|
| `domain/entities/course.entity.ts` | Zod schema + type |
| `domain/types/course.types.ts` | DTOs and filters |
| `infrastructure/api/courses.api.ts` | API calls |
| `infrastructure/api/courses.api.types.ts` | Raw response types |
| `application/hooks/useCourses.ts` | List query + filters |
| `application/hooks/useCourseMutations.ts` | Create / update / delete |
| `presentation/components/courses/CourseColumns.tsx` | TanStack Table columns |
| `presentation/components/courses/CourseForm.tsx` | RHF + Zod form |
| `presentation/components/courses/CreateCourseDialog.tsx` | Create modal |
| `presentation/components/courses/EditCourseDialog.tsx` | Edit modal |
| `presentation/components/courses/DeleteCourseDialog.tsx` | Delete confirm |
| `presentation/pages/CoursesPage.tsx` | Full page |

---

### `carch add:i18n`

Interactive command to add a translation namespace to a module or to shared.

```bash
carch add:i18n
```

Prompts:

1. **Where?** — `shared` or a specific module
2. **Namespace name** — e.g. `courses`, `settings`
3. **File names** — e.g. `index` or `table, form, hero`

Creates files for every detected locale, then **automatically registers** the namespace in `module.config.ts` (or `config/i18n.ts` for shared).

Example output for `carch add:i18n` → module: `teacher`, namespace: `courses`, files: `table, form`:

```
src/modules/teacher/i18n/
├── ar/courses/
│   ├── table.json
│   └── form.json
└── en/courses/
    ├── table.json
    └── form.json
```

---

## Architecture (generated project)

```
src/
├── app/                       next.js routing shell — re-exports only
│   ├── (auth)/login/
│   └── (teacher)/             one route group per module
│       ├── layout.tsx         role guard + DashboardLayout
│       └── dashboard/page.tsx
│
├── modules/
│   └── teacher/               same pattern for every module
│       ├── presentation/      layer 1 — UI only
│       ├── domain/            layer 2 — Zod entities + types
│       ├── application/       layer 3 — hooks + services
│       ├── infrastructure/    layer 4 — API + integrations
│       └── i18n/              module translations
│
├── shared/                    cross-module code, same 4 layers
├── config/                    env, constants, i18n registration
├── lib/                       cn, toast, format
├── providers/                 QueryProvider, AppProviders
├── styles/                    globals.css, fonts.css
└── middleware.ts              next-auth + next-intl
```

### Dependency rule

```
Presentation → Application → Domain ← Infrastructure
```

- **Presentation** — React components and pages. No API calls.
- **Domain** — Zod schemas and TypeScript types. No framework imports.
- **Application** — Hooks orchestrating domain + infrastructure.
- **Infrastructure** — Axios API calls and third-party SDKs.

---

## Tech stack (generated project)

| Concern | Package |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind v4 |
| UI | shadcn/ui |
| Data fetching | TanStack Query + Axios |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Auth | next-auth |
| i18n | next-intl |
| Toast | Sonner |
| Animation | Framer Motion |

---

## Author

**Mohamed Adel Eid**
[dev.mohamedadell@gmail.com](mailto:dev.mohamedadell@gmail.com)
[github.com/MohamedAdelEid](https://github.com/MohamedAdelEid)

---

## License

MIT
