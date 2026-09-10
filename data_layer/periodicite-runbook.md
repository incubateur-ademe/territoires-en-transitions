# Périodicité des indicateurs — déploiement et reprise

Ce runbook applique l’[ADR 0018](../doc/adr/0018-periodicite-des-indicateurs.md).
La validation de l’ADR et la livraison des composants concernés précèdent son exécution.

## Déploiement expand / contract

Sur une base existante, **expand et contract sont deux déploiements distincts**, bornés par
`@indicateur-periodicite-expand` et `@indicateur-periodicite-contract`, jamais par `HEAD`.
Les migrations déjà déployées ne sont pas réécrites.

| Phase    | Changements                                                                                                                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expand   | Catalogue des périodicités, défaut annuel des définitions, mode recommandé, préférences nullables, valeurs annuelles, audit et normalisation sans collision, trigger transitoire, nouveaux index, RPC EMT, file de réconciliation et projection des dépendances. |
| Contract | Nouvel audit sous verrou, refus des conflits, périodicité des définitions obligatoire sans défaut annuel, trigger strict, validation des formules, reporting et retrait des anciens index après adaptation de tous les `ON CONFLICT`.                            |

La classification initiale en annuel recommandé concerne les définitions prédéfinies **et personnalisées**,
sans distinction de collectivité propriétaire.

Le défaut annuel des **valeurs** reste une compatibilité des anciens contrats ; le mode recommandé
reste le défaut de création. Le défaut annuel des **définitions** disparaît au contract.

Ordre de déploiement :

1. Drainer brièvement tous les producteurs ; expand verrouille les définitions avant les valeurs.
   Les anciennes instances peuvent ensuite reprendre pendant la compatibilité.
2. Corriger tous les conflits historiques **avant** de déployer les lecteurs et calculs stricts.
   Le trigger transitoire normalise les écritures compatibles et refuse les nouvelles collisions.
3. Déployer application, backend et outils compatibles, mensuel désactivé ; retirer les anciennes
   instances et drainer les producteurs SQL directs.
4. Exécuter le contract après préflight, avec nouvel audit sous verrou.
5. Vérifier lecture/écriture, reporting et réconciliation, puis activer le mensuel.

Le flag `is-indicateur-periodicite-mensuelle-enabled` bloque les nouveaux choix de périodicité dans
le frontend **et** le backend jusqu’au postflight. Les imports de catalogue non annuels attendent
aussi cette activation : les anciennes contraintes d’unicité empêchent auparavant la coexistence
de janvier et de l’année correspondante.

**Prérequis avant le déploiement applicatif :**

- L’automatisation Google Sheets doit utiliser `POST /indicateur-definitions/import` et
  `GET /indicateur-definitions/verify`, avec bearer token de service, et lire l’enveloppe
  `status`, `definitions`, `reconciliation`. Méthode, secret et réponse doivent être validés sur
  la cible. L’ancien import anonyme par `GET` est supprimé, sans alias de compatibilité.
- La file durable doit être installée et le cron de réconciliation actif dans `apps/tools`
  (`ENABLE_CRON_JOBS`, sans exclusion de `drain-indicateur-formula-reconciliations`).

## Contract, restaurations et retour arrière

En environnement partagé, le contract passe par le workflow manuel protégé
`.github/workflows/cd-periodicite-contract.yml` ; une cible Make équivalente existe en local.
Les chemins ordinaires s’arrêtent à expand. L’acquittement `tet.periodicite_contract_confirmed`
est limité à la session Sqitch, fourni par ce chemin et indépendant du flag fonctionnel.

Un mainteneur exécute, un reviewer DB/plateforme distinct approuve. Les protections GitHub sont
un prérequis externe vérifié avant mutation : environnement et base identifiés, branche principale
seule, ni auto-approbation ni contournement administrateur. La connexion est directe ou via pooler
de session, jamais transactionnel. Le workflow protégé exige une image Sqitch épinglée par digest.

Le préflight technique et la validation opérateur vérifient la phase et le schéma, les périodicités
et formules valides, l’audit sans conflit,
les anciens producteurs drainés, Google Sheets compatible et le cron sain sans échec non pris en
charge. Une sauvegarde récente, un responsable du rollback et un gel des déploiements jusqu’au
postflight sont requis. L’audit des données et la validation du graphe sont répétés sous verrou.

Sauvegardes, restaurations et contract partagent la concurrence de maintenance de la cible ;
les opérations externes restent couvertes par le gel opératoire.
Une restauration exige source et cible dans la même phase complète `legacy`, `expand` ou `contract`.
Phase partielle ou incohérence entre registre Sqitch et schéma bloque toute troncature.
Audit et intentions sont restaurés du même snapshot ; la projection des dépendances est reconstruite
et validée sous verrou après chargement. Les dates sont réauditées en expand, validées en contract.

Le déploiement utilise `sqitch deploy --mode all --verify --to <tag>` : le tag borne la phase,
le mode `all` annule les changements de cette exécution en cas d’échec détecté, si les scripts
`revert` réussissent. Chaque changement SQL est transactionnel. Une interruption peut laisser
une phase partielle ; le préflight revalide cet état avant reprise jusqu’au même tag.
Le garde créé par le `revert` du reporting reste actif jusqu’au redéploiement transactionnel
du reporting compatible. La reprise et le maintien puis le retrait de ce garde doivent être testés.

Le bootstrap est réservé à une base au registre absent ou vide, **sans tables applicatives**, ou déjà au
contract. Il refuse une base existante sans registre ou arrêtée à expand. Son acquittement est
interne, sans option générale de contournement. Les tests destructifs locaux et CI vérifient une
cible jetable isolée ; ils n’acceptent pas de base arbitraire.
Après contract de tous les environnements persistants, un commit dédié retire les chemins
temporaires et rétablit les migrations ordinaires, en conservant le garde historique et son
rejeu au bootstrap.

Un retour complet à l’ancien schéma est sans perte uniquement si les définitions sont annuelles
recommandées, les valeurs annuelles et les préférences locales absentes. Sinon, il est bloqué
avant modification du reporting ou retrait des colonnes et exige une migration métier.
Après drainage des écritures, un garde transactionnel empêche toute nouvelle périodicité incompatible,
préférence ou mode imposé entre les changements Sqitch ; le reporting compatible le retire au
redéploiement. Une date normalisée n’est restaurable que si identité métier et date canonique
sont restées intactes : déplacement, réattribution, suppression ou remplacement invalide
définitivement l’audit, même si le même tuple réapparaît.

## Compatibilité du reporting et des dates

La migration normalise les dates historiques non canoniques sous audit, sans fusion automatique.
Les collisions doivent être corrigées. Le reporting conserve ses six colonnes historiques dans
le même ordre, puis ajoute `periodicite` et `periode_debut`. L’alias `annee` reste temporairement
disponible ; les nouveaux consommateurs utilisent périodicité et début de période, sans libellés SQL.

## Commandes locales et tests de migration

- `make db-migrate-periodicite-expand` déploie les quatre changements compatibles jusqu’au tag expand.
- `make db-migrate-periodicite-contract` applique le contract uniquement sur une base locale.
- `make db-init` et `make db-migrate-fresh` sont réservés à une base neuve ou ayant déjà franchi le contract.
- `make db-test-deployment-guards` vérifie les gardes sans toucher à la base.
- `make db-test-periodicite-migration` exige `PERIODICITE_MIGRATION_TEST_DATABASE_URL` vers une base
  locale jetable `periodicite_migration_lifecycle_test_*`, préparée avant expand. Il exerce expand,
  contract, concurrence, restauration des états dérivés et revert complet.

Chaque changement Sqitch est transactionnel ; le déploiement de plusieurs changements utilise
`--mode all --verify` et peut nécessiter la reprise décrite ci-dessus.
