# Prototypes

Prototypes de design construits avec le vrai design system (`@tet/ui`) : un
prototype se transpose tel quel dans `apps/app`.

- Lancer : `nx dev prototypes` (port 3002).
- Ajouter un prototype : `app/<slug>/page.tsx` et une entrée dans
  `src/prototypes.ts`.
- Vérifier : `nx lint prototypes` (le layout passe par `Stack`, `Inline`, `Grid`
  et `Box`, sans classe de layout ni valeur arbitraire).
- Conventions détaillées : `CLAUDE.md`.

## Déploiement Vercel

- Root directory : `apps/prototypes`, framework Next.js.
- L'installation se fait à la racine du monorepo : elle requiert le token du
  registre Bryntum (`BRYNTUM_ACCESS_TOKEN`, cf. `.npmrc`) dans les variables
  d'environnement du projet Vercel.
- Les pages sont statiques : aucune variable d'environnement applicative.
