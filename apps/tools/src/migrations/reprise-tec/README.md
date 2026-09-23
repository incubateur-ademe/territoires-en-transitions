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
`lignes_ecrites`.

```bash
pnpx tsx apps/tools/src/migrations/reprise-tec/import-demarches/index.ts --suivi <csv>            # simulation
pnpx tsx apps/tools/src/migrations/reprise-tec/import-demarches/index.ts --suivi <csv> --confirm  # import
```

S'arrête sans rien écrire si la collectivité d'un dossier est introuvable dans
TeT. Un second `--confirm` échoue sur `correspondance` : les dossiers sont déjà
là.

## Le schéma de travail `reprise_tec`

| Table             | Rôle                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `staging_<table>` | la copie de T&C, lue par les étapes d'import                                               |
| `correspondance`  | traduire un identifiant T&C en identifiant TeT                                             |
| `lignes_ecrites`  | savoir exactement quelles lignes du produit la reprise a écrites, pour pouvoir les retirer |

Pour tout retirer d'un coup :

```sql
drop schema reprise_tec cascade;
```
