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
vérifie que `nx build prototypes` passe.

### Prérequis (une fois par environnement cloud)

Dans les réglages de l'environnement (menu de l'environnement dans la barre de
titre de la session → _Edit_). Un script de la session ne peut pas les poser
lui-même : la politique réseau est appliquée hors du container.

1. **Network access** : garder le niveau _Limited_ et ajouter
   `npm.bryntum.com` (registre privé Bryntum) et `codeload.github.com`
   (dépendance de `crisp-api` hébergée sur GitHub) dans _Allowed domains_, en
   laissant cochée la case _Allow package managers_. Cf.
   https://code.claude.com/docs/en/cloud-environments#network-access.
2. **Token Bryntum** : `BRYNTUM_ACCESS_TOKEN` en _Network secret_ ou en
   variable d'environnement. Ne jamais le coller dans le chat.
3. **Accès GitHub** au repo avec droit de push, pour publier les branches de
   prototypes.

Si un prérequis manque, le hook l'indique en début de session.

## Déploiement

`nx build prototypes` produit un site statique dans `apps/prototypes/out/`,
aux chemins relatifs : il se publie tel quel sur un hébergement statique.

- **Preview depuis une session (locale ou cloud)** : déployer le dossier `out/`
  déjà construit (ex. `vercel deploy apps/prototypes/out`), sans build côté
  hébergeur, donc sans installer le monorepo ni fournir le token Bryntum.
- **Build par Vercel à chaque push** : root directory `apps/prototypes`,
  output `out`. L'installation se fait alors à la racine du monorepo et
  requiert le token du registre Bryntum (`BRYNTUM_ACCESS_TOKEN`, cf. `.npmrc`).
