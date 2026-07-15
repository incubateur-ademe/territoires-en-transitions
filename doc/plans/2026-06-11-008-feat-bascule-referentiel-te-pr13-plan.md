---

name: PR13 Fusion explications
overview: "Implémenter mergeCommentaires : concaténation des explications CAE/ECI vers TE avec traçabilité source (bloc par action d'origine, score figé depuis pre-switch-te), règles pures + service métier `merge(ctx)` consommant SwitchToTeContext (PR12) — sans persistance ni câblage dans switchToTe() (PR17/PR18)."
todos:

- id: rules-pures
content: Créer merge-commentaires.rules.ts + merge-commentaires.rules.spec.ts (cas annexe A PRD)
status: pending
- id: merge-service
content: Créer MergeCommentairesService.merge(ctx) — itère ctx.cibles.sousActionsEtTaches, lit explication depuis scoreMapsByReferentiel, sans I/O
status: pending
- id: module-wiring
content: Enregistrer MergeCommentairesService dans ReferentielsModule (switchToTe inchangé ; BuildSwitchToTeContextService déjà PR12)
status: pending
- id: e2e
content: Tests e2e merge-commentaires.service.e2e-spec.ts via buildSwitchToTeContextForTest (fixture partagé PR12)
status: pending
isProject: false

---



# PR13 — Fusion explications (`mergeCommentaires`)

**Parent** : [doc/plans/2026-06-11-001-feat-bascule-referentiel-te-prd.md](2026-06-11-001-feat-bascule-referentiel-te-prd.md)

**Branche** : `TE-7303/switch-te-PR13` depuis `main` (PR12 mergée)

**Estimation** : 200–300 LOC

**Prod** : Non (endpoint) — `switchToTe()` reste `SWITCH_NOT_IMPLEMENTED` jusqu'à PR18

---



## Contexte

Consomme `**SwitchToTeContext**` posé par [PR12](2026-06-11-007-feat-bascule-referentiel-te-pr12-plan.md) (cibles, score maps, fixture e2e). PR13 ajoute la **fusion des explications** (`action_commentaire`, libellé UI `explication`) : concaténation avec traçabilité par origine. Format de sortie HTML — cf. [§ Format de sortie](#format-de-sortie).

Diagramme et orchestration : cf. PR12 — delta PR13 = pas de `ScoresService`, lecture `explication`, **pas de ligne TE sans texte source** à migrer.

---



## Décisions actées

**Hérite PR12** pour : contrat `merge(ctx)` sans I/O, `ctx.scoreMapsByReferentiel`, validation snapshots (`PRE_SWITCH_SNAPSHOT_MISSING`), `ctx.cibles.sousActionsEtTaches`, filtrage `concerne`, ordre CAE puis ECI, persistance PR17, câblage hors `switchToTe()`. Détail : [PR12 § Décisions](2026-06-11-007-feat-bascule-referentiel-te-pr12-plan.md#décisions-actées).


| Sujet                       | Décision PR13                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Textes sources              | `ActionScore.explication` dans `scoreMapsByReferentiel` (peuplé au snapshot PR10) — pas de requête directe `action_commentaire` |
| Résultat                    | **Une entrée par action TE avec texte uniquement** — pas de ligne si aucune source avec explication non vide (contrairement aux statuts PR12, une entrée par cible) |
| Format de sortie            | HTML concaténé — [§ Format de sortie](#format-de-sortie)                                                                        |
| Corps des blocs             | Conservés tels quels (HTML ou texte brut hérité) ; `htmlToText` réservé au filtre vide                                          |
| Libellé score en-tête       | État **source figé** au moment T via `formatSourceScoreLabel` — pas projection TE (cf. PR12)                                    |
| `modifiedBy` / `modifiedAt` | Hors scope — PR17                                                                                                               |


---



## Implémentation



### 1) Rules pures — `merge-commentaires.rules.ts`

Fichier : `apps/backend/src/referentiels/switch-to-te/merge-commentaires/merge-commentaires.rules.ts`

#### Format de sortie

Les `action_commentaire` sources peuvent contenir du HTML (rich text BlockNote) ou du texte brut hérité. Le merge **concatène** sans normaliser les corps.

```ts
export const MERGE_COMMENTAIRES_PREFIX =
  '<p><span data-text-color="red">Les textes ci-après et les statuts associés sont issus de la bascule depuis les anciens référentiels CAE et/ou ECi. Ils sont à actualiser pour répondre à l\'actuelle sous-mesure.</span></p>\n<p>&nbsp;</p>';
```

> Formulation PRD telle quelle (casse « ECi » incluse) — ajustement copywriter possible en PR20 (modale) si besoin.

**En-tête de bloc** (`buildSourceBlockHeader`) :

```html
<p><strong>{origineActionId} - {nom} - {scoreLabel}</strong></p>
```

suivi de `\n`, puis le corps source inchangé.

**Séparateur entre blocs** : `<p>&nbsp;</p>\n`

**Exemple** (1 bloc CAE HTML + 1 bloc ECI texte brut) :

```html
<p><span data-text-color="red">Les textes ci-après…</span></p>
<p>&nbsp;</p>
<p><strong>cae_1.2.3 - Définir et mettre en oeuvre la stratégie - 42 % FAIT</strong></p>
<p class="!text-base !text-grey-8 font-[Marianne]">Service Espace Conseil Rénovation : 16 personnes…</p>
<p>&nbsp;</p>
<p><strong>eci_4.1 - Connaître les coûts - FAIT</strong></p>
ligne 1 du texte brut hérité
ligne 2 du texte brut hérité
```

**Rendu front** — `RichTextEditor` : si `content.trim().startsWith('<')` → `tryParseHTMLToBlocks` (chemin emprunté ici). Pas de parsing particulier dans les rules de merge.

> `data-text-color="red"` : attribut BlockNote pour la couleur de texte (cf. `RichTextEditor.stories.tsx`).



#### Types

```ts
export type MergeCommentaireSource = {
  referentielId: ReferentielId; // pour tri CAE puis ECI
  origineActionId: string;
  nom: string | null; // actionsOrigine.nom
  scoreLabel: string;
  explication: string; // texte brut ou HTML — conservé tel quel depuis le snapshot
};
```



#### Fonctions exportées


| Fonction                       | Rôle                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `formatSourceScoreLabel`       | Libellé score en-tête depuis `ActionScore` snapshot — cf. table ci-dessous    |
| `buildSourceBlockHeader`       | En-tête traçable (cf. [§ Format de sortie](#format-de-sortie))                |
| `buildSourceBlock`             | `buildSourceBlockHeader(...) + explication`                                   |
| `isExplicationNonVide`         | `htmlToText(explication).trim().length > 0` — filtre uniquement               |
| `sortMergeCommentaireSources`  | Tri stable : `cae` avant `eci`, puis ordre d'entrée                           |
| `mergeCommentairesFromSources` | Concatène `MERGE_COMMENTAIRES_PREFIX` + blocs ; retourne `null` si aucun bloc |




#### `formatSourceScoreLabel`

À partir du `ActionScore` **source** du snapshot (état figé au moment T, pas projection TE) :

```ts
const statut = getStatutAvancement({
  avancement: actionScore.avancement,
  desactive: actionScore.desactive,
  concerne: actionScore.concerne,
});
```


| Cas (`getStatutAvancement`)                   | Libellé en-tête                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `fait`                                        | `FAIT`                                                                                            |
| `programme`                                   | `PROGRAMMÉ`                                                                                       |
| `pas_fait`                                    | `PAS FAIT`                                                                                        |
| `detaille` / `detaille_au_pourcentage`        | `{faitPercent} % FAIT` — `faitPercent = floor(ratioFait × 100)`, `ratioFait` via `getScoreRatios` |
| `non_renseigne` (source concernée avec texte) | `NON RENSEIGNÉ`                                                                                   |
| `non_concerne`                                | ne doit pas arriver — filtré en amont                                                             |


Règles : libellés en **majuscules** ; pas d'arrondi 5 % TE ; si `nom` null → `nom ?? ''`.

#### `mergeCommentairesFromSources`

```
1. Filtrer sources avec isExplicationNonVide(explication)
2. Si liste vide → return null
3. Trier (CAE puis ECI)
4. return `${MERGE_COMMENTAIRES_PREFIX}${blocks.join('<p>&nbsp;</p>\n')}`
```



### 2) Service — `merge-commentaires.service.ts`

Fichier : `apps/backend/src/referentiels/switch-to-te/merge-commentaires/merge-commentaires.service.ts`

```ts
@Injectable()
export class MergeCommentairesService {
  merge(
    ctx: SwitchToTeContext
  ): Result<ActionCommentaireCreate[], SwitchToTeError>
}
```

**Même squelette que** `MergeStatutsService` ([PR12](2026-06-11-007-feat-bascule-referentiel-te-pr12-plan.md)) — deltas :

1. Lit `actionScore.explication` depuis `scoreMapsByReferentiel` (`CorrelatedActionWithScore.score` ne porte pas `explication`).
2. Filtre via `isExplicationNonVide` ; corps passé **tel quel** au bloc.
3. Ignorer la cible si `mergeCommentairesFromSources(sources)` → `null` — **aucune ligne** `action_commentaire` pour cette action TE.

Enregistrer `MergeCommentairesService` dans `ReferentielsModule` ; `SwitchToTeService` **inchangé**. Pas de code d'erreur dédié PR13.

---



## Tests



### A. `merge-commentaires.rules.spec.ts` (unitaire pur)

Couvrir [Annexe A — mergeCommentaires](2026-06-11-001-feat-bascule-referentiel-te-prd.md#a--algorithmes-de-fusion) + compléments PR13 :

- cas annexe A (ordre CAE/ECI, `non concerne`, N→1, 1→1 sans texte → `null`)
- format : `MERGE_COMMENTAIRES_PREFIX`, séparateur inter-blocs, corps HTML / texte brut conservés
- `isExplicationNonVide` : HTML vide (`<p></p>`, `<p>&nbsp;</p>`)
- `formatSourceScoreLabel` : cf. table [§ formatSourceScoreLabel](#formatsourcescorelabel)

Entrées fabriquées — pas de DB. Filtrage `concerne` : `isOrigineConcernee` (`origine.rules.ts`).

### B. `merge-commentaires.service.e2e-spec.ts`

Pattern e2e : calquer sur `merge-statuts.service.e2e-spec.ts` — fixture `buildSwitchToTeContextForTest`, seed `MERGE_STATUTS_FIXTURE`.


| Scénario                           | Vérif                                        |
| ---------------------------------- | -------------------------------------------- |
| CAE seul, 1→1 avec explication     | commentaire fusionné (préfixe + bloc source) |
| CAE + ECI, fusion N→1              | deux blocs ordonnés CAE puis ECI             |
| Source `non concerne` / sans texte | ignorée ou pas de commentaire TE             |
| Sans `pre-switch-te`               | `failure` à `buildSwitchToTeContext`         |
| Action TE native ou sans texte à migrer | aucune ligne dans le résultat |




### Références

- `merge-statuts.service.e2e-spec.ts`, `switch-to-te-context.test-fixture.ts` (PR12)
- `htmlToText` — `packages/domain/src/utils/html-to-text.ts`
- `RichTextEditor` — `packages/ui/src/design-system/RichTextEditor/RichTextEditor.tsx`

```bash
pnpm test:backend merge-commentaires
pnpm test:backend merge-commentaires.rules.spec
```

---



## Hors scope

Cf. [PR12 § Hors scope](2026-06-11-007-feat-bascule-referentiel-te-pr12-plan.md) — PR13 n'ajoute rien. Suite PR14+ : cf. [PR12 § Suite](2026-06-11-007-feat-bascule-referentiel-te-pr12-plan.md#suite-pr13).

---



## Critères de done

- [ ] `merge-commentaires.rules.ts` + spec (annexe A + cas HTML/vide)
- [ ] `MergeCommentairesService.merge(ctx)` — module enregistré, `switchToTe()` inchangé ; résultat filtré (lignes uniquement pour les actions avec texte à migrer)
- [ ] Format de sortie conforme à [§ Format de sortie](#format-de-sortie)
- [ ] Tests e2e verts (fixture PR12)
- [ ] PRD annexe A `mergeCommentaires` alignée sur § Format de sortie (exemple HTML, plus texte brut seul)
