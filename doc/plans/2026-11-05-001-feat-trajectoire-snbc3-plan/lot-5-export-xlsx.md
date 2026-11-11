---
title: 'Lot 5 — Export xlsx de la trajectoire'
parent: ./README.md
kind: lot
lot: 5
updated: 2026-11-11
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

Dans l'onglet `Territoire`, bloc ① « Sélection des EPCI », de la ligne 7 à la ligne N (N = 1266 dans la release V2.2) :

| Colonne | Contenu |
|---|---|
| A « Libellé EPCI » | libellé choisi (liste déroulante sur Z). Pré-rempli avec tous les EPCI de la première zone, hors EPT et Paris |
| B « Code EPCI » | formule `IFERROR(INDEX($X$7:$X$N, MATCH($A7, $Z$7:$Z$N, 0)), "")`. Plage nommée `terr_num_epci = Territoire!$B$7:$B$N`, lue par tout l'onglet `CALCUL` |
| X (masquée) | code du territoire (EPCI, EPT ou commune pour Paris) |
| Y (masquée) | nom |
| Z (masquée) | libellé désambiguïsé : « Nom (code) » si le nom existe en double |

Les colonnes X et Z sont en dur dans la fonction, comme dans `api/excel_export.py` de `snbc3` (constantes `HC`/`HL` du générateur) : si le générateur les déplace (elles étaient en U/V/W dans une version antérieure), l'export de `snbc3` casse lui aussi, et un territoire introuvable le signale (`TERRITOIRE_NOT_IN_WORKBOOK`, ou `WORKBOOK_INVALID` pour une liste vide). La release V2.2 n'a pas de `sharedStrings.xml` (chaînes inline) et pose déjà `fullCalcOnLoad="1"`.

`terr_zone` (`Territoire!B3`) est déduite de la sélection.

## Adaptation au territoire

`apps/backend/src/indicateurs/trajectoires/export-trajectoire-snbc3/select-territoire-in-snbc3-workbook.ts` : une fonction pure `(content: Buffer, codeTerritoire: string) → Result<Buffer, …>`.

1. Ouvrir le zip avec `jszip`, à ajouter en dépendance directe (il est déjà présent en transitif via `xlsx-template`). Trouver la feuille `Territoire` par `xl/workbook.xml` et ses rels, puis lire `xl/sharedStrings.xml`.
   Le XML est lu avec `htmlparser2` en mode XML (arbre `domhandler` avec la position de chaque nœud dans le source), pas avec des regex : commentaires, ordre des attributs et cibles relatives (`../`) sont gérés. Pas de préfixe d'espace de noms : ni Excel ni le générateur n'en mettent, et un élément introuvable donne `WORKBOOK_INVALID`, comme un `<calcPr>` absent. Les modifications sont ensuite appliquées sur le source aux positions des nœuds : le reste du fichier est conservé octet pour octet.
2. Parcourir la colonne X (code) à partir de la ligne 7, jusqu'à la première cellule vide : la dernière ligne non vide est N. Trouver la ligne dont le code est égal à `codeTerritoire`, et lire le libellé dans la colonne Z.
3. Écrire le texte de ce libellé en A7, sous forme de chaîne inline (`t="inlineStr"`, `<t xml:space="preserve">`), sans modifier `sharedStrings.xml`. Vider A8 jusqu'à la dernière ligne de la liste : retirer la valeur et garder le style.
4. Ne toucher ni aux formules de B, ni à la validation de données, ni aux autres onglets.
5. Forcer le recalcul à l'ouverture : `fullCalcOnLoad="1"` sur `<calcPr>` dans `xl/workbook.xml`. Sans ça, les valeurs en cache seraient celles de la sélection par défaut.

**Pourquoi patcher le XML.** Le classeur a des graphiques dans 10 onglets (`TOUS SECTEURS`, `RESIDENTIEL` … `UTCATF`). `exceljs` n'a pas de modèle des graphiques, et la version 4.4.0 échoue au chargement du classeur V2.2, sur ses dessins (`Cannot read properties of undefined (reading 'anchors')`, vérifié le 2026-11-11).

**Cas particuliers**
- **Code du territoire** : c'est le code du parquet, avec la même règle de rattachement que l'import du lot 1. C'est le SIREN, sauf pour Paris (5587), où c'est `commune_code` (`75056`). On extrait cette règle de l'import du lot 1 dans une fonction partagée par les deux.
- **EPT** : présents dans la liste X/Z, mais jamais pré-remplis. La recherche par code les trouve comme les autres.
- **Libellés en doublon** : on lit le libellé désambiguïsé en Z, jamais le nom de Y.
- **Type de cellule** : un code de X peut être stocké en nombre (`<v>200000172</v>`) ou en texte partagé. On compare des chaînes normalisées, après conversion des nombres en entiers.
- **Taille de la liste** : on vide toute la plage trouvée, quelle que soit sa longueur. Le générateur la dimensionne au nombre réel de territoires, et la zone pré-remplie peut changer.
- **Territoire absent du classeur alors qu'il a des valeurs `snbc3`** (parquet et xlsx désynchronisés) : on renvoie l'erreur `TERRITOIRE_NOT_IN_WORKBOOK` (500), qui est loguée. On ne renvoie jamais un classeur non adapté sans le dire.
- **Import complet inachevé** : l'import remplace les valeurs, puis écrit le classeur en dernier. Entre les deux, ou après un échec, les valeurs en base et le classeur stocké viennent de deux releases : le manifeste ne porte pas encore l'`importId` de `pending-release.json`, même quand l'import réimporte la release du manifeste. « Mes données » renvoie alors `SNBC3_IMPORT_UNFINISHED` (503) plutôt qu'un classeur qui ne correspond pas à la page. Le contrôle est refait après l'adaptation, avec la version du classeur lu : un import commencé entre-temps, ou allé au bout, donne aussi 503. L'outil brut reste servi, cohérent avec lui-même.
- **Statut autre que `disponible`** (`trajectoires.snbc3.checkStatus`, lot 2) : erreur 422 avec le message du statut. Le bouton n'est de toute façon affiché que pour `disponible`. Mayotte, absente du millésime comme du classeur, tombe dans ce cas.
- **Sélection multi-zone** : sans objet, puisqu'on ne sélectionne qu'un territoire.

## Service et endpoints

Dossier : `apps/backend/src/indicateurs/trajectoires/export-trajectoire-snbc3/`.

- `export-trajectoire-snbc3.service.ts` (Result pattern) :
  - les deux méthodes commencent par vérifier le flag (helper du lot 1) ; s'il est inactif, elles renvoient `TRAJECTOIRE_SNBC3_NON_OUVERTE` ;
  - `getWorkbook({ collectiviteId }, { user })` : lecture de `standalone.xlsx` dans le bucket du lot 1. La collectivité ne sert qu'à évaluer le flag, qui se décide par collectivité. Le buffer est gardé en cache mémoire, avec pour clé la date d'écriture de l'objet stocké (`storage.objects.updated_at`) : un réimport, qui le réécrit, invalide donc le cache ;
  - `getCollectiviteWorkbook({ collectiviteId }, { user })` : flag, contrôle d'accès et statut (`TrajectoireSnbc3Service.resolveStatut`, partagé avec `checkStatus`), code du territoire (`getSnbc3CodeTerritoire`, réciproque de `getSnbc3CollectiviteKey`), import inachevé (`Snbc3ReleaseStorageService.hasUnfinishedImport`), puis `selectTerritoireInSnbc3Workbook`.
- Erreurs ajoutées à `snbc3/trajectoire-snbc3.errors.ts` (une seule config pour le contrôleur) : `WORKBOOK_NOT_FOUND` (404 : pas de fichier stocké), `WORKBOOK_INVALID` (500 : onglet `Territoire` introuvable ou de structure inattendue), `TERRITOIRE_NOT_IN_WORKBOOK` (500), `TRAJECTOIRE_NON_DISPONIBLE` (422), `SNBC3_IMPORT_UNFINISHED` (503), et l'existante `TRAJECTOIRE_SNBC3_NON_OUVERTE` (403). Droits de lecture insuffisants : `UNAUTHORIZED` (403).
- `snbc3/trajectoire-snbc3.controller.ts` (celui de la méthodologie) : les routes `snbc3/telechargement` et `snbc3/outil`, toutes deux avec `?collectiviteId=`, appellent ce service, avec `createControllerErrorHandler`.
  - Nom de fichier : `Trajectoire SNBC3 - ${code} - ${nom}.xlsx` pour le classeur adapté ; nom d'origine pour le classeur brut. L'en-tête vient de `buildAttachmentContentDisposition` (`filename*` UTF-8) : avec `res.attachment`, un nom Latin-1 part tel quel et `res.send` abîme ses accents (« é » → « ý »).
  - `trajectoires.controller.ts` (SNBC 2) ne change pas. Il est nettoyé au lot 6.

## Frontend

Dossier : `apps/app/src/app/pages/collectivite/Trajectoire/`.

- Hooks `trajectoire-snbc3/data/use-telechargement-trajectoire-snbc3.ts` et `use-telechargement-outil-snbc3.ts` (ce dernier existait derrière `IS_OUTIL_SNBC3_DISPONIBLE`, retiré), construits avec la méthodologie sur `use-telechargement-snbc3.ts`, sur le modèle des hooks actuels, avec des noms de fichier de repli « Trajectoire SNBC3 ». L'événement PostHog `downloadSnbcFile` est réutilisé (`file: 'donnees-snbc3' | 'outil-snbc3'`).
- « Aller plus loin » de la nouvelle page (lot 3), comme dans la maquette : le bouton « Mes données (.xlsx) » et le lien vers l'outil Excel SNBC 3.
- Les cartes d'état vide du lot 3 utilisent `use-telechargement-outil-snbc3.ts`.
- `AllerPlusLoin.tsx`, `useTelechargementTrajectoire.ts` et `useTelechargementModele.ts` servent encore l'ancienne page. Ils sont supprimés au lot 6.

## Tests

- `select-territoire-in-snbc3-workbook.spec.ts`. Fixture : un mini-classeur construit dans le test, avec X, Z, A pré-rempli, des formules en B et un onglet de plus. Cas à couvrir :
  - A7 contient le libellé, et A8 à AN sont vides ;
  - un code numérique et un code texte ;
  - un libellé en doublon ;
  - Paris (`75056`) ;
  - un code absent, qui renvoie une erreur ;
  - `fullCalcOnLoad` est posé ;
  - toutes les entrées du zip autres que la feuille `Territoire` et `workbook.xml` sont identiques octet pour octet. Ce test garantit la conservation des graphiques.
- `snbc3-release-storage.service.spec.ts` : `hasUnfinishedImport` selon le manifeste et `pending-release.json`.
- `snbc3/trajectoire-snbc3.controller.e2e-spec.ts` : le stockage est simulé (`getWorkbookInfo`, `downloadWorkbook`, `hasUnfinishedImport`), comme pour la méthodologie : écrire dans le bucket remplacerait le classeur de l'import local. Le mini-classeur vient de `snbc3-workbook.test-fixture.ts`, partagé avec la spec unitaire.
  - `telechargement` sur un EPCI disponible renvoie un classeur adapté ;
  - sur un EPCI absent du millésime, il renvoie 422 ; sur un EPCI du millésime absent du classeur, 500 ;
  - sans métadonnée, il renvoie `WORKBOOK_NOT_FOUND` ;
  - `outil` renvoie le classeur brut ;
  - sans le flag, les deux routes sont refusées ; sans droit de lecture, `telechargement` est refusé (403) sans lire le classeur ;
  - pendant un import complet inachevé, `telechargement` renvoie 503 et `outil` sert le classeur stocké ;
  - après le remplacement du xlsx, le cache sert le nouveau fichier ; un échec de lecture n'est pas gardé en cache.

## Vérification

- `nx test backend 'select-territoire-in-snbc3-workbook'` et `nx test backend 'trajectoire-snbc3'`.
- **Vérification du lot 0**, sur le classeur généré du commit de publication, adapté par la fonction depuis Node, pour un EPCI, un EPT, Paris et un EPCI au libellé en doublon. À l'ouverture dans Excel, contrôler :
  - le territoire sélectionné et `terr_zone` (B3) ;
  - des graphiques présents et recalculés ;
  - la valeur `cae_1.a` en 2030 de `TOUS SECTEURS`, égale à celle de la page Trajectoire.
  - Tester aussi l'ouverture dans LibreOffice, dont le recalcul à l'ouverture dépend d'un réglage.
- En local (flag actif), les deux téléchargements fonctionnent depuis « Aller plus loin », et l'outil Excel depuis une carte d'état vide.
- En prod, les experts métier qui ont le flag vérifient le classeur de chaque nouvelle livraison.
