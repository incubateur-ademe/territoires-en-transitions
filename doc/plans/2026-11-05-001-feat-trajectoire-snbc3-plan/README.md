---
title: 'feat: Trajectoire SNBC 3 territorialisée'
type: feat
status: draft
date: 2026-11-05
updated: 2026-11-06
kind: index
---

# Plan : bascule de la trajectoire SNBC 2 vers SNBC 3 pré-calculée

> Décision d'architecture : [ADR 0023](../../adr/0023-integration-trajectoire-snbc3.md) (fonctionnement SNBC 2, couplage par la donnée, import avec un seul millésime en base, export, ouverture progressive derrière un feature flag). Ce plan l'applique, sans le portage TS conditionnel (point 5).

**Plans détaillés**

1. [Import des données et masquage sans flag](./lot-1-import-des-donnees.md)
2. [Backend en lecture seule](./lot-2-backend-lecture-seule.md)
3. [Page Trajectoire](./lot-3-page-trajectoire.md)
4. [Impacts ailleurs dans le frontend](./lot-4-impacts-frontend.md)
5. [Export xlsx de la trajectoire](./lot-5-export-xlsx.md)
6. [Généralisation](./lot-6-generalisation.md)
7. [Retrait de la SNBC 2](./lot-7-retrait-snbc2.md)

Indépendant des lots : [import du COG pour les communes et les EPCI de TeT](./complement-mise-a-jour-collectivites-cog-2026.md).

Quand livrer chaque lot : voir « Ordre de livraison ».

**Vocabulaire**
- **Ouverture progressive** : le feature flag `is-trajectoire-snbc3-enabled` est actif pour une partie des utilisateurs (experts métier, puis collectivités pilotes).
- **Généralisation** : le flag est retiré et la SNBC 3 devient la seule trajectoire, pour tous (lot 6).
- **Transition** : de la généralisation au retrait de la SNBC 2 (lot 7). Les deux séries s'affichent sur les fiches indicateurs.

## Contexte

L'esquisse Notion « SNBC3 : Actualisation des trajectoires (sans surcharge collectivité) » a été pariée le 27/10, sur une petite fournée, avec un engagement partenaire pour la fin d'année.

L'année de référence passe de 2015 (SNBC 2) à 2021 (SNBC 3). Les données viennent du dépôt `snbc3` (lien à compléter, comme dans l'ADR).

**Ce qu'on vise**
- La page Trajectoire perd « Recalculer » et « Compléter les données ».
- Un bandeau de transition s'affiche, qu'on peut fermer définitivement.
- Des états vides clairs sont prévus : EPCI absent du millésime, commune (avec un lien vers son EPCI), maille au-dessus de l'EPCI.
- « Aller plus loin » propose l'outil Excel `snbc3` et « Mes données (.xlsx) », le même classeur ouvert sur le territoire.
- Les experts métier vérifient en prod, derrière un feature flag, chaque livraison de données avant l'ouverture à tous.

**Sort de la SNBC 2 (décidé le 04/11)** : la SNBC 3 arrive comme une nouvelle source (décision 1). Les deux séries s'affichent côte à côte sur les fiches indicateurs, avec leur propre libellé et leur propre couleur, jusqu'au retrait de la SNBC 2 (lot 7), à une date à fixer.

## Constats sur les données locales (prod restaurée + pipeline lancé le 02/11)

- **Jointure** : le parquet compte 1 262 territoires, tous rattachés à une collectivité TeT (vérifié le 06/11).
  - 1 261 par `code_epci` = `collectivite.siren` : 990 CC, 224 CA, 22 METRO, 14 CU et 11 EPT.
  - Paris (`75056`, `niveau_geo=COMMUNE`) par `collectivite.commune_code`. C'est la collectivité 5587, de type `commune`.
  - Les 12 territoires qui ne sont pas des EPCI à fiscalité propre (Paris et les 11 EPT, `niveau_geo` `COMMUNE` ou `EPT`) sont tous des subdivisions de la MGP. Le mainteneur de `snbc3` le confirme. La MGP (`200054781`, collectivité 5116) figure aussi dans le parquet, en `EPCI`. Additionner la MGP et ses subdivisions compterait le même territoire deux fois. TeT n'additionne jamais de territoires : l'import écrit chaque territoire dans sa collectivité, et l'export du lot 5 ne sélectionne qu'un territoire. Il n'y a donc pas de double comptage (question 2).
  - Millésimes, vérifiés le 08/11 :
    - `snbc3` : codes communes du COG 2026, mais rattachement commune → EPCI de 2025, parce que geo.api.gouv.fr n'est pas à jour. Le mainteneur annonce le COG 2026, ce qui n'est vrai que pour les codes communes.
    - TeT : communes au COG 2023 (`imports.commune`, seed inchangé depuis mars 2023 : il ne contient aucun mouvement de commune du 01/01/2024 ni du 01/01/2025), périmètres des EPCI Banatic au 01/01/2025, et liste des EPCI à jour des fusions de 2026 (6860 importée de Banatic, 6031 créée à la main).
    - Comme l'import rattache par SIREN d'EPCI, le millésime des communes de TeT n'a pas d'effet sur lui. Il en a un sur l'EPCI parent des communes (lot 2).
  - Le parquet suit le découpage des EPCI de 2025 (geo.api.gouv.fr). Il ignore donc les deux fusions du 01/01/2026, vérifiées par l'état administratif des SIREN :
    - CC de Lévézou Pareloup (`241200765`, collectivité 3973) et CC du Pays de Salars (`241200658`, 3971) → CC du Lévézou (`994579670`, 6860, sans membre ni fiche) ;
    - CA du Val de Fensch (`245701222`, 4748) et CA Portes de France-Thionville (`245701362`, 4749) → Thionville Fensch Agglomération (`992367730`, 6031, 9 membres et 73 fiches).
    - Les quatre anciens EPCI reçoivent leur trajectoire. Les deux nouveaux passent en `absent_du_millesime` en attendant la réponse du mainteneur de `snbc3` (question 5).
    - Hors fusion, trois communes changent d'EPCI au 01/01/2026 (comparaison avec la composition communale INSEE au 01/01/2026, vérifiée le 08/11) : Bonrepos-sur-Aussonnelle (CA Le Muretain Agglo → CA Le Grand Ouest Toulousain), Bény-sur-Mer (CC Seulles Terre et Mer → CC Cœur de Nacre) et Barbazan-Dessus (CC des Coteaux du Val d'Arros → CA Tarbes-Lourdes-Pyrénées). Les trajectoires de ces six EPCI restent calculées sur leur périmètre de 2025.
  - Sur les 1 271 EPCI à fiscalité propre et EPT de TeT, 10 n'ont pas de données :
    - les 5 EPCI de Mayotte, que `snbc3` ne territorialise pas faute de source INSEE qui la couvre (README de `snbc3` et `docs/territorialisation_drom.md`, section « Mayotte ») ;
    - Saint-Martin, la Province Nord et la Collectivité territoriale de Martinique (question 1) ;
    - les deux EPCI issus des fusions.
- **SNBC 2 existante** : 1 141 collectivités ont une trajectoire SNBC 2, soit 2,17 M valeurs, de 2015 à 2050 (métadonnée id 17).
  - Le cron l'a calculée pour presque tous les EPCI, ainsi que pour 14 syndicats ou PETR.
  - **Le critère « avait une SNBC 2 » ne filtre donc presque rien.** On affiche le bandeau à tous les EPCI éligibles, et on abandonne la table de snapshot prévue au départ.
- **Totaux calculés par formule** : `cae_1.a`, `cae_1.c/d/e/i/k/l`, `cae_2.a/m`, `cae_63.a/c/d`, `cae_1.b` et `cae_2.b` ont une formule `valeur_calcule`. Les valeurs SNBC 2 de ces indicateurs sont en `calcul_auto=true`.
  - Le recalcul est déclenché par `ComputeValeursService.updateCalculatedIndicateurValeurs` (`apps/backend/src/indicateurs/valeurs/compute-indicateur-valeurs/compute-valeurs.service.ts`), via le service d'upsert des valeurs.
  - L'import passe donc par le backend et n'écrit que les indicateurs non calculés (ADR, §2).
- **Cohérence du recalage** : en 2021, la somme des GES et des consommations SNBC 3 ×1000 est égale à RARE `cae_1.a` / `cae_2.a` (écart médian de 0 sur 977 EPCI). Les unités sont confirmées : MtCO2e ×1000 donne des kteq, TWh ×1000 donne des GWh. 265 EPCI s'écartent toutefois de plus de 2 % sur les GES.
- **Parquet local** : 66 sous-secteurs, 2 570 458 lignes et 1 262 territoires, de 2020 à 2050, après contournement de `parc_vehicules` (question 3 en fin de plan).
- **Écarts avec RARE expliqués** : les 265 écarts de plus de 2 % ne viennent pas des valeurs vides, mais de quatre causes (page Notion TT-39, annexe A.4).
  - **146 EPCI de Grand Est** : le bouquet OREC mis à jour le 22/10/2026 (v2.5) contient le millésime 2026-08 de Grand Est, qui semble incomplet (agriculture de 7,7 à 1,0 Mt en 2021, déchets non publiés). Le pipeline du 02/11 l'a lu ; TeT a le millésime 2025-08 (Q8).
  - **89 EPCI d'Occitanie, 19 de Corse et 11 à cheval sur deux régions** : défauts de l'import RARE de TeT (industrie totale `0101.0107` ignorée, zéros corses importés, part d'une seule région retenue). Sans effet sur `snbc3`, mais à corriger côté TeT.
- **Valeurs vides (`pivot_absent`)** : 64 852 lignes en `NaN`, sur 7 codes. Ce sont des valeurs inconnues (poste non publié, secret statistique), importées comme vides. 48 territoires n'auront pas de total de consommation `cae_2.a` : c'est accepté (lot 1, « Autres décisions »).

## Décisions de conception

1. **Source `snbc3` distincte de `snbc`** (ADR, §2 ; détail au lot 1). La séparation rend la cohabitation explicite : pas d'ambiguïté de « dernier millésime » entre SNBC 2 et SNBC 3, et la SNBC 2 se retire par source.
2. **Les lecteurs « trajectoire » basculent sur `snbc3`, et les traitements génériques traitent les deux sources de la même façon** (détail aux lots 1, 2 et 4).
   - Lecteurs trajectoire (page Trajectoire, leviers, export, puis `progression_snbc` et score indicatif à la généralisation) : ils ne lisent que `snbc3`, qui n'a qu'un millésime en base (décision 6).
   - Exclusions génériques (moyenne des collectivités, drapeau « open data ») : `snbc3` est exclue partout où `snbc` l'est déjà, au moyen d'une constante `SOURCES_TRAJECTOIRE = ['snbc', 'snbc3']`.
   - Fiches indicateurs : `snbc3` est une couche « trajectoire » à part entière, affichée à côté de `snbc` pendant la transition.
   - Graphes des données territoriales du rapport PPT : comme les fiches indicateurs, ils montrent `snbc` et `snbc3` avec le flag (décidé le 10/11 : l'app et l'export présentent les mêmes données).
3. **Correspondance et conventions d'import** : la table et les règles sont dans le plan du lot 1. Deux nouveaux indicateurs, `cae_1.ih` et `cae_2.kh` (construction), sont créés par le catalogue. `cae_2.m` sera traité à part, si le produit veut le garder sans sous-secteurs.
4. **Export (décidé le 06/11, ADR §3)** : TeT sert le xlsx standalone du commit importé, tel quel ou ouvert sur le territoire (détail au lot 5).
5. **Feature flag `is-trajectoire-snbc3-enabled` (décidé le 06/11, ADR §4)**. On s'appuie sur les flags PostHog existants : `useIsFeatureFlagEnabled` côté front, `TrackingService.isFeatureEnabled(clé, userId, collectiviteId)` côté back. Sans utilisateur (anonyme, API, service role), le flag vaut `false`.
   - Les lots 2 à 5 ajoutent le chemin SNBC 3 à côté de l'ancien, sans rien retirer. Sans le flag, rien ne change : page actuelle, calcul et cron SNBC 2 compris.
   - Le lot 1 masque `snbc3` aux utilisateurs sans flag, au point de passage des valeurs d'indicateurs (fiches, tRPC, API publique). L'import peut donc avoir lieu en prod bien avant l'ouverture.
   - Le score indicatif et le cron restent sur la SNBC 2 jusqu'à la généralisation (lot 6, raison dans l'ADR §4).
   - Tests et recette : en dev, test et ci, le flag est toujours actif. Les cas sans flag se testent en espionnant `TrackingService.isFeatureEnabled` (comme dans `complete-plan-secteurs.e2e-spec.ts`), et se vérifient à la main sur un environnement où PostHog pilote le flag (préprod, ou prod).
6. **Un seul millésime `snbc3` en base (décidé le 06/11, ADR §2)** : chaque import remplace le précédent (détail au lot 1).

## Lot 0 : prérequis (hors code)

- [x] Sort de la SNBC 2 (décidé le 04/11, voir « Contexte »).
- [ ] Fixer la durée d'ouverture à tous avant la généralisation (lot 6), puis la durée de la transition, ou l'événement qui déclenche le retrait de la SNBC 2 (lot 7).
- [x] Libellés des deux séries sur les graphes : « SNBC2 » et « SNBC3 » (décidé le 04/11).
- [x] Faire valider la table de correspondance (page Notion TT-39, le 04/11). Elle est reprise dans le plan du lot 1.
- [ ] Grand Est (Q8) : remonté au RARE le 04/11, en attente de leur réponse et de celle d'Adrien. En attendant, ne pas réimporter les données RARE de Grand Est depuis le bouquet v2.5. **Bloquant pour le feu vert**, pas pour l'import.
- [ ] Ouvrir un ticket pour les défauts de l'import RARE de TeT : Occitanie, Corse, EPCI à cheval (Notion TT-39, annexe A.4).
- [x] Relancer `snbc3` avec `parc_vehicules` en local (fait le 02/11).
- [ ] Faire corriger la source `parc_vehicules` dans `snbc3` (question 3). **Bloquant pour le feu vert**, pas pour l'import.
- [ ] **Bloquant pour l'import en prod.** Obtenir le premier commit de publication du dépôt `snbc3`, lisible par le backend de prod. Il doit contenir le parquet, le xlsx standalone généré et complet, et le PDF de méthodologie (ADR §2). Le PDF doit intégrer les chiffres de cohérence nationale postérieurs à la mise à jour du bouquet OREC du 22/10.
- [ ] **Avant d'ouvrir le flag aux experts.** Sur le xlsx de ce commit, vérifier qu'un classeur adapté depuis Node s'ouvre bien sur le territoire, graphiques compris (procédure dans le plan du lot 5).
- [ ] Désigner les experts métier qui recevront le flag en prod, et définir les étapes de l'ouverture progressive (experts, collectivités pilotes, tous).
- [ ] **Bloquant pour la généralisation (lot 6).** Feu vert des experts métier sur la dernière livraison importée.
- [x] **Paris et les leviers** : Paris est accepté dans le chemin SNBC 3 des leviers, comme toute collectivité présente dans le millésime ; son mondrian s'affiche (décidé le 09/11, lot 2).
- [ ] Préparer les textes produit : bandeau, « Ce qui change », états vides, méthodologie par secteur, message « secteurs non représentés » du mondrian, et message sur l'aérien et le maritime aux DROM.
- [ ] **Mondrian : pourcentages SGPE.** Les pourcentages régionaux de `trajectoire-leviers.config.ts` (Excel « Proposition de calcul des Trajectoire-Leviers - SGPE ») ont été conçus pour une réduction de 2019 à 2030. Ils s'appliqueront à une réduction de 2021 à 2030, vers la cible SNBC 3. Demander au SGPE ou à TerriSTORY s'ils restent valables ou s'ils seront mis à jour.
- [ ] **Mondrian pour les DROM.** Le SGPE ne fournit pas de pourcentages pour les DROM, qui n'ont pas d'UTCATF. Proposition : masquer le mondrian pour leurs 18 EPCI. À valider.

## Lot 1 : import des données et masquage sans flag

- [ ] Création de `cae_1.ih` et `cae_2.kh` dans le catalogue, et ajout aux formules de `cae_1.i` et `cae_2.k`, avant le premier import.
- [ ] Ajout du feature flag `is-trajectoire-snbc3-enabled` 
- [ ] `SNBC3`, `SOURCES_TRAJECTOIRE`, les constantes SNBC 3 et la clé du flag dans le domaine.
- [ ] Table de correspondance, transformation et mutation d'import dans `apps/backend/src/indicateurs/trajectoires/import-snbc3/`, avec une métadonnée unique mise à jour en place.
- [ ] Stockage du xlsx standalone du commit dans le bucket `trajectoires-snbc3`.
- [ ] Exclusions génériques sur `SOURCES_TRAJECTOIRE`, et masquage de `snbc3` sans flag (valeurs et sources).

## Lot 2 : backend en lecture seule

- [ ] Procédures `trajectoires.snbc3.checkStatus` et `trajectoires.snbc3.get`, réservées aux utilisateurs qui ont le flag.
- [ ] Statuts de disponibilité (`disponible`, `absent_du_millesime`, `commune_non_supportee`, `supra_non_supporte`).
- [ ] Leviers : chemin SNBC 3 avec le flag (base 2021 lue dans `snbc3`, sans `objectifCommentaire`) ; cas de Paris et des DROM.
- [ ] Export PPT : avec le flag, SNBC 2 et SNBC 3 sur les graphes des données territoriales, comme dans l'app ; sans le flag, SNBC 2 seule.

## Lot 3 : page Trajectoire

- [ ] Aiguillage sur le flag vers une nouvelle page, sans toucher à l'ancienne.
- [ ] États vides par statut, avec le lien vers l'EPCI pour une commune.
- [ ] Bandeau de transition et modale « Ce qui change » ; ni calcul ni saisie.
- [ ] Lecture de `snbc3` et sous-secteur « Construction ».
- [ ] Mondrian : secteurs non représentés, et masquage pour les DROM.
- [ ] Méthodologie SNBC 3, libellés et événements PostHog.

## Lot 4 : autres impacts dans le frontend

- [ ] Avec le flag, plus de déclenchement du calcul sur la fiche indicateur ni dans la priorisation des leviers.
- [ ] Cohabitation des séries « SNBC2 » et « SNBC3 » sur les fiches indicateurs (`Indicateurs/data/`).

## Lot 5 : export xlsx de la trajectoire

- [ ] Adaptation du classeur au territoire, par patch XML (libellé en A7, reste de la sélection vidé, recalcul à l'ouverture).
- [ ] Routes `snbc3/telechargement` (classeur adapté) et `snbc3/outil` (outil Excel brut), réservées aux utilisateurs qui ont le flag.
- [ ] « Mes données (.xlsx) » et outil Excel dans la nouvelle page et sur ses cartes d'état vide.

## Lot 6 : généralisation

- [ ] Retrait du flag, de l'ancienne page et des procédures et endpoints SNBC 2 ; code de calcul SNBC 2 débranché, mais conservé.
- [ ] Suppression du cron `compute-all-outdated-trajectoires` et de son service.
- [ ] Score indicatif et `progression_snbc` sur `snbc3`, et recalcul des scores courants.

## Lot 7 : retrait de la SNBC 2

- [ ] Suppression du code SNBC 2 conservé et des variables `TRAJECTOIRE_SNBC_*`.
- [ ] Retrait des branches `snbc` du frontend et de `IndicateurSourceEnum.SNBC`.
- [ ] Script de suppression des données de la source `snbc`.

## Ordre de livraison

1. Lot 1 : fusion et déploiement tôt. Le catalogue (lot 1, étape 1) et le masquage (étape 4) doivent être en prod avant le premier import.
2. Import en prod dès que le commit de publication `snbc3` est disponible (lot 0). Il est invisible sans le flag. Chaque nouvelle livraison de données se réimporte et remplace la précédente.
3. Lots 2 à 5 : livrés au fil de l'eau, dans cet ordre de préférence (le lot 3 utilise les procédures du lot 2, et le lot 5 utilise le xlsx du lot 1). Les utilisateurs sans flag ne voient rien changer.
4. Ouverture progressive du flag : experts métier en prod, puis collectivités pilotes, puis tout le monde.
5. Lot 6 : généralisation, en une livraison, après le feu vert des experts. La transition commence : les deux séries cohabitent sur les fiches indicateurs.
6. Lot 7 : retrait de la SNBC 2 à la date fixée.

La vérification de chaque lot est décrite dans son plan.

## Questions de couverture et de données

1. **Collectivités TeT sans trajectoire.** Saint-Martin, la Province Nord et la Collectivité territoriale de Martinique sont hors du périmètre de `snbc3`. Est-ce normal ? Mayotte est exclue de façon documentée par `snbc3`.
2. **Métropole du Grand Paris.** MGP, EPT et Paris ont chacun leur trajectoire. TeT les affiche séparément, sans jamais les additionner, ce qui évite le double comptage signalé par `snbc3`. Cet affichage nous convient-il ?
3. **Source `parc_vehicules` cassée.** Le jeu data.gouv a été renommé : l'ancien slug `donnees-sur-le-parc-de-vehicules-au-niveau-communal` répond 404, le nouveau est `parc-de-vehicules-routiers`. Le CSV n'a plus de colonne `CLASSE_VEHICULE` : l'équivalent est `GROUPE`.
    - Le pipeline continue malgré l'échec, et tout le routier GES finit dans « domicile-travail ».
    - **À corriger dans `snbc3`.** On a contourné le problème en local en générant le cache à la main.
    - Il faudrait aussi que le pipeline échoue franchement quand une source manque.
4. **Livraison.** Le canal est fixé par l'ADR : un commit du dépôt `snbc3`, dont la date sert de millésime.
    - Qui possède la CI de publication côté `snbc3` ?
    - Quand publier un nouveau commit, une fois le point 3 corrigé et la question de Grand Est réglée ? Il sera réimporté avant le feu vert.
5. **Découpage des EPCI de 2026.** Le parquet ignore les deux fusions et les trois changements de commune du 01/01/2026 (voir « Jointure »). La question est remontée au mainteneur de `snbc3`, qui pense être au COG 2026. La réponse lui précise que seuls ses codes communes le sont. En attendant, la CC du Lévézou et Thionville Fensch Agglomération restent en `absent_du_millesime`. Un parquet au découpage 2026 se réimportera comme une nouvelle livraison. L'import du lot 1 supprime alors les valeurs des quatre anciens EPCI.
