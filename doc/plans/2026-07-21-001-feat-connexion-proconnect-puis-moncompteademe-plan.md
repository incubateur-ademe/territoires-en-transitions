---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: fusion des plans « ProConnect connexion unique » (2026-07-21) et « Connexion MonCompteAdeme OIDC » (2026-07-20) + décisions UX Leny (2026-07-21) + réconciliation avec l'implémentation livrée (2026-07-23, rétro-ingénierie)
---

# Connexion externe OIDC + connexion unifiée MonCompteAdeme

## Summary

Brancher l'authentification externe de TeT via **OpenID Connect (OIDC)** sur une
infrastructure **multi-provider**, puis, par-dessus, une couche produit de
**connexion unifiée** qui pousse puis impose progressivement **MonCompteAdeme
(MCA, le Keycloak de l'ADEME)**.

Le flux OIDC *relying party* (RP) vit dans `apps/backend` (la prod Supabase
Cloud interdit un provider custom GoTrue) et se « ponte » vers une session
Supabase standard : tout l'aval (tRPC, RLS, cookies partagés) reste inchangé.
Deux providers partagent ce socle — **ProConnect** (fédération OIDC de l'État)
et **MonCompteAdeme** — via une table d'identités unique et une config par
provider.

La bascule vers MCA est pilotée par une **date butoir configurable
(`OIDC_DEADLINE`, fuseau Europe/Paris)** qui définit deux phases —
**coexistence** (mot de passe + MCA, MCA recommandé) puis **obligatoire** (MCA
seul à l'écran) — le tout derrière un **feature flag PostHog**
(`connexion-unifiee-moncompteademe`) pour un déploiement progressif et
réversible.

> **État (repère, 2026-07-23)** : le socle OIDC multi-provider et les deux
> providers sont **implémentés** ; **MCA est activé** en dev, **ProConnect est
> désactivé par flag** (`PRO_CONNECT_ENABLED=false`) le temps de finaliser MCA.
> La couche connexion unifiée (statut de migration, phases, bannière, modale
> d'incitation, modale bloquante) est **implémentée derrière le feature flag**.
> Restent : e2e Playwright (fake IdP), ADR, et l'enforcement serveur de la
> Phase 2 (voir §Limites et OQ). Ce plan a été **réconcilié avec le code livré**
> (rétro-ingénierie) : les noms de fichiers/tables/variables reflètent
> l'implémentation réelle.
>
> **Décision révisée par cette fusion** : le plan ProConnect du 2026-07-21
> actait un no-go « pas de double système d'auth à J1 ». L'échéancier de
> coexistence (piloté par `OIDC_DEADLINE`) **remplace ce no-go**.

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
  - Migration `apps/auth` → `apps/app` en cours
    (`doc/plans/2026-06-24-001-refactor-auth-into-app-plan.md`) : l'écran de
    login final attend cette livraison ; le module OIDC backend, non. Les écrans
    de connexion/création vivent encore dans `apps/auth` (provisoire, U9).
  - MCA = Keycloak : realm `integration` sur rec-fa.ademe.fr (recette), realm
    `master` sur preprod-fa.ademe.fr (préprod) et moncompte.ademe.fr (prod).
    Flow confidentiel. **Email/username mutables** → liaison par `sub` (subject :
    identifiant technique chez le fournisseur) obligatoire.
  - Le `sub` ProConnect est unique par couple agent×FI — **non stable si l'agent
    change de FI** : rotation gérée par upsert.
  - **Différence de claims vérifiée** (résout OQ4) : **ProConnect n'émet pas
    `email_verified`** (confirmé via sa doc) ; **MCA (Keycloak) l'émet**. D'où la
    politique `estEmailVerifie` (décision 9).
  - URI strictes des deux côtés (correspondance exacte, wildcards proscrits,
    HTTPS en prod).

## Requirements

### Capacités clés

- **R1** : un bouton par provider déclenche un flux OIDC Authorization Code en
  client confidentiel porté par le backend ; le `client_secret` ne quitte jamais
  le serveur. ProConnect utilise le bouton officiel DSFR ; MCA un bouton maison
  (logo ADEME).
- **R2** : au retour du callback, l'utilisateur obtient une **session Supabase
  standard** (vrai refresh token GoTrue, cookies `.territoiresentransitions.fr`)
  et est redirigé vers sa destination (`next` whitelisté same-root-domain).
- **R3** : matching à la connexion : `sub` connu → session directe ; email connu
  **et vérifié** → **liaison automatique + toast** « comptes associés » (une
  seule fois) ; email connu **non vérifié** → statut dédié `email-non-verifie`
  (R14) ; aucun match → dialog de bienvenue (R4). Aucune donnée déplacée,
  `auth.users.id` reste la clé interne.
- **R4** : **dialog de bienvenue** (aucun match) : « Aviez-vous déjà un
  compte ? ». « Oui » → **re-connexion avec l'ancien compte** dans la même
  session → double preuve → liaison immédiate + toast ; fallback « mot de passe
  oublié » → email de confirmation (token hashé, usage unique, 24 h, pas de
  session au clic). « Non » → création de compte.
- **R5** : création de compte → étape signup existante (téléphone + CGU) puis
  « rejoindre une collectivité » avec **pré-sélection par SIRET** (SIREN = 9
  premiers chiffres, modifiable) ; rôle et intitulé de poste saisis par
  l'utilisateur.
- **R6** : **infrastructure multi-provider** : table d'identités unique, module
  backend commun, registre de config par provider, mêmes cas de matching et
  parcours — seules la config (issuer, client, scopes/claims, auth) et le bouton
  diffèrent. Chaque provider s'active/se désactive indépendamment (`*_ENABLED`).
- **R7** : configuration par environnement (`PRO_CONNECT_*`,
  `MON_COMPTE_ADEME_*`, `OIDC_*`) via GitHub Environments / Koyeb, chiffrée
  dotenvx en local ; aucun secret dans le bundle client.
- **R8** : déconnexion **fail-safe** : la session Supabase locale meurt d'abord,
  puis redirection `session/end` du provider avec `id_token_hint` — l'échec de
  l'étape provider ne bloque jamais le logout local. MCA : logout local par
  défaut (son `session/end` invalide le SSO de toutes les applications ADEME).
- **R9** : un utilisateur connecté peut **lier volontairement** son identité
  externe depuis son profil (mode `link` : rattache le `sub` au compte courant,
  avec garde-fous anti-vol), et la délier (garde-fou anti-lock-out : refus si
  c'est le dernier moyen de connexion).
- **R10** *(révisé)* : la migration est pilotée par la **date butoir
  `OIDC_DEADLINE`** (fuseau Europe/Paris) → deux phases calculées **côté
  serveur** : `coexistence` (avant) et `obligatoire` (après). En phase
  obligatoire, le formulaire mot de passe est **retiré de l'UI** (connexion,
  création) et une **modale bloquante** impose la liaison MCA. *Remplace le
  `AUTH_LOGIN_MODE=dual|sso_only` du plan initial.*
- **R11** : en phase coexistence, une **bannière d'annonce** in-app
  (per-utilisateur, masquable) et une **modale d'incitation** post-connexion
  (non bloquante, « Rappel n/3 », au plus 1×/session/jour) invitent à lier MCA.
  Après l'échéance, la modale bloquante sert de parcours de rattrapage.
- **R12** : le login classique reste strictement fonctionnel pendant la
  coexistence (aucune régression, invitations comprises).
- **R13** : tout échec OIDC (state, nonce, token invalide, erreur provider,
  compte désactivé) aboutit à un message explicite, jamais à une 500 nue
  (redirection typée `?erreur=<code>`).
- **R14** *(nouveau)* : quand un compte TeT existe pour l'email mais que le
  provider ne l'atteste pas vérifié (`estEmailVerifie` faux), on **ne rattache
  pas automatiquement** ; l'utilisateur est renvoyé vers un écran d'alerte
  (« vérifiez d'abord votre email ») plutôt que vers un dead-end.
- **R15** *(nouveau)* : **toute** la couche connexion unifiée (traitement
  recommandé, bannière, modales, masquage du mot de passe) est **derrière le
  feature flag PostHog** `connexion-unifiee-moncompteademe`. Flag OFF ⇒ aucun
  changement d'interface, aucune modale/bannière. Actif en dev/ci par défaut.

### Critères d'acceptation

- **AC1** : connexion de bout en bout via un provider activé → session Supabase
  valide (cas 1).
- **AC2** : première connexion d'un compte existant (email vérifié) → même
  utilisateur, droits/collectivités/fiches intacts, **toast une seule fois**
  (cas 2).
- **AC3** : aucun match → dialog ; « oui » + re-connexion → **un seul**
  utilisateur, lié par `sub` ; « non » → création + CGU + pré-sélection SIRET
  (ProConnect), modifiable ; SIRET inconnu → sélecteur vide.
- **AC4** : changement d'email côté provider → même utilisateur retrouvé par
  `sub`, email synchronisé (sauf collision : loggée, non synchronisée).
- **AC5** : `sub` déjà lié à un autre compte lors d'une liaison volontaire →
  erreur explicite, aucun lien modifié.
- **AC6** : parcours MCA complet contre le realm `integration` puis `preprod-fa`,
  mêmes garanties que AC1–AC4.
- **AC7** *(révisé)* : phase `obligatoire` (date passée + FF actif) → formulaire
  mot de passe absent des écrans connexion/création (MCA seul) ; utilisateur
  authentifié sans identité MCA liée → **modale bloquante** de liaison ; bascule
  vérifiée en changeant `OIDC_DEADLINE`.
- **AC8** : provider désactivé (`*_ENABLED=false`) → aucun bouton, endpoints
  inertes (404). Feature flag OFF → aucune modale/bannière, écrans actuels
  intacts.
- **AC9** *(nouveau)* : compte OIDC-only (sans mot de passe) → la ligne « Email
  et mot de passe » n'apparaît pas dans « Mon compte ».

### Limites de portée

- **Hors périmètre** : API PERSONNE (création de comptes Keycloak depuis TeT —
  contraintes réseau), SAML, refonte de l'onboarding au-delà des adaptations
  ciblées, fusion automatique de deux comptes créés à tort (runbook support).
- **Enforcement Phase 2 côté serveur** *(limite connue)* : le retrait du mot de
  passe en phase obligatoire est **côté UI** (masquage + modale bloquante).
  GoTrue reste joignable ; le ré-appariement réel repose sur le flux OIDC-first
  (à la 1ʳᵉ connexion MCA, appariement par email). Un refus serveur du grant mot
  de passe quand `liaisonRequise` est une **étape ops** non implémentée (OQ11).

## Key Technical Decisions

1. **Le backend NestJS possède tout le protocole OIDC** (login, callback,
   logout) via un contrôleur REST public (`IdentiteOidcController`,
   `@AllowPublicAccess` + `@Throttle`, pattern `apikeys.controller.ts`,
   ADR 0007), sous le **préfixe global `/api/v1`**. Endpoints :
   `GET /:provider/{login,callback,logout,logout/callback}`. URLs de callback
   déclarées aux tiers : `https://api.territoiresentransitions.fr/api/v1/{provider}/callback`.
   Bibliothèque `openid-client` v6 (discovery en cache, validation id_token via
   JWKS). *(Le RP est côté `api.*`, pas `apps/app` — les URIs communiquées à la
   MOE Keycloak pointent sur `api.*`.)*
2. **Pont session Supabase** : `supabaseAdmin.auth.admin.generateLink({type:'magiclink'})`
   (aucun email envoyé, retourne `hashed_token`) → 303 vers
   `app.*/auth/verify?token_hash=…` → route handler `verifyOtp({type:'email', token_hash})`
   (client SSR) → cookies Supabase standards. Jamais `action_link` (incompatible
   PKCE de `@supabase/ssr`), jamais de JWT maison. Cookie `oidc-id-token`
   (httpOnly, domaine racine, 12 h) conservé pour le logout.
3. **Table d'identités multi-provider** `utilisateur.identite_oidc` — PK
   `(provider, sub)`, `UNIQUE(user_id, provider)`, colonnes `email`, `siret`,
   `idp_id`, `claims` jsonb, `created_at`, `derniere_connexion`. RLS sans policy
   (service_role only). Rotation de `sub` par upsert sur `(user_id, provider)`.
   `provider ∈ {'proconnect','moncompteademe'}`. Table de repli
   `utilisateur.demande_rattachement` (token hashé sha256, 24 h, index partiel
   `(provider, sub) WHERE confirmed_at IS NULL`).
   *(Noms définitifs sans suffixe `_proconnect` : le modèle est multi-provider
   dès le départ.)*
4. **Parcours déclaratif sans état intermédiaire** : au retour sans
   correspondance, rien n'est créé tant que l'utilisateur n'a pas répondu. Les
   claims vérifiés voyagent dans un **ticket JWT signé** (HS256,
   `OIDC_TICKET_SECRET`, TTL 15 min) ; les mutations tRPC du parcours sont des
   `publicProcedure` dont la preuve d'identité est ce ticket. Les routes app du
   parcours sont `/proconnect/bienvenue*` (nommage historique conservé — le
   provider est porté par le ticket, pas par l'URL).
5. **Liaison assistée par re-connexion** : la branche « oui » de la dialog
   utilise le login classique comme preuve directe (mutation authed
   `lierIdentiteParSession`, entrée = ticket) — liaison immédiate. La table
   `demande_rattachement` ne sert que le fallback « mot de passe oublié »
   (`demanderRattachement` / `confirmerRattachement`, publicProcedures).
6. **Liaison toujours visible** : toute liaison (auto cas 2 ou assistée)
   déclenche un toast via un indicateur one-shot posé au pont session.
7. **Pré-sélection de collectivité par SIRET** (ProConnect) : claim `siret` →
   rapprochement SIREN→collectivité côté backend ; correspondance unique →
   pré-sélection modifiable. MCA n'expose pas de SIRET (résout OQ10 : non).
8. **Migration pilotée par date + phase (côté serveur) + feature flag**
   *(remplace `AUTH_LOGIN_MODE`)* :
   - `OIDC_DEADLINE` (chaîne `AAAA-MM-JJ`/`AAAA/MM/JJ`, interprétée en
     **Europe/Paris** via luxon — gère CET/CEST) → phase `coexistence` |
     `obligatoire` calculée par `StatutMigrationService`.
   - `StatutMigrationRouter` expose `getStatutMigration` (public : phase, date,
     provider actif) et `getStatutMigrationUtilisateur` (authed : + identité
     liée, présence de mot de passe, `liaisonRequise`).
   - Feature flag PostHog `connexion-unifiee-moncompteademe` (hook partagé
     `useIsFeatureFlagEnabled` dans `@tet/ui`, utilisé par `apps/app` **et**
     `apps/auth`) gate tout l'affichage.
   - Phase 2 = **masquage UI** du mot de passe + modale bloquante ; désactivation
     GoTrue = étape ops (limite connue).
9. **Politique `estEmailVerifie(provider, claims)`** : `email_verified`
   explicitement `false` → non vérifié (bloquant) ; **absent** → confiance
   accordée au provider (ProConnect est « de confiance » : email issu de l'IdP
   officiel) ; MCA émet le claim, donc sa valeur réelle est respectée. Conditionne
   la liaison auto (cas 2) et la synchronisation d'email (cas 1). Résout OQ4.
10. **Règles de matching** : recherche email sur `lower(auth.users.email)` ;
    `dcp.deleted` → non trouvé ; `dcp.limited` → `compte-desactive` ; sync email
    via `admin.updateUserById` avec garde-fou collision. DCP pré-remplies depuis
    `given_name`/`usual_name` (ProConnect) ou `given_name`/`family_name` puis
    repli `name`/`preferred_username` (MCA).
11. **Liaison volontaire sécurisée** (`mode=link`) : drapeau `oidc-link-mode`
    (valeur `'1'`, non forgeable) ; au callback le compte cible est **re-résolu
    depuis la session Supabase**, jamais depuis le cookie ; `rattacherAvecGardeFous`
    (refus si `sub` déjà lié ailleurs / compte supprimé).
12. **MCA (Keycloak)** : scopes `openid email profile` ; auth client
    `client_secret_post` ; **userinfo JSON non signé** (≠ ProConnect RS256) ;
    mapping `usual_name ← family_name` (repli `name`/`preferred_username`) ;
    `email_verified` émis. Logout local par défaut (SSO global ADEME).
13. **e2e** : fake IdP OIDC en CI (`oidc-provider` node), backend CI pointé
    dessus. Dev local : sandbox ProConnect + realm `integration` MCA.

## Implementation Units

> Repère d'état : ✅ livré · 🟡 partiel · ⬜ à faire.

### U1 — Spike pont session `generateLink` → `verifyOtp` ✅

- **Requirements** : R2 ; décision 2. **Dependencies** : aucune.
- **Fait** : le pont session fonctionne (connexion OIDC → session Supabase).
- **Verification** : session avec refresh token ; token_hash réutilisé rejeté.

### U2 — Module backend OIDC multi-provider ✅

- **Requirements** : R1, R6, R7, R13 ; décisions 1, 12.
- **Files** : `apps/backend/src/users/identite-oidc/identite-oidc.controller.ts`,
  `oidc-client.service.ts`, `creer-session.service.ts`,
  `providers/oidc-provider.config.ts` (type + **registre**
  `buildOidcProviderConfig`), `providers/proconnect.config.ts`,
  `providers/moncompteademe.config.ts` ; `configuration.model.ts`
  (`PRO_CONNECT_*`, `MON_COMPTE_ADEME_*`, `OIDC_*`).
- **Fait** : cookies state/nonce/next httpOnly ; auth client par provider
  (`client_secret_post`/`basic`) ; erreurs typées → redirection.
- **Verification** : `nx test backend 'identite-oidc'` vert.

### U3 — Modèle de données ✅

- **Requirements** : R3, R6 ; décisions 3, 5.
- **Files** : migrations Sqitch `utilisateur/identite_oidc` + `demande_rattachement` ;
  tables Drizzle dans `apps/backend/src/users/identite-oidc/models/`.
- **Verification** : PK/unicités/RLS ; upsert de rotation de sub.

### U4 — Matching et liaison (cas 1/2) + toast + email non vérifié ✅

- **Requirements** : R3, R14, AC1, AC2, AC4 ; décisions 6, 9, 10.
- **Files** : `authentifier/authentifier-oidc.service.ts` (statuts `connexion`,
  `compte-desactive`, `email-non-verifie`, `non-reconnu` ; `estEmailVerifie`),
  `rattacher-identite/rattacher-identite.service.ts` ;
  `apps/app/app/auth/verify/route.ts` (verifyOtp + cookies + `next` + indicateur
  one-shot), toast `ToastLiaisonComptes`.
- **Fait** : cas 1/2 + toast ; `email-non-verifie` → écran de bienvenue en mode
  alerte (`?erreur=oidc-email-non-verifie`).
- **Verification** : e2e-spec backend colocalisés (dont `email_verified` absent
  vs explicitement `false`).

### U5 — Dialog de bienvenue (cas 3) : association ou création ✅

- **Requirements** : R4, R5, AC3 ; décisions 4, 5, 7.
- **Files** : `apps/app/app/(public)/proconnect/bienvenue/{page,confirmer-session,
  confirmer-rattachement}` + `src/auth/proconnect/{bienvenue,confirmer-session}.view.tsx` ;
  backend `demander-rattachement/`, `confirmer-rattachement/`,
  `creer-compte/creer-compte-oidc.{service,controller}.ts`
  (`@Controller('proconnect/bienvenue')`, `GET creer-compte`) ;
  `preselection-collectivite/`.
- **Détail** : `confirmer-session` fait une **navigation dure**
  (`window.location.assign`) + ré-assainissement de `next` pour éviter un faux
  404 (groupe `(public)` sans providers collectivité).
- **Verification** : parcours manuel sandbox ; e2e Playwright ⬜.

### U6 — Déconnexion ✅

- **Requirements** : R8 ; décision 12.
- **Files** : endpoints `logout`/`logout/callback` du contrôleur ;
  `sign-out-user.server.ts`.
- **Fait** : logout fail-safe ; MCA local par défaut.

### U7 — MonCompteAdeme, second provider ✅

- **Requirements** : R6, AC6 ; décisions 1, 3, 12.
- **Files** : `providers/moncompteademe.config.ts`, `configuration.model.ts`
  (`MON_COMPTE_ADEME_*`), bouton MCA (`@tet/ui`), `OidcProviderButtons.tsx`.
- **Fait** : realm `integration`, scopes `openid email profile`,
  `client_secret_post`, userinfo JSON, mapping des claims. **Activé en dev**.
- **Reste** : recette croisée MOE Keycloak sur `preprod-fa`/prod (délais
  externes).

### U8 — Liaison volontaire et déliaison depuis le profil ✅

- **Requirements** : R9, AC5, AC9 ; décision 11.
- **Files** : `apps/app/src/users/profil/profil-methodes-connexion.tsx`,
  `gerer-identites/gerer-identites.{service,router}.ts`,
  `lier-identite/lier-identite-par-session.{service,router}.ts`, endpoint
  `login?mode=link`.
- **Fait** : lier/délier par provider ; garde-fous ; cookie `oidc-link-mode` +
  re-résolution session au callback.

### U9 — Écrans de login/création + exposition ✅ (provisoire, avant refactor)

- **Requirements** : R1, R12, AC8 ; dépend du refactor auth→app pour l'écran
  final.
- **Files** : `apps/auth/components/Login/LoginTabs.tsx`,
  `Signup/SignupStep1.tsx`, `OidcProviderButtons.tsx`, `LoginModal`/`SignupModal`
  (largeur `md`).
- **Fait** : boutons providers pilotés par `listerProvidersActifs` (seuls les
  providers activés s'affichent) ; onglets classiques conservés.
- **Note** : provisoire (TODO U-refactor) ; le bouton n'apparaît que si le
  provider est activé backend.

### U10 — Connexion unifiée : phases, statut, bannière, modales ✅ (derrière FF)

- **Requirements** : R10, R11, R15, AC7, AC9 ; décisions 8, 9.
- **Files backend** : `identite-oidc/statut-migration/{service,router,service.spec}.ts` ;
  `configuration.model.ts` (`OIDC_DEADLINE`) ; `users.router.ts` (composition).
- **Files domaine** : `packages/domain/src/utils/feature-flags.ts` (clé FF) ;
  `packages/domain/src/users/user-preferences.schema.ts` (bloc `moncompteademe`) ;
  `packages/ui/src/components/tracking/use-is-feature-flag-enabled.ts` (hook
  partagé).
- **Files front** : `apps/auth/components/ConnexionUnifiee/` (hook + blocs
  Phase 1/2 + séparateur) ; `apps/app/src/users/moncompteademe/`
  (`use-statut-migration-mca`, `annonce-migration.banner`,
  `incitation-liaison.modal`, `liaison-obligatoire.modal`) ;
  `authed-providers.tsx` (montages) ; `profil-methodes-connexion.tsx` (phases).
- **Fait** : phase Europe/Paris ; bannière masquable + incitation (compteur en
  préférences) + modale bloquante ; masquage du formulaire mot de passe en
  Phase 2 (anti-flash pendant le chargement) ; « Mon compte » Phase 1/2.
- **Reste** : enforcement serveur de la Phase 2 (refus grant password /
  procédures sensibles quand `liaisonRequise`) — étape ops (OQ11).

### U11 — e2e, CI et documentation 🟡

- **Requirements** : R12, AC1–AC7.
- **Fait** : tests backend `identite-oidc` (dont `statut-migration`) verts ;
  documentation didactique `doc/connexion-unifiee-moncompteademe.md`.
- **Reste** ⬜ : fake IdP OIDC + e2e Playwright (fixtures de connexion) ; ADR
  « Authentification externe OIDC multi-provider » dans `doc/adr/` ; script
  d'audit des domaines email.

## Séquencement (rappel historique + état)

1. **Lot 1 — socle OIDC brut** : U1 → U2, U3 → U4. ✅
2. **Lot 2 — parcours complets** : U5 (dialog + création + SIRET), U6 (logout). ✅
3. **Lot 3 — MonCompteAdeme** : U7, U8. ✅ (recette croisée prod en attente)
4. **Lot 4 — connexion unifiée** : U9, U10 (phases + bannière + modales, FF). ✅
   Reste : enforcement serveur Phase 2 (ops), e2e (U11), habilitations prod
   (DINUM ProConnect / MOE MCA), et réactivation de ProConnect selon calendrier.

## Open Questions

- **OQ1** : habilitation prod ProConnect (DataPass) (DINUM). *Ouvert.*
- **OQ2** : redirect_uris sandbox ProConnect (localhost/http, multiples). *Résolu
  en pratique (dev OK).*
- **OQ3** : rate limit GoTrue `/auth/v1/verify` par IP Koyeb — mesurer avant
  bascule prod (Supabase). *Ouvert.*
- **OQ4** : `email_verified` ProConnect — **résolu : non émis** → politique
  `estEmailVerifie` (décision 9).
- **OQ5** : volumétrie de la rotation de `sub` (DINUM). *Ouvert.*
- **OQ6** : realm `integration` MCA accepte-t-il `http://localhost:8080` ? *À
  confirmer / fallback Keycloak Docker.*
- **OQ7** : rôle `consentCGU` requis pour le client MCA sans API PERSONNE ? (MOE).
- **OQ8** : durée de session ProConnect 12 h vs refresh Supabase (produit).
- **OQ9** : couverture SIRET→collectivité (EPCI par SIREN ; communes par INSEE) —
  mesurer (données/produit). *Ouvert.*
- **OQ10** : MCA expose-t-il un claim SIRET/organisation ? **Résolu : non.**
- **OQ11** *(révisé)* : faut-il un **enforcement serveur** de la Phase 2 (refus
  du grant mot de passe quand `liaisonRequise`), ou le masquage UI + appariement
  OIDC-first suffit-il ? (produit + ops).
- **OQ12** : critère de bascule (date `OIDC_DEADLINE` + taux de comptes liés) et
  cohorte de déploiement du feature flag (produit).
- **OQ13** : `dcp.limited` → blocage support (retenu) ou rattachement ? *Retenu :
  blocage.*

## Risks & Dependencies

- **Enforcement Phase 2 UI-only** : la garantie de blocage n'est pas côté serveur
  (OQ11) — à assumer ou à durcir avant une prod « obligatoire ».
- **Délais externes** : DataPass DINUM et MOE Keycloak sur le chemin critique de
  la prod ; recette croisée MCA `preprod-fa`/prod en attente.
- **Sandbox à SIRET/organisation figé** : la pré-sélection SIRET n'est réellement
  testable qu'avec l'habilitation prod.
- **Prise de contrôle de compte** : liaison auto conditionnée à l'email vérifié
  (`estEmailVerifie`) ; liaison assistée à double preuve ; `mode=link` re-résolu
  depuis la session ; fallback email anti-énumération, token hashé usage unique.
- **Refactor auth→app en parallèle** : écrans de connexion encore dans `apps/auth`
  (provisoire) ; coordonner l'écran final.
- **Logout SSO global MCA** : jamais appelé par défaut.

## Verification Contract

1. `nx test backend 'identite-oidc'` (dont `statut-migration`) vert ; typecheck
   backend + app + ui + auth vert.
2. AC1–AC5 rejoués contre le provider activé ; AC6 contre `integration`.
3. AC7 : basculer `OIDC_DEADLINE` à une date passée (FF actif) → écrans MCA-only
   - modale bloquante ; date future → Phase 1 (bannière + incitation) ; AC8 :
   FF OFF → aucun changement ; provider désactivé → 404.
4. AC9 : compte OIDC-only → pas de ligne mot de passe.
5. e2e Playwright (fake IdP) ⬜ ; aucun secret provider dans le bundle client.

## Definition of Done

- [x] Spike pont session validé
- [x] Socle OIDC multi-provider + ProConnect + MonCompteAdeme (cas 1/2 + toast,
      email non vérifié, dialog, SIRET, logout)
- [x] Liaison volontaire/déliaison au profil
- [x] Connexion unifiée derrière feature flag : phases (Europe/Paris), bannière,
      incitation, modale bloquante, « Mon compte » Phase 1/2
- [ ] Enforcement serveur Phase 2 (décision OQ11) — si retenu
- [ ] Habilitation prod DINUM ; recette croisée MCA `preprod-fa`/prod
- [ ] e2e fake IdP Playwright ; ADR publié ; runbook fusion support
- [ ] Réactivation de ProConnect selon calendrier produit

## Sources & Research

- Plan « ProConnect connexion unique » (2026-07-21) — architecture backend RP,
  pont session, matching, parcours 4c.
- Plan « Connexion MonCompteAdeme OIDC » (2026-07-20, supprimé) — kit MCA
  (realms, flow confidentiel, logout SSO global, API PERSONNE et contraintes
  réseau).
- Décisions UX Leny (2026-07-21) : dialog de bienvenue par re-connexion, toast
  systématique, pré-sélection SIRET.
- **Réconciliation avec l'implémentation (2026-07-23)** : politique
  `estEmailVerifie` (ProConnect n'émet pas `email_verified`), couche connexion
  unifiée (`OIDC_DEADLINE` Europe/Paris + phases + feature flag PostHog),
  spécificités MCA (userinfo non signé, mapping `usual_name`), noms
  de tables/fichiers/variables définitifs, limite d'enforcement Phase 2.
- Documentation didactique : `doc/connexion-unifiee-moncompteademe.md`.
- « MC-Kit d'intégration » (ADEME, 30/06).
- Analyse tacct (github.com/incubateur-ademe/tacct) — validation du pattern RP.
- Doc ProConnect : partenaires.proconnect.gouv.fr.
