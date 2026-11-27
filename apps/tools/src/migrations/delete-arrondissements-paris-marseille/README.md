# Nettoyage des arrondissements de Paris et Marseille

Procédure SQL manuelle pour [TET-6518](https://app.notion.com/p/2e76523d57d780d993bfe0921cd6da1b) :
centraliser l'usage dans les espaces Ville, en transférant les fiches et en
archivant les autres données des espaces d'arrondissement avant leur suppression.
Le script est absent du plan Sqitch, des seeds et des déploiements.

## Traitement

Les cibles sont les collectivités de type `commune` portant les codes `13201`
à `13216` (Marseille) et `75101` à `75120` (Paris). Leurs identifiants sont
résolus dans la base choisie. Un unique espace Ville de Marseille (`13055`)
et de Paris (`75056`) doit être présent.

| Données                                                                                    | Traitement                                                                                                                                               |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fiches et sous-actions                                                                     | Transfert à leur Ville, en conservant identifiants, contenu, auteurs, dates et liens. Image initiale conservée dans l'archive.                           |
| Utilisateurs actifs sans droit Ville                                                       | Création d'un seul droit `lecture` par utilisateur et Ville, même en cas de plusieurs droits d'arrondissement.                                           |
| Droits Ville existants                                                                     | Inchangés. Un droit désactivé bloque le lot ; aucune réactivation automatique.                                                                           |
| Droits d'arrondissement inactifs                                                           | Archivés sans créer de droit Ville.                                                                                                                      |
| Valeurs d'indicateurs                                                                      | Archivage intégral, y compris objectifs, commentaires et métadonnées. Aucune agrégation ni réattribution à la Ville.                                     |
| Audits, demandes, scores, membres, pilotes, personnalisation, historiques et usages connus | Archivage puis retrait des tables actives.                                                                                                               |
| Paniers et leurs actions/statuts                                                           | Archivage si l'arrondissement est propriétaire ou présélection d'un panier sans collectivité propriétaire. Un propriétaire hors périmètre bloque le lot. |
| `public.commune` et `migration.plan_action`                                                | Archivage des lignes des espaces retirés. Les tables géographiques `imports.*` restent intactes.                                                         |
| Stockage                                                                                   | Les fichiers bloquent le lot. Les liens vers les buckets vides sont archivés et supprimés ; les buckets restent en place.                                |

Les comptes utilisateurs, Lyon et les données métier déjà présentes dans les
espaces Ville restent conservés. Les triggers de transfert des fiches peuvent
ajouter un historique sur la Ville. La liste exacte des tables, prédicats et
ordre de traitement se trouve dans
[les règles SQL](delete-arrondissements-paris-marseille.rules.sql).

Après déploiement du [correctif applicatif des espaces absents (PR #5881)](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5881),
livré séparément du nettoyage SQL, les anciennes URL d'espaces supprimés affichent
la page 404 avec un lien vers l'accueil. Les fiches transférées se retrouvent
depuis l'espace de leur Ville.

Toute dépendance non prévue bloque le lot : FK directes ou indirectes,
`CASCADE` et `SET NULL` compris, et tables avec `collectivite_id` sans FK.
Une référence indirecte sans FK n'est connue que si elle figure explicitement
parmi les règles. Les références uniquement stockées dans du JSON, du texte
ou des services externes ne sont pas inventoriées.

## Connexion

Lancer `psql` depuis la racine du repo. `ARRONDISSEMENTS_DATABASE_URL` est une
variable de terminal à renseigner explicitement, pas une variable chargée
par le projet. Elle doit contenir l'URL PostgreSQL de la base choisie.

- Stack locale par défaut : `postgresql://postgres:postgres@localhost:54322/postgres`.
- Cibles Koyeb `preprod` et `prod` : valeur du secret `SUPABASE_DATABASE_URL_preprod`
  ou `SUPABASE_DATABASE_URL_prod`, utilisé comme `SUPABASE_DATABASE_URL` du backend.
- Préprod Scaleway : output `pg_connection_uri` de `infra/nonprod`, accessible
  depuis les IP autorisées par `pg_allowed_ips`. L'URL privée utilisée dans
  les conteneurs n'est pas accessible directement depuis le poste opérateur.
- L'output du même nom dans `infra/prod` vise la base Scaleway. Vérifier que
  cette base sert effectivement la production avant de l'utiliser.

Le rôle doit pouvoir lire toutes les tables concernées. Pour appliquer, il doit
également pouvoir verrouiller et modifier les tables et créer/protéger l'archive
dans `private`. Le script échoue si les droits ou RLS empêchent un inventaire complet.

## Inventaire

Commencer sur une copie récente et isolée. La restauration
`make db-restore-local-from-prod-backup` charge uniquement les tables de
`data_layer/backup/restore-config.yml`. Comparer cet ensemble aux tables du dump :
les tables concernées manquantes, dont `migration.plan_action`, `client_scores`,
`personnalisation_consequence`, `pre_audit_scores`, `usage_backup` ou `visite_backup`,
doivent aussi être restaurées depuis la même archive avant de valider une suppression.

```sh
psql -X --dbname="${ARRONDISSEMENTS_DATABASE_URL:?URL PostgreSQL requise}" \
  -v apply=false \
  --file=apps/tools/src/migrations/delete-arrondissements-paris-marseille/delete-arrondissements-paris-marseille.sql
```

Les fonctions auxiliaires sont créées dans le schéma temporaire de la session.
L'inventaire s'exécute dans une transaction `REPEATABLE READ READ ONLY`, sans
créer d'archive persistante ni de droit Ville.

- `Espace ciblé` : identifiant, code et nom de chaque arrondissement.
- `TRAITEMENT` : table, opération prévue (`transfer` ou `archive`) et nombre de lignes.
- `DROIT` : utilisateur et Ville pour lesquels un droit lecture sera créé.
- `BLOCAGE` : dépendance hors traitement, Ville manquante/dupliquée ou droit Ville désactivé.
- `Stockage` : buckets liés et nombres d'objets ; tout nombre non nul bloque le lot.

`espaces_supprimes = 0` est normal en mode inventaire. Vérifier le message
`Blocage détecté : f` avant de préparer l'application. L'inventaire ne réserve
pas les données ; tous les contrôles sont refaits pendant l'application.

## Application manuelle

1. Relire les espaces, les traitements et les droits lecture prévus. Résoudre
   les blocages explicitement ; le script ne propose pas de mode de forçage.
2. Disposer d'une sauvegarde restaurable de la base cible et réussir une
   suppression sur une copie complète. Fermer les écritures applicatives,
   imports et workers pendant l'intervention : les verrous portent sur les
   tables entières, y compris les dépendances et `storage.objects`.
3. Lancer :

   ```sh
   psql -X --dbname="${ARRONDISSEMENTS_DATABASE_URL:?URL PostgreSQL requise}" \
     -v apply=true \
     --file=apps/tools/src/migrations/delete-arrondissements-paris-marseille/delete-arrondissements-paris-marseille.sql
   ```

4. Conserver le `run_id` affiché et relancer l'inventaire : aucun espace ne
   doit rester ciblé. Vérifier les fiches dans leurs Villes et les nouveaux droits lecture.
   Après déploiement du correctif #5881, ouvrir un ancien lien de fiche et un ancien
   tableau de bord d'arrondissement pour vérifier qu'ils affichent la page 404.

Le script conserve les contraintes et triggers. Une erreur, une dépendance
apparue pendant le traitement ou une écriture incomplète annule tout le lot,
archive et nouveaux droits compris. Le délai d'attente d'un verrou est de
5 secondes, celui de l'instruction de 5 minutes. Un rejeu après succès ne
supprime rien et ne duplique pas les archives.

## Archive et récupération

`private.arrondissements_paris_marseille_cleanup` est réservée à l'administration.
RLS est activé et les droits de `PUBLIC`, `anon`, `authenticated` et `service_role`
sont révoqués. Chaque ligne contient le `run_id`, la table source, l'opération,
la ligne complète en JSONB et la date d'archivage :

- `archive`, phase `before` : image de chaque ligne à retirer, enfants connus
  compris, avant toute écriture du lot ;
- `archive`, phase `removed` : images supplémentaires des lignes modifiées ou
  créées par les triggers avant leur retrait, sans perdre l'état initial ;
- `transfer`, phase `before` : image initiale de chaque fiche transférée ;
- `grant`, phase `created` : image de chaque droit lecture créé.

Pour examiner un lot avec le rôle d'intervention :

```sql
SELECT source_table, operation, phase, count(*)
FROM private.arrondissements_paris_marseille_cleanup
WHERE run_id = '<run_id affiché>'::uuid
GROUP BY source_table, operation, phase
ORDER BY source_table, operation, phase;
```

Après commit, une récupération nécessite une procédure préparée à partir de la
sauvegarde et des images archivées. Aucun revert automatique n'est fourni : il
faut tenir compte des triggers, contraintes et éventuelles écritures postérieures.
Les buckets vides peuvent être gérés séparément via l'API Storage.

Les seeds de développement et la création administrative peuvent recréer ces
espaces. Ce script ne pose pas de contrainte permanente sur les codes commune.

## Validation

Les tests exercent PostgreSQL avec pgTAP et des données synthétiques, sans
serveur applicatif ni appel externe. Chaque suite nécessite une base jetable
vide hors extension pgTAP. Les tests de permissions nécessitent un superutilisateur.

```sh
pg_prove --dbname="$ARRONDISSEMENTS_TEST_DATABASE_URL" --ext .psql --verbose \
  data_layer/tests/collectivite/delete-arrondissements-paris-marseille.assertions.psql

pg_prove --dbname="$ARRONDISSEMENTS_CLI_TEST_DATABASE_URL" --ext .psql --verbose \
  data_layer/tests/collectivite/delete-arrondissements-paris-marseille-cli.assertions.psql
```

La première suite utilise une transaction annulée à la fin. La seconde commit
ses fixtures pour tester les transactions réelles du CLI ; détruire sa base
jetable après le test. L'extension `.psql` exclut ces suites de `run_tests.sh`,
qui travaille sur une base applicative initialisée.
