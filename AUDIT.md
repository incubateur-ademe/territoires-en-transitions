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
- Rate limiting sur les endpoints d'authentification.

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

#### 3.1.2 CORS permissif avec credentials
**Fichier :** `apps/backend/src/main.ts`

```typescript
app.enableCors({
  origin: true,  // Reflète n'importe quelle origine
  credentials: true,
});
```

- **Risque :** Potentiel CSRF si des cookies sont utilisés.
- **Atténuation actuelle :** JWT en header Authorization (pas de cookie).
- **Recommandation :** Restreindre les origines autorisées à une whitelist explicite en production.

#### 3.1.3 Politiques RLS partiellement permissives
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
| A05 | Security Misconfiguration | ⚠️ Moyen | CSP unsafe-inline en prod |
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
1. **Corriger CSP unsafe-inline** dans `apps/auth/proxy.ts` et `apps/panier/proxy.ts`.
2. **Restreindre CORS** à une whitelist d'origines en production.
3. **Ajouter `pnpm audit`** dans le workflow CI.

### Court terme (1-2 sprints)
4. Auditer et documenter la stratégie RLS — identifier les tables intentionnellement publiques.
5. Installer **husky + lint-staged** pour les pre-commit hooks.
6. Ajouter **couverture de tests** avec seuil dans la CI.
7. Créer **CONTRIBUTING.md** et **CODE_OF_CONDUCT.md**.
8. Activer **Dependabot** ou **Renovate** pour le suivi des dépendances.

### Moyen terme (1-3 mois)
9. Activer les vérifications TypeScript manquantes (`noImplicitReturns`, etc.).
10. Ajouter le monitoring de taille de bundle (`@next/bundle-analyzer`).
11. Supprimer `e2e-cypress-deprecated/`.
12. Planifier la migration Strapi 4 → 5.
13. Augmenter la couverture de tests vers 40%+ (prioriser auth, scoring, API).

---

## 7. Conclusion

**Note globale : 7.5/10**

Le projet Territoires en Transitions est un projet OSS gouvernemental bien architecturé avec une stack moderne et des fondations solides. La séparation des concerns est claire, le typage end-to-end avec tRPC est excellent, et la pipeline CI/CD est robuste.

Les principaux axes d'amélioration concernent :
- La **sécurité CSP** (risque XSS en production) — le plus urgent.
- La **couverture de tests** insuffisante pour un projet de cette taille.
- L'**outillage contributeur** (git hooks, guides de contribution) pour faciliter l'onboarding.
- La **gouvernance des dépendances** (audit automatisé, monitoring bundle).

Aucune vulnérabilité critique n'a été détectée. Les bonnes pratiques de base sont en place (pas de secrets hardcodés, requêtes paramétrées, DOMPurify). Les risques identifiés sont principalement des améliorations de configuration et de processus.
