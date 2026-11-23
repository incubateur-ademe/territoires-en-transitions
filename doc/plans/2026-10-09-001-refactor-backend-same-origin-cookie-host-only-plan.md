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

## État (2026-11-23)

| Phase                               | Preprod   | Prod (Koyeb)                |
| ----------------------------------- | --------- | --------------------------- |
| 0 — nom de cookie par environnement | fait      | sans objet (Supabase cloud) |
| 1 — proxy same-origin `app.…/api`   | fait      | à la bascule Coolify        |
| 1 bis — CORS et jeton en `Bearer`   | code prêt | code prêt, à déployer       |
| 2 — OIDC sur l'origine de l'app     | à faire   | à la bascule (ou 2 bis)     |
| 3 — cookie `__Host-`                | à faire   | après 1 bis et 2            |

## Pourquoi

### Déclencheur n° 2 : les previews par pull request

Une preview (`<pr>-app.preview.territoiresentransitions.fr`, PR #5981) fait
tourner le code non relu d'une PR, y compris celui d'une montée de dépendance.
Tant que le cookie de session est sur le domaine racine, le navigateur le lui
envoie : jeton d'accès **et** jeton de rafraîchissement, durée de vie ~3 ans
(`maxAge`). Toute personne de l'équipe qui ouvre une preview lui livre sa
session de prod (et de preprod). Le site, `aldo.…`, `rencontres.…` et
`supabase-api.…` le reçoivent aussi, sans en avoir besoin.

**Le cookie `__Host-` ne suffit pas.** Une preview reste _same-site_ avec la
prod : `SameSite=Lax` ne la bloque pas, elle peut appeler la prod avec
`credentials: 'include'` et lire la réponse sans jamais voir le cookie. Il
fallait donc aussi fermer le CORS, que ce plan rangeait en nettoyage (phase 4) :

- backend : `enableCors({ origin: true, credentials: true })` renvoyait
  n'importe quelle origine ;
- app : `isAllowedOrigin` autorisait tout `*.territoiresentransitions.fr` avec
  `Access-Control-Allow-Credentials: true` (hérité de `apps/auth`).

C'est l'objet de la phase 1 bis. `__Host-` apporte en plus qu'un sous-domaine
ne peut pas écraser le cookie (_cookie tossing_).

Ce qui reste hors de portée de ce plan : les autres cookies du domaine racine
(session Crisp, PostHog) restent lisibles par une preview. Servir les previews
sur un autre domaine enregistrable réglerait l'ensemble d'un coup.

### Déclencheur n° 1 : collision de cookie avec GoTrue self-hosté

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

## Phase 1 bis — CORS et jeton en `Bearer` (indépendante du proxy)

Rend le backend indépendant du cookie cross-origin : c'est ce qui permet la
phase 3 en prod **avant** la bascule Coolify. Sans impact sur les sessions.

1b.1. Client tRPC navigateur (`trpc-with-react-query.provider.tsx`) : envoie
`Authorization: Bearer <access_token>` (session du client Supabase) et
n'utilise plus `credentials: 'include'`. Le backend l'acceptait déjà en
repli, et le client REST (`use-api-client.ts`) le faisait déjà.
1b.2. Backend, CORS (`main.ts`) : toute origine reste acceptée (site,
intégrations par clé d'API), mais `Access-Control-Allow-Credentials` n'est
renvoyé qu'à l'origine de `APP_URL`.
1b.3. Backend, cookie (`supabase-cookie-parser.ts`) : le cookie de session
n'est honoré que sans en-tête `Origin` (navigation, appel serveur) ou si
`Origin` est celle de `APP_URL`. Garde côté serveur : le CORS n'empêche
pas une requête « simple » d'être exécutée.
1b.4. App : suppression de `apps/app/cors.config.ts` et de `isAllowedOrigin`
(plus aucun appelant cross-origin depuis la fin de `apps/auth`).

**Ordre de déploiement : app et site d'abord, backend ensuite.** Le formulaire
de contact du site utilisait `credentials: 'include'` ; déployé avant lui, le
backend lui refuserait la lecture de la réponse.

À vérifier après déploiement : apps de test Koyeb (`BACKEND_TEST_URL`) et
`trpc-ui`, qui appellent le backend depuis une autre origine — ils passent
désormais par le `Bearer`.

## Phase 2 — OIDC sur l'origine de l'app (⚠ action humaine)

**ProConnect est actif en prod.** Deux dépendances au domaine racine :

- la liaison de compte (`mode=link`) lit le cookie de session sur `api.…` lors
  d'une navigation (`resolveAuthenticatedUserId`) : avec un cookie host-only et
  sans proxy, elle redeviendrait silencieusement une connexion simple ;
- les cookies `id_token` / `oidc-provider` sont posés par `api.…` sur le
  domaine racine pour être lus par l'app (déconnexion).

La phase 3 est donc **bloquée par celle-ci** en prod. Tant que la prod est sur
Koyeb (deux apps distinctes, pas de routage par chemin), deux options :

- attendre la bascule Coolify (Traefik route `app.…/api`), ou
- **2 bis** : un route handler Next limité aux chemins OIDC
  (`app/api/v1/[provider]/[...path]/route.ts`, navigations et petites
  réponses : ni streaming ni gros corps), supprimé à la bascule.

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

N'attend plus la bascule GoTrue : avec les previews, c'est un prérequis à leur
ouverture. Prérequis : phases 1 bis et 2 (ou 2 bis) dans l'environnement visé.
Preprod d'abord.

3.1. `getCookieOptions()` : piloté par le nom. Si
`SUPABASE_AUTH_COOKIE_NAME` commence par `__Host-`
(`__Host-sb-tet-<env>-auth-token`) : pas de `domain`, `secure: true`,
`path: '/'`. Sans la variable (local, CI), rien ne change — pas de
question de cookie `Secure` sur `http://localhost`.
3.2. Backend : même variable (le serveur Next lui relaie le cookie sous ce
nom, `trpc-server-client.ts`). `supabase-cookie-parser.ts` essaie aussi
l'ancien nom, pour ne pas dépendre de l'ordre de déploiement.
3.3. Migration, dans `proxy-client.ts` avant `createServerClient` : si
l'ancien cookie est présent (morceaux `.0`, `.1`… compris), le recopier
sous le nouveau nom puis le **supprimer explicitement** avec
`Domain=.territoiresentransitions.fr`. Personne n'est déconnecté.
La suppression est obligatoire même sans recopie : l'ancien cookie vit
~3 ans et son jeton de rafraîchissement reste valide tant que
l'utilisateur ne revient pas. Garder ce code plusieurs mois.
3.4. Équipe : repasser une fois sur l'app (prod et preprod) après le
déploiement et avant d'ouvrir une preview — l'ancien cookie n'est purgé
qu'à la visite suivante.
3.5. E2E : `getCookieDomain` (`e2e/tests/shared/supabase-client.utils.ts`) →
hôte de l'app, `secure: true` hors local.
3.6. Ensuite : retirer le `hostname` passé par
`apps/app/app/root-providers.tsx`, `COOKIE_DOMAIN`, et `getRootDomain`
de `pathUtils.ts` s'il n'a plus d'autre usage (aujourd'hui aussi dans
`content-security-policy.config.ts`).

## Phase 4 — Nettoyage

4.1. Backend : une fois tous les environnements en same-origin, retirer
complètement `credentials` de `enableCors` (`main.ts`) — déjà restreint à
l'origine de l'app en phase 1 bis.
4.2. ~~Supprimer `apps/app/cors.config.ts`~~ — fait en phase 1 bis.
4.3. Retirer le montage `/trpc` historique si plus aucun appelant.
4.4. Supprimer le fallback `supabaseUrlToAuthCookieName` de la phase 0.2, le
repli sur l'ancien nom (3.2) et la migration de cookie (3.3).
4.5. Supprimer le route handler OIDC de la phase 2 bis s'il a été posé.

## Ordre de déploiement

1. ~~Phases 0 et 1 sur preprod.~~
2. Phase 1 bis partout (app et site, puis backend).
3. Phases 2 et 3 sur preprod.
4. Prod : phase 2 (à la bascule Coolify) ou 2 bis (avant), puis phase 3.
5. **Ouverture des previews : pas avant l'étape 4.**
6. Phase 4.

## Vérification

- Connexion par mot de passe, magic link et ProConnect ; déconnexion
  (y compris le logout SSO amont) ; liaison d'une identité OIDC depuis le
  profil.
- Sessions preprod et prod indépendantes dans un même navigateur.
- Le `Set-Cookie` de session ne porte plus de `Domain` et commence par
  `__Host-` ; l'ancien cookie du domaine racine a disparu après une visite.
- `curl -i -H "Origin: https://1-app.preview.territoiresentransitions.fr"`
  vers l'app : aucun `Access-Control-Allow-Origin` ; vers l'API : pas de
  `Access-Control-Allow-Credentials`.
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
