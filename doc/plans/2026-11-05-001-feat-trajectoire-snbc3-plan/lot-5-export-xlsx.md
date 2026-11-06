---
title: 'Lot 5 — Export xlsx de la trajectoire'
parent: ./README.md
kind: lot
lot: 5
updated: 2026-11-06
---

# Lot 5 SNBC 3 : export xlsx de la trajectoire, derrière le feature flag

> Décision d'architecture : [ADR 0023](../../adr/0023-integration-trajectoire-snbc3.md), §3 (classeur standalone adapté au territoire par TeT, sans Excel ni COM).
> [Plan général](./README.md) (prérequis du lot 0, décision de conception 5, ordre de livraison).

## Contexte

L'export est livré derrière le flag (plan général, décision 5), et doit être prêt quand on ouvre la nouvelle page aux experts. Il ajoute deux téléchargements du classeur standalone publié par `snbc3` (« Trajectoire GES de référence-V2.xlsx ») :
- **« Mes données (.xlsx) »** (`GET /trajectoires/snbc3/telechargement`) : le classeur, ouvert sur le territoire de la collectivité ;
- **« Outil Excel SNBC 3 »** (`GET /trajectoires/snbc3/outil`) : le classeur tel qu'il est publié, sans sélection imposée. Il sert dans « Aller plus loin » et sur les cartes d'état vide du lot 3 (plan général, décision 4).

Les endpoints SNBC 2 `telechargement` et `modele` restent en place pour les utilisateurs sans flag, jusqu'au lot 6.

Les deux téléchargements viennent du même millésime que les données affichées : le xlsx est celui que l'import du lot 1 a stocké.

Prérequis (lot 0) : le commit de publication contient un classeur **généré** (le template du dépôt a un onglet `Territoire` vide), et la vérification d'ouverture décrite plus bas est faite.

## Structure du classeur

La référence est `snbc3/api/excel_export.py`, qui fait déjà cette adaptation en Python, et `_build_caract_territoire` dans `snbc3/standalone_tool/update_standalone_tool.py`.

Dans l'onglet `Territoire`, bloc ① « Sélection des EPCI », de la ligne 7 à la ligne N (N = 1268 dans le classeur actuel) :

| Colonne | Contenu |
|---|---|
| A « Libellé EPCI » | libellé choisi (liste déroulante sur W). Pré-rempli avec tous les EPCI de la première zone, hors EPT et Paris |
| B « Code EPCI » | formule `INDEX(U, MATCH(A, W, 0))`. Plage nommée `terr_num_epci = Territoire!$B$7:$B$1268`, lue par tout l'onglet `CALCUL` |
| U (masquée) | code du territoire (EPCI, EPT ou commune pour Paris) |
| V (masquée) | nom |
| W (masquée) | libellé désambiguïsé : « Nom (code) » si le nom existe en double |

`terr_zone` (`Territoire!B3`) est déduite de la sélection.

## Adaptation au territoire

`apps/backend/src/indicateurs/trajectoires/export-trajectoire-snbc3/select-territoire-classeur-snbc3.ts` : une fonction pure `(classeur: Buffer, codeTerritoire: string) → Result<Buffer, …>`.

1. Ouvrir le zip avec `jszip`, à ajouter en dépendance directe (il est déjà présent en transitif via `xlsx-template`). Trouver la feuille `Territoire` par `xl/workbook.xml` et ses rels, puis lire `xl/sharedStrings.xml`.
2. Parcourir U à partir de la ligne 7, jusqu'à la première cellule vide. Trouver la ligne dont le code est égal à `codeTerritoire`, et lire le libellé dans la colonne W de cette ligne.
3. Écrire ce libellé en A7, sous forme de chaîne inline (`t="inlineStr"`), sans modifier `sharedStrings.xml`. Vider A8 jusqu'à la dernière ligne trouvée en U : retirer la valeur et garder le style.
4. Ne toucher ni aux formules de B, ni à la validation de données, ni aux autres onglets.
5. Forcer le recalcul à l'ouverture : `fullCalcOnLoad="1"` sur `<calcPr>` dans `xl/workbook.xml`. Sans ça, les valeurs en cache seraient celles de la sélection par défaut.

**Pourquoi patcher le XML.** `exceljs`, comme `openpyxl` utilisé par l'API `snbc3`, perd les graphiques à la réécriture. Or le classeur en a dans 10 onglets (`TOUS SECTEURS`, `RESIDENTIEL` … `UTCATF`). Il faudra signaler ce défaut de `api/excel_export.py` à l'équipe `snbc3`.

**Cas particuliers**
- **Code du territoire** : c'est le code du parquet, avec la même règle de rattachement que l'import du lot 1. C'est le SIREN, sauf pour Paris (5587), où c'est `commune_code` (`75056`). On extrait cette règle de l'import du lot 1 dans une fonction partagée par les deux.
- **EPT** : présents dans la liste U/W, mais jamais pré-remplis. La recherche par code les trouve comme les autres.
- **Libellés en doublon** : on lit le libellé désambiguïsé en W, jamais le nom de V.
- **Type de cellule** : un code de U peut être stocké en nombre (`<v>200000172</v>`) ou en texte partagé. On compare des chaînes normalisées, après conversion des nombres en entiers.
- **Taille de la liste** : on vide toute la plage trouvée, quelle que soit sa longueur. Le générateur la dimensionne au nombre réel de territoires, et la zone pré-remplie peut changer.
- **Territoire absent du classeur alors qu'il a des valeurs `snbc3`** (parquet et xlsx désynchronisés) : on renvoie l'erreur `TERRITOIRE_ABSENT_DU_CLASSEUR` (500), qui est loguée. On ne renvoie jamais un classeur non adapté sans le dire.
- **Statut autre que `disponible`** (`trajectoires.snbc3.checkStatus`, lot 2) : erreur 422 avec le message du statut. Le bouton n'est de toute façon affiché que pour `disponible`. Mayotte, absente du millésime comme du classeur, tombe dans ce cas.
- **Sélection multi-zone** : sans objet, puisqu'on ne sélectionne qu'un territoire.

## Service et endpoints

Dossier : `apps/backend/src/indicateurs/trajectoires/export-trajectoire-snbc3/`.

- `export-trajectoire-snbc3.service.ts` (Result pattern) :
  - les deux méthodes commencent par vérifier le flag (helper du lot 1) ; s'il est inactif, elles renvoient `TRAJECTOIRE_SNBC3_NON_OUVERTE` ;
  - `getClasseur(user)` : lecture de `standalone.xlsx` dans le bucket du lot 1. Le buffer est gardé en cache mémoire, avec pour clé la `dateVersion` et le `nomDonnees` de la métadonnée `snbc3` : un réimport invalide donc le cache ;
  - `getClasseurCollectivite(collectiviteId, user)` : contrôle d'accès et statut (`trajectoires.snbc3.checkStatus`), code du territoire, puis `selectTerritoireClasseurSnbc3`.
- `export-trajectoire-snbc3.errors.ts` : `CLASSEUR_INDISPONIBLE` (pas de métadonnée `snbc3`, ou pas de fichier stocké), `TERRITOIRE_ABSENT_DU_CLASSEUR`, `TRAJECTOIRE_NON_DISPONIBLE`, `TRAJECTOIRE_SNBC3_NON_OUVERTE`.
- `trajectoires-snbc3.controller.ts` : les routes `snbc3/telechargement` et `snbc3/outil` appellent ce service, avec `createControllerErrorHandler`.
  - Nom de fichier : `Trajectoire SNBC3 - ${code} - ${nom}.xlsx` pour le classeur adapté ; nom d'origine pour le classeur brut.
  - `trajectoires.controller.ts` (SNBC 2) ne change pas. Il est nettoyé au lot 6.

## Frontend

Dossier : `apps/app/src/app/pages/collectivite/Trajectoire/`.

- Nouveaux hooks `use-telechargement-trajectoire-snbc3.ts` et `use-telechargement-outil-snbc3.ts`, sur le modèle des hooks actuels, avec des noms de fichier de repli « Trajectoire SNBC3 ». L'événement PostHog `downloadSnbcFile` est réutilisé (`file: 'donnees-snbc3' | 'outil-snbc3'`).
- « Aller plus loin » de la nouvelle page (lot 3), comme dans la maquette : le bouton « Mes données (.xlsx) » et le lien vers l'outil Excel SNBC 3.
- Les cartes d'état vide du lot 3 utilisent `use-telechargement-outil-snbc3.ts`.
- `AllerPlusLoin.tsx`, `useTelechargementTrajectoire.ts` et `useTelechargementModele.ts` servent encore l'ancienne page. Ils sont supprimés au lot 6.

## Tests

- `select-territoire-classeur-snbc3.spec.ts`. Fixture : un mini-classeur construit dans le test, avec U, W, A pré-rempli, des formules en B et un onglet de plus. Cas à couvrir :
  - A7 contient le libellé, et A8 à AN sont vides ;
  - un code numérique et un code texte ;
  - un libellé en doublon ;
  - Paris (`75056`) ;
  - un code absent, qui renvoie une erreur ;
  - `fullCalcOnLoad` est posé ;
  - toutes les entrées du zip autres que la feuille `Territoire` et `workbook.xml` sont identiques octet pour octet. Ce test garantit la conservation des graphiques.
- `trajectoires-snbc3.controller.e2e-spec.ts` : le fixture xlsx est déposé dans le bucket.
  - `telechargement` sur un EPCI disponible renvoie un classeur adapté ;
  - sur un EPCI absent, il renvoie 422 ;
  - sans métadonnée, il renvoie `CLASSEUR_INDISPONIBLE` ;
  - `outil` renvoie le classeur brut ;
  - sans le flag, les deux routes sont refusées ;
  - après le remplacement du xlsx, le cache sert le nouveau fichier.

## Vérification

- `nx test backend 'select-territoire-classeur-snbc3'` et `nx test backend 'trajectoires-snbc3'`.
- **Vérification du lot 0**, sur le classeur généré du commit de publication, adapté par la fonction depuis Node, pour un EPCI, un EPT, Paris et un EPCI au libellé en doublon. À l'ouverture dans Excel, contrôler :
  - le territoire sélectionné et `terr_zone` (B3) ;
  - des graphiques présents et recalculés ;
  - la valeur `cae_1.a` en 2030 de `TOUS SECTEURS`, égale à celle de la page Trajectoire.
  - Tester aussi l'ouverture dans LibreOffice, dont le recalcul à l'ouverture dépend d'un réglage.
- En local (flag actif), les deux téléchargements fonctionnent depuis « Aller plus loin », et l'outil Excel depuis une carte d'état vide.
- En prod, les experts métier qui ont le flag vérifient le classeur de chaque nouvelle livraison.
