---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: fusion des plans « ProConnect connexion unique » (2026-07-21) et « Connexion MonCompteAdeme OIDC » (2026-07-20) + décisions UX Leny (2026-07-21) + réconciliation avec l'implémentation livrée (2026-07-23, puis 2026-08-13 — rétro-ingénierie et ajout des sections d'exploitation)
---

# Connexion externe OIDC + connexion unifiée MonCompteAdeme

## Summary

Brancher l'authentification externe de TeT via **OpenID Connect (OIDC)** sur une
infrastructure **multi-provider**, puis, par-dessus, une couche produit de
**connexion unifiée** qui met en avant **MonCompteAdeme (MCA, le Keycloak de
l'ADEME)**.

Le flux OIDC *relying party* (RP) vit dans `apps/backend` (la prod Supabase
Cloud interdit un provider custom GoTrue) et se « ponte » vers une session
Supabase standard : tout l'aval (tRPC, RLS, cookies partagés) reste inchangé.
Deux providers partagent ce socle — **ProConnect** (fédération OIDC de l'État)
et **MonCompteAdeme** — via une table d'identités unique et une config par
provider.

Les providers s'activent par variable d'environnement (`*_ENABLED`), le provider mis en avant est résolu
côté serveur par ordre de préférence (`OIDC_PROVIDER_PREFERENCE`), et
l'incitation à lier son compte passe par une bannière masquable et une modale.
La **création** de compte, elle, passe désormais obligatoirement par MCA/PC.

> **État (repère, 2026-08-13)** : le socle OIDC multi-provider et les deux
> providers sont **implémentés** ; **MCA est activé** en dev, **ProConnect est
> désactivé par flag** (`PRO_CONNECT_ENABLED=false`) et n'est pas censé être activé 
> tant que MCA est utilisé, ça a été fait "en attendant" MCA et dans la perspective
> d'utiliser possiblement ProConnect en direct plus tard.
> La couche connexion unifiée (statut serveur, bannière, modale d'incitation,
> bloc « Recommandé », `/signup` via provider) est **livrée**. Le refactor
> `apps/auth` → `apps/app` est **terminé** : il n'y a plus d'app `auth`.
> Restent : recette croisée MOE Keycloak (`preprod-fa`/prod), habilitation prod
> DINUM, e2e du tour complet contre un faux IdP, ADR, runbook de fusion support.
>
> **Décisions révisées par la livraison** : le no-go « pas de double système
> d'auth à J1 » (plan du 2026-07-21) **et** l'échéancier de coexistence piloté
> par une date butoir `OIDC_DEADLINE` (fusion du 2026-07-23) sont **tous deux
> abandonnés**. Il n'y a ni date butoir, ni phases, ni feature flag : le mot de
> passe reste utilisable sans fin de vie annoncée pour le moment. La bascule vers « MCA seul »
> redevient une décision produit à reprendre (voir OQ11/OQ12).

## Problem Frame

- **Acteurs** : agents des collectivités (population ProConnect), utilisateurs
  de l'écosystème ADEME (population MCA), équipe TeT, DINUM (habilitation
  ProConnect), MOE (maîtrise d'œuvre) Keycloak ADEME.
- **Motivation** : friction du login actuel (15 % des connexions = reset de mot
  de passe, blocages anti-spam), engagements d'interopérabilité (TerriSTORY, Mon
  Espace Collectivités), demande ADEME d'unification des identités.
- **Comportement initial** : authentification 100 % Supabase Auth (GoTrue) en
  email/mot de passe et magic link/OTP. Aucun provider OIDC externe.
- **Contraintes structurantes** :
  - Prod sur **Supabase Cloud** → impossible d'ajouter un provider OIDC custom
    dans GoTrue (liste fermée ; SSO Supabase SAML-only). On implémente le flux
    OIDC nous-mêmes (RP) et on ponte vers une session Supabase standard.
  - MCA = Keycloak : realm `integration` sur rec-fa.ademe.fr (recette), realm
    `master` sur preprod-fa.ademe.fr (préprod) et moncompte.ademe.fr (prod).
    Flow confidentiel. **Email/username mutables** → liaison par `sub` (subject :
    identifiant technique chez le fournisseur) obligatoire.
  - Le `sub` ProConnect est unique par couple agent×FI — **non stable si l'agent
    change de FI** : rotation gérée par upsert.
  - **Différence de claims vérifiée** : **ProConnect n'émet pas `email_verified`**
    (confirmé via sa doc) ; **MCA (Keycloak) l'émet**, mais son realm
    d'intégration le renvoie à `false`. D'où la politique par liste de providers
    de confiance (décision 9).
  - URI strictes des deux côtés (correspondance exacte, wildcards proscrits,
    HTTPS en prod).

## Requirements

### Capacités clés

- **R1** : un bouton par provider déclenche un flux OIDC Authorization Code en
  client confidentiel porté par le backend ; le `client_secret` ne quitte jamais
  le serveur. Les deux providers partagent le **bouton officiel DSFR**
  (`packages/ui/src/design-system/ProConnectButton/ProConnectButton.tsx`) —
  MonCompteAdeme s'affichant avec ce même bouton, la bascule d'un provider à
  l'autre ne change pas l'écran.
- **R2** : au retour du callback, l'utilisateur obtient une **session Supabase
  standard** (vrai refresh token GoTrue, cookies `.territoiresentransitions.fr`)
  et est redirigé vers sa destination (`next` whitelisté same-root-domain).
- **R3** : matching à la connexion : `sub` connu → session directe ; email connu
  **et vérifié** → **liaison automatique + toast** « comptes associés » (une
  seule fois) ; email connu **non vérifié** → statut dédié `email-non-verifie`
  (R14) ; aucun match → dialog de bienvenue (R4). Aucune donnée déplacée,
  `auth.users.id` reste la clé interne.
- **R4** : **dialog de bienvenue** (aucun match, hors intention de création) :
  « Aviez-vous déjà un compte ? ». « Oui » → **re-connexion avec l'ancien
  compte** dans la même session → double preuve → liaison immédiate + toast ;
  fallback « mot de passe oublié » → email de confirmation (token hashé, usage
  unique, 24 h, pas de session au clic). « Non » → création de compte.
- **R5** : création de compte → étape signup existante (téléphone + CGU) puis
  « rejoindre une collectivité » avec **pré-sélection par SIRET** (SIREN = 9
  premiers chiffres, modifiable) ; rôle et intitulé de poste saisis par
  l'utilisateur.
- **R6** : **infrastructure multi-provider** : table d'identités unique, module
  backend commun, registre de config par provider, mêmes cas de matching et
  parcours — seules la config (issuer, client, scopes/claims, auth) et le
  libellé du bouton diffèrent. Chaque provider s'active/se désactive
  indépendamment (`*_ENABLED`).
- **R7** : configuration par environnement (`PRO_CONNECT_*`,
  `MON_COMPTE_ADEME_*`, `OIDC_TICKET_SECRET`) via GitHub Environments / Koyeb,
  chiffrée dotenvx en local ; aucun secret dans le bundle client.
- **R8** : déconnexion **fail-safe** : la session Supabase locale meurt d'abord,
  puis redirection `session/end` du provider avec `id_token_hint` — l'échec de
  l'étape provider ne bloque jamais le logout local. MCA : logout local par
  défaut (son `session/end` invalide le SSO de toutes les applications ADEME).
- **R9** : un utilisateur connecté peut **lier volontairement** son identité
  externe depuis son profil (mode `link` : rattache le `sub` au compte courant,
  avec garde-fous anti-vol), et la délier (garde-fou anti-lock-out : refus si
  c'est le dernier moyen de connexion).
- **R10** *(révisé — remplace la date butoir et les phases)* : le provider mis
  en avant est résolu **côté serveur** par ordre de préférence
  (`OIDC_PROVIDER_PREFERENCE` = MCA puis ProConnect) ; le premier provider
  effectivement configuré gagne. **Aucune date butoir, aucune phase** : le
  formulaire email + mot de passe reste affiché et strictement fonctionnel sur
  l'écran de connexion.
- **R11** *(révisé)* : incitation **non bloquante** à lier MCA — une bannière
  d'annonce in-app masquable (préférence per-utilisateur persistée) et une
  modale post-connexion plafonnée à `OIDC_MODAL_MAX_DISPLAY_COUNT = 3` rappels,
  au plus une fois par session (drapeau `sessionStorage 'oidc-modal-seen'`) et
  pas deux fois le même jour (`modalLastSeenAt`). **Aucune modale bloquante.**
- **R12** : le login classique reste strictement fonctionnel (aucune régression,
  invitations comprises).
- **R13** : tout échec OIDC (state, nonce, token invalide, erreur provider,
  compte désactivé) aboutit à un message explicite, jamais à une 500 nue
  (redirection typée `?erreur=<code>`).
- **R14** : quand un compte TeT existe pour l'email mais que le provider ne
  l'atteste pas vérifié (`isEmailVerified` faux), on **ne rattache pas
  automatiquement** ; l'utilisateur est renvoyé vers un écran d'alerte
  (« vérifiez d'abord votre email ») plutôt que vers un dead-end.
- **R15** *(révisé — remplace le feature flag)* : l'activation est **par
  provider et par configuration** (`*_ENABLED` + config complète ; `superRefine`
  fail-fast au démarrage si un provider est activé sans sa config). Aucun
  provider configuré ⇒ aucun bouton, aucune bannière, aucune modale, endpoints
  404, et `/signup` retombe sur le formulaire email + mot de passe (mode
  dégradé, tracé en warning Sentry).
- **R16** *(nouveau)* : la **création de compte passe par le fournisseur
  d'identité**. `/signup` en point d'entrée (`view` absente ou `etape1`)
  redirige vers `/:provider/login?intent=creation` ; au retour sans
  correspondance, le compte est créé directement, sans l'écran « aviez-vous déjà
  un compte ? ». Les vues déjà engagées ne sont jamais redirigées — en
  particulier `etape3`, qui est la complétion de profil des sessions sans DCP et
  boucherait à l'infini.

### Critères d'acceptation

- **AC1** : connexion de bout en bout via un provider activé → session Supabase
  valide (cas 1).
- **AC2** : première connexion d'un compte existant (email vérifié) → même
  utilisateur, droits/collectivités/fiches intacts, **toast une seule fois**
  (cas 2).
- **AC3** : aucun match, sans intention de création → dialog ; « oui » +
  re-connexion → **un seul** utilisateur, lié par `sub` ; « non » → création +
  CGU + pré-sélection SIRET, modifiable ; SIRET inconnu → sélecteur vide.
- **AC4** : changement d'email côté provider → même utilisateur retrouvé par
  `sub`, email synchronisé (sauf collision : loggée, non synchronisée).
- **AC5** : `sub` déjà lié à un autre compte lors d'une liaison volontaire →
  erreur explicite, aucun lien modifié.
- **AC6** : parcours MCA complet contre le realm `integration` puis `preprod-fa`,
  mêmes garanties que AC1–AC4.
- **AC7** *(révisé)* : provider activé → badge « Recommandé » sur l'écran de
  connexion, **onglet mot de passe toujours accessible** ; utilisateur
  authentifié sans identité liée → bannière d'annonce + modale d'incitation, la
  croix masquant durablement la bannière.
- **AC8** *(révisé)* : provider désactivé (`*_ENABLED=false` ou config
  incomplète) → aucun bouton, endpoints inertes (404), aucune bannière ni
  modale. Plus aucun provider configuré → `/signup` en mode dégradé + warning
  Sentry.
- **AC9** : compte OIDC-only (sans mot de passe) → la ligne « Email et mot de
  passe » n'apparaît pas dans le profil.
- **AC10** *(nouveau)* : `/signup` (point d'entrée) redirige vers le provider ;
  `/signup?view=etape3` ne redirige jamais.

### Limites de portée

- **Hors périmètre** : API PERSONNE (création de comptes Keycloak depuis TeT —
  contraintes réseau), SAML, refonte de l'onboarding au-delà des adaptations
  ciblées, fusion automatique de deux comptes créés à tort (runbook support).
- **Pas de fin de vie du mot de passe** *(limite assumée)* : aucun refus serveur
  du grant mot de passe, même pour un compte ayant lié MCA. « Lier » n'est pas
  « migrer ». Un jour de bascule reste à décider (OQ11/OQ12).
- **Pas de révocation de session** *(limite assumée)* : aucun changement d'état
  (liaison, déliaison, désactivation d'un provider) ne ferme les sessions en
  cours. Voir § Après déploiement.

## Key Technical Decisions

1. **Le backend NestJS possède tout le protocole OIDC** (login, callback,
   logout) via un contrôleur REST public (`OidcController`,
   `@AllowPublicAccess` + `@Throttle({limit: 10, ttl: 60000})`, pattern
   `apikeys.controller.ts`, ADR 0007), sous le **préfixe global `/api/v1`**.
   Endpoints : `GET /:provider/{login,callback,logout,logout/callback}`, le
   `login` acceptant `next`, `mode=link` et `intent=creation`. URLs de callback
   déclarées aux tiers :
   `https://api.territoiresentransitions.fr/api/v1/{provider}/callback`.
   Bibliothèque `openid-client` v6 (discovery en cache, validation id_token via
   JWKS). *(Le RP est côté `api.*`, pas `apps/app` — les URIs communiquées à la
   MOE Keycloak pointent sur `api.*`.)*
2. **Pont session Supabase** : `supabaseAdmin.auth.admin.generateLink({type:'magiclink'})`
   (aucun email envoyé, retourne `hashed_token`) → 303 vers
   `app.*/auth/verify?token_hash=…` → route handler `verifyOtp({type:'email', token_hash})`
   (client SSR) → cookies Supabase standards. Jamais `action_link` (incompatible
   PKCE de `@supabase/ssr`), jamais de JWT maison. Deux cookies annexes de 12 h
   sont posés au callback pour la seule déconnexion amont : `oidc-id-token`
   (httpOnly) et `oidc-provider` (lisible par l'app).
3. **Table d'identités multi-provider** `public.utilisateur_identite_oidc` — PK
   `(provider, sub)`, `UNIQUE(user_id, provider)`, colonnes `email`, `siret`,
   `idp_id`, `claims` jsonb, `created_at`, `last_sign_in_at`. RLS activée sans
   policy **et** `REVOKE ALL … FROM anon, authenticated` (le schéma `public`
   étant exposé à PostgREST, la RLS ne doit pas être l'unique barrière devant
   les claims bruts). Rotation de `sub` par upsert sur `(user_id, provider)`.
   `provider ∈ {'proconnect','moncompteademe'}`. Table de repli
   `public.utilisateur_identite_oidc_invitation` (token hashé sha256, 24 h, index
   partiel `(provider, sub) WHERE confirmed_at IS NULL`).
4. **Parcours déclaratif sans état intermédiaire** : au retour sans
   correspondance, rien n'est créé tant que l'utilisateur n'a pas répondu. Les
   claims vérifiés voyagent dans un **ticket JWT signé** (HS256,
   `OIDC_TICKET_SECRET`, TTL 15 min) ; les mutations tRPC du parcours sont des
   `publicProcedure` dont la preuve d'identité est ce ticket. Les routes app du
   parcours sont `/auth/proconnect*` (nommage historique conservé — le
   provider est porté par le ticket, pas par l'URL).
5. **Liaison assistée par re-connexion** : la branche « oui » de la dialog
   utilise le login classique comme preuve directe (mutation authed
   `linkOidcIdentityToUserSession`, entrée = ticket) — liaison immédiate. La
   table `utilisateur_identite_oidc_invitation` ne sert que le fallback « mot de
   passe oublié » (`inviteUserToLinkOidcIdentity` /
   `confirmOidcIdentityLinkedToUser`, publicProcedures).
6. **Liaison toujours visible** : toute liaison (auto cas 2 ou assistée)
   déclenche un toast via un indicateur one-shot posé au pont session
   (`?liaison=1` → `?comptes-associes=1`, lu une fois puis nettoyé de l'URL).
7. **Pré-sélection de collectivité par SIRET** — *opérante via ProConnect,
   inopérante via MCA en l'état* : claim `siret` → rapprochement
   SIREN→collectivité côté backend ; correspondance unique → pré-sélection
   modifiable. ProConnect émet le SIRET de l'organisation choisie par l'agent.
   MCA expose un claim `siret` et il est **mappé** dans
   `moncompteademe.config.ts`, mais une observation du 2026-08-10 sur
   `rec-fa.ademe.fr` (realm `integration`) a montré que le jeton porte le SIRET
   **du siège de l'ADEME** (`385290309…`), pas celui de la collectivité
   sélectionnée en amont, et n'émet ni `organization_label` ni `idp_id` :
   l'organisation ne franchit pas le Keycloak. Le commentaire de la config, qui
   affirme le contraire, est donc trompeur. La pré-sélection ne peut pas tomber
   juste par ce chemin ; les seules issues sont un mapper Keycloak côté ADEME ou
   ProConnect en direct. Reste à confirmer que `preprod-fa`/prod se comportent
   comme l'intégration (OQ10).
8. **Mise en avant par préférence de provider** *(remplace intégralement la
   migration date butoir + phases + feature flag)* :
   - `OIDC_PROVIDER_PREFERENCE` (constante serveur, MCA puis ProConnect) →
     premier provider configuré gagne, `null` si aucun.
   - `GetOidcStatusRouter` expose `getStatus` (public : `targetProvider`,
     `enabled` — pour les écrans non authentifiés) et `getUserStatus` (authed,
     qui ajoute `hasLinkedIdentity` et `hasPassword`).
   - L'affichage de la bannière et de la modale combine ce statut serveur avec
     les préférences per-utilisateur (`user-preferences.schema.ts`, bloc `oidc` :
     `isBannerVisible`, `modalDisplayCount`, `modalLastSeenAt`).
   - Aucune phase, aucun masquage du formulaire mot de passe, aucun feature flag.
9. **Politique `isEmailVerified(provider, claims)`** : une **liste de providers
   de confiance** (`OIDC_PROVIDERS_EMAIL_DE_CONFIANCE` = `proconnect`,
   `moncompteademe`) dont l'email fait foi **quelle que soit** la valeur du claim
   — ProConnect ne l'émet pas, et le Keycloak MCA d'intégration le renvoie à
   `false` alors que ProConnect est en coulisses. Tout provider non listé exige
   `email_verified === true` (absent ou `false` = non vérifié, fail closed).
   Conditionne la liaison auto (cas 2) et la synchronisation d'email (cas 1).
10. **Règles de matching** : recherche email sur `lower(auth.users.email)` ;
    `dcp.deleted` → non trouvé ; `dcp.limited` → `compte-desactive` ; sync email
    via `admin.updateUserById` avec garde-fou collision (échec ⇒ on garde l'email
    connu de GoTrue pour le pont session). DCP pré-remplies depuis
    `given_name`/`usual_name` (ProConnect) ou `given_name`/`family_name` puis
    repli `name`/`preferred_username` (MCA).
11. **Liaison volontaire sécurisée** (`mode=link`) : drapeau `oidc-link-mode`
    (valeur `'1'`, non forgeable) ; au callback le compte cible est **re-résolu
    depuis la session Supabase**, jamais depuis le cookie ; garde-fous (refus si
    `sub` déjà lié ailleurs / compte supprimé). Déliaison sérialisée par
    `SELECT … FOR UPDATE` pour éviter qu'un double appel concurrent ne laisse un
    compte sans aucun moyen de connexion (TOCTOU).
12. **MCA (Keycloak)** : scopes `openid email profile` ; auth client
    `client_secret_post` ; **userinfo JSON non signé** (≠ ProConnect RS256) ;
    mapping `usual_name` avec replis `family_name` → `name` →
    `preferred_username` ; `email_verified` émis. Logout local par défaut (SSO
    global ADEME).
13. **Création de compte par le provider** (`intent=creation` → cookie
    `oidc-signup-intent`) : quand le matching ne trouve rien, on crée directement
    au lieu de demander « aviez-vous déjà un compte ? » — l'intention est déjà
    connue. Repli formulaire email + mot de passe uniquement en mode dégradé
    (aucun provider configuré, ou backend injoignable) : mieux vaut un
    formulaire qu'une page en erreur.
14. **La session n'est jamais spécifique au provider** : le pont ne crée aucune
    session propre, et aucune ligne de code en aval ne distingue une session
    OIDC d'une session mot de passe. Les conséquences en exploitation sont
    documentées en § Après déploiement — c'est une décision d'architecture, pas
    un détail d'implémentation.
15. **e2e** : le front est couvert par Playwright avec les providers **activés à
    la volée côté client**, sans dépendre des flags backend — le test reste vert
    que le provider soit activé (dev) ou non (CI). Le tour complet contre un
    faux IdP OIDC reste à faire. Dev local : sandbox ProConnect + realm
    `integration` MCA.

## Implementation Units

> Repère d'état : ✅ livré · 🟡 partiel · ⬜ à faire.

### U1 — Spike pont session `generateLink` → `verifyOtp` ✅

- **Requirements** : R2 ; décisions 2, 14. **Dependencies** : aucune.
- **Fait** : le pont session fonctionne (connexion OIDC → session Supabase).
- **Verification** : session avec refresh token ; token_hash réutilisé rejeté.

### U2 — Module backend OIDC multi-provider ✅

- **Requirements** : R1, R6, R7, R13 ; décisions 1, 12.
- **Files** : `apps/backend/src/users/authentications/oidc/oidc.controller.ts`,
  `oidc-client.service.ts`, `create-supabase-session.service.ts`,
  `oidc.models.ts`, `oidc.utils.ts`,
  `provider-configs/oidc-provider.config.ts` (type + registre),
  `provider-configs/proconnect.config.ts`,
  `provider-configs/moncompteademe.config.ts` ;
  `apps/backend/src/utils/config/configuration.model.ts` (`PRO_CONNECT_*`,
  `MON_COMPTE_ADEME_*`, `OIDC_TICKET_SECRET` + `superRefine` fail-fast).
- **Fait** : cookies state/nonce/next httpOnly (TTL 5 min) ; auth client par
  provider ; erreurs typées → redirection.
- **Verification** : `nx test backend 'oidc'` vert.

### U3 — Modèle de données ✅

- **Requirements** : R3, R6 ; décisions 3, 5.
- **Files** : `data_layer/sqitch/deploy/utilisateur/utilisateur_identite_oidc.sql`
  et `…_invitation.sql` (+ `revert/`, `verify/`, tests pgTAP) ; tables Drizzle
  dans `apps/backend/src/users/authentications/oidc/models/`.
- **Verification** : PK/unicités/RLS + REVOKE ; upsert de rotation de sub.

### U4 — Matching et liaison (cas 1/2) + toast + email non vérifié ✅

- **Requirements** : R3, R14, AC1, AC2, AC4 ; décisions 6, 9, 10.
- **Files** : `login-user-with-oidc-provider/login-user-with-oidc-provider.service.ts`
  (statuts `connexion`, `compte-desactive`, `email-non-verifie`, `non-reconnu`) ;
  `isEmailVerified` dans `oidc.models.ts` ;
  `link-oidc-identity-to-user/link-oidc-identity-to-user.service.ts` ;
  `apps/app/app/(public)/auth/verify/route.ts` (verifyOtp + cookies + `next` +
  indicateur one-shot) ; `apps/app/src/utils/toast/toast-liaison-comptes.tsx`
  (monté dans `apps/app/app/root-providers.tsx`).
- **Verification** : e2e-spec backend colocalisés (dont `email_verified` absent
  vs explicitement `false`).

### U5 — Dialog de bienvenue (cas 3) : association ou création ✅

- **Requirements** : R4, R5, AC3 ; décisions 4, 5, 7.
- **Files app** : `apps/app/app/(public)/auth/proconnect/{page.tsx,
  confirmer-session/,confirmer-rattachement/}` ;
  `apps/app/src/users/authentications/oidc/link-oidc-identity/{link-oidc-identity.welcome.view.tsx,
  link-oidc-identity.confirm-session.view.tsx,
  link-oidc-identity.confirm-invitation.view.tsx}`.
- **Files backend** : `invite-user-to-link-oidc-identity/`,
  `confirm-oidc-identity-linked-to-user/`,
  `link-oidc-identity-to-user-session/`,
  `create-user-oidc-identity/create-user-oidc-identity.{service,controller}.ts`,
  `get-preselected-collectivite/`, `oidc-session-ticket/`.
- **Détail** : `confirmer-session` fait une **navigation dure**
  (`window.location.assign`) + ré-assainissement de `next` pour éviter un faux
  404 (groupe `(public)` sans providers collectivité).
- **Verification** : parcours manuel sandbox ; tour complet e2e ⬜ (U11).

### U6 — Déconnexion ✅

- **Requirements** : R8 ; décision 12.
- **Files** : endpoints `logout`/`logout/callback` du contrôleur ;
  `packages/api/src/utils/supabase/sign-out-user.server.ts` ;
  `apps/app/src/ui/layout/header/use-logout.ts` (navigation navigateur complète,
  l'URL de logout étant cross-origin) ;
  `apps/app/src/ui/layout/header/make-secondary-nav.ts`.
- **Fait** : logout fail-safe ; MCA local par défaut ; cookie `oidc-provider`
  validé par `/^[a-z]+$/` avant injection dans l'URL (il est modifiable côté
  client).

### U7 — MonCompteAdeme, second provider ✅

- **Requirements** : R6, AC6 ; décisions 1, 3, 12.
- **Files** : `provider-configs/moncompteademe.config.ts`,
  `configuration.model.ts` (`MON_COMPTE_ADEME_*`),
  `packages/ui/src/design-system/ProConnectButton/ProConnectButton.tsx`
  (mutualisé),
  `apps/app/src/users/authentications/oidc/login-user-with-oidc/login-user-with-oidc.buttons.tsx`.
- **Fait** : realm `integration`, scopes `openid email profile`,
  `client_secret_post`, userinfo JSON, mapping des claims. **Activé en dev**.
- **Reste** : recette croisée MOE Keycloak sur `preprod-fa`/prod (délais
  externes), et arbitrage du claim `siret` (décision 7).

### U8 — Liaison volontaire et déliaison depuis le profil ✅

- **Requirements** : R9, AC5, AC9 ; décision 11.
- **Files** : `apps/app/app/(authed)/profil/page.tsx` ;
  `apps/app/src/users/authentications/oidc/link-oidc-identity/{link-oidc-identity.methods.tsx,
  link-oidc-identity.profile-urls.ts}` ;
  `handle-user-oidc-identities/handle-user-oidc-identities.service.ts` (+ router,
  errors) ; `link-oidc-identity-to-user-session/` ; endpoint `login?mode=link`.
- **Fait** : lier/délier par provider ; garde-fous (dernier moyen de connexion,
  `FOR UPDATE`) ; cookie `oidc-link-mode` + re-résolution session au callback.

### U9 — Écrans de connexion et de création ✅

- **Requirements** : R1, R12, R16, AC8, AC10 ; décisions 13, 15.
- **Files** : `apps/app/app/(public)/login/{page.tsx,page.client.tsx}` ;
  `apps/app/app/(public)/signup/page.tsx` (résolution du provider +
  redirection + mode dégradé tracé Sentry) ;
  `apps/app/src/users/authentications/login-user/`,
  `apps/app/src/users/authentications/signup-user/` ;
  `apps/app/src/users/authentications/oidc/login-user-with-oidc/{login-user-with-oidc.buttons.tsx,
  login-user-with-oidc.recommended-block.tsx, login-user-with-oidc.urls.ts,
  use-login-user-with-oidc.ts}` ;
  `apps/app/src/users/authentications/oidc/create-user-with-oidc/create-user-with-oidc.urls.ts`.
- **Fait** : boutons pilotés par les providers activés ; badge « Recommandé » ;
  onglets classiques conservés ; `/signup` via provider.
- **Note** : le refactor `apps/auth` → `apps/app` est terminé — il n'y a plus
  d'app `auth`, plus de `LoginTabs.tsx` ni de `SignupStep1.tsx`.

### U10 — Statut serveur, bannière et modale d'incitation ✅

- **Requirements** : R10, R11, R15, AC7 ; décisions 8, 9.
- **Files backend** : `get-oidc-status/get-oidc-status.{service,router}.ts`
  (+ `.service.spec.ts`) ; composition dans le router `users`.
- **Files domaine** : `packages/domain/src/users/user-preferences.schema.ts`
  (bloc `oidc` : `isBannerVisible`, `modalDisplayCount`, `modalLastSeenAt`).
- **Files front** :
  `apps/app/src/users/authentications/oidc/link-oidc-identity/{use-link-oidc-identity.ts,
  link-oidc-identity.banner.tsx, link-oidc-identity.modal.tsx}` ; montages dans
  `apps/app/app/(authed)/authed-providers.tsx`.
- **Fait** : provider mis en avant par préférence ; bannière masquable ;
  incitation plafonnée à 3 rappels, 1×/session/jour.
- **Abandonné** : date butoir `OIDC_DEADLINE`, phases
  `coexistence`/`obligatoire`, masquage du formulaire mot de passe, modale
  bloquante, feature flag PostHog `sso-moncompteademe`.

### U11 — e2e, CI et documentation 🟡

- **Requirements** : R12, AC1–AC10 ; décision 15.
- **Fait** : tests backend `oidc` verts (dont `get-oidc-status`) ; e2e
  Playwright `e2e/tests/users/authentications/login-user-with-oidc.spec.ts`
  (+ `.helpers.ts`) couvrant bannière, modale d'incitation et badge
  « Recommandé », avec activation des providers côté client ;
  `middleware-auth-redirects.spec.ts` couvrant les gardes de navigation.
- **Reste** ⬜ : fake IdP OIDC en CI pour le **tour complet** (login → callback →
  session) ; ADR « Authentification externe OIDC multi-provider » dans
  `doc/adr/` ; documentation didactique `doc/connexion-unifiee-moncompteademe.md`
  (la § FAQ ci-dessous en est le brouillon) ; runbook de fusion support ; script
  d'audit des domaines email.

## Séquencement (rappel historique + état)

1. **Lot 1 — socle OIDC brut** : U1 → U2, U3 → U4. ✅
2. **Lot 2 — parcours complets** : U5 (dialog + création + SIRET), U6 (logout). ✅
3. **Lot 3 — MonCompteAdeme** : U7, U8. ✅ (recette croisée prod en attente)
4. **Lot 4 — connexion unifiée** : U9, U10. ✅ Reste : e2e du tour complet
   (U11), habilitations prod (DINUM ProConnect / MOE MCA), arbitrage du claim
   `siret`, et réactivation de ProConnect selon calendrier produit.

## Open Questions

- **OQ1** : habilitation prod ProConnect (DataPass) (DINUM). *Ouvert.*
- **OQ2** : redirect_uris sandbox ProConnect (localhost/http, multiples). *Résolu
  en pratique (dev OK).*
- **OQ3** : rate limit GoTrue `/auth/v1/verify` par IP Koyeb — chaque connexion
  OIDC en consomme un. À mesurer avant bascule prod (voir § Après déploiement).
  *Ouvert.*
- **OQ4** : `email_verified` ProConnect — **résolu : non émis** → politique par
  liste de providers de confiance (décision 9).
- **OQ5** : volumétrie de la rotation de `sub` (DINUM). *Ouvert.*
- **OQ6** : realm `integration` MCA accepte-t-il `http://localhost:8080` ? *À
  confirmer / fallback Keycloak Docker.*
- **OQ7** : rôle `consentCGU` requis pour le client MCA sans API PERSONNE ? (MOE).
- **OQ8** : durée de session ProConnect 12 h vs refresh Supabase — **documenté
  plutôt que fermé** : les deux horloges sont indépendantes, voir § Après
  déploiement. Reste une décision produit si l'on veut les aligner.
- **OQ9** : couverture SIRET→collectivité (EPCI par SIREN ; communes par INSEE) —
  mesurer (données/produit). *Ouvert.*
- **OQ10** *(requalifiée)* : sur `integration`, MCA porte le SIRET de l'ADEME et
  non celui de la collectivité choisie (observé le 2026-08-10) —
  `preprod-fa`/prod se comportent-ils pareil, et la MOE peut-elle ajouter un
  mapper qui relaie le SIRET de l'IdP amont ? Le claim est mappé côté TeT, donc
  rien à changer ici si le mapper arrive. À noter : le log de diagnostic des
  claims d'organisation a été retiré d'`oidc-client.service.ts`, il faudra le
  remettre le temps de la recette croisée (décision 7). La question a été posée à l'équipe MOE, réponse en attente.
- **OQ11** *(révisé)* : faut-il annoncer une **fin de vie du mot de passe**, et
  avec quel enforcement serveur (refus du grant, procédures sensibles) ? Il n'y a
  aujourd'hui aucune contrainte : ni date, ni blocage (produit + ops).
- **OQ12** *(révisé)* : quel signal déclenche la bascule vers « MCA seul »
  (taux de comptes liés, volumétrie de connexions OIDC) et par quel mécanisme,
  puisqu'il n'y a plus ni date butoir ni feature flag ? (produit).
- **OQ13** : `dcp.limited` → blocage support (retenu) ou rattachement ? *Retenu :
  blocage.*
- **OQ14** *(nouveau)* : quels réglages de session (timebox, inactivity timeout,
  rotation, reuse interval) sont en vigueur sur le projet Supabase Cloud ? Ils ne
  sont pas versionnés dans le dépôt et conditionnent la durée réelle des
  sessions, OIDC ou non (voir § Après déploiement).

## Risks & Dependencies

- **Aucune fin de vie du mot de passe** : la promesse « connexion unifiée » n'est
  pour l'instant qu'une incitation. Sans OQ11/OQ12 tranchées, la migration peut
  stagner indéfiniment, aucun impact néanmoins.
- **Délais externes** : DataPass DINUM et MOE Keycloak sur le chemin critique de
  la prod ; recette croisée MCA `preprod-fa`/prod en attente.
- **Rate limits GoTrue derrière des IP mutualisées** : le pont session consomme
  un `verify` par connexion, depuis des IP sortantes Koyeb partagées et
  changeantes. Un 429 dégraderait toutes les connexions OIDC simultanément.
- **Sandbox à SIRET/organisation figé** : la pré-sélection SIRET n'est réellement
  testable qu'avec l'habilitation prod, et l'origine du SIRET MCA reste à
  confirmer.
- **Prise de contrôle de compte** : liaison auto conditionnée à l'email vérifié
  (`isEmailVerified`) ; liaison assistée à double preuve ; `mode=link` re-résolu
  depuis la session ; fallback email anti-énumération, token hashé usage unique.
- **Logout SSO global MCA** : jamais appelé par défaut.
- **Mode dégradé de `/signup`** : si le backend est injoignable, la création de
  compte retombe sur le formulaire email + mot de passe. Sans ce repli, une
  panne backend supprimerait toute inscription — d'où le warning Sentry à
  surveiller.

## Verification Contract

1. `nx test backend 'oidc'` (dont `get-oidc-status`) vert ; typecheck backend +
   app + ui vert.
2. AC1–AC5 rejoués contre le provider activé ; AC6 contre `integration`.
3. AC7 : provider activé → badge « Recommandé » + onglet mot de passe présent ;
   bannière et modale visibles pour un compte non lié, bannière masquée
   durablement après clic sur la croix (`make test-e2e`).
4. AC8 : `*_ENABLED=false` → aucun bouton, endpoints 404 ; plus aucun provider →
   `/signup` en mode dégradé + warning Sentry.
5. AC9 : compte OIDC-only → pas de ligne mot de passe. AC10 : `/signup`
   redirige, `/signup?view=etape3` non.
6. Tour complet e2e contre un faux IdP ⬜ ; aucun secret provider dans le bundle
   client.

## Definition of Done

- [x] Spike pont session validé
- [x] Socle OIDC multi-provider + ProConnect + MonCompteAdeme (cas 1/2 + toast,
      email non vérifié, dialog, SIRET, logout)
- [x] Liaison volontaire/déliaison au profil
- [x] Statut serveur + bannière + modale d'incitation + badge « Recommandé »
- [x] Création de compte par le fournisseur d'identité (+ mode dégradé)
- [x] Section d'exploitation et FAQ (gestion des sessions) — ci-dessous
- [ ] Arbitrage du claim `siret` MCA (décision 7 / OQ10)
- [ ] Réglages de session Supabase Cloud relevés et assumés (OQ14)
- [ ] Décision produit sur la fin de vie du mot de passe (OQ11/OQ12)
- [ ] Habilitation prod DINUM ; recette croisée MCA `preprod-fa`/prod
- [ ] e2e fake IdP (tour complet) ; ADR publié ; runbook fusion support
- [ ] Réactivation de ProConnect selon calendrier produit

## Après déploiement

Cette section documente ce que le code fait **en exploitation** — les
comportements qui ne se déduisent ni des exigences ni des critères
d'acceptation, et sur lesquels le support et la recette de bascule s'appuient.

### Une seule mécanique de session

Le flux OIDC **ne crée pas de session propre**. Il s'arrête au moment où une
session Supabase standard s'ouvre :

1. `create-supabase-session.service.ts` appelle
   `auth.admin.generateLink({type:'magiclink'})` — aucun email envoyé — et
   récupère `properties.hashed_token`.
2. `oidc.controller.ts` redirige en 303 vers `app.*/auth/verify?token_hash=…`.
3. `apps/app/app/(public)/auth/verify/route.ts` consomme le token par
   `verifyOtp({type:'email', token_hash})` avec le client SSR.

À partir de là, les cookies posés sont **exactement ceux d'une connexion par mot
de passe** : même nom (`sb-<projectRef>-auth-token`, plus ses chunks `.0`, `.1`…),
mêmes options, issues d'une source unique
(`packages/api/src/utils/supabase/cookie-options.ts`) — domaine **racine** pour
être partagé entre `app.*`, `api.*` et `panier.*`, `sameSite: lax`, `secure` en
prod. Aucun code en aval du pont ne distingue les deux chemins : le backend
vérifie le même JWT HS256 (`convert-jwt-to-auth-user.service.ts`), les mêmes
`authedProcedure` s'appliquent.

### Durées de vie

| Élément | Durée | Où c'est fixé |
| --- | --- | --- |
| Access token (JWT) | **1 h** | `jwt_expiry = 3600` (`supabase/config.toml`), `GOTRUE_JWT_EXP` (`docker-compose.yml`) |
| Refresh token | reconductible, **aucune borne déclarée** | pas de bloc `[auth.sessions]` dans le dépôt |
| Cookie de session | `maxAge` ≈ 3 ans | `cookie-options.ts` |
| Cookies de flux OIDC (`state`, `nonce`, `next`, `link-mode`, `signup-intent`) | 5 min | `OIDC_FLOW_COOKIES_TTL_MS` |
| Cookies `oidc-id-token` / `oidc-provider` | 12 h | `OIDC_ID_TOKEN_COOKIE_TTL_MS` |
| Ticket OIDC (cas 3) | 15 min | `oidc-session-ticket/` |

Le cookie ne borne donc rien : c'est le refresh token qui décide, et le dépôt ne
lui impose ni timebox ni délai d'inactivité. **En production, l'autorité est le
projet Supabase Cloud** — ces réglages ne sont pas versionnés ici. C'est OQ14, et
c'est à relever avant la bascule plutôt qu'à déduire du dépôt.

### Rafraîchissement : deux moteurs indépendants

- **Navigateur** : `createBrowserClient` sans option `auth` explicite, donc
  `autoRefreshToken` actif par défaut ; `onAuthStateChange` dans
  `user-provider.tsx` met à jour le contexte React.
- **Serveur** : `apps/app/proxy.ts` (le middleware Next 16, renommé) appelle
  `getNextResponseWithUpdatedSupabaseSession` → `auth.getClaims()` à chaque
  requête et repose les cookies rafraîchis.

Deux subtilités du second moteur :

- Le projet est en **JWT symétrique HS256** : `getClaims()` n'a pas de clé
  publique à utiliser, retombe sur `getSession()` puis sur `getUser(token)` —
  soit un **aller-retour réseau vers GoTrue à chaque requête proxifiée**. C'est
  de loin le premier poste de charge GoTrue, très au-dessus des connexions OIDC.
- Le `matcher` du proxy **exclut les requêtes de prefetch** du router Next : une
  navigation préchargée ne rafraîchit pas la session.

### Ce que les cookies OIDC ajoutent — et n'ajoutent pas

`oidc-id-token` (httpOnly) porte l'`id_token_hint` du `session/end` ;
`oidc-provider` (volontairement lisible par l'app) indique vers quel
`/:provider/logout` rediriger. **Aucun des deux n'authentifie quoi que ce soit** :
les supprimer ne déconnecte personne, cela dégrade seulement la déconnexion
amont. `oidc-provider` étant modifiable côté client, il est validé par
`/^[a-z]+$/` avant d'être injecté dans une URL.

### Trois horloges désynchronisées

1. L'access token, 1 h, invisible pour l'utilisateur.
2. La session TeT, reconductible sans borne déclarée — potentiellement des mois.
3. La session SSO amont chez le provider (~12 h côté ProConnect), et son reflet
   local, les cookies OIDC de 12 h.

Les conséquences :

- **Au-delà de 12 h, la déconnexion TeT ne peut plus fermer la session amont** :
  sans `id_token_hint`, `logout` purge les cookies et redirige vers l'app. C'est
  le comportement fail-safe voulu (R8), mais il est perceptible — voir la FAQ.
- **La session TeT survit largement à la session amont** : un agent peut rester
  des semaines sur TeT sans jamais repasser par MonCompteAdeme.

C'était la question OQ8 ; on la documente plutôt qu'on ne la ferme, aligner les
deux horloges étant une décision produit.

### Aucune révocation de session à distance

- Lier ou délier une identité, désactiver un provider (`*_ENABLED=false` →
  endpoints 404), changer l'ordre de préférence : **aucune session en cours n'est
  touchée**, aucune identité n'est supprimée en base.
- Aucun **back-channel logout** n'est enregistré chez les providers, aucun
  `session_state` n'est surveillé : une déconnexion chez MonCompteAdeme ou dans
  une autre application ADEME n'a aucun effet sur la session TeT. Le symétrique
  est voulu (décision 12).
- À l'inverse, `signOutUser()` appelle `signOut()` **sans scope**, donc en scope
  `global` par défaut : la déconnexion TeT ferme les sessions **TeT** de
  l'utilisateur sur **tous ses appareils**. À connaître pour le support.
- `dcp.limited` bloque la liaison et la connexion OIDC, mais n'invalide pas un
  JWT déjà émis — au plus une heure de sursis. La seule révocation immédiate
  passe par `auth.admin` côté Supabase.

### Charge et rate limits GoTrue

Chaque connexion OIDC consomme **un `generateLink` (admin) et un `verifyOtp`**
(`/auth/v1/verify`). Les compteurs concernés — `token_verifications`,
`token_refresh`, `sign_in_sign_ups` dans `[auth.rate_limit]`, relevés à 50 en
local pour les e2e — sont en Cloud des **limites par IP**, or les IP sortantes
Koyeb sont mutualisées et changeantes. Le symptôme d'un dépassement serait un 429
sur `/auth/v1/verify`, donc `oidc-echec-session` pour tout le monde en même
temps. C'est OQ3 : à mesurer avant la bascule.

### Ce qui n'existe pas côté serveur

- **Aucun refus de la connexion par mot de passe**, même pour un compte ayant lié
  MCA. `hasPassword` ne pilote que l'affichage du profil.
- **Un JWT expiré et une session absente sont indiscernables côté client** : le
  contexte tRPC avale l'erreur de vérification et renvoie `{user: null}`, d'où un
  `UNAUTHORIZED / 'Not authenticated'` identique dans les deux cas. Le mot
  « expired » n'atteint jamais le client, ce qui rend la branche
  `!error.message?.includes('expired')` de
  `packages/api/src/utils/trpc/react-query-client.ts` inopérante — `UNAUTHORIZED`
  figure déjà dans `UNRECOVERABLE_ERRORS`. À nettoyer, mais surtout : ne pas
  s'appuyer dessus.
- **Aucun intercepteur ne déconnecte sur 401.** Le rétablissement passe par la
  navigation : le proxy redirige vers `/`, et
  `apps/app/src/users/data/require-onboarded-user.server.ts` vers `/login`.

### Leviers d'exploitation, et ce qu'ils ne font pas

| Levier | Effet | Ne fait pas |
| --- | --- | --- |
| `MON_COMPTE_ADEME_ENABLED` / `PRO_CONNECT_ENABLED` (+ config complète) | Boutons, endpoints, bannière, modale ; `superRefine` fail-fast au démarrage | Ne déconnecte personne, ne délie rien ; si les deux tombent, `/signup` passe en mode dégradé |
| `OIDC_PROVIDER_PREFERENCE` (constante serveur) | Choisit le provider mis en avant | N'empêche pas l'autre provider de fonctionner |
| Préférences utilisateur (`isBannerVisible`, `modalDisplayCount`, `modalLastSeenAt`) | Bannière et incitation | Ne valent pas consentement, ne bloquent aucun accès |
| `sessionStorage 'oidc-modal-seen'` | Une modale au plus par session | Non persistant : réinitialisé à chaque nouvelle session navigateur |

### Observabilité

- **Logs** : `OidcController` (login/callback/logout, erreurs typées),
  `LoginUserWithOidcProviderService` (cas 1/2/3, compte désactivé, email non
  vérifié), `HandleUserOidcIdentitiesService` (déliaison refusée). **Jamais
  d'email en clair** (CWE-532/RGPD) : `sub` + `userId` suffisent.
- **Sentry** : `AllExceptionsFilter` + hook `onError` tRPC (`UNAUTHORIZED`
  filtré) ; plus un `captureMessage('…mode dégradé…', 'warning')` explicite sur
  `/signup` quand le provider n'est pas résolu — à surveiller, c'est le signal
  d'une anomalie de configuration.
- **Taux de liaison** :
  `select provider, count(*) from public.utilisateur_identite_oidc group by 1`,
  à comparer aux comptes actifs. C'est le seul indicateur de progression de la
  migration (OQ12).
- **Rotation de `sub`** (OQ5) : visible comme un upsert sur `(user_id, provider)`
  avec un `sub` différent ; aucun compteur dédié aujourd'hui.

### Runbook support

| Code / erreur | Cause | Geste |
| --- | --- | --- |
| `oidc-email-non-verifie` | Un compte TeT porte cet email, mais le provider ne l'atteste pas (provider non listé de confiance) | Faire vérifier l'email chez le provider, ou lier depuis le profil une fois connecté classiquement |
| `oidc-compte-desactive` | `dcp.limited` | Traitement support : réactiver le compte avant toute liaison |
| `oidc-identite-deja-liee-ailleurs` | Le `sub` est déjà rattaché à un autre compte TeT | Délier depuis le compte qui le détient, puis relier |
| `oidc-session-requise` | Session perdue entre le clic « lier » et le retour du provider | Se reconnecter et relancer la liaison |
| `oidc-ticket-expire` | Plus de 15 min passées sur l'écran de bienvenue | Recommencer la connexion |
| `oidc-state-invalide` | Cookies de flux expirés (5 min) ou navigateur les refusant | Recommencer ; vérifier les réglages de cookies |
| `session-invalide` (sur `/auth/verify`) | `token_hash` rejoué ou expiré | Recommencer la connexion |
| `DELIAISON_REFUSEE_DERNIER_MOYEN_CONNEXION` | Ni mot de passe, ni autre identité liée | Définir un mot de passe ou lier un second provider avant de délier |
| Deux comptes pour la même personne | Création avant liaison | Aucune fusion automatique (hors périmètre) : lier au bon compte, délier du mauvais, supprimer le compte en trop côté Supabase |

### Checklist avant bascule prod

- [ ] Réglages de session du projet Supabase Cloud relevés et assumés (timebox,
      inactivity timeout, rotation, reuse interval) — OQ14.
- [ ] Rate limits GoTrue (`verify`, `token_refresh`) confrontés à la volumétrie
      de connexion attendue ; IP sortantes Koyeb connues — OQ3.
- [ ] `redirect_uri` et `post_logout_redirect_uri` déclarées à l'identique des
      deux côtés (`api.*`, HTTPS, sans wildcard).
- [ ] `OIDC_TICKET_SECRET` présent — sinon le backend refuse de démarrer.
- [ ] `SMTP_TO_EMAIL_WHITELIST` compatible avec le fallback « mot de passe
      oublié » de la liaison, qui envoie un email.
- [ ] `COOKIE_DOMAIN` cohérent avec la racine partagée `app.*` / `api.*`.
- [ ] Mode dégradé de `/signup` vérifié backend injoignable — sinon une panne
      backend supprimerait toute création de compte.

## FAQ

Registre technique et support : réponse courte d'abord, mécanisme et fichier
ensuite.

**1. La gestion des sessions va-t-elle changer pour quelqu'un utilisant
MonCompteAdeme par rapport à une session classique ?**

Non. Une fois connecté, il n'existe qu'une seule sorte de session : une session
Supabase/GoTrue. Le flux MonCompteAdeme s'arrête au moment où cette session
s'ouvre — le backend échange le code OIDC contre des claims vérifiés, demande à
GoTrue un `hashed_token` (`generateLink`, aucun email envoyé), et
`/auth/verify` le consomme par `verifyOtp`. À partir de là : mêmes cookies,
mêmes noms, mêmes options, même durée, même rafraîchissement, même vérification
côté backend. Rien en aval du pont ne sait par quel chemin l'utilisateur est
entré. Deux cookies annexes s'ajoutent (`oidc-id-token`, `oidc-provider`, 12 h)
mais n'authentifient rien : ils servent uniquement à savoir vers quel
`session/end` rediriger à la déconnexion.

**2. Que se passe-t-il au bout d'une heure, quand le JWT expire ? Faut-il
repasser par MonCompteAdeme ?**

Non, et c'est transparent. Le refresh token est consommé automatiquement par deux
moteurs indépendants : `autoRefreshToken` du client navigateur, et `getClaims()`
dans `apps/app/proxy.ts` à chaque navigation. Exactement comme pour une session
ouverte par mot de passe. On ne repasse par le provider que si le refresh token
est devenu invalide (déconnexion, révocation).

**3. Combien de temps reste-t-on connecté sans rien faire ?**

Le dépôt ne déclare aucune borne — ni timebox, ni délai d'inactivité — et le
cookie porte un `maxAge` de ~3 ans : en local, une session dure indéfiniment tant
que le refresh token reste valide. En production, l'autorité est le projet
Supabase Cloud, dont les réglages ne sont pas versionnés ici (OQ14). Ce point est
identique avec ou sans MonCompteAdeme.

**4. Se déconnecter de TeT déconnecte-t-il des autres applications ADEME ? Et
l'inverse ?**

Non dans les deux sens, volontairement. La déconnexion TeT ferme d'abord la
session locale, puis, si la session venait d'un provider, redirige vers son
`session/end`. Pour MonCompteAdeme, ce `session/end` invaliderait le SSO de
**toutes** les applications ADEME : la décision 12 est donc de ne pas l'appeler
par défaut. Dans l'autre sens, TeT n'a enregistré ni back-channel logout ni
surveillance de `session_state` : une déconnexion ailleurs n'a aucun effet ici.
Une nuance utile au support : `signOut()` étant appelé sans scope, donc en scope
`global`, la déconnexion TeT ferme les sessions **TeT** de la personne sur tous
ses appareils.

**5. Pourquoi, juste après une déconnexion, un reclic sur « MonCompteAdeme »
reconnecte sans ressaisie ?**

Parce que la session SSO amont est encore ouverte chez le provider. Deux cas de
figure : soit le `session/end` n'a pas été appelé (comportement par défaut pour
MonCompteAdeme), soit il ne pouvait plus l'être — le cookie `oidc-id-token` qui
porte l'`id_token_hint` expire au bout de 12 h alors que la session TeT peut
durer bien plus longtemps. Sans hint, la déconnexion reste locale, par choix
fail-safe (R8). Ce n'est donc pas une ancienne session TeT qui survit : c'en est
une nouvelle, ouverte sans ressaisie.

**6. Après avoir lié MonCompteAdeme, le mot de passe fonctionne-t-il toujours ?**

Oui. Aucun refus serveur n'est implémenté : lier une identité n'est pas migrer.
`hasPassword` sert seulement à décider si la ligne « Email et mot de passe »
s'affiche dans le profil. En revanche, la **création** de compte passe par le
provider (`/signup` redirige vers `intent=creation`), avec repli sur le
formulaire uniquement en mode dégradé.

**7. Si on désactive MonCompteAdeme en urgence, les utilisateurs sont-ils
déconnectés ?**

Non. `MON_COMPTE_ADEME_ENABLED=false` rend les endpoints `/moncompteademe/*`
inertes (404) et retire boutons, bannière et modale, mais ne touche aucune
session en cours, ne délie aucune identité et laisse les identités en base. Un
effet de bord à connaître : si plus aucun provider n'est configuré, `/signup`
retombe sur le formulaire email + mot de passe, tracé en warning Sentry.

**8. Que se passe-t-il si l'email change chez MonCompteAdeme ?**

Le compte est retrouvé par `sub`, jamais par email (cas 1), puis
`auth.users.email` est synchronisé — à deux conditions : que le provider atteste
l'email (`isEmailVerified`, vrai d'office pour ProConnect et MCA, décision 9) et
qu'aucun autre compte ne porte déjà cet email. En cas de collision, la
synchronisation est refusée et loggée ; la session s'ouvre avec l'email que
GoTrue connaît, pas celui du provider.

**9. Deux comptes créés par erreur pour la même personne : que peut faire le
support ?**

Rien d'automatique, la fusion étant hors périmètre. Trois leviers existent : lier
l'identité au bon compte depuis le profil (`mode=link` — refusé si le `sub` est
déjà lié ailleurs, avec `oidc-identite-deja-liee-ailleurs`), délier l'identité du
mauvais compte (refusé si c'est son dernier moyen de connexion), et supprimer le
compte en trop côté Supabase en tenant compte des clés étrangères.

**10. Comment sait-on si la migration progresse ?**

Par le contenu de `public.utilisateur_identite_oidc` : c'est le seul indicateur.
Il n'y a ni date butoir, ni feature flag, ni phase — donc aucun basculement
automatique à attendre. Décider du signal et du mécanisme de bascule est
précisément OQ12.

## Sources & Research

- Plan « ProConnect connexion unique » (2026-07-21) — architecture backend RP,
  pont session, matching, parcours 4c.
- Plan « Connexion MonCompteAdeme OIDC » (2026-07-20, supprimé) — kit MCA
  (realms, flow confidentiel, logout SSO global, API PERSONNE et contraintes
  réseau).
- Décisions UX Leny (2026-07-21) : dialog de bienvenue par re-connexion, toast
  systématique, pré-sélection SIRET.
- **Réconciliation avec l'implémentation (2026-07-23)** : politique de confiance
  sur `email_verified`, spécificités MCA (userinfo non signé, mapping
  `usual_name`), noms de tables/fichiers/variables.
- **Réconciliation et sections d'exploitation (2026-08-13)** : abandon de la date
  butoir, des phases et du feature flag au profit de la préférence de provider ;
  création de compte par le fournisseur d'identité ; refactor `apps/auth` →
  `apps/app` terminé ; chemins de fichiers alignés sur le code livré ;
  §§ « Après déploiement » et « FAQ » écrites depuis le code.
- Documentation didactique `doc/connexion-unifiee-moncompteademe.md` : **à
  écrire** — la § FAQ ci-dessus en est le brouillon.
- « MC-Kit d'intégration » (ADEME, 30/06).
- Analyse tacct (github.com/incubateur-ademe/tacct) — validation du pattern RP.
- Doc ProConnect : partenaires.proconnect.gouv.fr.
