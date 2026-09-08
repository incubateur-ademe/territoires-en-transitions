# Composition communale des EPCI — source de l'import

Ce dossier ne contient aucun fichier : la source n'est pas versionnée ici, elle
est **téléchargée par le générateur**. Il documente d'où elle vient et ce qu'on
en fait.

Le seed produit est `data_layer/seed/imports/11-epci_commune.sql`.

## Provenance

| | |
|---|---|
| Jeu de données | [base nationale sur les intercommunalités](https://www.data.gouv.fr/datasets/base-nationale-sur-les-intercommunalites/) (BANATIC, DGCL) |
| Ressource | `perimetre-epci-a-fp.csv` |
| Identifiant pérenne | `6e05c448-62cc-4470-aa0f-4f31adea0bc4` |
| Format | CSV, séparateur `;`, encodage **cp1252**, fins de ligne CRLF |
| Millésime chargé | périmètres au 1er janvier 2025 (`ptot_2025` / `pmun_2025`) |
| md5 | `0dc9b8e62554802d78223bdac476a332` |

L'identifiant de ressource est stable : data.gouv redirige vers l'URL horodatée
du millésime courant. Un rejeu ramène donc le fichier de l'année sans qu'on
touche au générateur.

Le même fichier est committé dans le dépôt, à
`apps/backend/src/collectivites/import-collectivite-relations/perimetre-epci-a-fp.csv` :
l'import des relations EPCI ↔ communes s'en sert, et le service de rejeu s'y
replie quand le réseau manque. Les deux chemins passent par les constantes de
`epci-perimetre.source.ts`, pour qu'ils ne puissent pas diverger.

**L'export XLSX du site officiel est plus frais mais inexploitable** : 76 Mo
compressés, **1,46 Go décompressés** pour un seul onglet.

## Mettre à jour la liste

```sh
make seeds_rebuild_from_source
git diff --stat data_layer/seed/imports
```

Le générateur refuse toute anomalie plutôt que de réécrire un SQL douteux :
colonne absente, SIREN ou code INSEE mal formé, département hors du référentiel
TeT, doublon, siège contradictoire, caractère hors ASCII dans les colonnes
retenues, recomptage des communes en désaccord avec le `nb_membres` déclaré,
fichier tronqué. Mieux vaut un seed daté qu'un seed corrompu.

**Cadence : une fois par an.** La source est publiée à ce rythme, et les EPCI à
fiscalité propre n'ont quasiment pas évolué en nombre depuis la fin de
l'application de la loi NOTRe. Un job du scheduler de `apps/tools`
(`import-perimetres-epci`, le 1er janvier à 4 h) rejoue le calcul contre la
base sans passer par le seed.

## Les fichiers

| Fichier | Lignes | Devient | Apparié par |
|---|---|---|---|
| `perimetre-epci-a-fp.csv` (distant) | 34 871 + en-tête + une ligne vide finale | `imports.epci_commune` | `siren` de l'EPCI → `collectivite.siren` |

Quatre colonnes sur quatorze sont retenues : `siren` (l'EPCI), `insee` (la
commune membre), `dep_com` (le département **de la commune**) et `dept` (celui
**du siège** du groupement). Tout le sujet tient dans l'écart entre les deux
dernières.

Les libellés — `raison_sociale`, `nom_membre` — ne sont **jamais** repris, et
c'est délibéré : voir la section suivante.

### Le piège cp1252

BANATIC publie en cp1252 et les lecteurs du dépôt lisent en utf-8 :
`Cœuvres-et-Valsery` y devient `C�uvres-et-Valsery`. Le correctif intuitif ne
marche pas — sur Node, `new TextDecoder('windows-1252')` rend l'octet `0x9C` en
`U+009C`, un caractère de contrôle invisible, et non en « œ » ; `windows-1252`,
`cp1252`, `latin1` et `iso-8859-1` donnent tous le même résultat faux.

Plutôt que d'ajouter une dépendance de décodage pour des libellés dont personne
n'a besoin, le calcul ne lit que des codes, tous ASCII, et refuse la source si
un caractère hors ASCII y apparaît. Le générateur Python, lui, décode
correctement en cp1252 : il n'a pas cette contrainte.

### Pourquoi le calcul est en SQL

Deux appelants ont besoin du même calcul à des moments différents : le seed, sur
une base neuve comme au déploiement du change, et le service de rejeu annuel,
qui retélécharge la source. Écrire la règle en Python **et** en TypeScript, c'est
la laisser diverger.

Elle vit donc dans `imports.update_epci_perimetres_from_banatic()` (change
`collectivite/epci_perimetre_secondaire`). Le générateur Python n'est qu'un
transcodeur CSV → `INSERT`, sans aucune logique métier, et le service backend ne
fait que télécharger, remplacer la table et appeler la fonction.

La fonction est dans `imports` et non dans `public` : `public` est exposé à
PostgREST et `anon` y a `USAGE`, ce qui en ferait une RPC publique.

### Ce que le calcul produit

Sur le millésime 2025, parmi 1 255 EPCI à fiscalité propre :

- **89** débordent sur plusieurs départements → 98 périmètres secondaires ;
- **26** débordent sur plusieurs régions → 26 périmètres secondaires.

Le témoin de la carte est **Redon Agglomération** (SIREN `243500741`) : siège en
Ille-et-Vilaine, communes membres en Loire-Atlantique et dans le Morbihan, donc
à cheval sur la Bretagne et les Pays de la Loire. Le `verify` du change le
vérifie nommément.

**Aucun seuil n'est appliqué** : une seule commune membre suffit à déclarer son
département et sa région. C'est un choix, et il a une portée — 39 des 98
départements secondaires ne reposent que sur une commune, jusqu'à une sur 130
pour la Métropole du Grand Paris. Rien ne filtre par `source` à la lecture, donc
chaque ligne ouvre le dépôt PCAET de l'EPCI à la DDT du département concerné, et
chaque région à sa DREAL, sa DR ADEME et son conseil régional. La lecture
géographique le justifie : le PCAET couvre tout le territoire de l'EPCI.

### Pourquoi pas `collectivite_relations`

Cette table dit déjà quelles communes composent un EPCI, mais elle ne peut pas
servir de base au calcul : `ImportCollectiviteRelationsService` écarte les
communes de moins de 3 000 habitants (`MIN_COMMUNE_POPULATION`) et sa clé
étrangère ne retient que celles présentes dans `collectivite`. Il en reste
**3 668 relations pour 34 871 lignes de source**.

En partir manquerait **67 des 89** EPCI multi-départements et **22 des 26**
multi-régions : CC Adour Madiran n'a qu'une commune sur 72 en base, CC Cœur du
Pays Haut aucune sur 25. C'est le même constat qui a conduit l'import du
périmètre Banatic 2025 à ne pas reprendre ce garde (`doc/plans/2026-06-30-001`,
§1.3).

## Codes géographiques

`departement_code` et `siege_departement_code` ont une clé étrangère vers
`imports.departement`. Les 101 départements du référentiel TeT sont représentés
dans la source, Corse (`2A`, `2B`) et DOM (`971` à `976`) compris, et aucun code
de la source n'en sort.

Pas de clé étrangère vers `imports.commune`, en revanche : 32 codes INSEE de la
source n'y figurent pas — des communes nouvelles postérieures au millésime de
`03-commune.sql`, et Paris, que ce seed stocke en vingt arrondissements. La
table existe justement pour ne pas dépendre d'eux : le département d'une commune
vient de la source, jamais d'une traversée par le code INSEE. C'est aussi ce qui
évite le faux positif de la Métropole du Grand Paris.
