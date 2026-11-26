---
title: "refactor: Backend en same-origin et cookie d'auth host-only"
type: refactor
status: draft
date: 2026-10-09
---

# refactor: Backend en same-origin et cookie d'auth host-only

## Overview

Le cookie de session Supabase est posé sur `Domain=.territoiresentransitions.fr`
(`packages/api/src/utils/supabase/cookie-options.ts`). C'était nécessaire pour
le partager avec `apps/auth` et `apps/panier`, toutes deux supprimées.

Il reste un consommateur : **le backend**, appelé directement par le navigateur
sur un autre sous-domaine (`BACKEND_URL`) avec `credentials: 'include'`
(`packages/api/src/utils/trpc/trpc-with-react-query.provider.tsx`). Le backend
authentifie en lisant ce cookie en priorité
(`apps/backend/src/utils/trpc/trpc.service.ts`,
`extractAccessTokenFromSupabaseCookie`). Le flux OIDC « lier une identité »
relit aussi la session depuis ce cookie, et les cookies OIDC `id_token` /
`provider` sont eux aussi posés sur le domaine racine
(`oidc.controller.ts`, `idTokenCookieOptions`).

Objectif : faire passer les appels navigateur → backend par l'origine de l'app
(pattern BFF), puis restreindre les cookies d'auth à l'hôte de l'app.

## État (2026-11-24)

| Phase                               | Preprod        | Prod (Koyeb)                 |
| ----------------------------------- | -------------- | ---------------------------- |
| 0 — nom de cookie par environnement | fait           | sans objet (Supabase cloud)  |
| 1 — proxy same-origin `app.…/api`   | fait (Traefik) | code prêt (route handler)    |
| 2 — OIDC sur l'origine de l'app     | code prêt      | code prêt, variables à poser |
| 3 — cookie `__Host-`                | code prêt      | code prêt, variables à poser |

Les phases 1 à 3 s'activent par variables d'environnement, sans redéploiement
de code : voir « Ordre de déploiement ».

## Pourquoi

### Déclencheur : collision de cookie avec GoTrue self-hosté

Le nom du cookie est dérivé du premier label de `SUPABASE_URL`
(`supabaseUrlToAuthCookieName`, `packages/domain`) : `sb-<label>-auth-token`.
Avec Supabase cloud, ce label était la référence du projet, unique par
environnement. Avec GoTrue self-hosté derrière Coolify, il vaut `supabase-api`
partout :

| Environnement | `SUPABASE_URL`                                             | Cookie                       |
| ------------- | ---------------------------------------------------------- | ---------------------------- |
| preprod       | `https://supabase-api.preprod.territoiresentransitions.fr` | `sb-supabase-api-auth-token` |
| staging       | `https://supabase-api.staging.territoiresentransitions.fr` | `sb-supabase-api-auth-token` |
| prod (cible)  | `https://supabase-api.territoiresentransitions.fr`         | `sb-supabase-api-auth-token` |

Tous posés sur `.territoiresentransitions.fr` : preprod et staging s'écrasent
déjà mutuellement, la prod les rejoindra à la bascule.

Le cookie host-only règle le problème de fond, mais seulement une fois que
**tous** les environnements ont basculé (un cookie racine posé par l'un reste
envoyé aux autres). D'où la phase 0, qui débloque immédiatement en donnant un
nom distinct par environnement.

### Bénéfices du same-origin

- Surface réduite : le jeton de session n'est plus envoyé au site
  (`territoiresentransitions.fr`) ni à tout futur sous-domaine.
- Plus de CORS avec credentials (backend `main.ts`, `apps/app/cors.config.ts`
  hérité de `apps/auth`).
- CSP `connect-src` simplifiée.
- Les apps de test n'ont plus de cookie cross-site à faire passer.

C'est la recommandation du brouillon IETF _OAuth 2.0 for Browser-Based Apps_
(BFF) et de l'OWASP (cookies host-only, idéalement préfixe `__Host-`).

## Choix techniques

### Préfixe `/api`, sans réécriture de chemin

L'app Next n'a plus aucune route sous `/api` (`apps/app/app/api` n'existe
plus ; `/api/version` est devenu `/version`, `/api/zip` a été supprimé). Le
préfixe `/api` de l'app est donc libre et revient entièrement au backend.

Le backend sert déjà ses contrôleurs sous `/api/v1` (`setGlobalPrefix`,
`main.ts`). On route `app.…/api/*` vers le backend **sans retirer le
préfixe** : les chemins sont identiques des deux côtés.

- `app.…/api/v1/…` → backend `/api/v1/…` (contrôleurs, OIDC, uploads) ;
- tRPC est monté sur `/trpc` (`trpc.router.ts`) : on le monte aussi sur
  `/api/trpc`. `/trpc` reste servi pour le client serveur, `trpc-ui` et les
  appels directs, et pourra être retiré plus tard.
- `/version` et `/throw` (exclus du préfixe global) ne sont pas exposés sur
  l'origine de l'app : rien à faire.

Conséquence utile : le `redirect_uri` ProConnect garde son chemin actuel
(`/api/v1/proconnect/callback`), seul l'hôte change.

### Proxy : Traefik (Coolify)

Dans chaque environnement, l'app et le backend tournent sur le même serveur
Coolify (`infra/coolify/applications.tf`, champ `server`). Le Traefik de ce
serveur voit les deux conteneurs et peut router par chemin :

```hcl
backend = [
  "https://api.preprod.territoiresentransitions.fr",
  "https://app.preprod.territoiresentransitions.fr/api",
]
```

- Coolify génère une règle `Host(app.…) && PathPrefix(/api)`. Traefik
  ordonne les routers par longueur de règle : celui-ci passe devant le router
  `Host(app.…)` de l'app.
- Coolify active par défaut un middleware `stripprefix` sur les domaines avec
  chemin : **il faut le désactiver** pour le backend (réglage « Strip
  Prefixes » de l'application, à exposer dans
  `infra/scripts/coolify-upsert-application.sh`).
- **À vérifier sur la preprod** : les labels Traefik générés (règle,
  priorité, absence de strip). À défaut, poser les labels à la main, comme
  pour GoTrue dans `infra/nonprod/supabase-api/docker-compose.yml`.

Avantages sur un route handler Next : pas de saut supplémentaire par le
process Node, pas de streaming ni d'en-têtes hop-by-hop à gérer, pas de
timeout ni de limite de body à surveiller (import IA, exports longs).
`X-Forwarded-*` est posé par Traefik.

### Prod sur Koyeb : route handler Next

Sur Koyeb, l'app et le backend sont deux apps distinctes, sans routage par
chemin. Le proxy y est `apps/app/app/api/[...path]/route.ts` (pas `rewrites()`,
évalué au build et incompatible avec `BACKEND_URL` variable de déploiement ;
timeout de 30 s et limite de body sur les rewrites externes). `proxy.ts` exclut
déjà `/api` de son matcher.

- Relaie méthode, en-têtes et corps (en flux) vers `BACKEND_URL`, chemin
  conservé ; redirections et `Set-Cookie` rendus tels quels.
- Pose `X-Forwarded-Host` (hôte d'arrivée), comme Traefik : le backend s'en
  sert pour l'OIDC (phase 2).
- Coût : un saut de plus par le process Node de l'app pour tout le trafic API
  du navigateur. À surveiller : charge de l'instance, requêtes longues
  (exports), envois de fichiers.

Même chemin `/api`, même contrat : à la bascule Coolify, Traefik intercepte
`app.…/api` avant Next et le fichier se supprime sans toucher au client ni à
ProConnect.

### Proxys de confiance

Le nombre de proxys devant le backend varie (Traefik seul, ou Traefik → Next).
Rendre `trust proxy` (Express) configurable par variable d'environnement
plutôt que codé en dur : il conditionne l'IP client du rate limiting et des
logs (`getClientIp`, `trpc.service.ts`).

## Phase 0 — Nom de cookie par environnement (débloque preprod/staging)

0.1. `getCookieOptions()` : renseigner `name` (aujourd'hui en commentaire)
depuis une variable, ex. `SUPABASE_AUTH_COOKIE_NAME=sb-tet-preprod-auth-token`.
`@supabase/ssr` s'en sert aussi comme `storageKey`.
0.2. Backend : `supabase-cookie-parser.ts` lit ce même nom depuis sa config
au lieu de `supabaseUrlToAuthCookieName(supabaseUrl)` (fallback sur
l'ancien calcul si la variable est absente, pour la prod Koyeb).
Adapter `oidc.controller.spec.ts`.
0.3. Déclarer la variable pour preprod et staging (Secret Manager → Coolify,
`infra/coolify/env-manifest.tf`), app **et** backend.
0.4. E2E : le helper de cookie (`e2e/tests/shared/supabase-client.utils.ts`)
utilise le même nom.

Effet : une reconnexion pour les utilisateurs de preprod/staging. La prod
(Koyeb, Supabase cloud) n'est pas concernée.

## Phase 1 — Proxy same-origin (cookies inchangés)

Déployable seule, sans impact sur les sessions.

1.1. Backend : monter le middleware tRPC aussi sur `/api/trpc`.
1.2. Infra : ajouter `https://app.<env>…/api` aux domaines du backend
(`applications.tf`), strip désactivé ; vérifier les labels Traefik.
Commencer par preprod.
1.3. ~~Backend : `trust proxy` configurable~~ — inutile : `getClientIp`
lit la première entrée de `X-Forwarded-For`, que Traefik conserve quel
que soit le nombre de sauts. `req.ip` n'est utilisé qu'en repli.
1.4. Faire passer les appels navigateur par l'origine de l'app, **opt-in par
environnement** via `BACKEND_BROWSER_URL` (clé publique, ex.
`https://app.preprod.territoiresentransitions.fr`). Absente (prod
Koyeb) : comportement inchangé. - client tRPC navigateur : `getBrowserTrpcUrl()` → `<BACKEND_BROWSER_URL>/api/trpc` ;
le client serveur (`trpc-server-client.ts`) et le site gardent
`getTrpcUrl()`, en direct ; - `apps/app/src/utils/use-api-client.ts` (`ENV.backend_browser_url`). - **OIDC : reporté en phase 2.** Les cookies du flux (`state`, `nonce`,
`logout-state`) sont host-only, posés par l'hôte qui sert `/login`
ou `/logout`. Tant que `redirect_uri` pointe sur `api.…`, servir
`/login` depuis `app.…` les rendrait invisibles au callback. - `sign-out-user.server.ts` : URL de logout OIDC → idem, phase 2.
1.5. CSP : rien à faire, `'self'` couvre déjà `/api`. Retirer `BACKEND_URL`
du `connect-src` en phase 4.
1.6. Dev local et CI : reporté. Sans `BACKEND_BROWSER_URL`, le navigateur
appelle le backend en direct comme aujourd'hui.

Points de vigilance :

- Upload de l'import IA (`enqueue-import.controller.ts`,
  `AI_PLAN_IMPORT_MAX_SOURCE_BYTES`) : tester un fichier proche de la limite.
  **Ne pas déclencher d'import IA réel** (cf. CLAUDE.md) : tester avec le
  backend local et un faux LLM, ou faire valider l'upload par un humain.
- Requêtes longues (exports) : vérifier les timeouts Traefik.

## Phase 2 — OIDC sur l'origine de l'app (⚠ action humaine par provider)

Deux dépendances de l'OIDC au domaine racine :

- la liaison de compte (`mode=link`) lit le cookie de session au départ du flux
  et au retour du provider (`resolveAuthenticatedUserId`) : avec un cookie
  limité à l'hôte de l'app, elle redeviendrait silencieusement une connexion
  simple si le flux passait par `api.…` ;
- les cookies `id_token` / `oidc-provider` sont posés par `api.…` sur le
  domaine racine pour être lus par l'app (déconnexion).

Tout se pilote par la redirect URI du provider, **provider par provider** :

2.1. **Humain** : déclarer chez le provider les URL sur l'hôte de l'app (même
chemin) — `https://app.…/api/v1/<provider>/callback` et
`…/logout/callback`. Fait pour ProConnect. À faire pour Mon Compte ADEME.
2.2. Basculer `<PROVIDER>_REDIRECT_URI` et
`<PROVIDER>_POST_LOGOUT_REDIRECT_URI` (variables de déploiement backend).
2.3. Backend (`getOidcFlowRedirectUrl`, `oidc.utils.ts`) : quand la redirect
URI est sur l'origine de l'app, `/login` et `/logout` atteints par `api.…`
renvoient (302) vers la même URL sur l'origine de l'app. Les URL OIDC du
navigateur (`ENV.backend_url`) restent donc inchangées, et un provider
resté sur `api.…` continue de fonctionner à côté.
2.4. Backend (`idTokenCookieOptions`) : sans `Domain` quand la redirect URI est
sur l'origine de l'app — les cookies `id_token` / `oidc-provider` deviennent
limités à l'hôte de l'app.
2.5. Migration : les cookies `id_token`/`provider` déjà posés sur le domaine
racine (TTL 12 h) expirent seuls.

Tant qu'un provider reste sur `api.…` avec un cookie de session `__Host-`, sa
liaison de compte ne fonctionne pas (connexion et inscription : inchangées).

## Phase 3 — Cookie Supabase host-only `__Host-`

Prérequis dans l'environnement visé : phases 1 et 2. Preprod d'abord.

3.1. `getCookieOptions()` : piloté par le nom. Si
`SUPABASE_AUTH_COOKIE_NAME` commence par `__Host-` : pas de `domain`,
`secure: true`, `path: '/'`. Sans la variable (local, CI), rien ne change —
pas de question de cookie `Secure` sur `http://localhost`.
3.2. Nom : l'ancien nom préfixé de `__Host-`
(`__Host-sb-tet-preprod-auth-token` ; en prod
`__Host-sb-<ref du projet Supabase>-auth-token`). L'ancien cookie se déduit
ainsi du nouveau, côté app comme côté backend.
3.3. Backend : même variable (le serveur Next lui relaie le cookie sous ce
nom, `trpc-server-client.ts`). `supabase-cookie-parser.ts` lit aussi
l'ancien nom, pour les onglets ouverts avant la migration.
3.4. Migration (`migrateLegacyRootDomainCookies`, `proxy-client.ts`) : si
l'ancien cookie est présent (morceaux `.0`, `.1`… compris), il est recopié
sous le nouveau nom puis **supprimé explicitement** du domaine racine.
Personne n'est déconnecté. La suppression est faite même sans recopie :
l'ancien cookie vit ~3 ans et son jeton de rafraîchissement reste valide
tant que l'utilisateur ne revient pas. Garder ce code au moins 6 mois après
l'activation en prod ; passé ce délai, un utilisateur qui revient avec le seul
ancien cookie se reconnecte.
Risque accepté : tant qu'un navigateur n'est pas revenu sur l'app, il garde
l'ancien cookie et l'envoie aux autres sous-domaines, comme aujourd'hui. Pas
de révocation des sessions : elle déconnecterait tout le monde pour fermer une
exposition qui existe déjà et s'éteint au fil des visites.
3.5. Ensuite : retirer le `hostname` passé par
`apps/app/app/root-providers.tsx`, `COOKIE_DOMAIN`, et `getRootDomain`
de `pathUtils.ts` s'il n'a plus d'autre usage (aujourd'hui aussi dans
`content-security-policy.config.ts`).

## Phase 4 — Nettoyage

4.1. Backend : retirer `credentials: true` de `enableCors` (`main.ts`) et
réduire les origines autorisées. Le site n'appelle le backend que pour
des données publiques : vérifier qu'aucun appel du site n'envoie de
cookie.
4.2. Supprimer `apps/app/cors.config.ts` (et son appel dans `proxy.ts`) si
plus rien ne fait d'appel cross-origin vers l'app.
4.3. Retirer le montage `/trpc` historique si plus aucun appelant.
4.4. Supprimer le fallback `supabaseUrlToAuthCookieName` de la phase 0.2,
seulement une fois `SUPABASE_AUTH_COOKIE_NAME` déclarée dans tous les
environnements qui lisent la session (prod, local, CI, app **et** backend)
et rendue obligatoire dans la validation de config. Passé le délai de
conservation (3.4), supprimer aussi le repli sur l'ancien nom (3.3) et la
migration de cookie (3.4).
4.5. À la bascule Coolify de la prod : supprimer le route handler
`apps/app/app/api/[...path]/route.ts`.

## Ordre de déploiement

1. ~~Phases 0 et 1 sur preprod.~~
2. Code des phases 1 (route handler), 2 et 3 : inerte tant que les variables
   ne sont pas posées.
3. Activation dans un environnement, dans cet ordre :
   1. backend : `SUPABASE_AUTH_COOKIE_NAME=__Host-…` (il lit encore l'ancien
      nom) et redirect URI OIDC sur l'hôte de l'app ;
   2. app : `BACKEND_BROWSER_URL=<origine de l'app>` et
      `SUPABASE_AUTH_COOKIE_NAME=__Host-…` (variables GitHub du même nom pour
      la prod Koyeb, `env-manifest.tf` pour Coolify).
4. Phase 4. Le retrait du repli sur l'ancien nom et de la migration de
   cookie (4.4) attend la fin du délai de conservation (3.4).

Retour arrière : retirer `__Host-` du nom déconnecte les sessions déjà migrées
(l'ancien cookie a été supprimé).

## Vérification

- Connexion par mot de passe, magic link et ProConnect ; déconnexion
  (y compris le logout SSO amont) ; liaison d'une identité OIDC depuis le
  profil.
- Sessions preprod et prod indépendantes dans un même navigateur.
- Le `Set-Cookie` de session ne porte plus de `Domain` et commence par
  `__Host-` ; l'ancien cookie du domaine racine a disparu après une visite.
- Le cookie n'apparaît plus sur `territoiresentransitions.fr` (DevTools →
  Application → Cookies).
- Upload d'un document et d'un fichier d'import (sans lancer le LLM).
- L'IP client vue par le backend est la vraie (logs, rate limiting).

## Questions ouvertes

- Coolify : le domaine avec chemin génère-t-il bien la règle attendue, et
  le strip se désactive-t-il par l'API ?
- Dev local (1.6) : poser `BACKEND_BROWSER_URL=http://localhost:3000` pour
  passer par le route handler ?
- Les intégrations externes avec clé d'API (`apikeys.controller.ts`)
  continuent d'appeler `BACKEND_URL` directement : rien à changer, à
  confirmer.
