# Prototypes

Prototypes de design construits avec le vrai design system (`@tet/ui`) : un
prototype se transpose tel quel dans `apps/app`.

- Lancer : `nx dev prototypes` (port 3002).
- Ajouter un prototype : `app/<slug>/page.tsx` et une entrée dans
  `src/prototypes.ts`.
- Vérifier : `nx lint prototypes` (le layout passe par `Stack`, `Inline`, `Grid`
  et `Box`, sans classe de layout ni valeur arbitraire).
- Conventions détaillées : `CLAUDE.md`.

## Depuis une session Claude Code cloud

Rien à installer en local : le hook `.claude/hooks/session-start.sh` installe
Node, pnpm et les dépendances, configure le navigateur Playwright (captures) et
vérifie que `nx build prototypes` passe. Il exige, dans les réglages de
l'environnement cloud :

- `BRYNTUM_ACCESS_TOKEN` en variable d'environnement ou en Network secret ;
- `npm.bryntum.com` et `codeload.github.com` dans les domaines autorisés.

Si l'installation échoue, le hook l'indique en début de session.

## Déploiement

`nx build prototypes` produit un site statique dans `apps/prototypes/out/`,
aux chemins relatifs : il se publie tel quel sur un hébergement statique.

- **Preview depuis une session (locale ou cloud)** : déployer le dossier `out/`
  déjà construit (ex. `vercel deploy apps/prototypes/out`), sans build côté
  hébergeur, donc sans installer le monorepo ni fournir le token Bryntum.
- **Build par Vercel à chaque push** : root directory `apps/prototypes`,
  output `out`. L'installation se fait alors à la racine du monorepo et
  requiert le token du registre Bryntum (`BRYNTUM_ACCESS_TOKEN`, cf. `.npmrc`).
