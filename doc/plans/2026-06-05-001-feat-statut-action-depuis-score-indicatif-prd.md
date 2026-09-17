---
title: "feat: Dérivation du statut d'une action à partir de son score indicatif"
type: feat
status: active
date: 2026-06-05
---

# feat: Dérivation du statut d'une action à partir de son score indicatif

## Overview

Permettre de **dériver automatiquement le statut détaillé au pourcentage** d'une action à partir de son score indicatif calculé, puis de l'enregistrer via le chemin existant (`upsertActionStatuts`) afin que le score réel soit recalculé et le snapshot mis à jour. Deux modes : application **automatique** après saisie des valeurs d'indicateur (si statut non renseigné) et application **manuelle** par dimension via deux boutons sur la carte action.

Cette fonctionnalité constitue la **phase 2** du PRD `2026-06-04-001` (condition `referentiel(...)` dans les expressions cible/seuil), qui fiabilise le calcul du score indicatif par référentiel.

Le travail est séquencé en **3 tranches** : cœur (fonction pure), endpoint backend, front. **Arrêt pour feedback après la tranche 1.**

## Problem Statement / Motivation

Le score indicatif d'une action est calculé à partir des valeurs d'indicateurs sélectionnées par la collectivité : il produit deux **scores indicatifs** — un pour le réalisé (`fait.score`) et un pour l'objectif (`programme.score`) — chacun exprimé comme une **fraction d'avancement** (entre 0 et 1, pouvant dépasser 1). Aujourd'hui cette information reste purement **indicative et affichée** : elle n'a aucun effet sur le statut d'avancement de l'action, ni sur le score réel de la collectivité.

Conséquence : une collectivité qui a renseigné les données d'indicateur nécessaires au score indicatif doit **ressaisir manuellement** le statut détaillé au pourcentage correspondant, alors que l'information est déjà disponible et calculable. C'est une double saisie, source d'incohérence entre le score indicatif affiché et le statut effectivement pris en compte.

## Proposed Solution

Du point de vue de l'utilisateur :

- **Automatique** : lorsque le statut de l'action **n'est pas encore renseigné** et qu'il renseigne  les valeurs d'indicateur utilisées pour le score indicatif d'une action, le statut détaillé est dérivé (à partir des deux scores disponibles) et appliqué sans action supplémentaire.
- **Manuel** : lorsque le statut de l'action est déjà renseigné, deux boutons côté carte action — **« Appliquer le réalisé au statut »** et **« Appliquer l'objectif au statut »** — permettent de (ré)appliquer explicitement **une seule dimension** du score au statut, **même si un statut est déjà renseigné**. L'écrasement ne porte que sur la dimension concernée (le curseur correspondant) ; l'autre dimension du triplet existant est **préservée**.

### Modèle à deux curseurs

Le curseur d'avancement détaillé existant est un slider à **deux curseurs** sur l'axe `[0, 1]` (cf. `action-statut-detaille-au-pourcentage.slider.tsx`) :

- le **1er curseur** marque le réalisé (`fait`) ;
- le **2e curseur** marque l'objectif visé (position cumulée `fait + programmé`) ;
- `programmé` est donc la **largeur** entre les deux curseurs, et `pasFait` l'espace restant après le 2e curseur.

Or le score indicatif fournit exactement ces deux positions **cumulées** sur l'échelle d'avancement (cf. `score-indicatif.service.ts`) :

- `fait.score` (alias documentaire `faitScore`) → position du **1er curseur** ;
- `programme.score` (alias documentaire `programmeScore`) → position du **2e curseur**.

La part `programmé` du triplet vaut donc l'**écart** entre les deux curseurs, et **non** `programmeScore` directement (`programmeScore` est une position cumulée sur l'échelle, pas une part incrémentale).

Formule (curseurs bridés à `[0, 1]`, 2e curseur contraint `≥` 1er, triplet sommant toujours à 1, pleine précision sans arrondi au pas du slider) :

```
fait      = clamp(faitScore, 0, 1)
objectif  = max(fait, clamp(programmeScore, 0, 1))   // 2e curseur ≥ 1er
programmé = objectif − fait
pasFait   = 1 − objectif
```

### Tableau illustratif des règles de dérivation (auto / dérivation combinée)

Auto = on part de la baseline `[0, 0, 1]` (statut `non_renseigné`) et on applique les deux scores disponibles. Les scores indicatifs peuvent dépasser 1 (valeur au-delà du plafond de complétion de la formule `exprScore`), puis sont bridés à `[0, 1]` :

| Cas | `faitScore` | `programmeScore` | Triplet `[fait, programmé, pasFait]` | Statut normalisé |
|---|---|---|---|---|
| Exemple de référence | 0.5 | 0.6 | `[0.5, 0.1, 0.4]` (`programmé = 0.6 − 0.5`) | `detaille` |
| Réalisé partiel + objectif supérieur | 0.4 | 0.7 | `[0.4, 0.3, 0.3]` (`programmé = 0.7 − 0.4`) | `detaille` |
| Réalisé complet | 1.0 | — | `[1, 0, 0]` | `fait` |
| Objectif seul renseigné | — | 0.6 | `[0, 0.6, 0.4]` (`fait = 0`) | `detaille` |
| Réalisé seul renseigné | 0.5 | — | `[0.5, 0, 0.5]` (`programmé = 0`) | `detaille` |
| Score au-delà de 100 % | 1.3 | 1.5 | `[1, 0, 0]` (bridé) | `fait` |
| Objectif inférieur au réalisé | 0.8 | 0.5 | `[0.8, 0, 0.2]` (objectif déjà atteint → `programmé = 0`, `pasFait` absorbe) | `detaille` |
| Aucun score calculable | — | — | (aucun) | inchangé |

### Tableau illustratif (application manuelle par dimension, statut existant)

Manuel = on part du **triplet courant** (curseurs reconstitués) et on ne déplace qu'**un seul** curseur. Exemples avec un statut existant `[0.3, 0.4, 0.3]` (curseurs `0.3` / `0.7`) :

| Bouton | Score appliqué | Triplet résultant | Effet |
|---|---|---|---|
| « Appliquer le réalisé » | `faitScore = 0.5` | `[0.5, 0.2, 0.3]` | 1er curseur → 0.5, objectif (0.7) préservé |
| « Appliquer le réalisé » | `faitScore = 0.8` | `[0.8, 0, 0.2]` | 1er curseur dépasse l'objectif → 2e curseur poussé à 0.8 |
| « Appliquer l'objectif » | `programmeScore = 0.6` | `[0.3, 0.3, 0.4]` | 2e curseur → 0.6, réalisé (0.3) préservé |
| « Appliquer l'objectif » | `programmeScore = 0.2` | `[0.3, 0, 0.7]` | objectif < réalisé → `programmé = 0`, réalisé préservé |

## User Stories

1. En tant qu'utilisateur renseignant les valeurs d'indicateur d'une action dont le statut n'est pas renseigné, je veux que le statut détaillé soit dérivé et appliqué automatiquement, afin d'éviter une double saisie.
2. En tant qu'utilisateur ayant déjà renseigné un statut, je veux que l'application automatique **ne l'écrase pas** silencieusement, afin de garder la main sur ma saisie.
3. En tant qu'utilisateur, je veux deux boutons « Appliquer le réalisé au statut » et « Appliquer l'objectif au statut » qui (ré)appliquent explicitement **une seule dimension** du score même si un statut existe, afin de resynchroniser sélectivement le réalisé ou l'objectif sans écraser l'autre dimension que j'ai éventuellement ajustée.
4. En tant qu'utilisateur, je veux que la dérivation reflète l'information disponible quand un seul des deux scores (fait/objectif) est calculable, afin de ne pas être bloqué par une donnée manquante.
5. En tant qu'utilisateur, je veux que l'application automatique n'échoue jamais l'enregistrement de mes valeurs d'indicateur afin que la saisie des données reste toujours possible (dans la limite des vérifications de droits appliqués actuellement).
6. En tant que développeur, je veux une fonction pure de dérivation testable en isolation, afin de garantir un comportement déterministe et partageable.

## Technical Approach

### Fonctions et services à construire / modifier

- **`applyScoresToAvancementDetaille`** — fonction pure unifiée exportée dans `packages/domain/src/referentiels` (sans dépendance NestJS / base de données, sur le modèle des fonctions pures existantes du domaine `referentiels`). Couvre **auto** (dérivation combinée) et **manuel** (application d'une seule dimension). Les paramètres `faitScore` / `programmeScore` correspondent aux champs `fait.score` / `programme.score` renvoyés par `ScoreIndicatifService.getScoreIndicatif`.
  - Signature : `(existant: [number, number, number] | null, scores: { faitScore?: number | null; programmeScore?: number | null }) => [number, number, number] | null`.
  - Reconstitution des deux curseurs depuis l'existant (`null` → baseline `[0, 0, 1]`) :
    - `curseur1 = existant[0]` (réalisé)
    - `curseur2 = existant[0] + existant[1]` (objectif)
  - Application (chaque score fourni déplace son curseur, contrainte `curseur1 ≤ curseur2` maintenue) :
    - si `faitScore` fourni → `curseur1 = clamp(faitScore, 0, 1)` ; `curseur2 = max(curseur1, curseur2)` (pousse l'objectif si le réalisé le dépasse)
    - si `programmeScore` fourni → `curseur2 = max(curseur1, clamp(programmeScore, 0, 1))` (objectif jamais sous le réalisé → `programmé = 0`)
  - Triplet de sortie : `[curseur1, curseur2 − curseur1, 1 − curseur2]` (somme toujours `1`, pleine précision, pas d'arrondi au pas du slider).
  - **Auto** appelle avec `existant = null` et les deux scores disponibles (cf. tableau « dérivation combinée »).
  - **Manuel** appelle avec `existant = triplet courant` et **un seul** score (cf. tableau « application par dimension »).
  - Aucun score fourni / aucun calculable → renvoie `null` (aucun triplet, l'appelant gère le no-op).
  - Testable en isolation ; réutilisable front et back.

- **`UpdateStatutFromScoreIndicatifService` (nouveau)** ou méthode dédiée — orchestre la dérivation :
  - Input (union discriminée sur `overwrite`) :
    - `{ collectiviteId: number; actionIds: string[]; overwrite: false }` → **auto** : applique les deux scores disponibles, uniquement sur les actions `non_renseigne`.
    - `{ collectiviteId: number; actionIds: string[]; overwrite: true; scoreType: 'fait' | 'programme' }` → **manuel** : applique la seule dimension `scoreType` sur le triplet existant, même statut renseigné.
  - Recalcule les scores indicatifs à la volée via `ScoreIndicatifService.getScoreIndicatif({ collectiviteId, actionIds })` — **source de vérité = valeurs sélectionnées**, jamais le snapshot (évite la circularité avec `upsertActionStatuts` qui produit justement le snapshot).
  - Charge le **statut courant** des actions (avancement + avancementDetaille) pour reconstituer le triplet existant ; baseline depuis `AVANCEMENT_DETAILLE_PAR_STATUT` pour les statuts propres, `[0, 0, 1]` pour `non_renseigne`.
  - Pour chaque action :
    - sélectionne les scores à appliquer : auto → `{ faitScore, programmeScore }` (tous deux si calculables) sur `existant = null` ; manuel → uniquement `scoreType` sur `existant = triplet courant` ;
    - dérive le triplet via `applyScoresToAvancementDetaille` ;
    - **filtre best-effort** : ignore les actions sans triplet (score(s) requis non calculable(s)) et les actions non modifiables (parcours verrouillé/audit en cours, action désactivée) — réutilise la logique de `canUpdateActionStatutWithoutPermissionCheck` en amont ;
    - si `overwrite === false`, ignore les actions dont le statut est **déjà renseigné** (≠ `non_renseigne`) ;
    - construit un `ActionStatutCreate` avec `statut = DETAILLE_AU_POURCENTAGE` + le triplet ; l'adapter existant `actionStatutCreateToActionStatutInDatabase` normalise les cas propres (`[1,0,0]→fait`, `[0,1,0]→programme`, `[0,0,1]→pas_fait`).
  - S'il reste au moins une action à appliquer → un **seul** appel `upsertActionStatuts(...)` (contrainte mono-référentiel déjà garantie par ce service), qui recalcule le snapshot. Sinon **no-op** : aucune écriture, aucun recalcul de snapshot.
  - Retour : le `ScoreSnapshot` recalculé (identique à `upsertActionStatuts`). En cas de no-op, on renvoie le snapshot courant sans recalcul.

- **`UpdateActionStatutRouter` (modifié)** — ajoute la procédure `updateStatutFromScoreIndicatif` (mutation `authedProcedure`), avec contrôle de permission `REFERENTIELS.MUTATE` sur la collectivité (cohérent avec `updateStatut`/`setValeursUtilisees`).

- **Front (modifié)** :
  - **Auto** : le hook qui appelle `setValeursUtilisees` enchaîne, **en cas de succès**, un appel à `updateStatutFromScoreIndicatif` avec `{ overwrite: false }`. `setValeursUtilisees` reste pur côté backend (responsabilité unique). Invalidations de cache alignées sur `useUpdateActionStatut` (actions groupées, snapshot courant, historique).
  - **Manuel** : deux boutons sur la carte action, chacun appelant `updateStatutFromScoreIndicatif` avec `{ overwrite: true, scoreType }` :
    - « Appliquer le réalisé au statut » (`scoreType='fait'`) — visible/actif uniquement si `faitScore` est calculable ;
    - « Appliquer l'objectif au statut » (`scoreType='programme'`) — visible/actif uniquement si `programmeScore` est calculable.
    - Les deux requièrent la permission `referentiels.mutate`.

### Décisions techniques

- **`programmeScore` interprété comme position cumulée** : `programmé = objectif − réalisé`, jamais `programmeScore` brut. C'est la sémantique des deux curseurs du slider existant ; toute autre lecture sur-évalue le « programmé ».
- **Statut soumis toujours `DETAILLE_AU_POURCENTAGE`** : aucune logique de normalisation dupliquée, on s'appuie sur `actionStatutCreateToActionStatutInDatabase` (cohérent avec la modale d'avancement détaillé manuelle).
- **`overwrite=false` (auto) vs `overwrite=true` + `scoreType` (manuel)** : union discriminée. Auto = sûr par défaut (ne touche au statut que s'il est `non_renseigne`, applique les deux scores). Manuel = explicite, applique **une seule** dimension sur le triplet existant en préservant l'autre curseur. Cette union empêche les combinaisons absurdes (auto par dimension, manuel sans dimension).
- **Pleine précision, pas d'arrondi au pas du slider** : `statutDetailleAuPourcentageSchema` n'impose aucune contrainte de pas ; on conserve les fractions issues du score (bridage à `[0,1]`, somme `1`) pour ne pas dégrader le recalcul du score réel.
- **Best-effort en auto ET en manuel** : la dérivation ne lève jamais sur une action non calculable / non modifiable ; on filtre en amont. L'enregistrement des valeurs d'indicateur n'est jamais cassé par l'auto.
- **Pas de backfill rétroactif** : l'auto ne s'applique qu'aux nouvelles saisies/modifications de valeurs ; les actions existantes (valeurs déjà présentes mais statut non renseigné) ne sont pas traitées en masse — les boutons « Appliquer » couvrent ces cas au cas par cas.
- **Snapshot figé au moment de l'enregistrement** : comportement préexistant conservé. `setValeursUtilisees` ne recalcule pas le snapshot. En `overwrite=false` sans action appliquée, aucun recalcul n'est déclenché ; le snapshot continue de figer l'état du dernier enregistrement de statut.
- **Alignement ADR 0012 (pattern Result)** : les méthodes de service backend publiques privilégient un retour `Result<…, erreur typée>` plutôt qu'un `throw`, avec conversion en erreur tRPC au niveau du routeur. Le cas « endpoint appelé alors que la dimension demandée n'est pas calculable » renvoie une erreur typée (utilisée surtout sur le chemin des boutons ; côté front le bouton concerné est masqué/désactivé sans valeur).

## Implementation Units

Séquencement validé. **Arrêt pour feedback après la tranche 1.**

- **Tranche 1 (cœur)** : fonction pure `applyScoresToAvancementDetaille` (modèle à deux curseurs) + tests unitaires (dérivation combinée ET application par dimension).
- **Tranche 2 (endpoint backend)** : service + procédure `updateStatutFromScoreIndicatif` (recalcul score indicatif → chargement statut courant → dérivation → filtrage best-effort → `upsertActionStatuts`), union discriminée `overwrite`/`scoreType`, tests ciblés.
- **Tranche 3 (front)** : deux boutons « Appliquer le réalisé » / « Appliquer l'objectif » (`{ overwrite: true, scoreType }`) + enchaînement auto après `setValeursUtilisees` (`{ overwrite: false }`) + invalidations de cache.

## Testing Decisions

Un bon test vérifie le **comportement externe** (entrée → sortie) sans se coupler aux détails d'implémentation.

- **Fonction `applyScoresToAvancementDetaille`** (prioritaire, en isolation) :
  - _Dérivation combinée (auto, `existant = null`)_ :
    - exemple de référence : `0.5 / 0.6 → [0.5, 0.1, 0.4]` (`programmé = objectif − réalisé`) ;
    - réalisé partiel + objectif supérieur : `0.4 / 0.7 → [0.4, 0.3, 0.3]` ;
    - réalisé complet (`fait = 1`) → `[1, 0, 0]` ;
    - objectif seul (`fait` absent) : `– / 0.6 → [0, 0.6, 0.4]` ;
    - réalisé seul (`objectif` absent) : `0.5 / – → [0.5, 0, 0.5]` ;
    - score indicatif > 1 → bridé : `1.3 / 1.5 → [1, 0, 0]` ;
    - objectif inférieur au réalisé : `0.8 / 0.5 → [0.8, 0, 0.2]` (objectif déjà atteint → `programmé = 0`) ;
    - aucun score → `null`.
  - _Application par dimension (manuel, `existant = [0.3, 0.4, 0.3]`)_ :
    - réalisé seul `faitScore = 0.5` → `[0.5, 0.2, 0.3]` (objectif `0.7` préservé) ;
    - réalisé seul `faitScore = 0.8` → `[0.8, 0, 0.2]` (réalisé pousse l'objectif) ;
    - objectif seul `programmeScore = 0.6` → `[0.3, 0.3, 0.4]` (réalisé `0.3` préservé) ;
    - objectif seul `programmeScore = 0.2` → `[0.3, 0, 0.7]` (objectif sous réalisé → `programmé = 0`).
  - le triplet somme toujours à `1` ; pleine précision conservée.

- **Service `updateStatutFromScoreIndicatif`** (test ciblé) :
  - `{ overwrite: false }` : applique les deux scores sur action `non_renseigne`, **ignore** une action déjà renseignée ;
  - `{ overwrite: true, scoreType: 'fait' }` : déplace le réalisé en préservant l'objectif existant ; `scoreType: 'programme'` : déplace l'objectif en préservant le réalisé existant ;
  - best-effort : action non modifiable / dimension non calculable ignorée, sans erreur, sans casser l'application des autres ;
  - no-op : aucune action applicable → pas d'écriture, snapshot courant renvoyé ;
  - recalcul du snapshot quand au moins une action est appliquée.
  - Prior art : tests existants de `upsertActionStatuts` et du score indicatif (`pnpm test:backend`).

- **Front** (selon couverture existante) : enchaînement `setValeursUtilisees` → `updateStatutFromScoreIndicatif({ overwrite: false })` ; boutons « Appliquer le réalisé » / « Appliquer l'objectif » → `{ overwrite: true, scoreType }` avec visibilité conditionnée au score calculable ; invalidations de cache.

## Out of Scope

- Recalcul systématique du snapshot lors de `setValeursUtilisees` (le snapshot reste figé au dernier enregistrement de statut ; évolution éventuelle traitée séparément).
- Backfill/migration des actions existantes ayant des valeurs renseignées mais un statut non renseigné.
- Application automatique au moment du calcul du snapshot (`computeAndUpsert`) ou au chargement front.
- Toute évolution de l'algorithme de calcul du score indicatif lui-même (couvert par le PRD `2026-06-04-001`).
- Dérivation pour des statuts autres que `DETAILLE_AU_POURCENTAGE` (les cas propres restent gérés par la normalisation de l'adapter existant).
- Pré-alimentation automatique des valeurs opendata pour les indicateurs du score indicatif (nouveau référentiel TE uniquement) : script de migration pour créer les liens `actionScoreIndicateurValeur` manquants et dériver les statuts associés — évolution future, session distincte.

## Further Notes

- `doc/adr/0012-pattern-result.md` — pattern `Result` pour les méthodes de service publiques, conversion en erreur tRPC au niveau du routeur
- PRD amont : `2026-06-04-001-feat-condition-referentiel-expr-cible-seuil-prd.md`
- Dépendances réutilisées : `ScoreIndicatifService.getScoreIndicatif`, `UpdateActionStatutService.upsertActionStatuts`, `actionStatutCreateToActionStatutInDatabase`, `canUpdateActionStatutWithoutPermissionCheck`
