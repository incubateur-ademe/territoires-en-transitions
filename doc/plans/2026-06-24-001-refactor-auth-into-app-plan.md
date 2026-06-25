---
title: "refactor: Migrer apps/auth dans apps/app (app Next.js unique)"
type: refactor
status: active
date: 2026-06-24
---

# refactor: Migrer apps/auth dans apps/app (app Next.js unique)

## Overview

`apps/auth` est une app Next.js séparée, déployée sur son propre sous-domaine
(`auth.territoiresentransitions.fr`, port 3003). `apps/app`
(`app.territoiresentransitions.fr`) **redirige** aujourd'hui les chemins d'auth
(`/login`, `/signup`, `/recover`) vers ce sous-domaine via `getAuthUrl()`.

On rapatrie tout le code d'auth dans `apps/app`, servi **sous le même sous-domaine**,
dans un groupe de routes `(auth)`. Résultat visé : une seule app à déployer, des
redirections same-origin au lieu de cross-domaine, une config de déploiement simplifiée.

**Livraison en 2 PR :**
1. **PR préalable indépendante (U0)** : mettre en place une **CSP globale** sur l'app
   (l'app n'en pose aucune aujourd'hui), couvrant tous les services tiers existants.
   Indépendante de la migration et mergeable seule.
2. **PR de migration (U1→U7)** : tout le reste, en une seule PR. Les unités sont les
   étapes ordonnées de cette PR. La migration hérite alors de la CSP globale.

Contraintes : le **cookie cross-domaine** (posé sur le domaine racine, partagé avec
`site` et `panier`) reste **inchangé** ; `apps/auth` reste en place (dormant) jusqu'au
chantier de migration du panier (2ᵉ temps, hors scope).

---

## Problem Frame

Deux apps Next.js pour un même parcours imposent : double config build/déploiement
(deux images Koyeb, deux workflows CD), des redirections cross-domaine fragiles à
chaque transition login ↔ app, et une logique de session/redirection dupliquée entre
`apps/auth/src/supabase/middleware.ts` (`updateSessionOrRedirect`) et `apps/app/proxy.ts`.

En unifiant sous une seule origine, les redirections deviennent same-origin, la logique
middleware est mutualisée, et le déploiement se réduit à un service. La seule contrainte
dure : ne pas casser la session partagée avec `site`/`panier`.

---

## Requirements Trace

- R1. Les routes d'auth (`/login`, `/signup`, `/recover`, `/invite`, `/error`,
  `/rejoindre-une-collectivite`) sont servies par `apps/app` aux **mêmes chemins**.
- R2. Le flux nominal login ↔ app n'utilise plus aucune redirection cross-domaine.
- R3. `getCookieOptions` (cookie domaine racine) est inchangé ; session partagée site/panier préservée.
- R4. Les CTA de connexion/inscription de `site` et `panier` mènent désormais à l'app, sans régression.
- R5. L'envoi d'email d'invitation (`/invite`) fonctionne depuis l'app (SMTP/Brevo ; URL générée serveur-only — ORHUS-302).
- R6. Une **CSP est appliquée globalement à toutes les routes de l'app** (chantier préalable, U0),
  couvrant les services tiers existants ; les pages d'auth migrées en héritent. Les en-têtes **CORS**
  nécessaires aux requêtes cross-origin d'auth/invite restent posés par le middleware (U5).
- R7. `apps/auth` reste déployable (dormant) à l'issue de la PR : aucune suppression de code/CI/déploiement auth.
- R8. La couverture e2e valide le parcours d'auth **servi par l'app**.

---

## Scope Boundaries

- **Non-goal :** supprimer `apps/auth`, `cd-auth.yml`, les cibles Earthfile `auth-*`, ou décommissionner le service Koyeb auth.
- **Non-goal :** migrer `apps/panier` ou modifier la config de cookie cross-domaine.
- **Non-goal :** refondre l'UI/parcours d'auth (migration iso-fonctionnelle) ; remplacer `sendEmail` par le service email du backend (TODO existant).

### Deferred to Follow-Up Work

- Décommissionnement d'`apps/auth` (code + `cd-auth.yml` + cibles `auth-*` + service Koyeb) : chantier panier.
- Passage en cookie d'hôte (fin du cross-domaine) : après migration du panier.

---

## Context & Research

### Code et patterns de référence

- Middlewares : `apps/app/proxy.ts` (gère `isAuthPathname` → redirige vers le domaine auth ; checks DCP/collectivités),
  `apps/auth/proxy.ts` (CSP/CORS + `updateSessionOrRedirect`), `apps/auth/src/supabase/middleware.ts`.
- Pages/route auth : `apps/auth/app/{login,signup,error,page.tsx,invite/route.ts}`, `apps/auth/app/(authed)/rejoindre-une-collectivite/`.
- UI auth : `apps/auth/components/{Login,Signup,PasswordStrengthMeter,ResendMessage,VerifyOTP}/` (29 fichiers, dont stories).
  `ResetPassword.tsx` (dans `Login/`) porte la réinitialisation de mot de passe.
- Helpers serveur auth : `apps/auth/src/supabase/{actions.ts,getDbUserFromRequest.ts}`, `apps/auth/src/utils/sendEmail.ts`.
- Helpers partagés : `packages/api/src/utils/pathUtils.ts` (`getAuthUrl` = `NEXT_PUBLIC_AUTH_URL` + fallback koyeb ;
  `getAuthPaths` = **déjà** `NEXT_PUBLIC_APP_URL` ; `getRejoindreCollectivitePath` → `getAuthUrl`),
  `cookie-options.ts` (**inchangé**), `isAllowedOrigin.ts`, `get-request-url.ts`.
- Consommateurs de `getAuthUrl`/`NEXT_PUBLIC_AUTH_URL` : `apps/app/proxy.ts`,
  `apps/app/.../invite-membre/use-send-invitation.ts` (`${NEXT_PUBLIC_AUTH_URL}/invite`),
  `apps/app/app/(public)/invitation/[invitationId]/[invitationEmail]/route.ts`.
- Layouts app : `apps/app/app/layout.tsx` enveloppe tout dans `RootProviders` (fournit déjà `SupabaseProvider`,
  `UserProvider`, `PostHogProvider`, `TrpcWithReactQueryProvider`, `NuqsAdapter`, `ToastProvider` + `<div id="main">`).
- Déploiement : `Earthfile`, `apps/app/Earthfile`, `.github/workflows/{cd-app,cd-auth,cd-site,cd-panier,test-e2e}.yml`. Next 16.2.7 ; middleware = fichier racine `proxy.ts`.

### Faits vérifiés en recherche

- **`/recover` n'est pas une route physique aujourd'hui** : la réinitialisation passe par une `view` de `/login`
  (`useLoginState.tsx`). → Ce plan crée une **route/page dédiée `/recover`** (décision, cf. U2).
- **Aucun import `@tet/auth`** dans le monorepo → déplacement propre.
- **SMTP** (`SMTP_USER`/`SMTP_KEY` + `nodemailer`) n'est utilisé que par `sendEmail.ts` (route `/invite`).
  `nodemailer` est déjà disponible (dépendances de toutes les apps déclarées dans le `package.json` racine) → rien à ajouter.
- **`site`/`panier` ne lisent jamais `NEXT_PUBLIC_AUTH_URL` directement** : `site` n'utilise que `getAuthPaths` (→ `APP_URL`) ;
  `panier` utilise `getAuthPaths` + `getRejoindreCollectivitePath` (→ `getAuthUrl`). Une fois `getAuthUrl` basé sur `APP_URL`,
  `AUTH_URL` devient inutile pour les deux.
- **`docs/solutions/`** : aucun apprentissage pertinent.

### Inventaire des endpoints externes pour la CSP globale (U0)

L'app n'applique **aucune CSP** aujourd'hui (seul `apps/auth/proxy.ts` en pose une, limitée à
self/Supabase/backend/PostHog). Une CSP globale doit autoriser au minimum :

| Service | Déclencheur | Directives à ouvrir |
|---|---|---|
| Self / Next.js | toutes les pages | `default-src 'self'` ; `script-src 'self' 'unsafe-inline'` (TODO nonce, comme auth) ; `style-src 'self' 'unsafe-inline'` ; `img-src 'self' data: blob:` ; `font-src 'self' data:` |
| Supabase | API + Realtime | `connect-src $NEXT_PUBLIC_SUPABASE_URL` + variante `ws` ; `img-src` (storage/avatars) |
| Backend TET | API | `connect-src $NEXT_PUBLIC_BACKEND_URL` (+ `*.${rootDomain}` comme dans l'auth) |
| PostHog | analytics + rewrite `/ingest` | `script-src` + `connect-src $POSTHOG_HOST` |
| Sentry | erreurs + **Session Replay** | `connect-src` host du DSN (`sentry.incubateur.net`) ; **`worker-src 'self' blob:`** (replay) |
| Crisp (chat) | widget `crisp-sdk-web` | `script-src https://client.crisp.chat` ; `connect-src wss://*.relay.crisp.chat https://client.crisp.chat` ; `img-src https://*.crisp.chat` ; `font-src https://*.crisp.chat` (cf. doc CSP Crisp) |

**Exclus de la CSP de l'app** (vérifié — utilisés par d'autres apps uniquement) :
- **Axeptio** (consentement, `static.axept.io`) : `<Consent>` n'est rendu que par `apps/site` et `apps/panier` (`providers/posthog.tsx`), jamais par l'app.
- **Strapi media** (`*.media.strapiapp.com`) : utilisé comme média par le site ; la seule référence dans l'app est un **lien de téléchargement `.docx`** (navigation, non soumise à `img-src`/`connect-src`).

Bryntum (scheduler) est bundlé localement (npm), pas d'hôte externe ; `style-src 'unsafe-inline'`
couvre ses styles. Aucun `<iframe>` détecté → `frame-src` peut rester restrictif (à réévaluer si
une applet Crisp ou un embed est ajouté). La liste exhaustive est à valider en **report-only** (U0).

---

## Key Technical Decisions

- **CSP globale en PR préalable (U0)** : la CSP s'applique à **toutes** les routes de l'app, pas seulement l'auth ; déployée d'abord en `report-only` pour valider l'allowlist sans rien casser. La migration en hérite. *(Décision utilisateur.)*
- **Groupe `(auth)` à la racine, chemins inchangés** : préserve tous les liens externes et `redirect_to` existants. *(Décision utilisateur.)*
- **`/recover` = route/page dédiée** (et non une vue de `/login`), réutilisant le composant `ResetPassword`. *(Décision utilisateur.)*
- **`apps/auth` conservé (dormant)** jusqu'au chantier panier. *(Décision utilisateur.)*
- **Helpers d'URL refactorés vers `NEXT_PUBLIC_APP_URL`** ; suppression de `NEXT_PUBLIC_AUTH_URL` (+ fallback koyeb) côté consommateurs. *(Décision utilisateur.)*
- **Cookie cross-domaine inchangé** (`getCookieOptions`). *(Contrainte produit.)*
- **Middleware unifié** dans `apps/app/proxy.ts` : fusionne `updateSessionOrRedirect` + CSP/CORS ; les pages d'auth sont servies localement.
- **Code auth co-localisé** dans `apps/app/src/auth/` (composants + helpers serveur) — aucun nouveau package, aucun consommateur externe.

---

## Ordre d'implémentation

**U0 (CSP globale) est une PR préalable indépendante**, mergée avant la migration.
Le reste (U1→U7) est livré dans **une seule PR**. Au sein de cette PR, le seul
ordonnancement strict concerne la fin : faire servir l'auth localement par le middleware
(U5) **avant** de basculer les URLs vers l'app (U6), sinon une boucle de redirection
apparaît pendant le développement (`getAuthUrl → APP_URL/login → middleware redirige → …`).

```
PR préalable :  U0 CSP globale (report-only → enforce)
PR migration :
  U1 composants ─▶ U2 pages+layout (incl. /recover)
                └─▶ U4 rejoindre
  U3 invite
  U2,U3,U4 ─▶ U5 middleware unifié (CORS + redirections) ─▶ U6 bascule URLs + env ─▶ U7 e2e
```

---

## Output Structure

    apps/app/app/(auth)/
      layout.tsx            # Header auth (PAS de re-wrap des providers de RootProviders)
      page.tsx              # → redirige vers /login
      login/                # page.tsx, page.client.tsx, useLoginState.tsx, delete-old-auth-cookie.server.ts
      signup/               # page.tsx, page.client.tsx, useSignupState.tsx
      recover/page.tsx      # route dédiée → composant ResetPassword
      error/page.tsx
      invite/route.ts
      rejoindre-une-collectivite/
    apps/app/src/auth/
      components/           # Login/, Signup/, PasswordStrengthMeter/, ResendMessage/, VerifyOTP/
      supabase/             # getDbUserFromRequest.ts, actions.ts (ou réconciliés avec @tet/api)
      utils/sendEmail.ts

---

## High-Level Technical Design

> *Guide directionnel pour la revue, pas une spécification d'implémentation.*

Middleware unifié (`apps/app/proxy.ts`) après fusion :

```
proxy(request):
  poser CSP globale (déjà en place via U0) + CORS (auth)
  { response, user, client } = getNextResponseWithUpdatedSupabaseSession(request)

  si path ∈ routes (auth):
     si !user → servir la page                                   # ex-auth, non authentifié
     si user  → logique ex-updateSessionOrRedirect :
        DCP manquant & pas /signup → /signup?view=etape3
        routes autorisées (/signup, /rejoindre, /login, /invite) → servir
        sinon → redirect_to (si même domaine racine) ou APP_URL
  sinon (routes app):
     logique app existante inchangée (DCP, collectivités, TDB)
```

Différence clé : les branches « auth » ne font plus de redirection cross-domaine — elles
servent la page localement ou redirigent same-origin.

---

## Implementation Units

### PR préalable — CSP globale

- U0. **Appliquer une CSP globale à toutes les routes de l'app**

**Goal :** Poser, depuis `apps/app/proxy.ts`, une Content-Security-Policy couvrant l'ensemble des
routes de l'app (pas seulement l'auth), en autorisant les services tiers existants. **PR indépendante**,
mergée avant la migration.

**Requirements :** R6 · **Dependencies :** aucune (préalable)

**Files :**
- Modify: `apps/app/proxy.ts` (générer le nonce + l'en-tête CSP et l'attacher à toutes les réponses ;
  étendre le matcher si besoin pour couvrir toutes les pages)
- Reference: `apps/auth/proxy.ts` (construction CSP avec nonce + `getRootDomain`), inventaire ci-dessus
- Possible: helper partagé `packages/api/src/utils/` pour construire la CSP (réutilisable par auth/app)

**Approach :**
- Reprendre la mécanique de l'auth (nonce par requête, `'unsafe-inline'` en prod faute de nonce généralisé,
  `'unsafe-eval'` en dev uniquement, `upgrade-insecure-requests` en prod hors localhost).
- Construire l'allowlist à partir de l'**inventaire des endpoints externes** (cf. Context) :
  Supabase (+ws), backend (+`*.${rootDomain}`), PostHog, Sentry (+`worker-src 'self' blob:` pour le Replay),
  Crisp, images self/Supabase (`data:`/`blob:`). `frame-src` restrictif (aucun iframe détecté).
  (Axeptio et Strapi media exclus : non utilisés par l'app — cf. inventaire.)
- **Déploiement progressif** : livrer d'abord en `Content-Security-Policy-Report-Only` pour collecter
  les violations sans rien casser, valider en préprod, puis passer en `Content-Security-Policy` (enforce).
- Centraliser la liste des hôtes pour éviter la divergence avec la CSP de l'auth (qui reste, app dormant).

**Execution note :** valider en report-only sur préprod (parcours complets : chat Crisp, consentement
Axeptio, analytics PostHog, Sentry/Replay, scheduler Bryntum, images) avant de basculer en enforce.

**Test scenarios :**
- Integration — chaque page principale (TDB, fiches, indicateurs, référentiels, scheduler) charge sans
  violation CSP bloquante (vérifié via report-only puis enforce).
- Integration — Crisp s'initialise (script + websocket) ; PostHog envoie les events ;
  Sentry capture une erreur (+ Replay).
- Edge case — en dev, `'unsafe-eval'` autorisé (sources-map) ; en prod, absent.
- Edge case — `upgrade-insecure-requests` présent en prod, absent en dev/localhost.

**Verification :** en enforce, aucune violation CSP bloquante sur les parcours clés ; en-tête
`Content-Security-Policy` présent sur toutes les routes (auth comprises après migration).

---

### PR de migration

- U1. **Migrer les composants UI d'auth**

**Goal :** Déplacer `apps/auth/components/**` vers `apps/app/src/auth/components/**` (stories incluses).

**Requirements :** R1 · **Dependencies :** aucune

**Files :**
- Create: `apps/app/src/auth/components/**` (depuis `apps/auth/components/**`)
- Modify: imports → alias `@/...`, `@tet/ui`, `@tet/api`

**Approach :** copie d'arborescence + réécriture des imports ; vérifier la prise en compte par `apps/app/.storybook`.
`apps/auth` (dormant) garde ses copies — pas de suppression dans cette PR.

**Test scenarios :**
- Edge case — `PasswordStrengthMeter` : mot de passe faible/moyen/fort → niveau attendu (reprendre le test existant s'il existe).
- Happy path — `VerifyOTP` : OTP valide → callback de soumission appelé avec le code.
- Sinon `Test expectation: none — déplacement iso-fonctionnel` pour les composants purement présentiels.

**Verification :** Storybook rend les composants migrés ; `tsc` de l'app OK.

---

- U2. **Migrer les pages d'auth + le layout `(auth)` (incl. route `/recover` dédiée)**

**Goal :** Créer le groupe `(auth)` avec son layout et y déplacer `login`, `signup`, `error`, la page racine
(`→ /login`), plus une **nouvelle page dédiée `/recover`**, aux chemins inchangés.

**Requirements :** R1 · **Dependencies :** U1

**Files :**
- Create: `apps/app/app/(auth)/layout.tsx`, `(auth)/page.tsx`
- Create: `(auth)/login/{page.tsx,page.client.tsx,useLoginState.tsx,delete-old-auth-cookie.server.ts}`
- Create: `(auth)/signup/{page.tsx,page.client.tsx,useSignupState.tsx}`, `(auth)/error/page.tsx`
- Create: `(auth)/recover/page.tsx` (route dédiée)

**Approach :**
- **Layout : ne pas re-wrapper les providers.** `RootProviders` fournit déjà Supabase/User/PostHog/Trpc/Nuqs/Toast
  + `<div id="main">`. Le layout `(auth)` n'ajoute **que** le `Header` (@tet/ui) et, si besoin, des styles spécifiques.
- `searchParams` (`view`, `email`, `otp`, `redirect_to`) conservés à l'identique ; imports → `@/auth/components/...`.
- **`/recover` dédiée** : nouvelle page serveur+client montant le composant `ResetPassword` (extrait de `components/Login/`),
  sans dépendre de la `view` de `/login`. Conserver le passage de `redirect_to`/`email` en searchParams.
- Note : tant que le middleware (U5) n'est pas modifié, ces pages restent masquées par la redirection existante.

**Patterns to follow :** `apps/app/app/(public)/**` (groupe de routes + page serveur/`page.client.tsx`).

**Test scenarios :**
- Happy path — pages `(auth)` rendent avec le `Header` et **sans** double provider.
- Happy path — `(auth)/page.tsx` → redirige vers `/login`.
- Happy path — `/recover` rend le formulaire de réinitialisation (composant `ResetPassword`) et envoie l'email de reset.
- (Comportement de redirection complet validé en e2e après bascule du middleware — U5/U7.)

**Verification :** build OK ; `/login`, `/signup`, `/recover`, `/error` existent et rendent (en local en court-circuitant la redirection) ; pas de double-wrap de providers.

---

- U3. **Migrer la route `/invite` + `sendEmail` + helpers serveur**

**Goal :** Porter le handler d'invitation et l'envoi d'email dans l'app.

**Requirements :** R1, R5 · **Dependencies :** aucune

**Files :**
- Create: `apps/app/app/(auth)/invite/route.ts`, `apps/app/src/auth/utils/sendEmail.ts`,
  `apps/app/src/auth/supabase/getDbUserFromRequest.ts` (ou réconcilié avec `@tet/api`)

**Approach :**
- Conserver strictement la génération **serveur-only** de l'URL (ORHUS-302) et le schéma Zod ; `OPTIONS` (preflight) conservé.
- Réutiliser un client Supabase serveur existant de l'app si équivalent à `getDbUserFromRequest` (cf. Open Questions).
- `nodemailer` déjà disponible via le `package.json` racine — aucune dépendance à ajouter. Provisioning SMTP traité en U6.
- Note : `use-send-invitation` poste encore vers le sous-domaine auth tant que U6 n'est pas fait → route inerte jusque-là.

**Test scenarios :**
- Happy path — POST authentifié, payload valide (`urlType: invitation`) → email envoyé, URL sur `APP_URL`. Covers R5.
- Error path — non authentifié → 401 ; payload invalide (balise HTML dans le nom) → 400.
- Edge case — `APP_URL` absente → 500 ; `urlType: rattachement` → URL `/collectivite/:id/accueil`.
- Integration — sans `SMTP_*`, transport Mailpit (dev/CI).

**Verification :** un POST valide envoie l'email (Mailpit local) avec un lien sur l'app ; les chemins d'erreur renvoient les bons codes.

---

- U4. **Migrer la page `/rejoindre-une-collectivite`**

**Goal :** Déplacer la page authentifiée (et ses composants/hook) dans `(auth)`.

**Requirements :** R1 · **Dependencies :** U1

**Files :**
- Create: `apps/app/app/(auth)/rejoindre-une-collectivite/**` (depuis `apps/auth/app/(authed)/rejoindre-une-collectivite/**`)

**Approach :** imports → `@/auth/components/...`. La garde d'authentification est portée par le middleware unifié (U5),
qui doit autoriser cette route pour un utilisateur authentifié.

**Test scenarios :**
- Happy path — la page rend ; sélection d'une collectivité + soumission → rattachement inchangé.
- (Redirection si non authentifié validée en U5.)

**Verification :** rendu OK ; rattachement fonctionnel.

---

- U5. **Middleware unifié : l'app sert l'auth en local**

**Goal :** Faire servir les routes `(auth)` par l'app (plus de redirection cross-domaine), en intégrant
`updateSessionOrRedirect` et les en-têtes CORS. La CSP est déjà globale (U0) → rien à ajouter ici côté CSP.

**Requirements :** R2, R3 · **Dependencies :** U0, U2, U3, U4

**Files :**
- Modify: `apps/app/proxy.ts` (supprimer `isAuthPathname → redirectToAuthDomain` ; ajouter logique post-login + CORS ;
  ajuster le matcher pour `invite` si nécessaire)
- Reference: `apps/auth/proxy.ts`, `apps/auth/src/supabase/middleware.ts`

**Approach :**
- Non authentifié sur route `(auth)` → servir (ne pas rediriger vers `/`).
- Authentifié sur route `(auth)` → ex-`updateSessionOrRedirect` (DCP manquant → `/signup?view=etape3` ; autoriser
  `/signup`, `/rejoindre-une-collectivite`, `/login`, `/invite` ; sinon `redirect_to` même-domaine ou `APP_URL`).
- Ajouter le **CORS** (`isAllowedOrigin`, `Access-Control-*`) pour les requêtes cross-origin (ex. `/invite`),
  en cohabitation avec l'en-tête `x-current-path` et la CSP globale (U0). Logique app (non-auth) inchangée. Cookie inchangé.

**Execution note :** démarrer par un test du contrat de redirection (table authentifié/non × route auth/app) avant de fusionner les branches.

**Technical design :** voir « High-Level Technical Design ».

**Test scenarios :**
- Happy path — non authentifié sur `/login` (et `/recover`) → page servie (200), pas de redirection. Covers R2.
- Edge case — authentifié sans DCP sur route app → `/signup?view=etape3` (same-origin).
- Happy path — authentifié sur `/login?redirect_to=<même domaine racine>` → redirige vers `redirect_to`.
- Edge case — `redirect_to` externe → redirige vers `APP_URL` (pas vers l'externe) ; authentifié avec DCP sur `/login` → redirige vers l'app.
- Integration — requête cross-origin autorisée (`isAllowedOrigin`) → en-têtes `Access-Control-Allow-*` ; les pages `(auth)` portent déjà la CSP globale.

**Verification :** `app.tet.fr/login` est servi localement (plus de saut vers le sous-domaine auth) ; CORS présent sur les routes concernées ; CSP héritée de U0.

---

- U6. **Bascule des URLs vers l'app + env/déploiement**

**Goal :** Faire pointer tout le trafic d'auth vers l'app et retirer `NEXT_PUBLIC_AUTH_URL` des consommateurs.

**Requirements :** R2, R4, R5, R7 · **Dependencies :** U5

**Files :**
- Modify: `packages/api/src/utils/pathUtils.ts` (`getAuthUrl` → base `NEXT_PUBLIC_APP_URL`, suppression du fallback koyeb)
- Modify: `apps/app/.../use-send-invitation.ts` (`/invite` same-origin), `apps/app/app/(public)/invitation/.../route.ts` (valider)
- Modify: `apps/app/.env.sample` (+`SMTP_USER`/`SMTP_KEY`, −`NEXT_PUBLIC_AUTH_URL`), `apps/app/Earthfile` + `Earthfile` (+SMTP, −`AUTH_URL`)
- Modify: `.github/workflows/cd-app.yml` (−`--AUTH_URL`, +secrets/`--env` SMTP), `cd-site.yml` + `cd-panier.yml` (−`--AUTH_URL`)

**Approach :**
- `getAuthPaths` (déjà `APP_URL`) inchangé. Après ce changement, `getRejoindreCollectivitePath` (panier) et la route invitation résolvent sur l'app.
- `AUTH_URL` droppable de site **et** panier (vérifié : aucun ne lit `NEXT_PUBLIC_AUTH_URL` directement, et `NEXT_PUBLIC_APP_URL` leur est déjà fourni).
- Provisionner les secrets Koyeb `SMTP_USER`/`SMTP_KEY` côté app **avant** merge (ops). Ne pas toucher `cd-auth.yml` ni les cibles `auth-*`.

**Test scenarios :**
- Happy path — `getAuthUrl('/login', …)` → URL basée sur `APP_URL`. Covers R2.
- Edge case — hostname koyeb → plus d'URL auth dédiée (fallback supprimé) ; comportement validé.
- Integration — CTA login/signup de `site`/`panier` mènent à l'app (R4) ; `use-send-invitation` POST `/invite` same-origin (R5).

**Verification :** `grep` : plus aucune réf. `NEXT_PUBLIC_AUTH_URL` ni `preprod-auth-tet.koyeb.app` dans `apps/app|site|panier` et `packages/api` (hors `apps/auth`) ; `cd-auth.yml` inchangé ; build app OK avec SMTP.

---

- U7. **Adapter la couverture e2e au parcours servi par l'app**

**Goal :** Valider login/signup/recover/invitation servis par l'app.

**Requirements :** R8 · **Dependencies :** U6

**Files :**
- Modify: `apps/e2e/**` (scénarios d'auth → app, port 3000), `e2e/playwright.config.ts` (baseURL/ports), `.github/workflows/test-e2e.yml` (démarrage auth 3003 conservé, non bloquant)

**Test scenarios :**
- Happy path — `/login` sur l'app, connexion valide → tableau de bord (same-origin). Covers R2, R8.
- Happy path — `/signup` sur l'app → création de compte + étapes DCP ; `/recover` → email de réinitialisation.
- Integration — lien d'invitation → `/invitation/...` → consommation et redirection.
- Edge case — accès non authentifié à une route protégée → redirection `/login`.

**Verification :** suite Playwright verte en ciblant l'app pour les parcours d'auth.

---

## System-Wide Impact

- **Interaction graph :** `apps/app/proxy.ts` devient le point de contrôle unique (session/redirection/CORS + CSP globale de U0) pour app **et** auth. Risque principal : ordre des branches (mitigé par le test de contrat, U5).
- **CSP globale (U0) :** s'applique à tous les parcours existants (chat, analytics, monitoring, scheduler, images) → risque de régression silencieuse si un hôte manque. Mitigé par le rollout report-only.
- **Error propagation :** `/invite` conserve ses codes (401/400/500) ; `sendEmail` retombe sur Mailpit sans SMTP ; erreurs d'auth rendues côté page.
- **State lifecycle :** cookie inchangé ; risque de double-wrap de providers traité en U2.
- **API surface parity :** tout consommateur de `NEXT_PUBLIC_AUTH_URL` traité en U6 ; `getAuthPaths` déjà sur `APP_URL`.
- **Integration coverage :** parcours cross-app (site/panier → auth → app) ; la session posée doit rester visible par site/panier (cookie racine).
- **Unchanged invariants :** `getCookieOptions`, `apps/auth` (code/CI/déploiement), config cookie cross-domaine.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| CSP globale (U0) qui casse un service tiers (Crisp, Sentry/Replay, PostHog) | Rollout `report-only` d'abord + validation préprod des parcours clés avant enforce ; inventaire des endpoints (Context) |
| Boucle de redirection pendant le dev si la bascule URL (U6) précède le service local (U5) | Respecter l'ordre U5 → U6 ; la PR étant atomique, le risque ne touche jamais la prod |
| Régression du parcours login (ordre des branches du middleware fusionné) | Test du contrat de redirection avant fusion (U5) + e2e (U7) |
| Perte de session partagée site/panier | `getCookieOptions` non modifié ; test d'intégration cross-app |
| `/invite` cassé faute de SMTP côté app | Secrets Koyeb provisionnés avant merge (U6) ; fallback Mailpit en dev/CI |
| Double-wrap de providers (layout racine + `(auth)`) | Vérifié : `RootProviders` fournit déjà les providers ; le layout `(auth)` n'ajoute que `Header`/styles (U2) |

---

## Open Questions

### Resolved During Planning

- **Route `/recover`** : page/route dédiée (réutilise `ResetPassword`), pas une vue de `/login`. *(Décision utilisateur — U2.)*
- **`nodemailer`** : déjà disponible via le `package.json` racine ; aucune dépendance à ajouter. *(Confirmé utilisateur — U3.)*
- Emplacement des routes, sort d'`apps/auth`, résolution d'URL, cookie cross-domaine : cf. Key Technical Decisions.

### Deferred to Implementation

- **Réconciliation des clients Supabase serveur** : `actions.ts`/`getDbUserFromRequest` vs helpers `@tet/api/utils/supabase/*` — réutiliser l'existant si équivalent.
- **Fusion fine des deux proxys** : ordre exact des branches à valider sur cas réels (U5).

---

## Documentation / Operational Notes

- **PR préalable (U0) :** déployer la CSP en `report-only`, surveiller les violations en préprod (et idéalement collecter via un `report-uri`/`report-to` ou les logs navigateur) sur les parcours clés, puis basculer en enforce une fois l'allowlist validée.
- **Avant merge (U6) :** créer les secrets Koyeb `SMTP_USER`/`SMTP_KEY` sur le service `$ENV_NAME-app`.
- **Post-déploiement :** vérifier manuellement login/signup/recover/invitation sur l'app et les CTA site/panier. Sous-domaine auth laissé dormant.
- **Suivi :** ticket de décommissionnement d'`apps/auth` (code + `cd-auth.yml` + cibles `auth-*` + service Koyeb) à traiter avec/après la migration du panier.

---

## Sources & References

- Auth : `apps/auth/proxy.ts`, `apps/auth/src/supabase/middleware.ts`, `apps/auth/app/**`, `apps/auth/components/**`, `apps/auth/src/utils/sendEmail.ts`
- App : `apps/app/proxy.ts`, `apps/app/app/layout.tsx`, `apps/app/app/(public)/**`, `apps/app/src/app/paths.ts`, `.../invite-membre/use-send-invitation.ts`
- Partagé : `packages/api/src/utils/{pathUtils,isAllowedOrigin,get-request-url}.ts`, `packages/api/src/utils/supabase/cookie-options.ts`
- Déploiement : `Earthfile`, `apps/app/Earthfile`, `.github/workflows/{cd-app,cd-auth,cd-site,cd-panier,test-e2e}.yml`
