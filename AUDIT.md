# Audit de Code — Territoires en Transitions

**Date :** 2026-03-18
**Scope :** Audit statique complet (architecture, sécurité, qualité, CI/CD, OSS)

---

## 1. Vue d'ensemble du projet

| Aspect | Détail |
|--------|--------|
| **Type** | Monorepo (Nx + pnpm workspaces) |
| **Frontend** | Next.js 16, React 19, TailwindCSS, DSFR |
| **Backend** | NestJS 11, tRPC 11, BullMQ/Redis |
| **BDD** | PostgreSQL 15 via Supabase, Drizzle ORM |
| **Migrations** | Sqitch |
| **Tests** | Vitest, Playwright, pgTAP |
| **CI/CD** | GitHub Actions (22 workflows), Earthly |
| **Déploiement** | Koyeb (Paris), GHCR |
| **Node** | 24.x |

Le projet est une plateforme ADEME aidant les collectivités françaises dans leur transition écologique. Architecture moderne, bien structurée en 6 applications et 3 packages partagés.

---

## 2. Points forts

### 2.1 Architecture solide
- **Monorepo bien organisé** avec Nx pour l'orchestration des builds et tâches.
- **Séparation claire** : `apps/` (app, auth, backend, site, panier, tools), `packages/` (api, domain, ui), `data_layer/`.
- **ADR (Architecture Decision Records)** documentées (15+ décisions : tRPC, BullMQ, DDD, etc.).
- **TypeScript strict** activé (`"strict": true` dans tsconfig.base.json).

### 2.2 Stack technique moderne et cohérente
- **tRPC end-to-end typesafe** entre frontend et backend — excellente DX et sécurité de types.
- **React Query** pour la gestion d'état serveur.
- **DSFR** (Design System de l'État Français) garantit l'accessibilité et le respect des normes gouvernementales.
- **Drizzle ORM** pour un accès base typé et performant.

### 2.3 Pipeline CI/CD robuste
- **22 workflows GitHub Actions** couvrant CI, CD, tests, et déploiements.
- Parallélisation des jobs avec cache NX, Next.js et pnpm.
- Tests E2E Playwright avec retry (2x en CI) et rapports HTML.
- Builds containerisés via **Earthly** — reproductibles et isolés.

### 2.4 Bonnes pratiques de sécurité de base
- Pas de credentials hardcodées dans le code source.
- `.gitignore` correctement configuré (`.env`, `keyfile.json` exclus).
- Secrets GitHub Actions correctement gérés via `${{ secrets.* }}`.
- Protection XSS avec **DOMPurify** pour tout rendu HTML dynamique.
- Pas d'usage de `eval()` ou `new Function()`.
- Requêtes SQL paramétrées (pas d'injection SQL détectée).
- **SECURITY.md** avec processus de divulgation de vulnérabilités.
- Rate limiting sur les endpoints d'authentification (ThrottlerModule global + throttle spécifique sur la génération de tokens API : 3 req/s).
- **Argon2** pour le hashing des secrets API (supérieur à bcrypt).
- Upload de fichiers sécurisé : limite 15 Mo, hash SHA-256 pour déduplication, vérification de permissions, stockage Supabase isolé.
- Validation d'entrée systématique avec **Zod** (schémas de validation sur toutes les procédures tRPC).
- AuthGuard appliqué globalement — 18 endpoints explicitement marqués publics avec décorateurs dédiés.
- Pas de données sensibles dans les logs (tokens, secrets non loggués).

### 2.5 Qualité du code
- **Pattern Result<T, E>** pour la gestion d'erreurs côté backend (unions discriminées).
- **Sentry** intégré pour le monitoring d'erreurs en production.
- Lazy loading stratégique des composants lourds (Bryntum, Sentry, Crisp).
- ESLint 9 (flat config) avec règles TypeScript strictes (`no-non-null-assertion: error`, `no-explicit-any: warn`).
- Storybook 10 pour la documentation des composants UI.
- Swagger/OpenAPI pour la documentation API (`/api-docs/v1`).

---

## 3. Points faibles et risques

### 3.1 Sécurité — Priorité Haute

#### 3.1.1 CSP `unsafe-inline` en production
**Fichiers :** `apps/auth/proxy.ts`, `apps/panier/proxy.ts`

```
script-src: 'self' 'unsafe-inline'  // En production !
```

Un commentaire TODO existe dans le code : *"TODO: supprimer cette ligne et rétablir la précédente"*.

- **Risque :** Vulnérabilité XSS — les scripts inline sont autorisés.
- **Recommandation :** Implémenter un CSP basé sur des nonces ou migrer vers des scripts externes uniquement.

#### 3.1.2 Absence de headers de sécurité (helmet.js)
**Fichier :** `apps/backend/src/main.ts`

Le backend NestJS ne configure **aucun header de sécurité HTTP** :
- Pas de `X-Frame-Options` (clickjacking)
- Pas de `X-Content-Type-Options` (MIME sniffing)
- Pas de `Strict-Transport-Security` (HSTS)
- Pas de CSP sur les réponses API

- **Risque :** Surface d'attaque élargie — headers défensifs standards manquants.
- **Recommandation :** Ajouter `@nestjs/helmet` ou `helmet` middleware dans `main.ts`.

#### 3.1.3 XSS non sanitisé dans l'import de plan
**Fichier :** `apps/app/src/app/pages/Support/ImporterPlan/importer-plan.page.tsx`

```tsx
dangerouslySetInnerHTML={{ __html: errorMessage }}  // ⚠️ Pas de DOMPurify !
```

Contrairement aux autres usages de `dangerouslySetInnerHTML` (qui utilisent correctement `DOMPurify.sanitize()`), le message d'erreur ici est injecté **sans sanitisation**. Si le message d'erreur tRPC contient de l'input utilisateur, c'est un vecteur XSS.

- **Risque :** XSS reflété via messages d'erreur.
- **Recommandation :** Appliquer `DOMPurify.sanitize(errorMessage)` ou utiliser du texte React natif.

#### 3.1.4 CORS permissif avec credentials
**Fichier :** `apps/backend/src/main.ts`

```typescript
app.enableCors({
  origin: true,  // Reflète n'importe quelle origine
  credentials: true,
});
```

De plus, les fonctions Supabase Edge utilisent `Access-Control-Allow-Origin: '*'` dans `supabase/functions/_shared/cors.ts`.

- **Risque :** Potentiel CSRF si des cookies sont utilisés.
- **Atténuation actuelle :** JWT en header Authorization (pas de cookie). Utilitaire `isAllowedOrigin` existe dans `packages/api` mais n'est pas appliqué partout.
- **Recommandation :** Restreindre les origines autorisées à une whitelist explicite en production.

#### 3.1.5 Webhooks sans vérification HMAC
**Fichier :** `apps/tools/src/webhooks/webhook-consumer.service.ts`

Les webhooks ne supportent que Bearer token et Basic auth, sans vérification de signature HMAC des payloads.

- **Risque :** Un attaquant pourrait forger des payloads webhook valides si le token est compromis.
- **Recommandation :** Implémenter la vérification HMAC-SHA256 sur les payloads entrants.

#### 3.1.6 Politiques RLS partiellement permissives
Certaines tables ont des politiques RLS ouvertes :

```sql
-- data_layer/sqitch/deploy/collectivite/rls.sql
create policy allow_read on filtre_intervalle using (true);

-- data_layer/sqitch/deploy/evaluation/rls.sql
create policy allow_read on client_scores using (true);
```

- **Risque :** Toutes les données de ces tables sont lisibles par tous les utilisateurs authentifiés.
- **Recommandation :** Documenter explicitement quelles tables sont intentionnellement publiques. Auditer systématiquement les politiques RLS.

### 3.2 Tests — Priorité Moyenne

#### 3.2.1 Couverture de tests faible
- **101 fichiers de test** pour **~3 309 fichiers source** → ratio ~3%.
- Tests concentrés sur les chemins critiques (backend, API), mais beaucoup de composants frontend non testés.
- Pas de rapport de couverture automatisé dans la CI.

**Recommandation :**
- Définir un seuil minimum de couverture (ex: 40-60%).
- Ajouter des rapports de couverture dans la CI avec `vitest --coverage`.
- Prioriser les tests sur les modules critiques : auth, scoring, accès données.

#### 3.2.2 Pas de git hooks (pre-commit)
- Aucune configuration **husky** ou **lint-staged** détectée.
- Les vérifications de qualité ne sont appliquées qu'en CI (délai de feedback).

**Recommandation :** Installer `husky` + `lint-staged` pour lint et format au commit.

### 3.3 Architecture — Priorité Moyenne

#### 3.3.1 Dépendances lourdes non surveillées
Le projet embarque des dépendances volumineuses :
- **Bryntum Scheduler** (composant commercial lourd)
- **Nivo** (6 sous-packages de visualisation)
- **echarts**, **Leaflet**, **react-pdf**, **exceljs**, **pptx-automizer**

Pas de monitoring automatisé de la taille du bundle.

**Recommandation :**
- Ajouter `@next/bundle-analyzer` pour suivre la taille du bundle.
- Vérifier que le tree-shaking fonctionne correctement pour Nivo et autres.

#### 3.3.2 Strapi en version legacy
`strapi/` utilise Strapi 4.25.20 avec Node 16-18 — incompatible avec le Node 24 du reste du projet.

**Recommandation :** Planifier la migration vers Strapi 5 ou évaluer des alternatives.

### 3.4 Qualité du code — Priorité Basse

#### 3.4.1 Documentation inline inconsistante
- JSDoc présent dans certains fichiers (`packages/api`) mais absent de la majorité.
- Documentation en français (cohérent avec le projet gouvernemental).

#### 3.4.2 TypeScript strict incomplet
Certaines vérifications désactivées dans tsconfig :
- `noFallthroughCasesInSwitch: false`
- `noImplicitReturns: false`
- `noUnusedLocals: false`

**Recommandation :** Activer progressivement ces vérifications.

#### 3.4.3 Tests Cypress dépréciés non supprimés
Le dossier `e2e-cypress-deprecated/` existe encore.

**Recommandation :** Supprimer pour réduire le bruit et la dette technique.

---

## 4. Sécurité — Analyse OWASP Top 10

| # | Catégorie OWASP | Statut | Détail |
|---|-----------------|--------|--------|
| A01 | Broken Access Control | ⚠️ Moyen | RLS partiellement permissives, CORS ouvert |
| A02 | Cryptographic Failures | ✅ OK | JWT Supabase, HTTPS enforced |
| A03 | Injection | ✅ OK | Requêtes paramétrées, pas de SQL brut |
| A04 | Insecure Design | ✅ OK | Architecture DDD, ADR, patterns solides |
| A05 | Security Misconfiguration | ⚠️ Haut | CSP unsafe-inline en prod, absence de helmet.js, CORS wildcard sur Edge Functions |
| A06 | Vulnerable Components | ⚠️ Faible | Pas d'audit pnpm automatisé en CI |
| A07 | Auth Failures | ✅ OK | Supabase Auth, rate limiting, JWT |
| A08 | Software/Data Integrity | ✅ OK | Lock file, CI vérifiée |
| A09 | Logging/Monitoring | ✅ OK | Sentry, Logger NestJS |
| A10 | SSRF | ✅ OK | Pas de fetch dynamique côté serveur non contrôlé |

---

## 5. Considérations OSS (Open Source)

### Points positifs
- **Licence et contribution** : processus de sécurité documenté (SECURITY.md).
- **ADR publiques** : transparence sur les décisions architecturales.
- **Stack standard** : technologies mainstream facilitant les contributions.
- **DSFR** : conformité avec les standards du gouvernement français.

### Points d'amélioration
| Aspect | État | Recommandation |
|--------|------|----------------|
| **CONTRIBUTING.md** | Absent à la racine | Créer un guide de contribution clair |
| **CODE_OF_CONDUCT.md** | Non détecté | Ajouter (standard pour les projets gov) |
| **Issue templates** | Non vérifiés | Créer des templates (bug, feature, security) |
| **CLAUDE.md** | Absent | Ajouter pour guider les contributeurs IA |
| **pnpm audit en CI** | Absent | Ajouter `pnpm audit --audit-level=high` dans la CI |
| **Dependabot/Renovate** | Non détecté | Activer pour les mises à jour automatiques de dépendances |
| **License file** | Non vérifié à la racine | S'assurer qu'une licence OSS est présente |

---

## 6. Plan d'action recommandé

### Immédiat (Sprint en cours)
1. **Ajouter helmet.js** au backend NestJS (`apps/backend/src/main.ts`) — headers de sécurité manquants.
2. **Corriger CSP unsafe-inline** dans `apps/auth/proxy.ts` et `apps/panier/proxy.ts`.
3. **Sanitiser errorMessage** dans `apps/app/src/app/pages/Support/ImporterPlan/importer-plan.page.tsx` (XSS).
4. **Restreindre CORS** à une whitelist d'origines en production (backend + Supabase Edge Functions).
5. **Ajouter `pnpm audit`** dans le workflow CI.

### Court terme (1-2 sprints)
6. Auditer et documenter la stratégie RLS — identifier les tables intentionnellement publiques.
7. **Implémenter la vérification HMAC** pour les webhooks (`apps/tools/src/webhooks/`).
8. Installer **husky + lint-staged** pour les pre-commit hooks.
9. Ajouter **couverture de tests** avec seuil dans la CI.
10. Créer **CONTRIBUTING.md** et **CODE_OF_CONDUCT.md**.
11. Activer **Dependabot** ou **Renovate** pour le suivi des dépendances.
12. Restreindre le passage du token JWT aux headers uniquement (supprimer le support query params dans `auth.guard.ts`).

### Moyen terme (1-3 mois)
13. Activer les vérifications TypeScript manquantes (`noImplicitReturns`, etc.).
14. Ajouter le monitoring de taille de bundle (`@next/bundle-analyzer`).
15. Supprimer `e2e-cypress-deprecated/`.
16. Planifier la migration Strapi 4 → 5.
17. Augmenter la couverture de tests vers 40%+ (prioriser auth, scoring, API).

---

## 7. Conclusion

**Note globale : 7.5/10**

Le projet Territoires en Transitions est un projet OSS gouvernemental bien architecturé avec une stack moderne et des fondations solides. La séparation des concerns est claire, le typage end-to-end avec tRPC est excellent, et la pipeline CI/CD est robuste.

Les principaux axes d'amélioration concernent :
- Les **headers de sécurité HTTP** manquants (helmet.js) et la **CSP unsafe-inline** en production — le plus urgent.
- Une **XSS non sanitisée** dans la page d'import de plan.
- La **couverture de tests** insuffisante (~3%) pour un projet de cette taille.
- L'**outillage contributeur** (git hooks, guides de contribution) pour faciliter l'onboarding.
- La **gouvernance des dépendances** (166 vulnérabilités Dependabot, pas d'audit automatisé en CI).

Aucune vulnérabilité critique exploitable immédiatement n'a été détectée. Les bonnes pratiques de base sont en place (pas de secrets hardcodés, requêtes paramétrées, Argon2, Zod, AuthGuard global). Les risques identifiés sont principalement des **améliorations de configuration et de durcissement** (hardening) qui sont typiques d'un projet en développement actif.
