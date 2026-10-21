# Supprimer les espaces Arrondissements de Paris et Marseille

[TET-6518](https://app.notion.com/p/2e76523d57d780d993bfe0921cd6da1b).
Script manuel, absent du plan Sqitch et des seeds : aucun nettoyage au déploiement.

**Cette préparation ne réalise pas encore la suppression demandée sur les données
existantes.** Elle fournit un inventaire et une suppression des espaces sans
dépendances. Sur la copie du 20 octobre 2026, les 36 espaces restent bloqués.

## Décision produit et limites

Le ticket demande de retirer les espaces des arrondissements pour centraliser
l'usage dans les espaces Ville. Le [fil Mattermost cité par le ticket](https://mattermost.incubateur.net/betagouv/pl/9gddib4djfymjb68jf58zbfrry)
est arbitré par Nicolas ; la transcription fournie pour la revue indique que les
deux utilisateurs du 1er arrondissement de Marseille étaient déjà rattachés à la
Ville. Cette indication ne vaut pas pour tous les utilisateurs des arrondissements.

Les [commentaires du ticket](https://app.notion.com/p/2e76523d57d780d993bfe0921cd6da1b?d=1eb6523d57d78328a2e9037f6d5c318e)
demandent d'identifier avec précaution les données à supprimer (14 janvier 2026)
et confirment l'origine de la demande auprès de Nicolas (1er juillet 2026).
La décision de retirer les espaces est donc acquise. Le traitement de chaque
dépendance reste à définir ; ces échanges ne prescrivent ni l'effacement des
comptes utilisateurs ni une purge générale des données métier.

Le périmètre est limité aux collectivités de type `commune` portant les codes
`13201` à `13216` (Marseille) ou `75101` à `75120` (Paris). Les identifiants sont
résolus dans la base cible. Les villes (`13055`, `75056`), Lyon, les comptes
utilisateurs et les données géographiques d'import restent inchangés. Bordeaux,
évoqué dans la discussion initiale mais absent du ticket arbitré, est hors périmètre.

Le ticket ne définit aucun transfert de données ni de droits. Le script refuse
donc **toute suppression** si un espace ciblé a encore des dépendances : clés
étrangères, y compris celles avec cascade, tables avec `collectivite_id` même sans
FK, ou fichiers dans ses buckets. L'inventaire indique les espaces, tables,
colonnes et nombres de lignes concernés. Les références stockées seulement dans
du JSON, des journaux textuels ou des services externes ne sont pas inventoriées.
La présence des deux espaces Ville est également requise.

Seuls les liens `collectivite_bucket` vers des buckets vides sont supprimés avec
les espaces. Les buckets eux-mêmes restent en place ; les identifiants figurent
dans l'inventaire pour une éventuelle intervention ultérieure via l'API Storage.
Les contraintes et les triggers restent actifs.

## Données à traiter avant de terminer le ticket

Constats sur la copie locale de la sauvegarde du 20 octobre 2026, approfondis en
lecture seule le 21 octobre. Ils servent à préparer les décisions de conservation,
pas à autoriser automatiquement une suppression.

| Données | Constat | Conséquence pour l'intervention |
| --- | --- | --- |
| Droits | 9 lignes, dont 4 actives et 5 inactives. Les 2 utilisateurs actifs du 1er arrondissement de Marseille ont déjà un accès actif à la Ville. Ceux du 8e de Marseille et du 10e de Paris n'en ont pas. | Conserver tous les comptes. Définir le rattachement et le niveau d'accès des 2 autres utilisateurs ; recopier leur droit `admin` donnerait de nouveaux pouvoirs sur la Ville. Ne pas réactiver les droits inactifs. |
| Fiche action | 1 fiche non supprimée dans le 1er arrondissement de Marseille, sans fiche de même titre dans la Ville. | Préserver son contenu et ses liens. L'absence de description ne suffit pas à la qualifier de donnée jetable. |
| Indicateurs | 300 résultats de population INSEE (`terr_1`), 15 années par arrondissement parisien ; aucune valeur saisie avec un auteur, aucun objectif ni commentaire. | Ce sont des valeurs territorialisées à l'arrondissement. Les réattribuer directement à Paris changerait leur signification ; ne pas écraser ni additionner automatiquement les valeurs Ville. |
| Références structurelles | 36 lignes `public.commune` et 36 archives `migration.plan_action` sans catégories ni fiches. | Le contrôle générique les bloque aussi. Prévoir un traitement explicite de ces lignes ; ne pas les confondre avec 36 plans actifs ni supprimer `imports.commune`. |
| Audits et demandes | 16 audits sans validation, clôture ni date de fin ; 6 demandes sans date d'envoi. | Vérifier leur usage avant de décider de leur conservation. L'absence de finalisation n'autorise pas leur effacement. |
| Autres dépendances | Membres, pilotes, réponse de personnalisation, scores, paniers, historiques et traces d'usage. Aucun fichier trouvé dans les buckets liés. | Conserver le blocage jusqu'à classification et traitement explicites. |

Le précédent de Lyon ne constitue pas une procédure technique vérifiée : l'archive
contient encore ses 9 lignes d'arrondissement dans `public.collectivite`. Aucune
suppression de Lyon n'est ajoutée au périmètre pour résoudre cette divergence.

La résolution complète nécessite un plan par table et par espace distinguant les
données conservées, transférées et supprimées, puis un essai qui supprime réellement
les 36 espaces sur une copie tout en vérifiant les espaces Ville et les comptes.
Le test actuel de refus sur la sauvegarde prouve la protection des dépendances ;
il ne prouve pas la réalisation de la demande. Les imports et parcours de création
devront aussi être vérifiés pour éviter la recréation de ces espaces.

## Inventaire

Utiliser `psql` avec un rôle pouvant lire toutes les tables concernées. Le script
refuse un inventaire incomplet lié aux droits ou aux politiques RLS.
`ARRONDISSEMENTS_DATABASE_URL` doit désigner explicitement la base choisie.
Commencer sur une copie récente et isolée.

La restauration `make db-restore-local-from-prod-backup` charge les tables
énumérées dans `data_layer/backup/restore-config.yml`. Avant de conclure à
l'absence de dépendances, comparer cet ensemble aux tables de l'archive et de
l'inventaire. Des références peuvent notamment rester dans `migration.plan_action`,
`client_scores`, `personnalisation_consequence`, `pre_audit_scores`, `usage_backup`
ou `visite_backup`, qui ne font pas partie de cette restauration. Charger les
tables manquantes concernées depuis la même archive dans la copie locale avant
de tester la suppression.

```sh
psql -X --dbname="$ARRONDISSEMENTS_DATABASE_URL" \
  --file=data_layer/scripts/delete-arrondissements-paris-marseille.sql \
  > /tmp/arrondissements-inventaire.log 2>&1
```

La fonction auxiliaire est créée dans le schéma temporaire de la session.
L'inventaire s'exécute ensuite dans une transaction **READ ONLY**.
Une valeur de `espaces_supprimes = 0` en mode inventaire n'indique pas l'absence de
blocages : lire les messages `BLOCAGE` et les nombres d'objets stockés.

## Exécution manuelle, après revue

1. Vérifier les identifiants, les deux espaces Ville et tous les blocages.
   Si des données existent, décider explicitement de leur conservation ou de leur
   transfert ; le script ne les efface pas et n'offre aucun mode de forçage.
2. Disposer d'une sauvegarde restaurable de la base cible et valider le script
   sur une copie. Fermer les écritures applicatives, imports et tâches de fond
   pendant l'intervention : le script verrouille aussi les tables de dépendances
   et `storage.objects`.
3. Lancer explicitement :

   ```sh
   psql -X --dbname="$ARRONDISSEMENTS_DATABASE_URL" -v apply=true \
     --file=data_layer/scripts/delete-arrondissements-paris-marseille.sql
   ```

4. Relancer l'inventaire : aucun espace ne doit rester ciblé.

L'exécution refait les contrôles sous verrous et commit la suppression dans une
seule transaction. Une erreur ou un délai de verrouillage annule l'ensemble.
Une nouvelle exécution après succès ne supprime rien. Après commit, la récupération
des espaces nécessite la sauvegarde.

Les seeds de développement contiennent ces arrondissements et peuvent les recréer
lors d'une réinitialisation locale ; ce script reste une intervention manuelle.

## Validation

Les tests utilisent uniquement des données synthétiques dans une base jetable avec
pgTAP, sans serveur applicatif ni appel externe :

```sh
pg_prove --dbname="$ARRONDISSEMENTS_TEST_DATABASE_URL" --ext .psql --verbose \
  data_layer/tests/collectivite/delete-arrondissements-paris-marseille.assertions.psql
```

Cette base doit être vide (hors extension pgTAP). Le test refuse une base contenant
déjà `public.collectivite` ou un des schémas `storage`, `historique`, `imports`.
Les tests de permissions nécessitent un rôle superutilisateur dans cette base
jetable. L'extension `.psql` exclut ce test de la suite `run_tests.sh` qui s'exécute
sur une base initialisée.
