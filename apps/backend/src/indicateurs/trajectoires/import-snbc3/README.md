# Import de la trajectoire SNBC 3

Importe une release du dépôt `snbc3` comme source d'indicateur `snbc3`
([ADR 0023](../../../../../../doc/adr/0023-integration-trajectoire-snbc3.md), plan du lot 1).

- Une release est un dossier `releases/V<version>/` committé dans `snbc3` : `manifest.json`,
  `resultats_territorialises.parquet`, le classeur standalone (`.xlsx`) et le PDF de
  méthodologie. La date du commit sert de millésime (`date_version` de la métadonnée).
- Le parquet, le classeur et le PDF de méthodologie sont vérifiés contre les tailles et les sha256 du
  manifeste. Une release sans l'un des trois est refusée.
- Les colonnes lues du parquet doivent exister avec leur type physique (`BYTE_ARRAY` pour les
  chaînes, `INT64` ou `INT32` pour `annee`, `DOUBLE` pour `valeur_recalee`).
- Une seule métadonnée `snbc3` existe : chaque import la met à jour et remplace les valeurs en
  place (les `id` sont conservés). Les valeurs qui ne sont plus produites sont supprimées, et les
  totaux sont recalculés par les formules du catalogue.
- Le bucket privé `trajectoires-snbc3` (créé par l'import s'il n'existe pas) garde la release
  importée, chaque import complet écrasant le précédent :
  - `standalone.xlsx` : le classeur standalone, servi par l'export ; son nom d'origine, le commit et
    la version sont dans les métadonnées de l'objet ;
  - `methodologie.pdf` : le PDF de méthodologie, servi par `GET /trajectoires/snbc3/methodologie`
    (page Trajectoire) ; son nom d'origine, le commit et la version sont dans les métadonnées ;
  - `manifest.json` : le manifeste de la release, copié tel quel ; le commit et la version de ses
    métadonnées désignent la release en base ;
  - `pending-release.json` : le commit et la version (métadonnées de l'objet) du dernier import
    complet commencé, écrits avant de toucher aux valeurs ;
  - `last-import.json` : statut du dernier import (`running`, `done`, `done_with_errors` ou
    `failed`), dates, collectivités d'un rejeu partiel et rapport.
- Le bucket (`standalone.xlsx`, `methodologie.pdf`, `manifest.json`) et la date de la métadonnée ne sont mis à jour
  qu'une fois toutes les valeurs remplacées : après un import interrompu ou en échec, ils désignent
  encore la release précédente.
- La métadonnée s'appelle simplement « SNBC3 » : le front n'affiche ni version ni commit.
- Sans le feature flag `is-trajectoire-snbc3-enabled`, les valeurs `snbc3` restent invisibles
  (fiches indicateurs, tRPC, API publique). L'import peut donc avoir lieu avant l'ouverture.

La correspondance des codes SNBC 3 vers les indicateurs TeT est dans
[`snbc3-mapping.ts`](./snbc3-mapping.ts), les règles de transformation dans
[`build-snbc3-valeurs.ts`](./build-snbc3-valeurs.ts).

## Configuration

| Variable                             | Rôle                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `TRAJECTOIRE_SNBC3_REPOSITORY_URL`   | URL du dépôt GitLab `snbc3`. Requise en prod.             |
| `TRAJECTOIRE_SNBC3_GITLAB_TOKEN`     | Jeton GitLab (`read_repository`) : le dépôt `snbc3` est privé. Requis en prod.                                             |
| `TRAJECTOIRE_SNBC3_LOCAL_REPOSITORY` | Chemin d'un clone local de `snbc3`. S'il est défini, les releases y sont lues (`git show`) au lieu de GitLab. Pour le dev. |

## Mise en prod

1. **Catalogue d'abord.** `cae_1.ih` et `cae_2.kh` (construction) doivent exister, et les formules
   de `cae_1.i` et `cae_2.k` les inclure. Sinon l'import échoue sur chaque territoire (« absent du
   catalogue »). Ajout dans le Google Sheet du catalogue, puis `GET /indicateur-definitions/verify`
   et `GET /indicateur-definitions/import`.
2. **Import**, avec le jeton service role :

   ```bash
   curl -X POST "$BACKEND_URL/trpc/indicateurs.trajectoires.snbc3.import" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H 'Content-Type: application/json' \
     -d '{"commit": "a34a053e82be5d577ec7ade727c005ea248b36e3", "version": "2.1"}'
   ```

   - La mutation met l'import dans la file BullMQ `trajectoire_snbc3_import` et répond tout de
     suite : `{"jobId": "…"}`. Le worker lit et vérifie la release, remplace les valeurs, puis
     met à jour la date de la métadonnée et enregistre la release dans le bucket : 8 min en local
     pour la release V2.1 quand toutes les valeurs changent, 16 s pour un réimport identique (les
     valeurs inchangées ne sont pas réécrites). Le statut et le rapport sont dans
     `last-import.json`, et dans les logs du backend (« Import SNBC 3 terminé », « Rapport de
     l'import SNBC 3 ») :
     - `done` : toutes les valeurs sont importées ;
     - `done_with_errors` : l'import est allé au bout, mais des territoires sont en erreur
       (`report.errors`) ; les rejouer avec `collectiviteIds` ;
     - `failed` : l'import s'est arrêté (release invalide, panne de la base ou du stockage), avec
       le code ou le message d'erreur. Les valeurs déjà écrites restent ; relancer l'import.
   - Un seul import à la fois, toutes instances confondues : le job a un id fixe
     (`import-trajectoire-snbc3`), et la mutation répond `CONFLICT` si un import est déjà en cours
     ou en attente. Le job terminé du dernier import (et son rapport) reste dans la file jusqu'à
     la mise en file suivante.
   - Si le backend s’arrête pendant l’import (redéploiement), le job est repris une fois,
     plus tard, après expiration de son verrou (10 min) ; l’import est idempotent.
   - `collectiviteIds` (facultatif) rejoue l'import pour quelques collectivités, par exemple
     après des erreurs. Ce rejeu n'est accepté que pour la release du dernier import complet
     (commit et version du `manifest.json` du bucket, `PRECONDITION_FAILED` sinon), et refusé
     tant qu'un import complet commencé depuis (`pending-release.json`) n'est pas allé au bout :
     les valeurs mélangent alors deux releases, relancer un import complet. Il ne
     réécrit ni le classeur ni la date de la métadonnée. Sans ce filtre, les collectivités
     absentes de la release perdent leurs valeurs `snbc3`.
   - Le rapport liste les territoires non rattachés, EPCI sans données, valeurs créées,
     modifiées, inchangées et supprimées (valeurs importées seulement, sans les totaux calculés),
     erreurs par territoire. Une valeur refusée n'arrête pas les autres territoires ; une panne
     de la base arrête l'import (`failed`).

3. Pour revenir en arrière, réimporter un commit précédent.

## Vérification

```sql
-- La métadonnée unique, et le nombre de valeurs importées et calculées
select m.id, m.date_version, m.nom_donnees, v.calcul_auto, count(*)
from indicateur_source_metadonnee m
join indicateur_valeur v on v.metadonnee_id = m.id
where m.source_id = 'snbc3'
group by 1, 2, 3, 4;

-- Une collectivité : totaux 2021 (CC Faucigny-Glières : cae_1.a = 142,53, cae_2.a = 821,39)
select d.identifiant_referentiel, v.date_valeur, v.objectif, v.calcul_auto, v.objectif_commentaire
from indicateur_valeur v
join indicateur_definition d on d.id = v.indicateur_id
join indicateur_source_metadonnee m on m.id = v.metadonnee_id
join collectivite c on c.id = v.collectivite_id
where m.source_id = 'snbc3' and c.siren = '200000172'
  and d.identifiant_referentiel in ('cae_1.a', 'cae_2.a', 'cae_1.ih', 'cae_2.kh', 'cae_63.b')
  and v.date_valeur = '2021-01-01';

-- Les fichiers de la release importée (contenus : API Storage, ou Supabase Studio)
select name, user_metadata, updated_at from storage.objects where bucket_id = 'trajectoires-snbc3';
```
