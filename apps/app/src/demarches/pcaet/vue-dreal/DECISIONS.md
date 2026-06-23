# Decision Log — Vue DREAL (service instructeur PCAET)

> Proto · 2 écrans · Desktop · light mode · React + `@tet/ui` (in-codebase).
> Généré le 2026-06-23.

## Contexte

La DREAL (service déconcentré instructeur) est rattachée à une région et suit
automatiquement les EPCI de cette région **en lecture seule**, avec le droit de
**déposer un avis réglementaire**. Deux écrans :

1. **Dashboard** — tableau des collectivités suivies + module Notifications.
2. **Page PCAET (lecture seule)** — bandeau « service instructeur » + dossier en
   consultation + dépôt d'avis.

## Décisions

| # | Décision | Justification |
|---|----------|---------------|
| 1 | **Support : React + `@tet/ui` dans le codebase** (pas de Figma) | Choix explicite Arnaud. Le skill `create-maquette` (Figma/DS Semji) ne s'appliquait pas. |
| 2 | **Région mockée : Bourgogne-Franche-Comté, 9 EPCI** | Données réalistes (Grand Besançon, Dijon Métropole, Montbéliard…). Distribution de statuts conforme : 4 « Transmis pour avis », 2 « Adopté », 2 « Élaboration », 1 « Archivé ». |
| 3 | **Compteur sous-titre = nb réel de lignes (9)** | Le brief disait « 14 collectivités » en sous-titre mais « ~8 lignes » en tableau → incohérence. J'ai aligné le compteur sur les lignes réelles (dérivé de `drealCollectivites.length`). |
| 4 | **Mapping statut → badge centralisé** (`DREAL_STATUT_BADGE_VARIANT`) | Source unique de vérité, importée par le tableau (écran 1) ET le header du dossier (écran 2) → cohérence garantie. Élaboration=`default` (gris), Transmis=`info` (bleu), Adopté=`success` (vert), Archivé=`grey` (gris foncé). |
| 5 | **Règle « Déposer un avis »** (`canDeposerAvis`) | Bouton actif **uniquement** si statut = `transmis`. Même helper appliqué aux 2 écrans. |
| 6 | **« Consulter » réutilise la vue dossier existante** (`DemarchePcaetDetailPage`) + bandeau de contexte injecté via `?instructeur=1` | Décision Arnaud : pas de vue dédiée. `DrealContextBanner` lit le query param et affiche l'`Alert` instructeur (avec bouton « Déposer un avis » en footer) en tête du dossier ; rien sinon. **Proto** : toutes les lignes pointent vers le 1er dossier réel de la collectivité courante (`listDemarchesPcaet`), les EPCI mockés n'ayant pas de dossier réel. **Reco prod** : router vers le vrai dossier de l'EPCI + enforce le read-only. |
| 7 | **Point d'entrée : menu Paramètres, sous « Démarches PCAET »** (`generate-parametres-dropdown.ts`, label `navVueDrealPcaet`) | Emplacement demandé par Arnaud. Remplace le bouton interim qui était dans le header de la démarche (retiré). |
| 8 | **Routes** : `/demarche-pcaet/vue-dreal` (dashboard) et `/demarche-pcaet/vue-dreal/[epciId]` (consultation) | Calqué sur le pattern existant (`polluants-atmospheriques`, `[demarchePcaetId]/vulnerabilite`). |
| 9 | **Tableau du dashboard en pleine largeur** | Lisibilité : le tableau est dense (5 colonnes + actions). La sidebar Notifications a été retirée au profit du popover (#10). |
| 10 | **Notifications dans un popover** (bouton-cloche `notification-3-line` dans `PageHeader.Actions` → `DropdownMenu` shadcn/Radix) | Cohérent avec les actions header des autres écrans. Libère la largeur pour le tableau. Le `Tooltip` DS forçant `text-xs` sur ses enfants, le `DropdownMenu` (Radix, portal, sans contrainte typo) a été préféré. |

## Gaps DS / fallbacks (composants `@tet/ui` absents)

| Élément du brief | Statut DS | Solution |
|------------------|-----------|----------|
| `avatar-label-group` | ❌ absent | Composition maison `DrealContactCell` (pastille d'initiales + nom + email), palette DS. |
| `featured-icon` | ❌ absent | Composition maison `DrealFeaturedIcon` (cercle coloré + `Icon` DS, classes tokens info/success/primary/grey). |
| Button **Tertiary** | ❌ pas de variant `tertiary` | Mappé sur `grey` / icon-only (variants réels : primary/secondary/outlined/grey/white/underlined). |

> Reco : si ces patterns se généralisent, créer `Avatar`/`AvatarLabelGroup` et
> `FeaturedIcon` dans `@tet/ui` plutôt que de répliquer la composition.

## Fichiers

**Créés**
- `vue-dreal/vue-dreal.mock.ts` — types, données mock, mappings statut, helpers
- `vue-dreal/vue-dreal-dashboard.page.tsx` — écran 1
- `vue-dreal/vue-dreal-consulter.page.tsx` — écran 2
- `vue-dreal/components/dreal-statut-badge.tsx`
- `vue-dreal/components/dreal-featured-icon.tsx`
- `vue-dreal/components/dreal-contact-cell.tsx`
- `vue-dreal/components/dreal-collectivites-table.tsx`
- `vue-dreal/components/dreal-notifications-popover.tsx` (remplace l'ancienne card)
- `vue-dreal/components/dreal-context-banner.tsx` (bandeau instructeur greffé sur le dossier existant)
- route `app/.../demarche-pcaet/vue-dreal/page.tsx` (dashboard seul ; pas de route de consultation dédiée)

**Modifiés**
- `app/src/app/paths.ts` — 1 constante de chemin + 1 helper d'URL (dashboard)
- `app/src/labels/catalog.ts` — label `navVueDrealPcaet`
- `ui/layout/header/main-nav/collectivite/generate-parametres-dropdown.ts` — entrée Paramètres sous « Démarches PCAET »
- `demarches/pcaet/demarche-pcaet-detail.page.tsx` — `<DrealContextBanner />` en tête (conditionnel `?instructeur=1`)

## Vérification

- `tsc --noEmit` (apps/app) : **0 erreur**.
- Routes : à valider visuellement en navigation authentifiée.
