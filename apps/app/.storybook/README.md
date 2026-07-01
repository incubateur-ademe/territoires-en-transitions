# Storybook (apps/app)

Lancement : `pnpm storybook:app`.

## Contraintes de config (non-évidentes)

- **`optimizeDeps.include` des sous-chemins `@tet/domain/*`** (`main.ts`).
  `@tet/domain` est distribué en CJS ; `@tet/api` (consommé depuis `src`)
  l'importe en ESM. Sans pré-bundle Vite, les imports nommés échouent
  (`does not provide an export named ...`) et bloquent toutes les stories.
  → En ajoutant une story qui importe un nouveau sous-chemin `@tet/domain/*`,
  l'ajouter à cette liste.

- **`.env` chargé via `dotenv`** (`main.ts`). `nx storybook app` s'exécute au
  cwd racine du monorepo, donc `apps/app/.env` n'est pas chargé
  automatiquement ; sans lui, `createBrowserClient('')` lève une exception.

- **Providers réels dans `preview.tsx`.** Chaque story est enveloppée dans
  Supabase / tRPC / Collectivité avec un `user` mocké. Le mock doit suivre le
  schéma `UserWithRolesAndPermissions`. Une story dont le composant appelle
  tRPC/supabase renverra `401` (pas de session) : préférer la variante
  présentationnelle `*Base` ou mocker la donnée.
