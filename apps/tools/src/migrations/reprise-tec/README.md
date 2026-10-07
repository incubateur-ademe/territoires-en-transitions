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

Un dossier en élaboration dans T&C est revu avec le suivi ADEME et les autres
dossiers de sa collectivité : créé avant l'adoption d'un PCAET publié de la
même collectivité, c'en est le doublon, écarté (`elaboration_doublon`) ; seul
dans sa collectivité et lancé avant l'approbation du suivi, il a été adopté
hors de T&C : il arrive publié, adopté et publié à la date d'approbation. Le
rapport nomme chacun.

La population couverte et le commentaire de statut d'un dossier écrit n'ont
pas de place dans TeT : chacun laisse un écart `sans_place`, `precision` = le
nom de la colonne.

Un dossier saisi pour essai dans T&C (liste `DOSSIERS_DE_TEST` de
`perimetre.ts`) est écarté, motif `dossier_de_test`.

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

| Code | Garde                                                                                          | Quoi faire                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A27  | collectivité introuvable dans TeT, ou trouvée plusieurs fois                                   | la créer, ou corriger le doublon, avant l'import ; si elle existe sous un autre SIREN, l'ajouter à `SIRENS_RATTACHES` (`collectivites.ts`) |
| A3   | fenêtre d'avis de trois mois encore ouverte à la date de référence, jour de l'échéance compris | vérifier la date ; si elle est juste, attendre la fin de la consultation                                                                   |
| D3   | dossier qui arriverait instruit sans date de transmission                                      | corriger la source : il serait enfermé dans TeT                                                                                            |
| D4   | collectivité qui a déjà une démarche active dans TeT                                           | décider au cas par cas, on ne touche pas à son dossier                                                                                     |
| D7   | dossier qui arriverait publié sans date de publication                                         | corriger la source                                                                                                                         |

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

S'il s'arrête en route, l'import est déjà validé ; le relancer seul, à partir
du rang que donne le message d'arrêt :

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-diagnostic/recalculer.ts [--a-partir-de <rang>]
```

Le backend garde de la mémoire d'une collectivité à l'autre : sur un gros
volume, il peut tomber en route. Recalculer alors par paquets, en redémarrant
le backend entre deux.

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

Une saisine est la demande d'avis adressée à un service sur un dossier : sans
elle, le service ne peut pas ouvrir le dossier. Chaque dossier repris transmis
pour avis reçoit une saisine de chaque service
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

Le rapport compte les saisines par type de service et par périmètre, puis
nomme les dossiers qui n'ont aucune saisine principale d'un type. Pour la DDT,
c'est attendu : l'outre-mer, Paris et la petite couronne n'en ont pas.

#### Annuler les saisines

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-saisines/annuler.ts [--confirm]
```

Retire les saisines que l'import a écrites (d'après `lignes_ecrites`), et
seulement elles : les dossiers ne sont pas touchés, une saisine posée hors
reprise (transmission, rattrapage) reste. Un avis déposé par un service sur une
de ces saisines depuis l'import part avec elle : le script les compte.
Refuse de tourner si la reprise a écrit des avis : annuler d'abord leur import.

#### Ce qui arrête l'import des saisines

Avant toute écriture, le script vérifie ces cas, les liste tous, et s'arrête
s'il en trouve un :

| Garde                                                                                 | Quoi faire                                                                                                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| aucun dossier repris                                                                  | lancer d'abord l'import des dossiers (étape 2)                                                                   |
| un dossier repris a déjà une saisine                                                  | l'import a déjà tourné (l'annuler d'abord), ou le rattrapage des saisines est passé avant : retirer ses saisines |
| un dossier transmis dont l'échéance d'avis n'est pas passée, jour compris, ou absente | vérifier la date de transmission ; si elle est juste, attendre la fin de la consultation                         |
| un dossier transmis sans DREAL ou sans région qui couvre son siège                    | créer le service, ou corriger son périmètre, avant l'import                                                      |

### 5. Importer les fiches

Chaque action d'un dossier repris devient une fiche, rangée dans un plan
« PCAET <année de lancement> (repris de Territoires & Climat) » rattaché au
dossier : un plan par dossier qui porte des actions, aucun plan vide. Les
actions se lisent sur la ligne « mise en œuvre » du dossier, jamais sur son
doublon « définitif ». Le plan est un plan ordinaire : il compte pour l'étape
« Programme d'actions » du dossier.

```bash
SCRIPT=apps/tools/src/migrations/reprise-tec/import-fiches/index.ts
pnpx tsx $SCRIPT            # simulation
pnpx tsx $SCRIPT --confirm  # import
```

| Dans T&C                             | Dans TeT                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| intitulé, description                | titre, description (vide : rien)                                                                                   |
| date de lancement, date de création  | date de début ; créée et modifiée le                                                                               |
| (aucun statut)                       | « À venir » sur toutes les fiches                                                                                  |
| commentaires de conclusion et statut | notes de suivi, au nom du compte système « Territoires en Transition », datées de la création                      |
| (aucun auteur)                       | plan, thématiques et sous-thématiques liés au nom du compte système : la base exige un auteur                      |
| volets du PCAET                      | effets attendus                                                                                                    |
| cibles                               | cibles (7 vers 13)                                                                                                 |
| secteurs réglementaires (8)          | le champ secteurs de la fiche (`fiche_action_secteur_attribution`), origine « manuelle », au nom du compte système |
| autres secteurs                      | thématique, et sous-thématique quand une dit la même chose (table dans `listes-tec.ts`)                            |
| types de porteur, porteurs libres    | structures pilotes de la collectivité, réutilisées si elles existent                                               |
| types d'action, secteurs libres      | tags personnalisés de la collectivité, réutilisés s'ils existent                                                   |
| collectivité de l'action             | celle du dossier (toujours la même)                                                                                |

Non lus ici : contacts (pilotes), fichiers, images et « site web », repris par
les étapes suivantes. La classification IA des fiches n'est pas écrite : le
passage quotidien du produit la fera.

Toute ligne des tables d'action (dossiers repris ou non) finit soit écrite,
soit dans `ecarts`, une seule fois : le script le vérifie table par table
avant d'écrire. Une ligne sans numéro dans T&C est repérée par son action
(`tec_id`) et sa `precision` (`volet 2`, `cible 4`, `type_porteur 1`).

| Motif                   | Sens                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `doublon`               | action (ou sa ligne satellite) du doublon « définitif » d'un dossier ; seule la « mise en œuvre » est reprise          |
| `sans_etat_invisible`   | action d'un dossier que l'import des dossiers a écarté pour ce motif                                                   |
| `vitrine`               | action sans dossier : exemple de la vitrine de T&C, non reprise                                                        |
| `orphelin`              | volet d'une action qui n'existe pas (la table n'a pas de clé étrangère dans T&C)                                       |
| `historique_non_repris` | ligne du journal des modifications d'une action reprise : TeT tient son propre historique                              |
| `sans_place`            | partie d'une action reprise sans place dans une fiche : `precision` = `population_couverte` ou `fiche_action_associee` |

Le rapport compte aussi les classements sans sous-thématique (filtre perdu, ou
thématique du même sens), nomme les dossiers dont le doublon « définitif »
portait plus d'actions, et les collectivités qui reçoivent deux plans du même
nom (deux dossiers lancés la même année).

#### Annuler les fiches

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-fiches/annuler.ts [--confirm]
```

Retire, d'après `lignes_ecrites`, les fiches que l'import a écrites avec leurs
liens et leurs notes, puis les lignes d'historique que TeT a écrites pour
elles, puis les plans et leur lien au dossier, puis les tags que l'import a
créés et que plus aucune fiche ne porte, et enfin les traces et les écarts de
l'étape. Refuse de tourner si les étapes des pièces ou des contacts ont écrit
sur les fiches : les annuler d'abord.

**Ce qu'elle laisse** : les tags qui existaient avant l'import (réutilisés),
et ceux que l'import a créés mais qu'une autre fiche porte depuis. **Ce
qu'elle emporte** : tout ce que la collectivité a changé sur les fiches
reprises depuis l'import (le rapport compte les fiches modifiées). Un axe
ajouté par la collectivité dans un plan repris bloque l'annulation.

#### Ce qui arrête l'import des fiches

Avant toute écriture, le script vérifie ces cas, les liste tous, et s'arrête
s'il en trouve un :

| Garde                                                                                         | Quoi faire                                                                                               |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| aucun dossier repris qui porte des actions                                                    | lancer d'abord l'import des dossiers (étape 2)                                                           |
| un dossier a déjà un plan                                                                     | l'import a déjà tourné (l'annuler d'abord), ou la collectivité en a rattaché un : décider au cas par cas |
| le compte système `00000000-0000-0000-0000-000000000001` est absent ou sans nom               | le créer : notes et liens exigent un auteur                                                              |
| un libellé de TeT introuvable ou en double (type de plan, effet, thématique, sous-thématique) | corriger le libellé dans `listes-tec.ts` ou `listes-tet.ts`, ou la liste de TeT                          |
| un numéro de T&C inconnu (volet, cible, secteur, type de porteur, type d'action)              | l'ajouter à sa liste dans `listes-tec.ts`                                                                |
| un titre de plus de 300 caractères, une description de plus de 20 000                         | décider quoi faire du texte : le script ne tronque pas                                                   |

### 6. Importer les pièces des fiches

Les fichiers et le « site web » de chaque action reprise deviennent
des annexes de sa fiche. Les fichiers de T&C ne sont pas encore récupérés : un
fichier est écrit sans son contenu, il s'affiche sur la fiche avec son nom et
son téléchargement échoue. Les pièces des dossiers et les avis ne sont pas lus
ici.

```bash
SCRIPT=apps/tools/src/migrations/reprise-tec/import-pieces-fiches/index.ts
pnpx tsx $SCRIPT            # simulation
pnpx tsx $SCRIPT --confirm  # import
```

| Dans T&C                                 | Dans TeT                                                                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fichier d'une action (document ou image) | une ligne de la bibliothèque de la collectivité (nom affiché, et nom de stockage T&C comme référence), réutilisée si elle existe ; une annexe de la fiche qui y pointe |
| « site web » d'une action                | une annexe de la fiche avec un lien : l'adresse complète (`https://` ajouté s'il manque), titrée du nom du site sans `www.`                                            |
| date de création de l'action             | « Modifié le » de l'annexe                                                                                                                                             |
| (aucun déposant)                         | le compte « Territoires & Climat » (`00000000-0000-0000-0000-000000000002`), connexion bloquée : « Modifié le … par Territoires & Climat »                             |

Le produit met « Modifié le » d'une fiche au jour même à chaque annexe : le
script le lit avant d'écrire et le remet après, avec son auteur.

Tout fichier et « site web » de la copie (actions reprises ou non) finit
soit écrit, soit dans `ecarts`, une seule fois : le script le vérifie table par
table avant d'écrire. Un « site web » est repéré par son action (`tec_id`) et
la `precision` `url_site_web`.

| Motif                 | Sens                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `vitrine`             | fichier ou « site web » d'une action sans dossier (vitrine de T&C), non reprise                                     |
| `doublon`             | fichier ou « site web » d'une action du doublon « définitif » d'un dossier ; seule la « mise en œuvre » est reprise |
| `sans_etat_invisible` | fichier ou « site web » d'une action d'un dossier que l'import des dossiers a écarté pour ce motif                  |
| `orphelin`            | fichier d'une action qui n'existe pas                                                                               |
| `lien_invalide`       | « site web » d'une action reprise que le produit refuse (adresse qui n'est pas en http(s))                          |

Une ligne d'une action écartée prend le motif que l'import des fiches a donné à
son action. Le rapport compte les « site web » par collectivité, et nomme les
fichiers posés sur une ligne de bibliothèque qui existait déjà (la fiche affiche
alors le nom de cette ligne) et les « site web » refusés, avec leur adresse.

#### Annuler les pièces des fiches

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-pieces-fiches/annuler.ts [--confirm]
```

Retire, d'après `lignes_ecrites`, les annexes que l'import a écrites, en
remettant « Modifié le » de leurs fiches tel qu'il était, puis les lignes de
bibliothèque que l'import a créées et auxquelles plus aucun document ne pointe,
et enfin les traces et les écarts de l'étape. À lancer avant d'annuler l'import
des fiches, qui refuse sinon.

**Ce qu'elle laisse** : les lignes de bibliothèque qui existaient avant
l'import, et celles qu'il a créées mais qu'un autre document utilise depuis
(preuve, pièce de dossier, autre annexe) ; les lignes que le produit écrit dans
l'historique des fiches à chaque annexe ajoutée ou retirée (l'annulation des
fiches les retire). **Ce qu'elle emporte** : ce que la collectivité a changé
sur les annexes reprises depuis l'import (le rapport les compte).

#### Ce qui arrête l'import des pièces

| Garde                                                               | Quoi faire                                                                   |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| aucune fiche reprise                                                | lancer d'abord l'import des fiches (étape 5)                                 |
| une fiche qui doit recevoir un fichier ou un « site web » a disparu | décider au cas par cas : la fiche a été supprimée depuis l'import des fiches |
| des annexes de la reprise existent déjà                             | l'import des pièces a déjà tourné : l'annuler d'abord                        |
| le compte « Territoires & Climat » est absent ou sans nom           | le créer : une annexe exige un auteur                                        |
| un nom de stockage T&C refusé comme référence par le produit        | décider quoi faire du fichier : le script ne renomme pas                     |

### 6 bis. Importer les pièces des dossiers

Les fichiers déposés sur chaque dossier repris (sur sa ligne et sur son doublon
« définitif ») sont lus dans l'archive de T&C, déposés dans le stockage, et
rangés dans le catalogue du dossier. Les avis rendus sont écrits, validés, avec
leur PDF chez l'émetteur. Seules les références de la copie sont lues :
l'archive ne sert qu'aux octets.

```bash
export SUPABASE_URL="http://..."              # l'API de stockage de TeT
export SUPABASE_SERVICE_ROLE_KEY="..."        # pour déposer dans les buckets
SCRIPT=apps/tools/src/migrations/reprise-tec/import-pieces-dossiers/index.ts
pnpx tsx $SCRIPT --archive <dossier Uploads> --suivi <csv>            # simulation, rien n'est déposé
pnpx tsx $SCRIPT --archive <dossier Uploads> --suivi <csv> --confirm  # dépôt puis import
```

`--archive` est le dossier `Uploads/` de T&C (`Uploads/Demarches/…` y est
`Demarches/…`) ; `--suivi`, le suivi ADEME de l'import des dossiers. Avec
`--confirm`, les fichiers sont déposés **avant** la transaction, dans le bucket
de leur collectivité, sous le nom de leur empreinte et en remplaçant l'objet
existant, comme le produit : relancer après un échec redépose à l'identique.

| Dans T&C                                          | Dans TeT                                                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| un fichier de dossier                             | une ligne de la bibliothèque de la collectivité, référencée par l'empreinte sha256 de ses octets ; un objet de stockage                       |
| le même contenu plusieurs fois                    | une seule pièce par dossier, temps et contenu (les copies du doublon « définitif » s'y fondent) ; une seule ligne de bibliothèque par contenu |
| rubrique « dépôt pour avis »                      | l'amont du dossier, daté de la transmission                                                                                                   |
| rubrique « dépôt définitif »                      | l'aval du dossier, daté de la publication                                                                                                     |
| autre rubrique                                    | documents additionnels de l'amont, datés du jour de l'import                                                                                  |
| fichier absent de l'archive                       | la pièce, avec le nom de stockage T&C comme référence et sans objet de stockage : elle s'affiche, son téléchargement échoue                   |
| « Avis DREAL », « Avis CR » d'un dossier transmis | un avis validé au titre du préfet de région ou du président de région, sur la saisine principale de la DREAL ou de la région                  |
| (aucun déposant)                                  | aucun : `modified_by` et `depose_par` vides                                                                                                   |

**Le rangement.** Une case du catalogue ne reçoit qu'un PDF, du temps de la
pièce, si la pièce concerne la collectivité (catalogue lu par le produit), et
un seul fichier : le premier déposé. Le premier mot-clé trouvé dans le nom
décide de la case (diagnostic, stratégie, programme d'actions, EES…). Une
délibération va dans la case que dit son nom (engagement, arrêt, adoption),
sinon dans celle de sa rubrique (arrêt pour le dépôt pour avis, adoption pour le
dépôt définitif). Un nom générique (« PCAET »), seul fichier de son dépôt, va
dans le PCAET global, et coche les pièces qu'il comprend d'office, comme dans
l'app. Tout le reste va dans les documents additionnels.

**Les avis.** Le PDF retenu (format lu sur les octets) est le seul PDF de
l'avis, ou, parmi plusieurs, celui dont le nom dit avis, courrier ou signé (ni
annexe, ni MRAe, ni réponse), de préférence celui qui nomme l'émetteur du titre,
puis signé ou courrier, puis le plus ancien. Il va dans la bibliothèque et le
bucket de l'émetteur, marqué confidentiel ; aucune copie chez la collectivité.
Sa date : le suivi ADEME s'il tombe dans l'année qui suit la transmission (avis
du préfet), puis une date écrite dans le nom du fichier, puis la date « envoi »
de T&C, la première qui ne précède pas la transmission ; sinon, à moins d'un an
avant, le jour de la transmission. Les autres fichiers de l'avis, et ceux d'un
avis qui n'est pas écrit, vont aux documents de l'amont du dossier, rangés comme
les autres pièces, après elles.

Chaque fichier de dossier de la copie finit soit écrit, soit dans `ecarts`, une
seule fois : le script le vérifie avant d'écrire. Une copie fondue dans une
pièce ou un avis est écrite. Un avis qui n'est pas écrit laisse sur chacun de
ses fichiers (écrits au dossier) un écart de `precision` `avis`.

| Motif                    | Sens                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| motif du dossier         | fichier d'un dossier que l'import des dossiers a écarté (`elaboration_remplacee`, `sans_etat_invisible`) |
| `avis_sans_transmission` | (avis) dossier jamais transmis : pas de saisine, pas d'avis                                              |
| `avis_sans_fichier`      | (avis) aucun de ses fichiers n'est dans l'archive                                                        |
| `avis_sans_pdf`          | (avis) aucun de ses fichiers n'est un PDF (zip, 7z, image)                                               |
| `avis_sans_courrier`     | (avis) plusieurs PDF, aucun dont le nom dit avis, courrier ou signé : des pièces du PCAET                |
| `avis_anterieur`         | (avis) toutes ses dates précèdent la transmission de plus d'un an                                        |

Le rapport donne le bilan, les écarts par motif, le rangement par case, les
délibérations et les documents additionnels nommés, les pièces sans fichier,
les avis par titre et par origine de leur date, et nomme les avis à plusieurs
PDF (avec le fichier retenu), à un seul PDF dont le nom ne dit pas un avis, et
datés du jour de la transmission ; enfin le volume déposé.

**Les fichiers des fiches.** Les fichiers écrits par l'import des pièces des
fiches (étape 6), avec le nom de stockage T&C pour référence, reçoivent
l'empreinte de leurs octets et sont déposés dans le bucket de leur collectivité.
Si la collectivité a déjà une ligne de bibliothèque de ce contenu (une pièce de
dossier), l'annexe y pointe et la ligne de l'étape 6 est retirée. « Modifié le »
des fiches est gardé. `correspondance` retient, pour chaque fichier T&C
(`action_fichier`, `action_image`), sa ligne de bibliothèque.

#### Annuler les pièces des dossiers

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-pieces-dossiers/annuler.ts [--confirm]
```

Retire, d'après `lignes_ecrites`, les avis, les pièces en case (inclusions
comprises) et les documents additionnels que l'import a écrits ; remet aux
fichiers des fiches leur nom de stockage T&C (celui qui avait rejoint une pièce
de dossier retrouve sa propre ligne, sous un nouveau numéro) ; retire les lignes
de bibliothèque créées auxquelles plus rien ne pointe, les traces et les écarts.
Après la transaction, retire du stockage les fichiers **que la reprise a
déposés** (les empreintes des lignes de bibliothèque qu'elle a créées) et
qu'aucune ligne de bibliothèque ne référence plus ; un fichier que la
collectivité a déposé elle-même n'est jamais retiré, même sans ligne de
bibliothèque. Les fichiers d'un dépôt dont la transaction a échoué restent dans
le stockage, sans ligne. En
simulation, rien n'est retiré du stockage : le script compte. L'annulation des
pièces des fiches et celle des saisines refusent tant que cette étape a écrit.

**Ce qu'elle laisse** : les lignes de bibliothèque qui existaient avant
l'import, ou qu'il a créées mais qu'un autre document utilise depuis ; la marque
confidentielle posée sur une ligne d'émetteur déjà là. **Ce qu'elle emporte** :
ce que les services ont changé sur les avis repris (le script compte les avis
modifiés).

#### Ce qui arrête l'import des pièces des dossiers

Avant tout dépôt et toute écriture :

| Garde                                                                                                      | Quoi faire                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| aucun dossier repris, aucune saisine ou aucune annexe reprise                                              | lancer d'abord l'import des dossiers (étape 2), des saisines (étape 4) et des pièces des fiches (étape 6) |
| des pièces, avis ou lignes de bibliothèque de cette étape existent déjà                                    | l'import a déjà tourné : l'annuler d'abord                                                                |
| l'archive n'a pas de dossier `Demarches/`                                                                  | vérifier `--archive` : c'est le dossier `Uploads/` de T&C                                                 |
| une collectivité ou un émetteur qui doit recevoir un fichier n'a pas de bucket                             | le créer (`private.create_bucket`)                                                                        |
| un avis à écrire sans saisine principale de la DREAL ou de la région (seulement une secondaire, ou aucune) | corriger les saisines avant l'import                                                                      |
| une saisine principale qui a déjà un avis                                                                  | un service a déposé depuis l'import des saisines : décider au cas par cas                                 |

### 7. Importer les pilotes

Les pilotes des dossiers et des fiches de T&C deviennent des `personne_tag` :
un nom sans compte dans la collectivité TeT du dossier, le « tag » que le
produit propose pour une personne qui ne se connecte pas. Aucun compte n'est
créé : le script n'écrit ni dans `auth.users` ni dans `dcp`.

```bash
SCRIPT=apps/tools/src/migrations/reprise-tec/import-pilotes/index.ts
pnpx tsx $SCRIPT            # simulation
pnpx tsx $SCRIPT --confirm  # import
```

| Dans T&C                                                                            | Dans TeT                                                                                                                                            |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| chef de projet, participant ou coporteur, élu référent rattaché d'un dossier repris | un pilote de la démarche (`demarche_pilote`), sans auteur ; lu sur la ligne reprise du dossier et sur son doublon « définitif »                     |
| contact d'une action reprise                                                        | un pilote de sa fiche (`fiche_action_pilote`) ; « Modifié le » de la fiche ne bouge pas                                                             |
| prénom et nom de l'utilisateur                                                      | le nom du `personne_tag`, « Prénom Nom » tel que saisi, espaces en trop réduits ; réutilisé si ce nom existe déjà dans la collectivité, sans auteur |

Une personne est un nom exact dans une collectivité (la règle du produit) :
deux utilisateurs T&C de même nom y font un seul `personne_tag`, une casse ou
un accent différent en fait deux. Un utilisateur rattaché dans T&C à une autre
collectivité que le dossier est créé dans celle du dossier. Toujours un nom
sans compte, jamais un compte TeT existant, même à courriel identique : un
pilote à compte retirerait aux autres éditeurs de la collectivité le droit de
faire avancer le dossier.

Le rôle (chef de projet, participant, élu) n'a pas de place dans TeT : il
n'est pas écrit. Une personne qui cumule des rôles fait un seul pilote ; les
chefs de projet sont écrits en premier, l'écran montre les pilotes dans
l'ordre où ils sont écrits.

Tout utilisateur, lien de dossier, contact d'action, ligne d'historique de
dossier et organisation régionale de la copie finit soit écrit, soit dans
`ecarts`, une seule fois, et le texte de l'élu référent des dossiers repris
aussi : le script le vérifie table par table avant d'écrire. Un lien de
dossier est repéré par sa ligne T&C du dossier (`tec_id`) et la `precision`
`utilisateur <id> role <n>`, un contact d'action par son action et
`utilisateur <id>`, le texte de l'élu par son dossier et `elu_referent`.

| Motif                                                         | Sens                                                                                                                                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contact_instructeur`                                         | lien « contact ADEME DR », « contact DREAL » ou « contact CR » d'un dossier repris, ou utilisateur agent d'une organisation régionale : TeT désigne un service instructeur, pas une personne |
| `sans_role_repris`                                            | utilisateur qui n'est pilote d'aucun dossier ni d'aucune fiche repris                                                                                                                        |
| `elu_referent_texte_libre`                                    | texte de l'élu référent tapé à la main dans un dossier repris : texte libre (fonction, plusieurs noms), aucun pilote n'en est tiré                                                           |
| `historique_non_repris`                                       | ligne de l'historique d'un dossier : TeT n'a pas de place pour l'historique d'un dossier                                                                                                     |
| `service_de_tet`                                              | organisation régionale de T&C : TeT a ses services instructeurs, saisis à l'étape 4                                                                                                          |
| `vitrine`, `doublon`, `sans_etat_invisible`, `coquille_vide`… | lien d'un dossier ou contact d'une action que les imports des dossiers ou des fiches ont écartés pour ce motif                                                                               |
| `orphelin`                                                    | lien ou contact vers un utilisateur, un dossier ou une action qui n'existe pas                                                                                                               |

Les **30 705 alertes** de T&C (notifications envoyées aux utilisateurs) ne
sont pas copiées à l'étape 1 : elles ne sont ni lues ni reprises.

Le rapport nomme les `personne_tag` de même nom à la casse ou aux accents
près, les utilisateurs T&C réunis sous un même nom, les pilotes rattachés dans
T&C à une autre collectivité, les dossiers repris sans pilote, et les textes
d'élu référent qui ne sont qu'un nom.

#### Annuler les pilotes

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-pilotes/annuler.ts [--confirm]
```

Retire les pilotes des démarches et des fiches notées dans `lignes_ecrites`
dont le `personne_tag` est noté dans `correspondance`, puis les
`personne_tag` créés par l'import que plus rien n'utilise (aucune clé
étrangère vers `personne_tag` ni invitation ne les vise), et enfin les traces
et les écarts de l'étape. À lancer avant d'annuler l'import des fiches ou des
dossiers, qui refusent sinon.

**Ce qu'elle laisse** : les `personne_tag` qui existaient avant l'import
(l'import les a réutilisés, il ne les a pas créés) ; ceux qu'il a créés mais
qu'une fiche, un indicateur, un plan ou une invitation a pris depuis ; les
pilotes à compte. **Ce qu'elle emporte** : un pilote identique (même démarche
ou fiche, même `personne_tag`) ajouté à la main après l'import.

#### Ce qui arrête l'import des pilotes

| Garde                                                              | Quoi faire                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| aucun dossier repris                                               | lancer d'abord l'import des dossiers (étape 2)                  |
| aucune fiche reprise alors que des actions reprises ont un contact | lancer d'abord l'import des fiches (étape 5)                    |
| une démarche ou une fiche qui doit recevoir un pilote a disparu    | décider au cas par cas : elle a été supprimée depuis son import |
| un utilisateur T&C à nommer sans prénom ni nom                     | décider quoi écrire : le script n'invente pas de nom            |
| l'import des pilotes a déjà tourné (traces présentes)              | l'annuler d'abord                                               |

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
