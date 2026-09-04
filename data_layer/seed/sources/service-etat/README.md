# Services de l'État — source de l'import

Les services instructeurs du dépôt PCAET : DREAL, DDT, DR ADEME, services
nationaux, plus le SIREN des conseils régionaux. Ces CSV sont **la source**, lue
par `data_layer/scripts/generate_service_etat.py`.

## Provenance

Classeur `ListeServices.xlsx` remis par l'ADEME le 2026-09-02 (pièce jointe de la
carte Notion TETH-13), converti en CSV le 2026-09-04. Le classeur d'origine reste
dans Notion : il n'a pas sa place ici, `seed.sh` ne charge que des `*.sql` et un
xlsx ne se relit pas dans un diff.

## Mettre à jour la liste

Corriger le CSV concerné, puis :

```bash
make seeds_rebuild_from_source   # regénère le SQL, ne touche pas la base
git diff data_layer/seed/imports/09-service_etat.sql
```

Le générateur refuse toute anomalie plutôt que de réécrire un SQL douteux : code
géographique inconnu, SIREN mal formé, doublon sur une clé, SIREN inactif au
répertoire SIRENE. Mieux vaut un seed daté qu'un seed corrompu.

Le SQL généré est **idempotent** et sert deux fois : `seed.sh` le charge sur une base
neuve, et le change sqitch `collectivite/service_etat_import` porte le même corps
pour les bases déjà peuplées (staging, production).

## Les fichiers

| Fichier | Lignes | Devient | Apparié par |
|---|---|---|---|
| `ddt.csv` | 92 | `collectivite` type `ddt` | `departement_code` |
| `dreal.csv` | 18 | type `dreal` | `region_code` |
| `dr-ademe.csv` | 18 | type `dr_ademe` | `region_code` |
| `service-national.csv` | 2 | type `service_national` | `nom` |
| `conseil-regional.csv` | 18 | **update** des `type='region'` existants | `region_code` |
| `dreal-contacts.csv` | 22 | — | réservé à la slice 4 (TETH-11) |

`dreal-contacts.csv` n'est lu par personne aujourd'hui : les correspondants DREAL
relèvent de l'import des membres et de son mail d'invitation, pas de cette slice.

### La colonne `nom_anterieur` de `service-national.csv`

`service_national` est la seule famille appariée sur le nom : elle n'a pas de code
géographique — c'est précisément ce qui fait son périmètre national — et donc aucun
index unique sur quoi s'appuyer.

Conséquence : une ligne posée avant cet import sous une forme courte n'est pas
reconnue sous sa dénomination officielle, et l'import en créerait une seconde. La
colonne `nom_anterieur` déclare ce nom-là pour que la ligne soit **adoptée** — nom
aligné, SIREN et NIC renseignés — au lieu d'être doublée. Elle ne vise que les
lignes encore sans SIREN : un service déjà identifié au répertoire SIRENE n'est
jamais renommé.

Un seul cas aujourd'hui : le « DGEC » du seed de développement. La colonne reste
vide pour l'ADEME.

## NIC

Le NIC (numéro interne de classement, 5 chiffres) complète le SIREN pour former le
SIRET, et c'est lui qui distingue deux services partageant un SIREN — sans quoi le
rattachement automatique par ProConnect ne peut pas trancher.

- `dr-ademe.csv` et `service-national.csv` portent un **SIRET** : le NIC en est
  extrait directement. Les 18 DR ADEME partagent le SIREN 385290309 de l'ADEME, seul
  le NIC les sépare — le NIC ne doit donc **jamais** être cherché ailleurs pour elles
  (le siège du SIREN 385290309 est Angers, il vaudrait pour les 18).
- `ddt.csv`, `dreal.csv` et `conseil-regional.csv` ne portent qu'un **SIREN** : le
  générateur récupère le NIC du siège auprès de `recherche-entreprises.api.gouv.fr`.

Quand un service compte plusieurs implantations, le classeur les liste en
« Implantation 1..3 » ; c'est la première, le siège de la direction, qui est retenue.

## Lignes du classeur écartées (11)

Le générateur les rejetterait de toute façon ; elles sont sorties dès la conversion
pour que les CSV ne contiennent que des services.

| Onglet | Ligne | Motif |
|---|---|---|
| DDT | 75, 92, 93, 94 | « Regroupement au sein de la DRIEAT Île-de-France » — pas un service, une note |
| DDT | 971, 972, 973, 974, 976 | « Regroupement avec la DREAL au sein de la DEAL » — idem |
| DDT | 975 (DTAM Saint-Pierre-et-Miquelon) | Le département `975` n'existe pas dans `imports.departement` : aucune collectivité TeT n'est dans son périmètre, la DTAM n'aurait rien à instruire. Sa case « Code Région » est d'ailleurs vide. |
| DR ADEME | « ADEME », sans code région | Doublon exact de la ligne ADEME de l'onglet « Service national ». Une DR ADEME exige un code région. |

## Corrections orthographiques appliquées à la conversion

Le classeur portait des fautes évidentes, corrigées ici plutôt que dans le
générateur — une correction se relit dans un diff, pas dans une table de
substitution.

- 15 × `de L'Environnement` → `de l'Environnement` (majuscule parasite)
- 18 × `l'Amenagement` → `l'Aménagement`
- 15 × `(Dreal)` → `(DREAL)`, 3 × `(Deal)` → `(DEAL)`
- Mayotte : apostrophes typographiques `’` → `'`, comme les 17 autres lignes
- espaces de bord et espaces doubles, dans les libellés comme dans les adresses

Les libellés sont sinon **repris bruts**, sans forme courte dérivée : c'est la
dénomination officielle du service qui fait foi.

## Codes région

Le classeur stocke les codes de région d'outre-mer en numérique (`1`, `2`, `3`, `4`,
`6`) ; TeT les écrit sur deux caractères (`01`, `02`, `03`, `04`, `06`, cf.
`imports.region` et `collectivite.region_code` en `varchar(2)`). Les CSV portent la
forme TeT.
