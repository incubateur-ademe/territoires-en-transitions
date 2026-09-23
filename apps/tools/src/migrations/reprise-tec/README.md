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

Une date saisie à la main avant l'an 2000 (lancement, envoi pour avis,
réception du projet) est une faute de frappe dans T&C. Une année sur deux
chiffres, de 10 à 99, est lue 20AA (`0023-01-25` devient 2023-01-25) ; les
autres (`0002-12-01`, `0217-03-02`) sont traitées comme absentes. Le rapport
nomme chaque dossier concerné.

Un second `--confirm` échoue sur `correspondance` : les dossiers sont déjà là.

#### Ce qui arrête l'import

Avant toute écriture, le script vérifie ces cas, les liste tous, et s'arrête
s'il en trouve un :

| Code | Garde                                                                                          | Quoi faire                                                               |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A27  | collectivité introuvable dans TeT, ou trouvée plusieurs fois                                   | la créer, ou corriger le doublon, avant l'import                         |
| A3   | fenêtre d'avis de trois mois encore ouverte à la date de référence, jour de l'échéance compris | vérifier la date ; si elle est juste, attendre la fin de la consultation |
| D3   | dossier qui arriverait instruit sans date de transmission                                      | corriger la source : il serait enfermé dans TeT                          |
| D4   | collectivité qui a déjà une démarche active dans TeT                                           | décider au cas par cas, on ne touche pas à son dossier                   |

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

## Le schéma de travail `reprise_tec`

| Table             | Rôle                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `staging_<table>` | la copie de T&C, lue par les étapes d'import                                               |
| `correspondance`  | traduire un identifiant T&C en identifiant TeT                                             |
| `lignes_ecrites`  | savoir exactement quelles lignes du produit la reprise a écrites, pour pouvoir les retirer |
| `ecarts`          | savoir pourquoi une ligne de T&C n'a pas été reprise (`doublon`, `coquille_vide`…)         |

Pour tout retirer d'un coup :

```sql
drop schema reprise_tec cascade;
```
