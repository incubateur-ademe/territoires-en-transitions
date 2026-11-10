# 23. Différer les suites coûteuses sur les étages supérieurs des stacks natives

Date : 2026-11-09

## Statut

Proposé.

Complète [0017](0017-optimisation-ci-par-scope-affecte-et-parallelisation-ciblee.md)
en ajoutant la position dans une stack native au choix des familles de checks.
La sélection des projets affectés et les caches restent inchangés.

## Contexte

Les restacks peuvent lancer plusieurs fois les suites DB, backend/API, E2E
et Storybook sur des PR qui ne sont pas encore les prochaines à merger.
La [PR #5772](https://github.com/incubateur-ademe/territoires-en-transitions/pull/5772)
a retiré la sélection du sommet : elle supprimait le check requis des
ancêtres et ne leur donnait pas de verdict propre.

Le périmètre retenu est limité aux stacks explicitement déclarées dans
GitHub. Il ne nécessite ni label à gérer ni merge queue.

## Décision

- Conserver les checks rapides de chaque PR hors brouillon.
- Exécuter les suites coûteuses sur la première PR non mergée d’une stack.
  Comparer sa branche cible à celle de la stack, sans utiliser `position == 1`.
- Conserver la CI complète si les métadonnées natives sont absentes ou
  incomplètes, sur `main` et lors d’un lancement manuel.
- Garder l’appel à `_ci.yml` et son check requis `ci / status` sur chaque
  exécution admissible. La validation différée produit un échec explicite.
- Exiger le succès de tous les jobs sélectionnés ; un skip inattendu ne
  constitue pas une validation.
- Traiter les changements de base et l’entrée dans une stack, sans laisser
  les modifications de titre ou description annuler un run utile.
- Appeler `_ci.yml` pour tous les événements `edited` des PR hors brouillon :
  sauter cet appel ne publie que `ci`, sans le check requis `ci / status`.
  Les edits de titre ou description attendent le run actif ; ils peuvent
  ajouter une exécution, y compris lorsqu’un bot édite la PR.
- Donner à "Re-run all jobs" le sens d’une validation complète, même pour
  un étage supérieur. Aucun résultat n’est transféré entre PR.

## Conséquences

Les suites coûteuses sont évitées pendant les itérations sur les étages
supérieurs. La réduction réelle des minutes CI reste à mesurer après
activation ; une stack stabilisée doit toujours valider chaque étage.

Le feedback d’intégration arrive plus tard. Les checks différés apparaissent
en rouge, et le parcours par défaut sérialise les merges avec une validation
entre chaque étage. Un merge de plusieurs étages nécessite leur validation
complète préalable, déclenchable par un rerun.

La promotion et les notifications d’appartenance restent dépendantes des
événements GitHub. Le rerun complet fournit un chemin de récupération sans
label. La validation de ces événements sur une stack native réelle fait
partie de la recette avant activation ; les tests locaux ne la remplacent pas.

## Alternatives

- Le sommet seul ne prouve pas que chaque ancêtre peut être mergé isolément.
- Un label de report ajoute une manipulation pendant les restacks.
- La merge queue n’entre pas dans le périmètre actuel.
- Un cache de runs complets demande de prouver l’identité du contenu,
  du scope et de l’environnement ; sa complexité n’est pas retenue ici.

Le [guide CI](../../.github/README.md#ci-des-stacks-github-natives) décrit le fonctionnement et la récupération.
