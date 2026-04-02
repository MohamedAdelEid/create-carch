# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2025-04-01

### Added
- `npm create carch@latest` — interactive project creation
- `carch add:module <n>` — scaffold a new module with 4 clean layers
- `carch add:crud <module> <entity>` — generate full CRUD boilerplate (12 files)
- `carch add:i18n` — interactive i18n namespace generator with auto-registration
- Modular Clean Architecture template (presentation / domain / application / infrastructure)
- Clean Architecture template (single-app)
- next-intl integration with per-module and shared namespaces
- next-auth integration with JWT + httpOnly cookie
- TanStack Query + Axios HTTP client with interceptors
- shadcn/ui + Tailwind v4 support
- React Hook Form + Zod form generation
- TanStack Table columns generation
- Sonner toast wrapper (`lib/toast.ts`)
- Strict TypeScript 5 config
- RTL support via Tailwind `rtl:` variants
