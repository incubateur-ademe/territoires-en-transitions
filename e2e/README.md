# Test e2e avec Playwright

## Jouer les tests existants

Avant tout, il faut lancer le projet : `pnpm dev:app`.

Ensuite, pour exécuter les tests, il y a plusieurs méthodes possibles.

TLDR ? Une explication en vidéo [ici](https://www.youtube.com/watch?v=Xz6lhEzgI5I&list=PLQ6Buerc008dhme8fC80zmhohqpkA0aXI) (durée : 7 minutes)

⚠️ Comme le projet met un peu de temps à se lancer (avec les pages qui se construisent au fil des visites), il peut être nécessaire de lancer les tests plusieurs fois avant qu'ils réussissent.

### Méthode 1 : outil visuel (recommandée)

Playwright propose un outil très pratique pour jouer les tests et en visualiser les étapes.
Pour l'utiliser :

```
pnpm exec playwright test --ui
```

Quelques fonctionnalités intéressants :

- Before/after : permet de voir l'état du front avant et après une étape donnée du test
- Watch mode : écoute les modifications faites dans VS Code pour un test donné
- Pick locator (icône cible) : permet de récupérer le locator d'un élément d'ui en survolant cet élément

TLDR ? Une explication en vidéo [ici](https://www.youtube.com/watch?v=d0u6XhXknzU&list=PLQ6Buerc008dhme8fC80zmhohqpkA0aXI&index=4) (durée : 6 minutes)

### Méthode 2 : extension VS Code

Au préalable, il faut installer l'extension Playwright pour VS Code. Une fois que cela est fait, dans le fichier de test, des flèches permettant de jouer le test apparaissent.

Une fois le test joué, une fenêtre de navigateur s'ouvre et le test qui vient de s'exécuter se rejoue visuellement.

### Méthode 3 : dans le terminal

Pour exécuter les tests et voir le résultat dans le terminal, la commande est :

```
pnpm exec playwright test
```

Dans ce cas, un simple output dans le terminal nous dit si les tests passent.

## Créer des tests (le plus important 💖)

Playwright propose un outil de génération des tests 🤯

Celui-ci permet de réaliser des actions dans le front de l'app et de générer les tests automatiquement.
Plus d'infos [ici](https://playwright.dev/docs/codegen-intro).

Pour lancer le générateur de tests :

```
npx playwright codegen
```

TLDR ? Une explication en vidéo [ici](https://www.youtube.com/watch?v=LM4yqrOzmFE&list=PLQ6Buerc008dhme8fC80zmhohqpkA0aXI&index=3) (durée : 7 minutes)
