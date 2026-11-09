# CI des stacks GitHub natives

La CI conserve lint, build non runtime, typecheck et tests unitaires affectés
sur chaque PR hors brouillon. Les PR déclarées dans une stack native GitHub
diffèrent les suites coûteuses tant qu’elles dépendent d’une PR parente :
Storybook, préparation de la base, tests DB, backend/API et E2E.

La première PR non mergée reçoit la validation complète des projets affectés.
Elle est identifiée par l’égalité entre `pull_request.base.ref` et
`pull_request.stack.base.ref`. La position d’origine dans la stack ne suffit
pas : elle peut rester supérieure à 1 après le merge des premiers étages.

Les PR sans métadonnées natives complètes, y compris les branches empilées
manuellement, conservent la validation complète. Les pushes sur `main` et
les lancements manuels de Main CI conservent également cette validation.

## Checks et merge

Le workflow réutilisable reste appelé et publie `ci / status`. Ce check est
rouge tant que la validation complète est différée, même si les checks
rapides passent. Il explique la raison dans son résumé. Un job attendu
mais sauté, échoué ou annulé bloque également le merge.

Le merge de la PR parente provoque la promotion de l’étage suivant. Le
workflow traite les pushes et changements de branche cible pour lancer sa
validation complète. Les modifications du titre ou de la description ne
doivent pas annuler une validation en cours.

Le fonctionnement par défaut implique un merge étage par étage, avec une
attente de CI entre les merges. Les résultats d’une PR ne valident jamais
une autre PR de la stack.

## Lancer la validation complète sans attendre

Dans le run Pull request CI de la PR, choisir **Re-run all jobs**. Toute
nouvelle tentative exécute la validation complète, y compris pour un étage
supérieur. Cela permet aussi de récupérer une PR retirée d’une stack sans
nouveau push. **Re-run failed jobs** ne suffit pas : le calcul du mode doit
être réexécuté.

Pour fusionner plusieurs étages en une fois, chaque PR concernée doit avoir
obtenu son propre verdict complet sur sa version courante.

## Vérification locale

```sh
node --test .github/actions/ci/native-stack-policy/*.spec.mjs
```

Ces tests utilisent uniquement des événements et résultats synthétiques,
sans GitHub, base de données ou fournisseur LLM. Ils sont aussi exécutés
au début du job `analyze-affected`.

Voir la [décision et ses compromis](../adr/0023-ci-progressive-stacks-natives.md)
et la [documentation GitHub](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/optimizing-ci-for-stacked-pull-requests).
