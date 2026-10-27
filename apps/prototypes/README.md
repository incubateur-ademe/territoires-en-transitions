# Prototypes

Prototypes de design construits avec le vrai design system (`@tet/ui`) : un
prototype se transpose tel quel dans `apps/app`.

- Lancer : `nx dev prototypes` (port 3002).
- Ajouter un prototype : `app/<slug>/page.tsx` et une entrée dans
  `src/prototypes.ts`.
- Vérifier : `nx lint prototypes` (le layout passe par `Stack`, `Inline`, `Grid`
  et `Box`, sans classe de layout ni valeur arbitraire).
- Partir d'une maquette Claude Design : `/proto-import <slug>` dans Claude Code.
- Captures desktop et mobile d'un prototype construit :
  `node apps/prototypes/scripts/capture.mjs --route <slug> --out <dossier>`.
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
2. **Token Bryntum** : en _Network secret_ (parfois appelé _API credentials_)
   lié à l'hôte `npm.bryntum.com`, injecté dans l'en-tête
   `Authorization: Bearer <token>`. Le proxy l'ajoute aux requêtes hors du
   container : il n'est jamais lisible dans la session. Le saisir directement
   dans le formulaire (jamais dans le chat ni le repo), idéalement un token
   dédié et révocable. Ne pas le mettre en variable d'environnement, ni
   fournir la clé dotenvx (`.env.keys`), qui déchiffrerait tous les secrets.
3. **Accès GitHub** au repo avec droit de push, pour publier les branches de
   prototypes.

Si un prérequis manque, le hook l'indique en début de session.

Sans token Bryntum ni accès à `codeload.github.com`, le hook se replie sur une
installation sans Bryntum ni `crisp-api`, dont les prototypes n'ont pas
besoin : il les retire de `package.json` et `pnpm-lock.yaml` le temps de
`pnpm install` (`.claude/hooks/strip-private-deps.mjs`), puis restaure les deux
fichiers. Les contrôles supply-chain restent actifs pour tout le reste. Les
prototypes se construisent et se capturent ; les pages de l'app qui utilisent
Bryntum, non.

## Déploiement

`nx build prototypes` produit un site statique dans `apps/prototypes/out/`,
aux chemins relatifs : il se publie tel quel sur un hébergement statique.

- **Preview depuis une session (locale ou cloud)** : déployer le dossier `out/`
  déjà construit (ex. `vercel deploy apps/prototypes/out`), sans build côté
  hébergeur, donc sans installer le monorepo ni fournir le token Bryntum.
- **Build par Vercel à chaque push** : root directory `apps/prototypes`,
  output `out`. L'installation se fait alors à la racine du monorepo et
  requiert le token du registre Bryntum (`BRYNTUM_ACCESS_TOKEN`, cf. `.npmrc`).
