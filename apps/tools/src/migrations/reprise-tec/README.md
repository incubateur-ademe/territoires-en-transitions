# Reprise T&C vers TeT

Scripts de reprise des démarches PCAET de Territoires & Climat (T&C, base
séparée, schéma `4223_pcaet`) dans TeT.

## Principe

T&C et TeT sont deux bases distinctes. La reprise se fait en deux temps :

1. **copier** T&C tel quel dans un schéma de travail de TeT, `reprise_tec` ;
2. **importer** depuis cette copie vers les tables du produit, étape par étape.

Chaque script :

- tourne **en simulation par défaut** : il fait tout son travail, affiche ses
  comptes, puis annule tout ; `--confirm` pour valider ;
- écrit dans **une transaction** : un échec ne laisse rien à moitié fait ;
- affiche ses comptes et s'arrête en erreur s'ils ne tombent pas juste.

## Prérequis

```bash
export TEC_DATABASE_URL="postgresql://user:password@host:port/postgres"   # dump de T&C, lecture seule
export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/postgres"  # TeT
```

La source est un dump de T&C restauré dans un projet Supabase dédié, distinct
de la base TeT. Le rôle utilisé côté TeT doit pouvoir créer le schéma
`reprise_tec`.

## Ordre d'exécution

### 1. Copier T&C dans `reprise_tec`

Copie les tables du périmètre de reprise dans `reprise_tec.staging_<table>`,
sans transformation, sauf `utilisateur.pw` (les mots de passe de T&C), jamais
copiée. Les notifications de T&C (`alerte`) ne sont pas copiées : elles ne
sont pas reprises. Crée aussi `reprise_tec.correspondance` et `reprise_tec.lignes_ecrites`,
qui serviront aux étapes suivantes. N'écrit dans aucune table du produit.

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/extraire-source/index.ts            # simulation
pnpx tsx apps/tools/src/migrations/reprise-tec/extraire-source/index.ts --confirm  # copie
```

Rejouable : chaque table de copie est recréée à neuf. `correspondance` et
`lignes_ecrites` ne sont jamais vidées.

### 2. Importer les dossiers

Écrit une ligne de `demarche` par dossier repris. Lit la copie et le suivi de
l'obligation PCAET tenu par l'ADEME, un export CSV qui n'est pas dans le dépôt.
Chaque dossier écrit laisse une ligne dans `correspondance` et dans
`lignes_ecrites` ; chaque dossier écarté, une ligne dans `ecarts` avec son motif.
Avant toute écriture, le script vérifie que chaque ligne lue finit écrite ou
écartée, une seule fois (lu = écrit + écarté), et s'arrête sinon.

```bash
SCRIPT=apps/tools/src/migrations/reprise-tec/import-demarches/index.ts
pnpx tsx $SCRIPT --suivi <csv> --date-reference <AAAA-MM-JJ>            # simulation
pnpx tsx $SCRIPT --suivi <csv> --date-reference <AAAA-MM-JJ> --confirm  # import
```

`--date-reference` est **la date du jour de l'import**, pas la date de gel de
T&C : elle décide si une fenêtre d'avis est encore ouverte.

La date de transmission d'un dossier est la **réception du projet** ; à
défaut, la plus précoce des deux dates « envoi avis DREAL » et « envoi avis
CR » ; à défaut, aucune. Malgré leur nom, ces deux dates de T&C sont celles
des avis rendus (elles tombent le jour du courrier d'avis déposé), pas celles
de l'envoi du dossier. Un dossier en élaboration n'a jamais de date de
transmission : la clôture de nuit le passerait en instruit.

Le suivi ADEME contrôle cette date : l'avis de l'État qu'il porte ne peut pas
la précéder. S'il la précède de moins d'un an, la transmission est ramenée à la
plus précoce des dates de T&C qui ne suit pas l'avis, à défaut au jour de
l'avis. S'il la précède de plus d'un an, la date de T&C est gardée : le suivi
parle d'une collectivité, et l'avis peut être celui de son PCAET précédent. Le
rapport nomme chaque dossier concerné.

Une date saisie à la main avant l'an 2000 (lancement, envoi pour avis,
réception du projet) est une faute de frappe dans T&C. Une année sur deux
chiffres, de 10 à 99, est lue 20AA (`0023-01-25` devient 2023-01-25) ; les
autres (`0002-12-01`, `0217-03-02`) sont traitées comme absentes. Le rapport
nomme chaque dossier concerné.

Un second `--confirm` échoue sur `correspondance` : les dossiers sont déjà là.

Pour retirer l'import (simulation par défaut) :

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-demarches/annuler.ts [--confirm]
```

Seuls les dossiers écrits par la reprise partent (d'après `lignes_ecrites`). Les
saisines de ces dossiers, même ajoutées après coup, sont retirées d'abord : ce
sont les seules à bloquer la suppression ; le reste part en cascade. L'annulation
refuse de tourner si une tranche suivante a écrit : les annuler d'abord, dans
l'ordre inverse.

#### Ce qui arrête l'import

Avant toute écriture, le script vérifie ces cas, les liste tous, et s'arrête
s'il en trouve un :

| Code | Garde                                                                                          | Quoi faire                                                               |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A27  | collectivité introuvable dans TeT, ou trouvée plusieurs fois                                   | la créer, ou corriger le doublon, avant l'import                         |
| A3   | fenêtre d'avis de trois mois encore ouverte à la date de référence, jour de l'échéance compris | vérifier la date ; si elle est juste, attendre la fin de la consultation |
| D3   | dossier qui arriverait instruit sans date de transmission                                      | corriger la source : il serait enfermé dans TeT                          |
| D4   | collectivité qui a déjà une démarche active dans TeT                                           | décider au cas par cas, on ne touche pas à son dossier                   |
| D7   | dossier qui arriverait publié sans date de publication                                         | corriger la source                                                       |

Le script s'arrête aussi, sans rien écrire, sur un état de dossier T&C ou une
valeur d'obligation du suivi qu'il ne connaît pas : il ne devine pas.

#### Deux dossiers en cours

Une collectivité qui aura deux dossiers en cours, dont un instruit, passe : la
base l'accepte. Qu'il s'agisse de deux dossiers repris, ou d'un dossier repris
et d'une démarche déjà dans TeT. Mais l'application compte deux dossiers en
cours et grise le bouton « Nouvelle démarche ». Le script liste chaque
collectivité (D4, sans blocage).

Quoi faire : si l'ancien PCAET a été adopté, la collectivité le publie avec sa
délibération ; s'il a été abandonné, l'équipe le supprime à la main (un dossier
instruit n'est pas supprimable par la collectivité).

La requête qui recalcule la liste à tout moment :

```sql
select c.nom, c.siren, d.id, d.status, d.titre
  from public.demarche d
  join public.collectivite c on c.id = d.collectivite_id
 where d.type = 'pcaet'
   and d.status in ('en_elaboration', 'transmis_pour_avis',
                    'instruit_hors_plateforme', 'instruit')
   and d.collectivite_id in (
     select collectivite_id from public.demarche
      where type = 'pcaet'
        and status in ('en_elaboration', 'transmis_pour_avis',
                       'instruit_hors_plateforme', 'instruit')
      group by collectivite_id having count(*) > 1)
 order by c.nom, d.id;
```

### 3. Importer le diagnostic

Écrit le diagnostic de chaque dossier repris (émissions, consommation,
polluants, énergies renouvelables, séquestration), **rangé dans son dossier** :
une métadonnée de la source `pcaet-collectivite` par dossier, un lien
`demarche_pcaet_source_metadonnee` qui la rattache à la démarche, et les
valeurs de `indicateur_valeur` sous cette métadonnée. C'est ce que l'écran du
diagnostic d'une démarche affiche. Le diagnostic se lit sur la ligne « mise en
œuvre » du dossier, jamais sur son doublon « définitif ».

```bash
export TET_API_URL="https://..."           # le backend TeT
export TET_API_TOKEN="<service role>"      # jeton service role du backend
SCRIPT=apps/tools/src/migrations/reprise-tec/import-diagnostic/index.ts
pnpx tsx $SCRIPT            # simulation
pnpx tsx $SCRIPT --confirm  # import, puis recalcul
```

Les objectifs 2021 et 2026 ne sont pas écrits : la grille de TeT n'a pas ces
colonnes.

Toute ligne du diagnostic de T&C (onze tables, dossiers repris ou non) finit
soit écrite, soit dans `ecarts` avec un motif, une seule fois : le script le
vérifie table par table avant d'écrire (lues = écrites + écartées). Une ligne
sans numéro dans T&C est repérée par son dossier (`tec_id`) et sa `precision`
(`sol 2`, `periode 3`, `cible 4`). Une partie de ligne peut aussi être
écartée : la consommation EnR (`precision = 'consommation'`), un commentaire
d'onglet du dossier (`precision` = le nom de la colonne).

Quand plusieurs motifs s'appliquent, le premier de cet ordre gagne : le motif
du dossier, `valeur_vide`, `sans_indicateur_cible`, puis la colonne.

| Motif                                  | Sens                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `doublon`                              | ligne du doublon « définitif » d'un dossier déposé ; seule la ligne « mise en œuvre » est reprise                                                      |
| `coquille_vide`, `sans_etat_invisible` | ligne d'un dossier que l'import des dossiers a écarté pour ce motif                                                                                    |
| `valeur_vide`                          | case vide dans T&C : rien à reprendre                                                                                                                  |
| `sans_indicateur_cible`                | aucune ligne pour la recevoir dans la grille de TeT : filière sans ligne, potentiels EnR, séquestration hors estimation, consommation EnR, numéro vide |
| `objectif_sans_colonne`                | objectif 2021 ou 2026 : la grille de TeT n'a pas ces colonnes                                                                                          |
| `constat_sans_annee`                   | constat sans année, ou à une année impossible (0, 1900, 2900…)                                                                                         |
| `valeur_sans_periode`                  | valeur sans période dans T&C : ni constat ni objectif connu, ni année                                                                                  |
| `commentaire_sans_place`               | texte libre (commentaire d'onglet, commentaires sur les réseaux) : TeT ne commente qu'une valeur                                                       |
| `total_recalcule`                      | total de polluant déclaré, écrit puis remplacé par le calcul de TeT ; seule ligne à la fois écrite et écartée                                          |
| `total_melange`                        | dossier dont les totaux sont calculés sur un mélange avec un autre dossier de la même collectivité, à la même date (sur le dossier, table `demarche`)  |

Relire les objectifs 2021 et 2026 écartés, par exemple pour les émissions :

```sql
select e.tec_id, g.demarche_id, g.secteur_obligatoire_id, g.periode_id, g.emission_ges
  from reprise_tec.ecarts e
  join reprise_tec.staging_demarche_emission_ges g on g.id = e.tec_id
 where e.table_source = 'demarche_emission_ges'
   and e.motif = 'objectif_sans_colonne'
 order by g.demarche_id, g.secteur_obligatoire_id, g.periode_id;
```

#### Le recalcul des totaux

L'écriture directe en base ne déclenche pas le calcul des totaux (GES,
consommation, EnR, séquestration, polluants) que TeT fait à chaque saisie.
Avec `--confirm`, après le commit, le script appelle donc le recalcul du
backend (`indicateurs.valeurs.recompute`, service role), une collectivité à la
fois, puis inscrit :

- `total_recalcule` : chaque total de polluant déclaré que TeT a remplacé (sa
  formule du PM10 omet le transport routier ; il arrondit à 2 décimales) ;
- `total_melange` : chaque dossier dont une collectivité a un autre dossier
  repris à la même date. Le recalcul regroupe par collectivité, date et source,
  pas par dossier : leurs totaux mélangent les dossiers, et changent d'un
  recalcul à l'autre.

En simulation, le recalcul ne tourne pas : le script **prévoit** ces écarts en
refaisant l'addition de TeT (formules et arrondis lus en base).

Le recalcul refait aussi les totaux des autres sources des collectivités
touchées : ceux-là ne s'annulent pas, le rapport les compte à part.

S'il s'arrête en route, l'import est déjà validé ; le relancer seul :

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-diagnostic/recalculer.ts
```

#### Annuler le diagnostic

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-diagnostic/annuler.ts [--confirm]
```

Retire, étiquette par étiquette, les valeurs écrites et les totaux que le
recalcul a rangés dans les dossiers, puis les étiquettes et leurs liens, puis
les traces et les écarts de la tranche. Aucune tranche ne dépend de celle-ci :
pas de garde. **Non annulable** : les totaux que le recalcul a refaits sur les
autres sources des collectivités touchées.

#### Ce qui arrête l'import du diagnostic

Avant toute écriture, le script vérifie ces cas, les liste tous, et s'arrête
s'il en trouve un :

| Garde                                                                     | Quoi faire                                                                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| aucun dossier repris                                                      | lancer d'abord l'import des dossiers (étape 2)                                                          |
| un dossier a déjà un diagnostic rangé                                     | l'import a déjà tourné (l'annuler d'abord), ou la collectivité a saisi le sien : décider au cas par cas |
| un numéro de secteur, de polluant, de filière ou de sol inconnu du script | l'ajouter à sa table dans `emplacement.ts`, avec sa ligne de la grille ou `null`                        |
| le compteur des métadonnées est en retard sur la table                    | le recaler, après avoir compris pourquoi il l'est (commande ci-dessous)                                 |

```sql
select setval('public.indicateur_source_metadonnee_id_seq',
              (select max(id) from public.indicateur_source_metadonnee));
```

### 4. Saisir les services

Chaque dossier repris transmis pour avis reçoit une saisine de chaque service
qui couvre sa collectivité (DREAL, région, DDT, DR ADEME, services nationaux),
comme l'aurait fait sa transmission dans TeT : même règle de couverture
(`listInstructeursCouvrants` du backend), `source = 'transmission'`, périmètre
principal ou secondaire. Chaque saisine est datée du jour de la transmission
pour avis du dossier. Un dossier en élaboration n'est jamais saisi. Aucun avis
n'est écrit : ils viendront avec leur fichier.

```bash
SCRIPT=apps/tools/src/migrations/reprise-tec/import-saisines/index.ts
pnpx tsx $SCRIPT            # simulation
pnpx tsx $SCRIPT --confirm  # import
```

Après l'import, `rattraper-saisines-pcaet` ne trouve rien à faire sur les
dossiers repris. Ne pas le lancer entre l'import des dossiers et celui-ci : il
saisirait les services avec la date du jour.

#### Ce qui arrête l'import des saisines

Avant toute écriture, le script vérifie ces cas, les liste tous, et s'arrête
s'il en trouve un :

| Garde                                                                                 | Quoi faire                                                                                                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| aucun dossier repris                                                                  | lancer d'abord l'import des dossiers (étape 2)                                                                   |
| un dossier repris a déjà une saisine                                                  | l'import a déjà tourné (l'annuler d'abord), ou le rattrapage des saisines est passé avant : retirer ses saisines |
| un dossier transmis dont l'échéance d'avis n'est pas passée, jour compris, ou absente | vérifier la date de transmission ; si elle est juste, attendre la fin de la consultation                         |
| un dossier transmis sans DREAL ou sans région qui couvre son siège                    | créer le service, ou corriger son périmètre, avant l'import                                                      |

## Le schéma de travail `reprise_tec`

| Table             | Rôle                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `staging_<table>` | la copie de T&C, lue par les étapes d'import                                                                                    |
| `correspondance`  | traduire un identifiant T&C en identifiant TeT ; pour un dossier publié, d'où vient sa date d'adoption (`adoption_decidee_par`) |
| `lignes_ecrites`  | savoir exactement quelles lignes du produit la reprise a écrites, pour pouvoir les retirer                                      |
| `ecarts`          | savoir pourquoi une ligne de T&C n'a pas été reprise (`doublon`, `coquille_vide`…)                                              |

Pour tout retirer d'un coup :

```sql
drop schema reprise_tec cascade;
```
