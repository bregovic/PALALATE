# Palalate Development Standards & Instructions

Toto jsou naše standardy pro vývoj aplikace **Palalate**. Prosím, dodržuj je při každé úpravě kódu.

## 📱 Mobile-First & Responsiveness
*   Všechny nové prvky musí být **vždy optimalizovány pro mobilní zařízení**.
*   Testuj zobrazení na malých obrazovkách.
*   Používej flexibilní layouty a CSS proměnné z `globals.css`.

## 💎 Premium Design Aesthetics
*   Aplikace musí působit **prémiovým dojmem** (moderní dark mode, glassmorphism, jemné animace).
*   Vyhýbej se základním barvám. Používej definovanou paletu v `globals.css` (např. `var(--brand-500)`, `var(--bg-card)`).
*   Snaž se o čistý, "vzdušný" design s dostatečným paddingem.

## 🛠️ Evidence Vývoje (Sekce Vývoj)
*   **Každé nasazení (deployment) nebo významná změna musí být zaznamenána** v sekci **Nastavení -> Vývoj -> Historie verzí**.
*   Záznamy se přidávají buď přes UI (jako Admin) nebo přímo přes API `/api/development/releases`.
*   Uváděj verzi (pokud se mění) a stručný popis novinek.

## 🐛 Bug Tracking & Feedback
*   Chyby a bugy se evidují v sekci **Nastavení -> Vývoj -> Bugy & Feedback**.
*   Při hlášení bugu se snaž přiložit **snímek obrazovky** (clipboard Ctrl+V).
*   Vždy sleduj a aktualizuj stav bugu (**Pending -> In Progress -> Deployed -> Tested -> Closed**).

## 🌍 Lokalizace & Jazyk
*   UI musí být **kompletně v češtině**.
*   Data a časy formátuj podle českých zvyklostí (`cs-CZ`).

## 🧱 Struktura Kódu
*   Používej **Next.js (App Router)** a **TypeScript**.
*   Styluj primárně pomocí **globals.css** a sémantických tříd (`.btn`, `.card`, `.form-input`). Vyhýbej se přílišnému hromadění inline Tailwind tříd v komponentách, pokud existuje globální standard.
*   Databáze: **Prisma**. Po změně `schema.prisma` nezapomeň na `npx prisma generate` a `npx prisma db push`.
