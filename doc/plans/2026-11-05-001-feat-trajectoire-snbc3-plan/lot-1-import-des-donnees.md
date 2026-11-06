---
title: 'Lot 1 — Import des données et masquage sans flag'
parent: ./README.md
kind: lot
lot: 1
updated: 2026-11-09
---

# Lot 1 SNBC 3 : import des données et masquage sans flag

> Décision d'architecture : [ADR 0023](../../adr/0023-integration-trajectoire-snbc3.md) (import par une mutation service role, source `snbc3`, totaux laissés aux formules).
> [Plan général](./README.md).

## Contexte

Le lot 1 crée les indicateurs manquants, puis la mutation qui importe `resultats_territorialises.parquet` comme source `snbc3` et qui enregistre le xlsx standalone du même commit, servi par l'export du lot 5. Il masque aussi `snbc3` aux utilisateurs qui n'ont pas le feature flag (étape 4), ce qui permet d'importer en prod avant l'ouverture (plan général, décision 5).

La correspondance a été tranchée le 04/11 dans la page Notion « Correspondance des sous-secteurs, points à trancher » (TT-39 : base « Questions » et commentaires). Les numéros Q1 à Q9 renvoient à cette page, qui garde aussi l'analyse détaillée des valeurs vides, de Grand Est et de la qualité.

## Correspondance SNBC 3 → TeT

**Règles communes**
- Valeur importée : `valeur_recalee` × 1000 (MtCO2e → kteq CO2, TWh → GWh), écrite en `objectif`, pour chaque année de 2020 à 2050.
- Plusieurs codes vers un même indicateur : leurs valeurs sont sommées à l'import.
- Les indicateurs calculés (`cae_1.a`, `cae_1.c`, `cae_1.i`, `cae_2.a`, `cae_2.k`, `cae_63.a`…) ne sont pas importés : leurs formules les recalculent.
- Un code vide (`NaN`, qualité `pivot_absent`) reste vide, jamais 0 (Q7). Un indicateur dont tous les codes sont vides pour une année n'est pas écrit.
- Toutes les valeurs renseignées sont importées, quelle que soit leur `qualite` (Q9).
- Les codes sont ceux de la release V2.1 de `snbc3` (`releases/V2.1/`, commit `a34a053`). Elle a renommé les codes du tertiaire : `ter_ch_MI` → `ter_ch` (chauffage), `ter_ch_LC` → `ter_clim` (climatisation).
- Le parquet a 66 codes dans l'Hexagone, et 57 aux DROM, qui n'ont pas d'UTCATF : les `cae_63.*` y restent vides.
- Pour 5 EPCI de l'Hexagone (`200096683`, `245400262`, `245701222`, `245701362`, `247000623`), les 11 EPT et Paris, les 7 codes à valeurs vides et `emi_CSC_beccs_ind` n'ont aucune ligne.

| Indicateur TeT | Codes SNBC 3 | Note |
|---|---|---|
| **GES** (kteq CO2) | | |
| `cae_1.ca` / `cae_1.cb` | `emi_res_ch_MI` / `emi_res_ch_LC` | |
| `cae_1.cc` | `emi_res_autres` + `emi_res_clim` | Climatisation rangée dans « autres usages » (Q2). |
| `cae_1.da` | `emi_ter_ch` | Chauffage (`emi_ter_ch_MI` avant la V2.1). |
| `cae_1.db` | `emi_ter_autres` + `emi_ter_clim` | Climatisation rangée dans « autres usages » (Q2 ; `emi_ter_ch_LC` avant la V2.1). |
| `cae_1.ia` … `cae_1.if` | `emi_ind_met`, `_chim`, `_nonmet`, `_iaa`, `_equip`, `_pap` | Dans cet ordre. |
| `cae_1.ig` | `emi_ind_ind_autres` | Libellé « Autres industries » inchangé. |
| **`cae_1.ih`** (nouveau) | `emi_ind_const` | Construction, enfant de `cae_1.i` (Q3, étape 1). |
| `cae_1.ga` | `emi_agr_ener` | |
| `cae_1.gb` | `emi_agr_elev_bovins` + `_porcins` + `_volailles` + `_autres` | |
| `cae_1.gc` | `emi_agr_cult_engrais_min` + `_engrais_org` + `_pature` + `_autres` | |
| `cae_1.ea` | `emi_mob_vp_domtra` + `emi_mob_vp_2roues` + `emi_mob_vp_bus` | Mobilité locale, quotidienne (Q1). |
| `cae_1.eb` | `emi_mob_vp_autre` + `emi_fret_vul` + `emi_fret_pl` | Autre routier (Q1). |
| `cae_1.f` | `emi_tra_autres` | Vide pour 186 EPCI. |
| `cae_1.h` | `emi_dech` | Vide pour 284 EPCI, dont les 146 de Grand Est. |
| `cae_1.j` | `emi_en` | Vide pour 521 EPCI. En Occitanie, la branche énergie est comptée dans l'industrie. |
| `cae_1.csc` | −(`emi_CSC_beccs_en` + `emi_CSC_beccs_ind` + `emi_CSC_dac`) | Signe inversé : TeT stocke les captages en positif (Q5). Non recalé. |
| `cae_1.aa` (sans formule) | Σ des codes `emi_*` renseignés et non ignorés, dans leur signe natif | Net = brut − séquestration − captage (Q6). Hexagone seulement. |
| **Séquestration** (kteq CO2, signe inversé) | | |
| `cae_63.b` | −(`emi_UTCATF_for` + `emi_UTCATF_solfor`) | Sols forestiers ajoutés aux forêts (Q4). `solfor` n'est pas recalé. |
| `cae_63.ca` | −`emi_UTCATF_cult` | Émission nette : valeur négative. |
| `cae_63.cb` | −`emi_UTCATF_prai` | |
| `cae_63.da` | −`emi_UTCATF_zohu` | |
| `cae_63.db` | −`emi_UTCATF_arti` | Émission nette : valeur négative. |
| `cae_63.e` | −`emi_UTCATF_prbo` | |
| ignorés | `emi_UTCATF_aut`, `emi_UTCATF_bar` | Non importés, et exclus de `cae_1.aa` (Q4, Q6). |
| `cae_63.cc`, `cae_63.cd` | aucun | Vignes et vergers : restent vides. |
| **Consommation** (GWh) | | |
| `cae_2.ea` / `cae_2.eb` | `cons_res_ch_MI` / `cons_res_ch_LC` | |
| `cae_2.ec` | `cons_res_autres` + `cons_res_clim` | Q2. |
| `cae_2.fa` | `cons_ter_ch` | Chauffage (`cons_ter_ch_MI` avant la V2.1). |
| `cae_2.fb` | `cons_ter_autres` + `cons_ter_clim` | Q2 (`cons_ter_ch_LC` avant la V2.1). |
| `cae_2.ka` … `cae_2.kf` | `cons_ind_met`, `_chim`, `_nonmet`, `_iaa`, `_equip`, `_pap` | |
| `cae_2.kg` | `cons_ind_ind_autres` + `cons_csc` | Procédé de captage compté comme process industriel, à documenter dans la méthodologie (Q5). |
| **`cae_2.kh`** (nouveau) | `cons_ind_const` | Construction, enfant de `cae_2.k` (Q3). |
| `cae_2.i` | `cons_agr` | Vide pour 31 EPCI (secret statistique). |
| `cae_2.g` | `cons_mob_vp_domtra` + `cons_mob_vp_autre` | `autre` couvre déjà fret, bus et 2 roues. Omis pour une année si `cons_mob_vp_autre` est vide (Q7). |
| `cae_2.h` | `cons_tra_autres` | Vide pour 263 EPCI. |
| `cae_2.j` | `cons_dech` | Vide pour 776 EPCI. |
| `cae_2.l_pcaet` | aucun | Seules les émissions de la branche énergie sont territorialisées. La SNBC 2 a une valeur pour 49 collectivités : leur `cae_2.a` n'a pas le même périmètre dans les deux séries. |

**Autres décisions**
- **Formule de `cae_2.a` conservée pour l'instant (Q7).** Avec `val(cae_2.i)`, 48 territoires n'ont pas de total de consommation SNBC 3 : 31 EPCI sous secret, les 5 EPCI sans ligne, les 11 EPT et Paris. Leurs sous-secteurs s'affichent normalement. Passer à `opt_val` (proposé dans Notion) a été écarté après mesure en local le 04/11 :
  - hors SNBC 3, 207 totaux nouveaux (64 résultats et 139 objectifs saisis, 4 PCAET) seraient presque tous partiels, sans agriculture ;
  - la SNBC 2, qui doit rester figée, gagnerait 36 objectifs `cae_2.a` (collectivité 5182), car l'import du catalogue recalcule toutes les sources.
- **Grand Est (Q8)** : en attente (plan général, lot 0).
- **Qualité (Q9)** : pas de colonne dédiée, mais un résumé dans `objectif_commentaire` (voir l'étape 3).

## Étape 1 : catalogue d'indicateurs (action humaine, puis mise à jour du dépôt)

Les définitions et les formules viennent du catalogue Google Sheets. Elles sont importées par `GET /indicateur-definitions/import` (`apps/backend/src/indicateurs/import-indicateurs/import-indicateur-definition.controller.ts`). `upsert-indicateur-definitions.service.ts` recalcule déjà, dans la même transaction, les valeurs des formules modifiées (`recomputeAll`). Il n'y a donc **ni migration sqitch, ni script de recalcul** à écrire.

À faire dans le Sheet, par un éditeur du catalogue :
- ajouter `cae_1.ih` « Emissions de gaz à effet de serre - industrie - Construction » : titre court « Construction », unité `kteq CO2`, parent `cae_1.i`, catégorie `cae`, thématique `activites_economiques`, précision 2, sur le modèle de `cae_1.ig` ;
- ajouter `cae_2.kh` « Consommation énergétique - industrie - Construction » : unité `GWh`, parent `cae_2.k`, sur le modèle de `cae_2.kg` ;
- dans la formule de `cae_1.i`, ajouter `+opt_val(cae_1.ih)` ;
- dans la formule de `cae_2.k`, ajouter `+opt_val(cae_2.kh)` ;
- appeler `/verify`, puis `/import`, en local et en prod, **avant le premier import SNBC 3**. Sinon les totaux de l'industrie seraient faux.

La formule ne change aucun résultat tant que `cae_1.ih` et `cae_2.kh` sont vides. Mais l'import déclenche un `recomputeAll` de `cae_1.i` et `cae_2.k` sur toute la base, qui corrige les écarts existants. Mesuré en local le 05/11 (requête en annexe) :
- SNBC 2 : 73 224 totaux déjà conformes, 504 saisis (protégés), aucun changement ;
- `rare`, `citepa`, `pcaet` : totaux importés sans enfants dans la même source, aucun changement ;
- saisies collectivité : 59 totaux calculés changent, sur 3 collectivités :
  - 4546 : 30 objectifs `cae_1.i` passent de ~14 à ~14 000 (sous-secteurs industrie apparemment saisis en teq au lieu de kteq), et 4 résultats saisis le 27/10/2025 seraient effacés : saisis sur des lignes déjà calculées, ils sont restés marqués `calcul_auto = t` (défaut corrigé par `d445c76bf6`, le 10/10/2026) ;
  - 4946 : 27 objectifs `cae_1.i` et 1 objectif `cae_2.k` sont ajoutés ;
  - 5297 : une ligne `cae_1.i` vide est supprimée.

Rejouer la requête en prod juste avant l'import du catalogue, et prévenir 4546 si l'écart s'y confirme.

Dans le dépôt, reporter les mêmes changements dans `apps/backend/src/indicateurs/import-indicateurs/samples/import-indicateur-definitions.csv`, qui sert au seed et aux tests.

`ges-emissions-properties.ts` et `consommations-finales-properties.ts`, qui listent les sous-secteurs affichés sur la page Trajectoire, ne changent pas dans ce lot : le chemin SNBC 2 les lit encore. L'affichage du sous-secteur « Construction » passe au lot 3.

## Étape 2 : domaine (`packages/domain/src/indicateurs/trajectoires/`)

Le domaine ne reçoit que ce qui est partagé avec les lots suivants :
- dans `indicateur-source.enum.ts`, ajouter `SNBC3 = 'snbc3'` et `SOURCES_TRAJECTOIRE = [SNBC, SNBC3]` ;
- dans `constants.ts`, ajouter `ANNEE_REFERENCE_SNBC_V3 = 2021`, et `DATE_DEBUT_SNBC_V3 = '2020-01-01'`. La date de version n'est pas une constante : c'est la date du commit `snbc3` importé (ADR, §2) ;
- dans `packages/domain/src/utils/feature-flags.ts`, ajouter `is-trajectoire-snbc3-enabled`.

## Étape 3 : backend (`apps/backend/src/indicateurs/trajectoires/import-snbc3/`)

### Correspondance et transformation

Elles ne servent qu'à l'import : elles sont placées avec lui, pas dans `packages/domain`.

- `snbc3-mapping.ts` : un `Record<code_traj_supra, { identifiant, sign: 1 | -1 } | 'ignored'>` qui couvre **les 66 codes**, d'après le tableau ci-dessus.
  - Aucun code n'alimente `cae_2.l_pcaet`, `cae_63.cc` ni `cae_63.cd`.
  - Un commentaire rappelle les anciens codes du tertiaire (`ter_ch_MI`, `ter_ch_LC`), renommés `ter_ch` et `ter_clim` par la V2.1.
- `build-snbc3-valeurs.ts` : une fonction pure `(lignes d'un territoire) → { identifiant, annee, objectif, objectifCommentaire }[] | erreur`.
  1. Un code absent de la correspondance provoque une erreur, et non un simple log : c'est la protection contre une dérive de schéma.
  2. Les `valeur_recalee` NaN ou nulles sont ignorées.
  3. Les valeurs sont sommées par `(identifiant, annee)`, puis multipliées par 1000, et le signe est appliqué.
  4. `cae_2.g` est omis pour une année si `cons_mob_vp_autre` est vide.
  5. `cae_1.aa` n'est calculé que si `zone = HEXAGONE`.
  6. `objectifCommentaire` est construit par indicateur (voir ci-dessous).
- `build-snbc3-valeurs.spec.ts` doit couvrir :
  - les agrégations : élevage (4 codes), routier, climatisation, `cons_csc` + `cons_ind_ind_autres` → `cae_2.kg` ;
  - les signes de `cae_63.b` (`for` + `solfor`) et de `cae_1.csc`, et le ×1000 ;
  - un NaN qui n'est pas converti en 0, et l'omission de `cae_2.g` ;
  - `cae_1.aa` présent dans l'Hexagone et absent aux DROM ;
  - `bar` et `aut` ignorés, et le rejet d'un code inconnu ;
  - les trois formes du commentaire ;
  - la complétude : chaque code est mappé ou ignoré, et chaque cible est un `identifiant` connu du CSV sample.

### Commentaire des valeurs (`objectif_commentaire`)

La SNBC 2 écrit sur chaque valeur « Source des données d'entrée: rare,aldo - Indicateurs manquants: cae_2.j, … ». Ce texte s'affiche dans le tableau des valeurs. Pour la SNBC 3, le commentaire est calculé par **(territoire, indicateur)**, à partir des codes qui alimentent l'indicateur et de leur `qualite` (`ok`, `pivot_absent`, `pass_through_sans_recalage`, `non_recale_absent`, `non_recale_secteur_nul`) :

- **Recalage** :
  - « recalée sur OREC 2021 » (Hexagone) ou « recalée sur CITEPA IGT 2021 » (DROM), d'après `zone`, si tous les codes renseignés sont en `qualite = ok` ;
  - « non recalée » si aucun ne l'est ;
  - « partiellement recalée sur … » si les deux cas coexistent. C'est le cas, par exemple, de `cae_1.aa`, à cause du CSC en `pass_through_sans_recalage`.
- **Indicateurs manquants** : les identifiants TeT du territoire dont tous les codes sont vides (`pivot_absent`). La liste est la même sur toutes les valeurs du territoire.

Exemples :
- « Trajectoire SNBC 3 recalée sur OREC 2021 - Indicateurs manquants : cae_1.j, cae_2.j »
- « Trajectoire SNBC 3 non recalée - Indicateurs manquants : cae_2.j »

Points d'attention :
- Le format est volontairement différent de celui de la SNBC 2. Le lot 2 ne le parse pas : la base des leviers devient la valeur `snbc3` de 2021.
- La qualité est la même d'une année à l'autre pour un (territoire, code). Si ce n'est pas le cas, le commentaire est calculé par année.
- Les totaux calculés par formule n'ont pas de commentaire.

### Lecture, métadonnée, service et router

- **Dépendance** : ajouter `hyparquet` à la racine (JS pur, sans dépendance, lit la compression SNAPPY du fichier). `@dsnp/parquetjs`, `@duckdb/node-api` et `parquet-wasm` sont plus lourds pour ce besoin. Ne lire que les colonnes `code_epci`, `niveau_geo`, `zone`, `code_traj_supra`, `annee`, `valeur_recalee` et `qualite`.
- `snbc3-source-metadonnee.repository.ts` :
  - upsert de `indicateur_source` : `id='snbc3'`, libellé « SNBC3 », `ordreAffichage` juste après `snbc` ;
  - **une seule métadonnée pour la source `snbc3`** (ADR §2) : get-or-create sur `source_id`, puis mise à jour à chaque import : `dateVersion` = date du commit, `nomDonnees` = « SNBC3 » : le front n'affiche ni version ni commit, qui sont dans le bucket (`manifest.json`, `last-import.json`). Mêmes conventions que la métadonnée SNBC 2 : diffuseur et producteur « ADEME » (le producteur sert de nom de série sur les graphes), pas de limites ; la méthodologie attend une page d'aide SNBC 3 ;
  - même schéma que `demarches/pcaet/shared/demarche-pcaet-source-metadonnee.repository.ts`.
- `import-trajectoire-snbc3.service.ts` :
  1. résoudre le commit (date), puis lire la release `releases/V<version>/` par un `Snbc3ArtifactReader` injectable : son `manifest.json`, le parquet et le xlsx standalone. L'import échoue si l'un manque, ou si sa taille ou son sha256 diffère du manifeste.
     - En prod, l'API GitLab du dépôt `snbc3`. Le dépôt est privé : jeton `TRAJECTOIRE_SNBC3_GITLAB_TOKEN` (`read_repository`).
     - En dev, un clone local (`TRAJECTOIRE_SNBC3_LOCAL_REPOSITORY`, lu par `git show`).
     - Dans les tests, un dépôt en mémoire, avec un parquet construit par `hyparquet-writer` (devDependency) ;
  2. valider le schéma des colonnes ;
  3. enregistrer le xlsx dans le bucket privé `trajectoires-snbc3`, sous le chemin fixe `standalone.xlsx`, en écrasant le précédent (`SupabaseService.saveInStorage`, en upsert). Son nom d'origine est gardé dans les métadonnées de l'objet. Le lot 5 le sert tel quel ou adapté au territoire. À côté, le `manifest.json` de la release, copié tel quel, et `last-import.json` : statut du dernier import (`running`, `done`, `failed`), dates et rapport, lisible sans les logs puisque l'import complet se termine en arrière-plan. L'import crée le bucket s'il n'existe pas (`SupabaseService.ensurePrivateBucket`) : pas de migration sqitch, seul le service role y accède ;
  4. regrouper les lignes par territoire, puis rattacher chaque territoire à `collectivite.siren`, ou à `commune_code` si `niveau_geo = COMMUNE` (Paris). Cette règle est une fonction exportée, que réutilise l'export du lot 5 ;
  5. pour chaque collectivité :
     - appeler `buildSnbc3Valeurs` ;
     - convertir chaque identifiant en `indicateurId` (une seule requête sur les définitions) ;
     - appeler `ManageIndicateurValeursService.upsertIndicateurValeurs(valeurs, { isUserTrusted: true })` avec le `metadonneeId` et `dateValeur = annee-01-01`. C'est le même appel que `trajectoires-spreadsheet.service.ts:285`, qui déclenche les formules. Il met à jour en place les lignes existantes de la métadonnée, ce qui conserve leurs `id` : `action_score_indicateur_valeur` y fait référence, avec `on delete cascade`, une fois le score indicatif passé sur `snbc3` (lot 6) ;
     - supprimer les valeurs non calculées de la métadonnée qui n'ont pas été réécrites (une année ou un indicateur devenu vide), par le service des valeurs (`deleteIndicateurValeurs`), puis rapprocher les totaux calculés de la collectivité ;
  6. sur un import complet (sans `collectiviteIds`), supprimer de la même façon les valeurs `snbc3` des collectivités absentes du nouveau millésime ;
  7. produire un rapport : territoires non rattachés, EPCI TeT sans données, nombre de valeurs écrites, mises à jour et supprimées, erreurs par territoire. L'échec d'un territoire n'arrête pas les autres.
  - Le filtre facultatif `collectiviteIds` permet de rejouer un sous-ensemble.
- `import-trajectoire-snbc3.router.ts` :
  - `serviceRoleProcedure` `indicateurs.trajectoires.snbc3.import`, avec l'entrée `{ commit, version, collectiviteIds?, wait? }` ;
  - sur le modèle de `collectivites/import-perimetres-epci/import-perimetres-epci.router.ts` ;
  - à brancher dans `indicateurs.module.ts` et `indicateurs.router.ts`, à côté de `TrajectoiresRouter`.
- **Durée** : l'import complet de la V2.1 (1 262 territoires, 1,73 M valeurs importées) prend 8 min en local quand toutes les valeurs changent, et 16 s pour un réimport identique : bien au-delà du timeout HTTP dans le premier cas.
  - La mutation lit et vérifie la release, enregistre le classeur et met à jour la métadonnée, puis répond `{ status: 'running' }`. Le remplacement des valeurs se poursuit en arrière-plan, avec le rapport dans les logs.
  - `wait: true` renvoie le rapport à la fin (tests, rejeu d'un sous-ensemble).
  - Un seul import à la fois par instance (`CONFLICT`).
- **Mémoire** (instance de prod à 4 Go) : le parquet est lu par tranches de 100 000 lignes et gardé en colonnes typées (~31 Mo), les lignes d'un territoire n'étant matérialisées que le temps de le traiter.
  - Lecture seule : pic de ~450 Mo, contre ~1 Go en décodant d'un bloc les 3 groupes de lignes (~860 000 lignes chacun).
  - Import complet en local, en lots de 10 territoires : RSS de ~630 Mo au repos, ~1,8 Go au pic quand tout change, ~2 Go pour un réimport identique. Des lots de 25 coûtent 100 à 165 Mo de plus pour 4 % de temps en moins.
  - Ce pic n'est que de la réserve de V8 : avec un ramasse-miettes forcé toutes les 10 s, le tas retenu reste plat pendant tout l'import (346 à 371 Mo, pour 328 Mo au repos) et le RSS ne dépasse pas 920 Mo. L'import ne retient que 20 à 40 Mo, sans fuite ; sous contrainte de mémoire, V8 collecte plus tôt. Rien à régler, sauf à vouloir borner le tas de tout le backend (`--max-old-space-size`).
  - L'import journalise son avancement tous les 200 territoires, avec le tas et le RSS.
- **Vitesse** : 12 à 14 min au départ (~0,6 s par territoire). Le profil montrait Node inactif 66 % du temps : l'attente vient du nombre de requêtes (~77 par territoire, avec la cascade de calcul des totaux) et des lignes écrites puis relues, plus que du CPU (Drizzle 4,4 s et formules 3,1 s pour 50 territoires).
  - Les valeurs identiques à celles en base (objectif arrondi à la précision de l'indicateur, et commentaire) ne sont plus réécrites, et leurs totaux ne sont pas recalculés : un réimport identique passe de 12 min à 16 s.
  - Les territoires sont écrits par lots de 10 dans une transaction (`replaceMetadonneeValeurs` multi-collectivités), rejoués un par un si le lot échoue : l'import où tout change passe à 8 min.
- `README.md` : la commande `curl` pour la prod (avec l'en-tête service role), l'ordre de mise en prod (catalogue de l'étape 1, puis import) et les requêtes de vérification.
- `import-trajectoire-snbc3.router.e2e-spec.ts` :
  - fixture : un mini-parquet avec 2 EPCI de l'Hexagone (dont un sans `cons_agr`), 1 EPCI des DROM, Paris et 1 SIREN inconnu ;
  - accès refusé hors service role ;
  - valeurs, commentaires et métadonnée `snbc3` ;
  - xlsx enregistré dans le bucket, et import en échec sans xlsx ;
  - réimport d'un autre commit : une seule métadonnée `snbc3`, mise à jour ; `id` des valeurs conservés ; valeurs devenues vides supprimées, totaux recalculés ; xlsx remplacé ;
  - recalcul des totaux : `cae_1.i` inclut `ih`, et `cae_2.a` reste absent sans agriculture ;
  - valeurs `snbc` intactes, et idempotence.

## Étape 4 : masquage de `snbc3` sans feature flag

Prérequis de l'import en prod : avant l'ouverture, rien ne doit changer pour les utilisateurs sans le flag `is-trajectoire-snbc3-enabled`.

- **Exclusions génériques, sans condition** : `valeurs-moyenne.service.ts` et `list-indicateurs.repository.ts` passent de `!= 'snbc'` à `not in SOURCES_TRAJECTOIRE`. Sans ce changement, la SNBC 3 entrerait dans la moyenne des collectivités et dans le drapeau « open data ».
- **Helper `isTrajectoireSnbc3Enabled(user, collectiviteId)`**, qui appelle `TrackingService.isFeatureEnabled('is-trajectoire-snbc3-enabled', user?.id, collectiviteId)`. Les lots 2 et 5 le réutilisent. Le flag est évalué avec le groupe `collectivite`, ce qui permet d'ouvrir à des utilisateurs, puis à des collectivités.
- **Filtre conditionné au flag** dans `list-indicateur-valeurs.service.ts`. C'est le point de passage des fiches indicateurs, du tRPC et de l'API REST publique. La source `snbc3` est retirée si le helper renvoie `false`.
- Même filtre sur la liste des sources disponibles (`indicateur-sources.repository.ts`, via son service), qui sert aux filtres des fiches.
- Les autres lecteurs (page Trajectoire, leviers, PPT, score indicatif) lisent `snbc` en dur et ne voient donc pas `snbc3`.
- Deux autres lecteurs d'`indicateur_valeur` ne passent pas par ces services :
  - l'export xlsx des indicateurs (`export-indicateurs.service.ts`), qui lit les valeurs en interne : même filtre conditionné au flag ;
  - le nombre d'indicateurs renseignés de la recherche de collectivités (`recherches.service.ts`) : `snbc3` exclue sans condition jusqu'à la généralisation (lot 6).
- Tests : `list-indicateur-valeurs`, la liste des sources et l'export xlsx, avec et sans flag (plan général, décision 5), ainsi que la moyenne et le drapeau « open data », qui doivent exclure `snbc3` dans tous les cas.

## Vérification

- `nx test backend 'build-snbc3-valeurs'`.
- Catalogue local : importer le CSV mis à jour, puis vérifier dans `make db-shell` que `cae_1.ih` et `cae_2.kh` existent, et que les formules de `cae_1.i` et `cae_2.k` les incluent.
- `nx test backend 'import-trajectoire-snbc3'`.
- Import local de la release V2.1 (commit `a34a053`), lue dans un clone de `snbc3` (`TRAJECTOIRE_SNBC3_LOCAL_REPOSITORY`), en notant la durée :
  - CC Faucigny-Glières (`200000172`) : `cae_1.a` 2021 = 142,53 et `cae_2.a` 2021 = 821,39 (égal à RARE), sur les années 2020 à 2050 ;
  - les valeurs sont rattachées à l'unique métadonnée `snbc3`, et les totaux sont en `calcul_auto=true` ;
  - `cae_1.ih` et `cae_2.kh` renseignés, `cae_63.b` positif, `cae_63.ca` négatif, `cae_1.aa` absent pour un EPCI des DROM ;
  - commentaires : « recalée sur OREC 2021 » pour un sous-secteur courant, « non recalée » pour `cae_1.csc`, « recalée sur CITEPA IGT 2021 » pour les GES d'un EPCI des DROM ;
  - un EPCI de Nouvelle-Aquitaine sous secret statistique : `cae_2.a` est absent, mais les sous-secteurs sont présents ;
  - Paris (5587) et un EPT ;
  - le xlsx est présent dans le bucket `trajectoires-snbc3` ;
  - les valeurs SNBC 2 (métadonnée 17) n'ont pas changé ;
  - une deuxième exécution ne change pas les comptes.
- Masquage, sur préprod puis en prod après l'import (décision 5) : sans le flag, la fiche `cae_1.a` et l'API REST `GET /indicateurs/valeurs` ne montrent pas `snbc3`, et la moyenne des collectivités ne change pas. Avec le flag, la série apparaît.

## Hors lot

- Saisies restées marquées `calcul_auto = t` : jusqu'à `d445c76bf6` (10/10/2026), modifier une ligne déjà calculée n'écrivait pas `calcul_auto = false`. Tout recalcul peut donc effacer ces saisies, et pas seulement celui de l'étape 1. En local, 778 lignes calculées ont un auteur (73 collectivités) : ce sont les candidates, pas toutes concernées. Avant l'import du catalogue en prod, repérer les lignes `calcul_auto = t` dont la valeur stockée diffère du calcul, et les repasser à `calcul_auto = false`.
- Conditions du premier import en prod : voir l'ordre de livraison et le lot 0 du plan général.

## Annexe : écarts entre les totaux industrie stockés et le calcul

Pour chaque (total, collectivité, date, métadonnée), compare le total stocké à la somme arrondie de ses enfants. États : `ok`, `calculé différent` et `calculé orphelin` (changés par le recalcul), `manquant` (créé), `saisi (protégé)` et `saisi sans enfants` (inchangés). Approximation : ne tient pas compte des sources complémentaires (`insee`) ni du choix du dernier millésime.

```sql
with parents(parent, enfants) as (values
  ('cae_1.i', array['cae_1.ia','cae_1.ib','cae_1.ic','cae_1.id','cae_1.ie','cae_1.if','cae_1.ig']),
  ('cae_2.k', array['cae_2.ka','cae_2.kb','cae_2.kc','cae_2.kd','cae_2.ke','cae_2.kf','cae_2.kg'])),
src as (
  select p.parent, v.collectivite_id, v.date_valeur, coalesce(v.metadonnee_id,-1) metadonnee_id,
         round(sum(v.resultat)::numeric,2) r, round(sum(v.objectif)::numeric,2) o,
         count(v.resultat) nr, count(v.objectif) no
  from parents p join indicateur_definition d on d.identifiant_referentiel = any(p.enfants)
  join indicateur_valeur v on v.indicateur_id = d.id
  group by 1,2,3,4),
cur as (
  select d.identifiant_referentiel parent, v.collectivite_id, v.date_valeur, coalesce(v.metadonnee_id,-1) metadonnee_id,
         round(v.resultat::numeric,2) r, round(v.objectif::numeric,2) o, v.calcul_auto
  from indicateur_valeur v join indicateur_definition d on d.id=v.indicateur_id
  where d.identifiant_referentiel in ('cae_1.i','cae_2.k'))
select coalesce(s.parent,c.parent) parent, coalesce(m.source_id,'collectivite') source,
  case when c.parent is null then 'manquant'
       when s.parent is null and c.calcul_auto then 'calculé orphelin'
       when s.parent is null then 'saisi sans enfants'
       when not c.calcul_auto then 'saisi (protégé)'
       when (s.r is distinct from c.r and s.nr>0) or (s.o is distinct from c.o and s.no>0) then 'calculé différent'
       else 'ok' end etat,
  count(*), count(distinct coalesce(s.collectivite_id,c.collectivite_id)) collectivites
from src s full join cur c using (parent, collectivite_id, date_valeur, metadonnee_id)
left join indicateur_source_metadonnee m on m.id = coalesce(s.metadonnee_id,c.metadonnee_id)
group by 1,2,3 order by 1,2,3;
```
