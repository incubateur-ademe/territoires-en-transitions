# Migration mensuelle des indicateurs de Margny

La PR [#5312](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5312)
est la quatrième livraison : elle suit #5215 et précède le nettoyage #5296. Elle convertit
les deux indicateurs existants de Margny (collectivité 2181) en mensuels et reprend
les six images archivées par #5220, avec identifiants, commentaires, provenance,
auteurs et horodatages d'origine. Cette réparation métier ponctuelle ne rouvre pas
la modification de périodicité après création : hors migration, la décision du
24 septembre 2026 reste appliquée. La saisie et la visualisation sont mensuelles,
sans agrégation temporelle.

| Indicateur                             | Mois 2025 | Résultat / objectif |
| -------------------------------------- | --------- | ------------------- |
| « test » (31816)                       | Janvier   | 5 / 3               |
|                                        | Février   | 7 / 5               |
|                                        | Mars      | 2 / 7               |
|                                        | Avril     | 8 / 9               |
| « Nombre de projets analysés » (32392) | Novembre  | absent / 2          |
|                                        | Décembre  | absent / 3          |

Les quatre observations supprimées sont réinsérées et les deux conservées au
1er janvier sont déplacées en avril et décembre. Le premier jour du mois est la
date canonique. Les autres données et les liens des définitions sont conservés.
Les archives et outils temporaires sont retirés dans la livraison suivante.

Avant déploiement, valider l'activation, suspendre les écritures/imports/tâches,
prendre une sauvegarde complète et vérifier sa restauration sur une base jetable.
Déployer et vérifier jusqu'à `@indicateur-margny-mensuel`, puis contrôler les six
observations dans l'application avant réouverture. Les scripts de restauration
identifient l'état `contract-margny`, restaurent aussi les archives d'origine et
refusent les sauvegardes avant migration sur une cible déjà migrée, et inversement.

La migration est transactionnelle et prend le verrou du graphe puis les tables
concernées, avec un `lock_timeout` de cinq secondes. Une archive partielle, une
saisie modifiée, un identifiant réutilisé ou une nouvelle observation/dépendance
bloque la conversion. Les protections d'immuabilité sont réactivées dans la même
transaction ; une installation sans ces données ne crée aucun indicateur.

Avant nettoyage, le revert ciblé restaure les deux observations annuelles et
remet les quatre autres dans l'archive. Il refuse toute modification des six
images, nouvelle observation, rattachement à un groupe ou dépendance. Après réouverture,
préférer une correction en avant ; ne pas forcer un retour qui perdrait une saisie.

Les scripts `deploy`, `verify` et `revert` de cette migration peuvent être répétés
sur une copie de production isolée. `make db-test-backup-compatibility` couvre le
refus des sauvegardes incompatibles et la présence de l'archive nécessaire au
retour arrière. Les fixtures de `tests/indicateur/fixtures/margny-monthly.psql`
sont exécutées par la CI dans une base jetable : déploiement, comparaison des
images archivées, retour exact à l’annuel et redéploiement.

Le cycle de transition et son ancien outil de clonage ont été retirés avec la
simplification annuelle. Le schéma préparatoire déjà déployé et les six originaux
archivés restent les prérequis de cette migration métier.
