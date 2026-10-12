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

### Alternative transitoire : route handler Next

Uniquement si la prod doit rester plusieurs mois sur Koyeb alors qu'on veut le
BFF avant la bascule. Koyeb sait aussi router des chemins entre services d'une
même app : à vérifier en premier.

Sinon, `apps/app/app/api/[...path]/route.ts` (pas `rewrites()`, évalué au
build et incompatible avec `BACKEND_URL` variable de déploiement ; timeout de
30 s et limite de body sur les rewrites externes). `proxy.ts` exclut déjà
`/api` de son matcher.

- Exporte `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` ;
  `fetch(new URL(pathname + search, BACKEND_INTERNAL_URL), { method, headers,
body: req.body, duplex: 'half', redirect: 'manual' })` ; réponse transmise
  telle quelle (statut, `Location`, `Set-Cookie` multiples, body en
  streaming) ; retire `host` et les en-têtes hop-by-hop ; ajoute
  `X-Forwarded-For/Host/Proto`.
- Cible l'URL **interne** du backend, pas `BACKEND_URL` public (sinon la
  requête ressort par le proxy d'entrée puis y revient).

Même chemin `/api`, même contrat : passer ensuite à Traefik se fait en
supprimant le fichier, sans toucher au client ni à ProConnect.

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

## Phase 2 — OIDC sur l'origine de l'app (⚠ action humaine)

2.1. **Humain** : déclarer chez ProConnect, pour chaque environnement, les
nouvelles URL (même chemin, hôte de l'app) : - `redirect_uri` : `https://app.…/api/v1/proconnect/callback`
(aujourd'hui `<BACKEND_URL>/api/v1/proconnect/callback`) ; - `post_logout_redirect_uri` équivalente.
2.2. Basculer `PRO_CONNECT_REDIRECT_URI` et
`PRO_CONNECT_POST_LOGOUT_REDIRECT_URI` (variables de déploiement backend,
`apps/backend/.env` en local).
2.3. Basculer les URL OIDC du navigateur sur `ENV.backend_browser_url` :
`login-user-with-oidc.urls.ts`, `create-user-with-oidc.urls.ts`,
`link-oidc-identity.profile-urls.ts` et leurs appelants,
`signup/page.tsx`, `sign-out-user.server.ts`.
2.4. Retirer `domain` de `idTokenCookieOptions()` (`oidc.controller.ts`) ;
supprimer `getRootDomainFromUrl` (`oidc.utils.ts`) s'il ne sert plus.
Passant par l'origine de l'app, les `Set-Cookie` sans `Domain` deviennent
host-only sur `app.…`.
2.5. Mettre à jour `oidc.controller.spec.ts`.
2.6. Migration : les cookies `id_token`/`provider` déjà posés sur le domaine
racine (TTL 12 h) expirent seuls.

## Phase 3 — Cookie Supabase host-only `__Host-`

**Calée sur la bascule GoTrue de la prod.** À ce moment, `SUPABASE_URL`
change et donc le nom du cookie aussi : tout le monde est déconnecté une fois
quoi qu'il arrive. Renommer en `__Host-…` ne coûte alors rien de plus, et
supprime le besoin d'une migration de cookies (pas de collision entre ancien
et nouveau nom).

Pour preprod/staging, la phase peut être appliquée dès que la phase 1 y est
en place (une reconnexion de plus).

3.1. `getCookieOptions()` : nom `__Host-sb-tet-<env>-auth-token` (via la
variable de la phase 0), sans `domain`, `secure: true`, `path: '/'`.
Retirer le `hostname` passé par `apps/app/app/root-providers.tsx` ;
supprimer `getRootDomain` de `packages/api/src/utils/pathUtils.ts` s'il
n'a plus d'autre usage (aujourd'hui aussi dans
`content-security-policy.config.ts`). Supprimer `COOKIE_DOMAIN` des
environnements.
3.2. Dev local : `__Host-` impose `Secure`. Les navigateurs acceptent les
cookies `Secure` sur `http://localhost`, mais vérifier Playwright et
garder un nom sans préfixe en local si besoin.
3.3. E2E : `getCookieDomain` (`e2e/tests/shared/supabase-client.utils.ts`) →
hôte de l'app.

## Phase 4 — Nettoyage

4.1. Backend : retirer `credentials: true` de `enableCors` (`main.ts`) et
réduire les origines autorisées. Le site n'appelle le backend que pour
des données publiques : vérifier qu'aucun appel du site n'envoie de
cookie.
4.2. Supprimer `apps/app/cors.config.ts` (et son appel dans `proxy.ts`) si
plus rien ne fait d'appel cross-origin vers l'app.
4.3. Retirer le montage `/trpc` historique si plus aucun appelant.
4.4. Supprimer le fallback `supabaseUrlToAuthCookieName` de la phase 0.2.

## Ordre de déploiement

1. Phase 0 sur preprod/staging.
2. Phases 1 et 2 sur preprod/staging, directement avec Traefik.
3. Phase 3 sur preprod/staging.
4. Prod : phases 1, 2 et 3 à la bascule Koyeb → Coolify.
5. Phase 4.

Le route handler Next n'intervient que si la prod doit obtenir le BFF avant sa
bascule (cf. « Alternative transitoire »).

## Vérification

- Connexion par mot de passe, magic link et ProConnect ; déconnexion
  (y compris le logout SSO amont) ; liaison d'une identité OIDC depuis le
  profil.
- Sessions preprod et staging indépendantes dans un même navigateur.
- Le cookie n'apparaît plus sur `territoiresentransitions.fr` (DevTools →
  Application → Cookies).
- Upload d'un document et d'un fichier d'import (sans lancer le LLM).
- L'IP client vue par le backend est la vraie (logs, rate limiting).

## Questions ouvertes

- Coolify : le domaine avec chemin génère-t-il bien la règle attendue, et
  le strip se désactive-t-il par l'API ?
- Dev local (1.6) : route handler limité au dev ou `rewrites()` conditionnel ?
- Les intégrations externes avec clé d'API (`apikeys.controller.ts`)
  continuent d'appeler `BACKEND_URL` directement : rien à changer, à
  confirmer.
