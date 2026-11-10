# Suivi PostHog du dépôt PCAET

Ce document décrit les événements PostHog du dépôt PCAET et les deux tableaux
de bord construits dessus. Il sert de référence pour créer ou faire évoluer
les tableaux, et pour ajouter un événement sans casser les croisements.

## Principes

- **Le serveur émet les faits métier** : création, transitions, pièces,
  diagnostic, avis, référents, import IA. Un fait est capturé après le succès
  de l'opération, hors transaction.
- **Le client n'émet que les gestes** : vues d'écran, modales ouvertes ou
  annulées, actes bloqués, téléchargements, filtres.
- **Chaque événement serveur porte le groupe `collectivite`**. Le type, la
  région, le département et la population de la collectivité viennent de ce
  groupe, synchronisé chaque nuit. Ils ne sont pas recopiés sur les événements.
- **Aucune donnée sensible** : jamais de nom de fichier, de message d'erreur
  brut, de nom ni d'email. Seulement des codes stables.

## Propriétés communes

Tous les événements `demarches:pcaet:*`, serveur comme client, portent :

| Propriété | Valeurs |
|---|---|
| `demarche_id` | identifiant de la démarche |
| `collectivite_id` | collectivité déposante |
| `demarche_status` | `en_elaboration`, `transmis_pour_avis`, `instruit`, `instruit_hors_plateforme`, `publie`, `archive` |
| `demarche_obligation` | `obligatoire`, `volontaire` (absente si non lue) |
| `transmitted_off_platform` | dépôt hors plateforme |
| `is_scot_aec` | PCAET porté par un SCoT-AEC |
| `acteur` | `collectivite`, `instructeur`, `public`, `systeme` |
| `instructeur_type` | `dreal`, `region`, `ddt`, `dr_ademe`, `service_national` (acteur instructeur) |
| `perimetre_saisine` | `principal`, `secondaire` (acteur instructeur) |

Un événement sans acteur humain (cron, bascule constatée) a pour `distinct_id`
`demarche:<id>` et ne crée pas de profil de personne.

Le code : `apps/backend/src/demarches/pcaet/shared/tracking/` côté serveur,
`apps/app/src/demarches/use-demarche-tracker.ts` côté client.

## Événements serveur

| Événement | Propriétés propres |
|---|---|
| `demarches:pcaet:creee` | `launched_year`, `nb_pilotes`, `obligation_saisie` |
| `demarches:pcaet:modifiee` | `champs_modifies` |
| `demarches:pcaet:supprimee` | — |
| `demarches:pcaet:transition` | `transition`, `from_status`, `to_status`, `jours_depuis_creation`, `jours_dans_statut_precedent` |
| `demarches:pcaet:transition_refusee` | `transition`, `blocked_by`, `blocked_by_all` |
| `demarches:pcaet:transmise` | `nb_saisines`, `nb_saisines_secondaires`, `types_saisis`, `nb_services_sans_compte` |
| `demarches:pcaet:publiee` | `adopted_year`, `jours_depuis_creation`, `jours_depuis_transmission`, `jours_entre_adoption_et_publication`, `nb_plans`, `nb_precedentes_archivees` |
| `demarches:pcaet:instruction:close` | `raison` (`avis_tous_rendus`, `delai_avis_echu`), `jours_depuis_transmission` |
| `demarches:pcaet:document:depose` / `:retire` | `document_id`, `etape`, `requis`, `reprise`, `mime_type`, `taille_ko` |
| `demarches:pcaet:document:inclusion_declaree` | `document_id`, `couvert`, `requis` |
| `demarches:pcaet:document:additionnel_ajoute` / `_modifie` / `_retire` | `etape` |
| `demarches:pcaet:diagnostic:valeurs_saisies` | `nb_valeurs`, `nb_valeurs_effacees`, `nb_indicateurs`, `champs`, `annees` |
| `demarches:pcaet:diagnostic:annee_reference_definie` | `annee`, `changement`, `nb_indicateurs` |
| `demarches:pcaet:vulnerabilite:*` | `thematique_id`, `champ`, `horizon`, `niveau` |
| `demarches:pcaet:plan:rattache` / `:dissocie` | `plan_id`, `source` (`cree`, `existant`), `a_verifier`, `nb_plans_apres` |
| `demarches:pcaet:saisine:date_ajoutee` | acteur instructeur |
| `demarches:pcaet:avis:brouillon` / `:valide` / `:supprime` | `au_titre_de`, `nb_pieces`, `jours_avant_echeance_avis`, `instruction_close` (validé) |
| `demarches:pcaet:dossier:telecharge` | `type` (`dossier_zip`, `document_unitaire`), acteur instructeur |
| `demarches:pcaet:referent:ajoute` / `:retire` | `organisme_type`, `avec_compte` ; groupe de l'organisme, pas de démarche |
| `demarches:pcaet:snapshot` | une ligne par démarche chaque nuit, voir plus bas |

Import IA (`apps/backend/src/plans/ai-plan-import/`), propriétés en camelCase
pour ne pas casser l'historique :

| Événement | Ajouts |
|---|---|
| `plans:import-ia:started` | `origine` (`page`, `modale_demarche`, `etape_documents`), `demarcheId`, `profile`, `withSecteurs` |
| `plans:import-ia:refused` | `reason` (code d'erreur), `origine`, `demarcheId`, `fileSizeBytes` |
| `plans:import-ia:step_done` | `step`, `status`, `durationMs`, `llmCalls`, `failedCalls`, `rateLimitedCalls`, `totalTokens`, `models` |
| `plans:import-ia:resume_requested` / `:resumed` | `attempt`, `origine`, `demarcheId` |
| `plans:import-ia:succeeded` / `:failed` | `origine`, `demarcheId`, `strategy`, `attempt`, `pageCount`, `ocrPages`, `sizeBytes`, `documentKind`, `rateLimited`, `sousActionsCount`, `duplicates`, `scored`, `improved`, `resumes` |

### Le snapshot quotidien

Le job `posthog-demarches-pcaet-snapshot` (2 h 30, `apps/tools`) appelle
`demarches.pcaet.trackSnapshot`. Chaque démarche non archivée, et chaque
démarche archivée depuis moins de 30 jours, reçoit un événement
`demarches:pcaet:snapshot` avec :

`jours_depuis_creation`, `jours_dans_statut`, `jours_depuis_transmission`,
`jours_depuis_publication`, `jours_avant_echeance_avis`,
`echeance_avis_depassee`, `nb_saisines`, `avis_attendus`, `avis_rendus`,
`nb_plans`, `nb_plans_a_verifier`, `nb_plans_secteurs_a_renseigner`,
`nb_pilotes_avec_compte`, `documents_amont_complets`,
`documents_aval_complets`, `diagnostic_complet`, `transitions_atteignables`,
`bloque_par`.

Les champs de complétude ne sont lus que pour les statuts où un guard en
dépend. Ailleurs ils valent `null`.

## Événements client

`Event.demarches.pcaet` et `Event.plans.importIa` dans
`packages/ui/src/components/tracking/posthog-events.ts`.

| Écran | Événements |
|---|---|
| Liste des démarches | `liste_vue`, `creer_clic`, `liste_action`, `publier_modale` (`origine: liste`) |
| Parcours d'élaboration | `section_vue` (`section`, `topic`, `etape`), `navigation`, `avancement_ouvert`, `contacts_ouverts`, `transition_bloquee_vue` (`transition`, `blocked_by`) |
| Transmission et publication | `transmettre_modale`, `publier_modale` (`etat`: `ouverte`, `confirmee`, `annulee`) |
| Documents | `document:depot_erreur` (`raison`), `document:telecharge`, `import_programme:choix` (`creer_au_depot`, `sans_import`, `creer`, `plus_tard`) |
| Programme d'actions | `plan:modale` (`type`: `creer`, `importer_ia`, `demander_import`) |
| Import IA | `plans:import-ia:arriere_plan_clic`, `reessayer_clic`, `reprendre_clic` |
| Instruction | `instruction:liste_vue`, `instruction:filtre`, `instruction:dossier_vu`, `instruction:etape_vue`, `instruction:tout_telecharger`, `instruction:finaliser_modale` (`ouverte`, `confirmee`, `erreur`, `annulee`), `avis:telecharge` |
| Consultation publique | `public:liste_vue`, `public:dossier_vu`, `public:etape_vue`, `document:telecharge` |
| Référents et accès | `referents:vue`, `acces_refuse` (`espace`) |

## Tableaux de bord

Filtres communs aux deux : période, groupe `collectivite` (`type` différent de
`test`, `region_code`, `departement_code`, `population`), `demarche_obligation`,
`transmitted_off_platform`.

### « PCAET – pilotage »

Pour la DGEC et l'ADEME. Dix tuiles, sans détail technique.

1. **Stock par statut** : aire empilée sur `snapshot`, démarches distinctes par
   jour, ventilées par `demarche_status`.
2. **Stock par région** : tableau `snapshot` du dernier jour, groupe
   `region_code` × `demarche_status`.
3. **PCAET actifs sur la période** : nombre, requête HogQL ci-dessous.
4. **Flux mensuels** : barres `creee`, `transition` avec `to_status =
   transmis_pour_avis`, `publiee`.
5. **Entonnoir du dépôt** : `creee` → `document:depose` (`requis = true`) →
   `plan:rattache` → `transmise` → `avis:valide` → `publiee`, par
   `demarche_id`, avec le temps médian entre étapes et une ventilation par
   `demarche_obligation`.
6. **Délais d'instruction** : médiane de `jours_depuis_transmission` sur
   `instruction:close`, et part de chaque `raison`.
7. **Échéances proches** : nombre de `snapshot` du dernier jour avec
   `demarche_status = transmis_pour_avis` et `jours_avant_echeance_avis < 15`.
8. **Obligatoire, volontaire, hors plateforme** : `snapshot` du dernier jour,
   `demarche_obligation` × `transmitted_off_platform`.
9. **Programmes importés par IA** : `plans:import-ia:succeeded` avec
   `demarcheId` renseigné, par mois, et la part vérifiée
   (`plans:import-ia:verified`).
10. **Consultation publique** : `public:dossier_vu` et `document:telecharge`
    avec `acteur = public`, collectivités distinctes.

### « PCAET – produit »

Pour l'équipe. Sept blocs, environ 25 tuiles.

- **Activité** : démarches, collectivités et personnes actives par semaine ;
  `section_vue` par `section` ; rétention hebdomadaire des collectivités qui
  ont une démarche en élaboration ; chemins depuis `liste_vue`.
- **Blocages** : `transition_refusee` et `transition_bloquee_vue` par
  `blocked_by` ; sur le dernier `snapshot`, `bloque_par` par statut, et les
  démarches avec `nb_plans_a_verifier > 0` ou `nb_plans_secteurs_a_renseigner > 0` ;
  modales ouvertes contre confirmées (`transmettre_modale`, `publier_modale`).
- **Documents** : `document:depose` par `document_id` et `etape` ;
  `document:depot_erreur` par `raison` ; inclusions déclarées ; taille médiane
  par pièce ; `import_programme:choix` par `choix`.
- **Diagnostic** : `diagnostic:valeurs_saisies` par semaine ; thématiques de
  vulnérabilité ajoutées ; années de référence.
- **Instruction** : `instruction:dossier_vu` par `etat_saisine` ; avis et
  téléchargements serveur par `instructeur_type` et `perimetre_saisine` ;
  dossiers vus sans avis rendu ; délai entre
  transmission et `avis:valide` ; téléchargements ; `finaliser_modale` par
  `etat`.
- **Import IA** : lancements par `origine` ; succès, échecs (`reason`,
  `failedStep`) et refus (`reason`) ; durée médiane et p90 ; `step_done` par
  `step` (durée, `rateLimitedCalls`) ; reprises ; `pageCount` et `ocrPages` ;
  délai entre succès et vérification ; clics `reessayer`, `reprendre`,
  `arriere_plan`.
- **Qualité** : `acces_refuse` par `espace` ; `$exception` sur les routes
  `demarche-pcaet` et `instruction` ; part des `transition` dont
  l'`acteur` est `systeme`.

### Requêtes HogQL

PCAET actifs sur la période (tuile 3) : une démarche est active si elle a reçu
un événement métier ou une page vue, hors snapshot.

```sql
SELECT count(DISTINCT properties.demarche_id) AS pcaet_actifs
FROM events
WHERE timestamp >= {filters.dateRange.from}
  AND timestamp < {filters.dateRange.to}
  AND properties.demarche_id IS NOT NULL
  AND (
    (event LIKE 'demarches:pcaet:%' AND event != 'demarches:pcaet:snapshot')
    OR event = '$pageview'
  )
```

Stock par statut (tuile 1) :

```sql
SELECT toDate(timestamp) AS jour,
       properties.demarche_status AS statut,
       count(DISTINCT properties.demarche_id) AS demarches
FROM events
WHERE event = 'demarches:pcaet:snapshot'
  AND timestamp >= now() - INTERVAL 180 DAY
GROUP BY jour, statut
ORDER BY jour
```

Ce qui retient les dossiers, sur le dernier snapshot :

```sql
SELECT properties.demarche_status AS statut,
       arrayJoin(JSONExtract(properties.bloque_par, 'Array(String)')) AS guard,
       count(DISTINCT properties.demarche_id) AS demarches
FROM events
WHERE event = 'demarches:pcaet:snapshot'
  AND toDate(timestamp) = (
    SELECT max(toDate(timestamp)) FROM events
    WHERE event = 'demarches:pcaet:snapshot'
  )
GROUP BY statut, guard
ORDER BY demarches DESC
```

## Mise en place

1. Déployer les cinq PR empilées, dans l'ordre.
2. Attendre une semaine de données, dont quelques snapshots.
3. Créer les deux tableaux de bord. Le connecteur PostHog de Claude doit
   pointer sur le projet Territoires en Transitions.
