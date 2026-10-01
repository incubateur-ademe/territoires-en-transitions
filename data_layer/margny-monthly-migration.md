# Migration mensuelle des indicateurs de Margny

Cette cinquième livraison suit #5215 et précède le nettoyage #5296. Elle convertit
les deux indicateurs existants de Margny (collectivité 2181) en mensuels et reprend
les six images archivées par #5220, avec identifiants, commentaires, provenance,
auteurs et horodatages d'origine.

| Indicateur | Mois 2025 | Résultat / objectif |
| --- | --- | --- |
| « test » (31816) | Janvier | 5 / 3 |
| | Février | 7 / 5 |
| | Mars | 2 / 7 |
| | Avril | 8 / 9 |
| « Nombre de projets analysés » (32392) | Novembre | absent / 2 |
| | Décembre | absent / 3 |

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
images, nouvelle observation, agrégation ou dépendance. Après réouverture,
préférer une correction en avant ; ne pas forcer un retour qui perdrait une saisie.

`make db-test-periodicite-migration` couvre le cycle précédent puis les vrais
scripts de cette livraison, leurs refus atomiques, les six images mensuelles,
la conservation des archives et le retour arrière contrôlé. Utiliser une base
jetable `periodicite_migration_lifecycle_test_*` initialisée avant les périodicités.

Le 1er octobre 2026, sur PostgreSQL 15 jetable avec fixtures synthétiques :
cycle complet, conversion et retour arrière contrôlé, conservation des archives,
aller-retour réel `pg_dump`/`pg_restore` des originaux et 96 assertions SQL réussis.
Les contrôles shell refusent aussi les sauvegardes de l'autre état de migration.
Ces vérifications locales doivent être répétées sur une copie récente avant le
déploiement, en mesurant les verrous au volume réel.
