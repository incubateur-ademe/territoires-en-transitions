---
title: "feat: Badges d'état du processus d'audit sur l'onglet Audit et Labellisation"
type: feat
status: active
date: 2026-05-20
branch: display-audit-status-on-labellisation-tab
---

# feat: Badges d'état du processus d'audit sur l'onglet Audit et Labellisation

## Overview

Afficher sur l'onglet **"Audit et Labellisation"** d'un référentiel un badge décrivant l'état du processus d'audit, avec un comportement différencié pour les membres de la **CT** et l'**auditeur·ice**, et un comportement de clôture qui dépend du **sujet** de la demande (`cot` / `cot_avec_labellisation` / `labellisation`).

Le travail est découpé en **5 PRs indépendamment mergeables**, précédées d'un **spike léger** (15 min) qui ne couvre plus qu'une vérification d'invalidation cache — les autres incertitudes ayant été clôturées par décision métier.

## Problem Statement / Motivation

Aujourd'hui, l'utilisateur·ice ne sait pas où en est le processus d'audit en regardant l'onglet :

- côté CT, le CTA "Demander un audit" est désactivé sans badge explicatif explicite
- côté auditeur, aucun retour clair sur "tu as un audit attribué" vs "tu as un audit en cours"
- côté CT, après clôture d'un audit COT-seul, il n'est pas évident qu'on peut redemander, et pour les audits avec labellisation, l'attente "Labellisation en cours" n'est pas explicite

Le ticket introduit des badges visuels avec tooltips contextuels qui couvrent l'ensemble des transitions et clarifient les actions possibles à chaque étape.

> ⚠️ **Scope** : la nouvelle vue est l'onglet "Audit et Labellisation" rendu par `apps/app/src/referentiels/audit-labellisation/` (vue checklist). L'ancien composant `HeaderLabellisation.tsx` (dossier `labellisations/`, design legacy) **n'est pas touché** par ce ticket.

## Proposed Solution

### Architecture en frontière (déjà actée)

```
backend state (demande, audit.dateDebut, audit.valide, audit.auditeurs)
        │
        ▼  mapper pur en frontière (parcours-to-audit-badge-status.ts)
        │
clean enum: AuditBadgeStatus = 'auditRequested' | 'auditAssigned'
                              | 'auditInProgress'
                              | 'auditCompleted'
                              | 'auditCompletedLabellisationInProgress'
        │
        ▼  composants (testés render, exhaustifs sur l'enum × viewerRole)
        │
        ▼  flow réel (testé e2e Playwright, transitions critiques uniquement)
```

Le mapper retourne `null` quand aucun badge ne doit s'afficher (cas `non_demandee` ou viewer hors-périmètre) — la visibilité reste de la responsabilité du caller (`feedback_visibility_belongs_to_caller`).

### Stack de PRs

```
PR0 — Spike léger (timeboxé 15 min, en parallèle, non bloquant)
  └─ vérifie uniquement l'invalidation cache de useStartAudit
  └─ produit un mini-rapport markdown sous .claude/todos/, n'est pas commité

PR1 — Mapper frontend + domain rule canStartNewAuditCycle + tests unit
  └─ ship-alone : code non consommé, mais exporté et testé exhaustivement

PR2 — Composant <AuditBadge /> + tests render + labels catalog
  └─ ship-alone : composant exporté, story Storybook optionnelle

PR3 — Câblage dans la vue checklist (audit-labellisation/)
  └─ ship-alone : le badge apparaît dans l'UI ; consomme PR1 + PR2

PR4 — Mise à jour Scores.tsx + PreuveLabellisation.tsx
  └─ ship-alone : applique la même logique disabled/tooltip aux autres vues
                  qui consomment parcours.status ; évite le drift

PR5 — E2e Playwright : 3 specs + enrichissement POM/fixture
  └─ ship-alone : tests passent contre PR3 mergé
```

Chaque PR contient ses propres tests et est mergeable en l'état sans casser le main.

## Technical Approach

### Stack PR0 — Spike

**Objectif** : vérifier le seul point résiduel — invalidation du cache `useStartAudit` — avant d'écrire le câblage en PR3.

**Questions clôturées par décision métier** (n'apparaissent plus dans le spike) :

- ✅ **Q1 — peuplement de `auditeurs[]`** : l'assignation des auditeurs est un **évènement externe** (admin métier, hors UI app). Il existe donc une fenêtre `status === 'demande_envoyee' && auditeurs.length === 0` après la création de la demande mais avant l'assignation. **Discriminant retenu** : `auditeurs.length` distingue `auditRequested` (= 0) de `auditAssigned` (≥ 1). Mémoire : `project_auditeurs_assignes_evenement_externe`.
- ✅ **Q2 — clôture d'un audit COT-seul** : le backend ne maintient pas de `demande.enCours` après clôture COT-seul (la demande sort naturellement du cycle actif). `parcours.status` repasse à `non_demandee`, le CTA "Demander un audit" se réactive sans état frontend dédié. **Conséquence** : la valeur `audit_termine_cot_clos` disparaît de l'enum (5 valeurs au lieu de 7).
- ✅ **Q3 — sortie de `auditCompletedLabellisationInProgress`** : la validation finale d'une labellisation est aussi un **évènement externe** (commission). Côté frontend, on l'observe via `parcours.labellisation?.obtenue_le` (postérieure à `demande.envoyeeLe`). L'état est **sticky** jusqu'à ce champ. Le mapper retourne `null` (= retour à `non_demandee`) dès que `obtenue_le > envoyeeLe`. Mémoire : `project_labellisation_validee_evenement_externe`.

**Livrable** : un fichier `.claude/todos/spike-audit-badge-decisions.md` (gitignored) qui répond à la question restante :

1. **Invalidation cache `useStartAudit`** (Q4 originale)
   - Vérifier que `useStartAudit` invalide bien `getParcours.queryKey({ collectiviteId, referentielId })` (en plus des invalidations legacy déjà observées)
   - Si non : ajouter l'invalidation dans PR3 pour que le badge CT bascule sans reload manuel

**Décisions accompagnantes** (acquises, à appliquer dès PR1) :
- **viewerRole étendu en `'auditee' | 'auditor' | 'other'`** : le `'other'` couvre l'admin support, le visiteur externe, l'utilisateur sans permission `referentiels.mutate` ni statut auditeur. Mapper retourne `null` pour `'autre'` quelle que soit la branche.
- **Naming** : pour éviter la collision avec `BadgeAuditStatut` (qui porte sur le statut **par mesure**), on appellera notre composant `<AuditBadge />` (parcours global) et on laissera l'existant tel quel. À documenter en haut de fichier dans le nouveau composant.

> Le spike PR0 n'est pas bloquant pour PR1 — il peut être fait en parallèle. Son résultat n'affecte que PR3 (ajout éventuel d'une invalidation).

### Stack PR1 — Mapper frontend + domain rule + tests unit

**Fichiers créés** dans le dossier-feature `apps/app/src/referentiels/audit-labellisation/audit-badge-status/` :

- `index.ts` — barrel, expose `AuditBadgeStatus`, `AuditViewerRole`, `parcoursToAuditBadgeStatus`, `getViewerRole`
- `types.ts`
  ```ts
  export type AuditBadgeStatus =
    | 'auditRequested'
    | 'auditAssigned'
    | 'auditInProgress'
    | 'auditCompleted'
    | 'auditCompletedLabellisationInProgress';

  export type AuditViewerRole = 'auditee' | 'auditor' | 'other';
  ```
- `parcours-to-audit-badge-status.ts`
  ```ts
  type Input = {
    parcours: ParcoursLabellisation | null;
    viewerRole: AuditViewerRole;
  };
  export function parcoursToAuditBadgeStatus({ parcours, viewerRole }: Input): AuditBadgeStatus | null { … }
  ```
- `parcours-to-audit-badge-status.spec.ts` — colocated avec le mapper
- `get-viewer-role.ts` — pure helper, évite le double-ternaire dans le container (cf. `feedback_no_nested_ternaries`)
  ```ts
  type Input = { isAuditor: boolean; canMutate: boolean };
  export function getViewerRole({ isAuditor, canMutate }: Input): AuditViewerRole {
    if (isAuditor) return 'auditor';
    if (canMutate) return 'auditee';
    return 'other';
  }
  ```
- `get-viewer-role.spec.ts` — 4 cas (auditor prioritaire, auditor seul, auditee, other)

**Fichiers créés côté domaine** dans `packages/domain/src/referentiels/labellisations/start-new-audit-cycle/` (sibling de `start-audit/`) :

- `start-new-audit-cycle.rules.ts` — règle métier pure : *peut-on démarrer un nouveau cycle d'audit ?*
  ```ts
  export function canStartNewAuditCycle(parcours):
    | { canRequest: true; reason: null }
    | { canRequest: false; reason: 'AUDIT_REQUEST_PENDING' | 'AUDIT_IN_PROGRESS' | 'LABELLISATION_IN_PROGRESS' }
  ```
  Logique :
  - parcours absent ou status `non_demandee` → `canRequest: true`
  - status `demande_envoyee` → `AUDIT_REQUEST_PENDING`
  - status `audit_en_cours` → `AUDIT_IN_PROGRESS`
  - status `audit_valide` + sujet `cot` (défensif) → `canRequest: true`
  - status `audit_valide` + labellisation pending (`obtenue_le == null || obtenue_le <= envoyee_le`) → `LABELLISATION_IN_PROGRESS`
- `start-new-audit-cycle.rules-errors.ts` — enum des reasons (pattern aligné sur `start-audit/start-audit.rules-errors.ts`)
- `start-new-audit-cycle.rules.spec.ts` — 9 cas couvrant chaque branche + edges `obtenue_le === envoyee_le` (borne stricte), `obtenue_le > envoyee_le`, sujet=cot défensif
- Helper privé `isLabellisationStillPending(parcours)` colocated (vérifie `obtenue_le == null || obtenue_le <= demande.envoyeeLe`)

**Pourquoi domaine et pas UI ?** La question "peut-on redemander" est purement métier ; les consommateurs (checklist PR3, Scores PR4, et potentiellement d'autres vues plus tard) doivent partager exactement la même règle. La traduction `reason → tooltip text` reste côté UI (via `getRequestAuditTooltip` ajouté en PR2 dans `audit-badge-status/`).

**Règles du mapper** :

| # | parcours.status | auditeurs.length | audit.dateDebut | audit.valide | parcours.labellisation.obtenue_le | viewerRole | sujet | → output |
|---|---|---|---|---|---|---|---|---|
| 1 | `non_demandee` | — | — | — | — | n'importe | — | `null` |
| 2 | `demande_envoyee` | `0` | — | — | — | `auditee` | — | `auditRequested` |
| 3 | `demande_envoyee` | `0` | — | — | — | `auditor` | — | `null` |
| 4 | `demande_envoyee` | `≥ 1` | `null` | — | — | `auditee` | — | `auditRequested`¹ |
| 5 | `demande_envoyee` | `≥ 1` | `null` | — | — | `auditor` | — | `auditAssigned` |
| 6 | `audit_en_cours` | — | `≠ null` | `false` | — | `auditee` | — | `auditInProgress` |
| 7 | `audit_en_cours` | — | `≠ null` | `false` | — | `auditor` | — | `auditInProgress` |
| 8 | `audit_valide` | — | — | `true` | n'importe | `auditor` | n'importe | `auditCompleted` |
| 9 | `audit_valide` | — | — | `true` | `null` ou `≤ demande.envoyeeLe` | `auditee` | `labellisation` ou `labellisation_cot` | `auditCompletedLabellisationInProgress` |
| 10 | `audit_valide` | — | — | `true` | `> demande.envoyeeLe` | `auditee` | n'importe | `null` (labellisation obtenue → cycle terminé) |
| 11 | n'importe | — | — | — | — | `other` | — | `null` |
| 12 | `parcours === null` | — | — | — | — | n'importe | — | `null` |

¹ L'auditee continue de voir `auditRequested` tant que l'audit n'est pas démarré — le ticket réserve `auditAssigned` à l'auditor.

> Note : pour le cas `audit_valide` + `viewerRole=ct` + `sujet=cot`, le backend retourne déjà `status='non_demandee'` après clôture (la demande n'est plus active). La ligne 1 couvre donc ce cas, pas besoin d'une ligne dédiée.

**Tests** : 1 cas par ligne du tableau (≈12 cas), nommés `should return X when ...`. Plus 2 cas adversariaux : `obtenue_le === demande.envoyeeLe` (égalité stricte) et `obtenue_le antérieure à une demande précédente` (cycle ancien) — pour valider la borne `>` et la sémantique « postérieure à la demande courante ».

### Stack PR2 — Composant `<AuditBadge />` + tests render + labels

**Layering container / view** dans `apps/app/src/referentiels/audit-labellisation/audit-badge/` :

- `index.tsx` — container `<AuditBadge>`, sans props. Appelle les hooks, dérive `viewerRole` via `getViewerRole`, passe `parcours + viewerRole` à la view. **Pas de tests dédiés** (la logique est en `getViewerRole.spec` et les hooks sont mockables si besoin).
  ```tsx
  /**
   * Badge de statut du PARCOURS d'audit (état global du cycle).
   * Container : résout viewerRole + parcours depuis les hooks.
   * Ne pas confondre avec <BadgeAuditStatut /> qui porte sur le statut PAR MESURE.
   */
  export default function AuditBadge() {
    const parcours = useCycleLabellisation();
    const { isRoleAuditeur } = useCollectiviteContext();
    const canMutate = hasCollectivitePermission('referentiels.mutate');
    const viewerRole = getViewerRole({ isAuditor: isRoleAuditeur, canMutate });
    return <AuditBadgeView parcours={parcours} viewerRole={viewerRole} />;
  }
  ```

- `audit-badge.view.tsx` — view interne `<AuditBadgeView>`, reçoit `parcours + viewerRole`, appelle `parcoursToAuditBadgeStatus` en interne, rend le badge DS ou `null`.
  ```tsx
  type Props = {
    parcours: TCycleLabellisation | null;
    viewerRole: AuditViewerRole;
  };
  export function AuditBadgeView({ parcours, viewerRole }: Props) {
    const status = parcoursToAuditBadgeStatus({ parcours, viewerRole });
    if (status === null) return null;
    // rendu DS Badge + (si auditCompleted) message d'infos auditeur
  }
  ```

- `audit-badge.view.spec.tsx` — tests render colocated avec la view. Les tests construisent un `parcours` minimaliste par cas (le mapper exhaustif est déjà testé en PR1, donc ici on n'a besoin que de 1 cas par valeur d'enum + cas `null`).

**Fichier UI annexe** dans `audit-badge-status/` (ajouté en PR2 car consommé par les CTAs PR3/PR4, pas par le mapper PR1) :

- `get-request-audit-tooltip.ts` — pure helper de présentation : `(reason) → libellé catalog`. Une seule responsabilité : traduire un reason métier (issu de `canStartNewAuditCycle`) en libellé tooltip. Pas de logique conditionnelle métier.
- `get-request-audit-tooltip.spec.ts` — 3 cas (1 par reason)

**Mapping enum → rendu** (consommé par le composant) :

| status | viewerRole | badge.title | badge.variant | tooltip sur badge | wrapper |
|---|---|---|---|---|---|
| `auditRequested` | `auditee` | "Audit demandé" | `info` | — | — |
| `auditAssigned` | `auditor` | "Audit attribué" | `info` | — | — |
| `auditInProgress` | `auditee` ou `auditor` | "Audit en cours" | `info` | — | — |
| `auditCompleted` | `auditor` | "Audit terminé" | `success` | — | — |
| `auditCompletedLabellisationInProgress` | `auditee` | "Audit terminé et labellisation en cours" | `success` | — | — |

> Le composant lui-même n'affiche **pas** de CTA ni de tooltip de CTA. Les tooltips "Demande d'audit en cours…" / "Labellisation en cours…" appartiennent au CTA "Demander un audit" et sont gérés en PR3+PR4.

**Tests render** (≈9 cas) :
1. `(auditRequested, auditee)` → texte "Audit demandé" visible, variant `info`
2. `(auditAssigned, auditor)` → texte "Audit attribué" visible
3. `(auditInProgress, auditee)` → texte "Audit en cours" visible
4. `(auditInProgress, auditor)` → texte "Audit en cours" visible (même rendu)
5. `(auditCompleted, auditor)` → texte "Audit terminé" visible, variant `success`, + message d'infos sous le badge (wording proposé, cf. Q7)
6. `(auditCompletedLabellisationInProgress, auditee)` → texte "Audit terminé et labellisation en cours" visible
7. A11y : variant `info` n'est pas le seul porteur d'info (titre texte présent)
8. A11y : badge focusable au clavier si tooltip futur (pour PR3 — déjà tester l'invariant ici si le wrapper est prêt)
9. Snapshot ou query par texte/variant (au choix, render-first)

**Labels à ajouter dans `apps/app/src/labels/catalog.ts`** (section ~ligne 337-378) :
```ts
auditDemande: 'Audit demandé',
auditAttribue: 'Audit attribué',
// auditEnCours: existe déjà
auditTermine: 'Audit terminé',
auditTermineMessageAuditeur: 'Le rapport d\'audit a été transmis à la collectivité.', // wording à proposer, cf. Q7
auditTermineLabellisationEnCours: 'Audit terminé et labellisation en cours',
demandeAuditEnCoursTooltip: 'Demande d\'audit en cours : vous pourrez effectuer une nouvelle demande une fois celle-ci terminée.',
labellisationEnCoursTooltip: 'Labellisation en cours : vous pourrez effectuer une nouvelle demande une fois celle-ci terminée.',
```

### Stack PR3 — Câblage dans la vue checklist

**Fichiers modifiés** :
- `apps/app/src/referentiels/audit-labellisation/checklist/index.tsx` (ou le sous-composant qui rend le header)
- `apps/app/src/referentiels/audit-labellisation/checklist/header.tsx` si applicable

> `apps/app/src/referentiels/labellisations/HeaderLabellisation.tsx` est **hors scope** (composant legacy d'un design antérieur, non rendu sur la nouvelle vue checklist).

**Logique de câblage** :

Grâce au container `<AuditBadge>` (PR2) qui résout tout en interne, le parent en checklist n'a **rien à câbler** :

```tsx
return (
  <Header>
    <AuditBadge />
    {/* CTAs existants : démarrer/clôturer audit (auditeur), demander audit (CT) */}
  </Header>
);
```

Le composant `<AuditBadge>` gère :
- la résolution de `viewerRole` (via `getViewerRole`)
- la récupération du `parcours` (via `useCycleLabellisation`)
- le passage à `<AuditBadgeView>` qui appelle le mapper et rend le badge DS (ou `null`)
- le rendu du message d'infos auditeur si `auditCompleted` (cf. Q7)

### Stack PR4 — Mise à jour Scores.tsx + PreuveLabellisation.tsx (drift prevention)

**Fichiers modifiés** :
- `apps/app/src/referentiels/tableau-de-bord/labellisation/Scores.tsx` (l. 128-136)
- `apps/app/src/app/pages/collectivite/BibliothequeDocs/PreuveLabellisation.tsx` (l. 93-112)

**Changements** :

`Scores.tsx` — le CTA "Demander un audit" doit être désactivé avec tooltip dans **3 cas** au lieu de 2 actuellement. Consomme la règle domaine `canStartNewAuditCycle` (PR1) + le helper UI `getRequestAuditTooltip` (PR2) :

```tsx
const requestability = canStartNewAuditCycle(parcours);
const tooltip = requestability.allowed
  ? undefined
  : getRequestAuditTooltip(requestability.reason);

<Tooltip label={tooltip}>
  <Button disabled={!requestability.allowed} onClick={openModal}>
    Demander un audit
  </Button>
</Tooltip>
```

Cette même règle est appliquée en PR3 sur le CTA équivalent de la vue checklist : un seul endroit dans tout le code dit "peut-on redemander un audit ?", et un seul endroit traduit le `reason` métier en libellé tooltip. Aucun risque de drift de logique entre les deux vues.

`PreuveLabellisation.tsx` — vérifier que la `readonlyLogic` (l. 93-112) reste cohérente avec la nouvelle taxonomie. Probablement pas de changement nécessaire (la logique repose sur `audit_valide` qui ne change pas en backend), mais à confirmer en revue.

**Tests** :
- Pas de spec unit additionnelle (`canStartNewAuditCycle.spec.ts` et `get-request-audit-tooltip.spec.ts` sont déjà couverts en PR1/PR2)
- Pas de nouveau test render Scores.tsx (couvert par les e2e PR5), mais vérifier que les tests existants passent toujours

### Stack PR5 — E2e Playwright + enrichissement POM/fixture

**Fichiers créés/modifiés** :
- `e2e/tests/referentiels/labellisations/new-audit-labellisation.pom.ts` (enrichissement)
- `e2e/tests/referentiels/labellisations/audit-badge-flow-cot.spec.ts`
- `e2e/tests/referentiels/labellisations/audit-badge-flow-labellisation.spec.ts`
- `e2e/tests/referentiels/labellisations/audit-badge-flow-cot-avec-labellisation.spec.ts`
- `e2e/tests/referentiels/referentiels.fixture.ts` (ajout de `assignAuditeur` si absent — confirmé manquant par le spike, sinon réutiliser `addAuditeur`)

**Pattern par spec** (basé sur `e2e/tests/referentiels/scores/update-action-statut.spec.ts:99-169` — pattern login switcher éprouvé) :

```ts
test('flow audit cot sans labellisation', async ({ page, collectivite, referentiels }) => {
  const ctUser = collectivite.getUser();
  const auditeurUser = await collectivite.addUser({ role: CollectiviteRole.LECTURE, autoLogin: false });
  await referentiels.addAuditeur({ user: auditeurUser, collectiviteId, referentielId });

  // Étape 1 : CT demande
  await ctUser.login();
  await pom.goto(collectiviteId, referentielId);
  await pom.demanderAudit({ sujet: 'cot' });
  await expect(pom.badge('Audit demandé')).toBeVisible();

  // Étape 2 : auditeur voit l'attribution (côté CT, le badge reste "Audit demandé" — pas de bascule)
  await auditeurUser.login();
  await page.reload();
  await expect(pom.badge('Audit attribué')).toBeVisible();
  await expect(pom.startAuditButton).toBeVisible();

  // Étape 3 : auditeur démarre
  await pom.startAuditButton.click();
  await expect(pom.badge('Audit en cours')).toBeVisible();
  await expect(pom.closeAuditButton).toBeVisible();

  // Étape 4 : CT voit "en cours" + CTA disabled + tooltip
  await ctUser.login();
  await page.reload();
  await expect(pom.badge('Audit en cours')).toBeVisible();
  await expect(pom.demanderAuditButton).toBeDisabled();
  await pom.demanderAuditButton.hover();
  await expect(pom.tooltipText('Demande d\'audit en cours')).toBeVisible();

  // Étape 5 : auditeur clôture (upload rapport)
  await auditeurUser.login();
  await page.reload();
  await pom.closeAudit();

  // Étape 6 : CT peut redemander
  await ctUser.login();
  await page.reload();
  await expect(pom.demanderAuditButton).toBeEnabled();
  // Pas de badge bloquant
  await expect(pom.badge('Audit terminé et labellisation en cours')).not.toBeVisible();
});
```

Specs 2 et 3 : identiques jusqu'à l'étape 5, divergent à l'étape 6 :
- Spec 2 (labellisation) : `await expect(pom.badge('Audit terminé et labellisation en cours')).toBeVisible(); await expect(pom.demanderAuditButton).toBeDisabled();`
- Spec 3 (cot_avec_labellisation) : idem que Spec 2

**POM additions** :
```ts
badge = (text: string) => this.page.getByRole('status', { name: text })
                              .or(this.page.getByText(text)); // selon implementation Badge DS
tooltipText = (text: string) => this.page.getByRole('tooltip', { name: new RegExp(text) });
demanderAuditButton = this.page.getByRole('button', { name: /demander un audit/i });
startAuditButton = this.page.getByRole('button', { name: /démarrer l'audit/i });
closeAuditButton = this.page.getByRole('button', { name: /clôturer l'audit/i });
```

## System-Wide Impact

### Interaction graph
- `useEnvoiDemande` → mutation tRPC → invalide `getParcours.queryKey` → `useCycleLabellisation` refetch → mapper recalcule `badgeStatus` → `<AuditBadge>` rerender
- `useStartAudit` → mutation tRPC + `router.refresh()` → idem
- À vérifier en PR0 : `useStartAudit` invalide-t-il tous les caches consommés ? (Q4)

### Error propagation
- Le mapper est pur, ne throw jamais (retourne `null` en fallback). Aucune erreur à propager.
- Les tooltips DS échouent silencieusement si l'élément ref est démonté pendant `hover` — couvert par Floating UI, RAS.

### State lifecycle risks
- **Gap C3** : si l'invariante "1 cycle actif" n'est pas garantie BDD, le mapper produit un état pourri sans le savoir. Mitigation : mapper retourne `null` en fallback explicite ; à monitorer en review PR3.

### API surface parity
- 2 vues consomment `parcours.status` aujourd'hui et sont dans le scope : `Scores.tsx` (tableau de bord), `PreuveLabellisation.tsx` (bibliothèque docs). PR4 les traite. Sans PR4 → drift garanti entre tableau de bord et nouvelle vue checklist.
- `HeaderLabellisation.tsx` consomme aussi `parcours.status` mais est **hors scope** (composant legacy non rendu sur la nouvelle vue).

### Integration test scenarios
- Couverts par les 3 e2e PR5. Scénario implicite testé : invalidation cache après mutation côté un utilisateur impacte la vue de l'autre utilisateur après reload.

## Acceptance Criteria

### Functional Requirements

- [ ] Badge "Audit demandé" visible uniquement côté CT pendant toute la phase pré-démarrage (que les auditeurs soient assignés ou non)
- [ ] Badge "Audit attribué" visible uniquement côté auditeur, après assignation et avant démarrage
- [ ] Badge "Audit en cours" visible côté CT ET auditeur pendant l'audit
- [ ] Côté CT pendant `audit_en_cours` : CTA "Demander un audit" disabled, tooltip au hover = libellé spec
- [ ] Badge "Audit terminé" visible côté auditeur après clôture, + message d'infos sous le badge (wording proposé en review)
- [ ] Après clôture audit COT-seul : côté CT, CTA "Demander un audit" enabled, pas de badge bloquant
- [ ] Après clôture audit labellisation OU cot_avec_labellisation : côté CT, badge "Audit terminé et labellisation en cours", CTA disabled, tooltip au hover = libellé spec
- [ ] Visiteur tiers (ni CT membre ni auditeur) : aucun badge affiché

### Non-Functional Requirements

- [ ] Mapper frontend pur, testé exhaustivement (≈12 cas), aucun appel API direct
- [ ] Règle domaine `canStartNewAuditCycle` (5 cas) consommée à l'identique par PR3 (checklist) et PR4 (Scores) — pas de duplication de logique métier dans l'UI
- [ ] Composant `<AuditBadge>` testé en render avec Testing Library, ≈9 cas
- [ ] 3 e2e Playwright (un par sujet de demande), pattern login switcher éprouvé, fixtures ad hoc (pas de `YOLO_DODO`)
- [ ] Aucun hardcoded color, tous les libellés via `appLabels.*`
- [ ] Aucun re-export de type domain, le `AuditBadgeStatus` est un type d'affichage propre
- [ ] Composant nommé `<AuditBadge>` (pas de collision avec `<BadgeAuditStatut>` existant pour les mesures)

### Quality Gates

- [ ] Tests passent en local et en CI
- [ ] Pas de régression visible dans `Scores.tsx` et `PreuveLabellisation.tsx` (PR4)
- [ ] Code review par `kieran-typescript-reviewer` sur PR1, `jsx-quality-reviewer` + `jsx-structure-reviewer` sur PR2/PR3, `compound-engineering:review:pattern-recognition-specialist` sur PR4

## Success Metrics

- 100% des cas du mapper sont couverts par un test unit
- 100% des valeurs de l'enum `AuditBadgeStatus` sont couvertes par un test render
- Les 3 sujets de demande sont testés bout-en-bout par les e2e
- Zéro régression sur les tests e2e existants `start-labellisation-cot.spec.ts` / `validate-labellisation-cot.spec.ts` / `request-labellisation-audit-cot.spec.ts`

## Dependencies & Risks

### Dépendances

- **PR0 (spike)** non bloquant pour PR1 ; peut tourner en parallèle. Son résultat n'affecte que PR3 (ajout éventuel d'une invalidation cache)
- **PR2 dépend de PR1** (consomme le type `AuditBadgeStatus`)
- **PR3 dépend de PR1 + PR2** (utilise mapper + composant)
- **PR4 dépend de PR1** (utilise mapper + helper `getDemandeAuditCTAState`)
- **PR5 dépend de PR3** (l'UI doit être câblée pour que les tests passent)

### Risques

| Risque | Impact | Mitigation |
|---|---|---|
| ~~**C1** : `auditeurs[]` peuplé dès la demande~~ | — | ✅ Clôturé : assignation externe, fenêtre `auditeurs.length === 0` garantie après demande |
| **C2** : `viewerRole` binaire ne couvre pas admin/visiteur | Badges affichés hors-cible | Ajouté `'autre'` au type (voir PR1) |
| **C3** : invariante « 1 cycle actif » non garantie | Mapper produit état pourri silencieux | Mapper retourne `null` en fallback explicite ; à monitorer en review PR3 |
| ~~**I1** : pas de sortie pour `auditCompletedLabellisationInProgress`~~ | — | ✅ Clôturé : observé via `parcours.labellisation.obtenue_le > demande.envoyeeLe` |
| **I2** : `useStartAudit` n'invalide pas tous les caches | Badge CT reste bloqué alors qu'auditeur a démarré | Spike PR0 vérifie ; correction dans PR3 si besoin |
| **I6** : Scores.tsx pas mis à jour | Drift entre tableau de bord et nouvelle vue checklist | PR4 explicite couvre |

## Sources & References

### Origin
- Description fonctionnelle issue d'un ticket interne + cadrage approfondi en session (décisions arch actées en amont du plan)

### Internal References

- **Code à modifier** :
  - `apps/app/src/referentiels/audit-labellisation/audit-badge-status/` — dossier-feature : `types.ts`, `parcours-to-audit-badge-status.ts(+spec)`, `get-viewer-role.ts(+spec)`, `index.ts` (barrel) — PR1 ; puis `get-request-audit-tooltip.ts(+spec)` — PR2
  - `packages/domain/src/referentiels/labellisations/request-labellisation/can-request-audit.ts(+spec)` — règle métier "peut-on redemander un audit" — PR1
  - `apps/app/src/referentiels/audit-labellisation/audit-badge/` — dossier-feature : `index.tsx` (container `<AuditBadge>`), `audit-badge.view.tsx` (`<AuditBadgeView>` + mapper appelé en interne), `audit-badge.view.spec.tsx` — PR2
  - `apps/app/src/referentiels/audit-labellisation/checklist/index.tsx` — vue checklist principale (point de câblage PR3)
  - `apps/app/src/referentiels/tableau-de-bord/labellisation/Scores.tsx:128-136` — CTA disabled/tooltip à étendre (PR4)
  - `apps/app/src/app/pages/collectivite/BibliothequeDocs/PreuveLabellisation.tsx:93-112` — vérifier readonly logic (PR4)
  - `apps/app/src/labels/catalog.ts:337-378` — ajouter libellés (PR2)
  - `e2e/tests/referentiels/labellisations/new-audit-labellisation.pom.ts` — enrichir POM (PR5)
  - `e2e/tests/referentiels/referentiels.fixture.ts` — `addAuditeur` existe ; vérifier `closeAudit` (PR5)

- **Code hors scope (à ne pas toucher)** :
  - `apps/app/src/referentiels/labellisations/HeaderLabellisation.tsx` — composant legacy d'un design antérieur, non rendu sur la nouvelle vue checklist

- **Domain (ne pas modifier)** :
  - `packages/domain/src/referentiels/labellisations/parcours-labellisation-status.enum.ts`
  - `packages/domain/src/referentiels/labellisations/request-labellisation/request-labellisation.rules.ts:26-43`
  - `packages/domain/src/referentiels/labellisations/parcours-labellisation.schema.ts`

- **Patterns à réutiliser** :
  - `apps/app/src/referentiels/audits/BadgeAuditStatut.tsx` — pattern `statusToLabel` + `statusToState`
  - `packages/ui/src/design-system/Badge/Badge.tsx` — props `variant`, `size`, `type`
  - `packages/ui/src/design-system/Tooltip/Tooltip.tsx` — gère `aria-role` automatiquement, pas besoin d'`aria-describedby` manuel
  - `apps/app/src/referentiels/labellisations/start-audit/audit-selection.ts` — exemple de mapper pur testé
  - `e2e/tests/referentiels/scores/update-action-statut.spec.ts:99-169` — pattern login switcher CT/auditeur

- **Plans connexes** :
  - `compound-knowledge-db/docs/plans/2026-05-06-001-feat-checklist-labellisation-from-parcours-plan.md` — règles nommage français/anglais, scope précédent
  - `compound-knowledge-db/docs/plans/2026-05-06-002-feat-modale-cloture-audit-deux-etapes-plan.md` — layering atomic/container/view/mapper

- **ADRs & solutions** :
  - `doc/adr/0013-tests-e2e.md` — POM, getByRole, isolation
  - `doc/solutions/test-failures/parallel-e2e-test-isolation.md` — pièges parallélisation, bannir `YOLO_DODO`
  - `doc/solutions/design-patterns/permission-gated-sql-projection-2026-04-28.md` — projection conditionnelle par rôle

### Preferences appliquées (mémoire)

- `feedback_derive_enum_at_boundary` — pattern mapper en frontière
- `feedback_pure_mapper_between_contexts` — fichier `xxx-to-yyy.ts` + specs unit
- `feedback_subtype_handling_high` — résolution des unions au plus haut
- `feedback_visibility_belongs_to_caller` — mapper retourne `null`, parent gère `<VisibleWhen>`
- `feedback_component_layering` — container (hooks) `<AuditBadge>` / view (props + mapper) `<AuditBadgeView>` / pur mapper, un fichier par rôle
- `feedback_no_nested_ternaries` — `getViewerRole()` extrait en pure helper avec early returns plutôt que double ternaire inline
- `feedback_no_domain_type_re_export` — `AuditBadgeStatus` est un type d'affichage distinct
- `feedback_labels_in_catalog` — tous libellés via `appLabels.*`
- `feedback_inline_props_no_t_prefix`, `feedback_components_named_for_intent_not_position`, `feedback_extract_component_over_comment`
- `feedback_render_component_tests` — render TL, pas extraction de logique
- `feedback_english_scaffolding_french_apis` — `viewerRole`, `status`, `disabled` en anglais ; `auditeur`, `demande`, `labellisation` en français
- `feedback_adhoc_users_for_auth_tests` — `addUser` ad hoc, jamais `YOLO_DODO`
- `feedback_prefer_roles_over_data_test` — `getByRole`/`getByLabel` dans les e2e
- `feedback_spike_before_plan` — PR0 timeboxé
- `project_viewer_role_exclusif_par_collectivite` — un utilisateur n'a qu'un rôle par collectivité
- `project_auditeurs_assignes_evenement_externe` — fenêtre `auditeurs.length === 0` exploitable
- `project_labellisation_validee_evenement_externe` — fin observée via `obtenue_le`

### Open Questions

**Clôturées par décision métier** :
- ✅ **Q1** — `auditeurs[]` peuplé par évènement externe ; fenêtre `length === 0` après demande
- ✅ **Q2** — clôture audit COT-seul : pas de demande en cours en BDD → `parcours.status` repasse à `non_demandee` naturellement
- ✅ **Q3** — fin de labellisation observée via `parcours.labellisation.obtenue_le > demande.envoyeeLe`
- ✅ **Q5** — caduque : `HeaderLabellisation.tsx` est hors scope (legacy, non rendu sur la nouvelle vue)

**Restantes** :
- **Q4 (I2)** — `useStartAudit` invalide-t-il bien `getParcours.queryKey` ? → spike PR0 (15 min)
- **Q6 (M6)** — étendre l'enum backend pour exposer un statut « labellisation_validee » natif, ou laisser la dérivation côté frontend ? → optionnel, peut faire l'objet d'un follow-up séparé si la dérivation `obtenue_le > envoyeeLe` se révèle fragile
- **Q7 (non bloquante)** — wording du **message d'infos** sous le badge "Audit terminé" côté auditeur. Le ticket prévoit un message d'infos associé à ce statut sans préciser le contenu. À **proposer** dans PR3 (par exemple : "Le rapport d'audit a été transmis à la collectivité.") et faire valider en review.
