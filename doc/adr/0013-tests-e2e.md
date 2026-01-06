# 11. Mise en place de tests E2E avec playwright

**Date :** 2025-10-13  
**Statut :** Proposition

## Constat

La solution comporte actuellement :

- des tests unitaires permettant de tester en particulier des fonctions pures métier (ex: parser d'expression, calcul de score)
- des tests e2e backend permettant de tester finement les endpoints backend (ex: recherche de fiches avec tous les filtres possibles). L'IA permet facilement d'accélerer la couverture de l'existant s'il n'est pas exhaustif

Par ailleurs, l'introduction de tRPC avec typage de bout en bout associé apporte un bon niveau de confiance sur la communication entre le front et le back (il est moins facilement possible de casser un appel du front vers le back).

En revanche, les parcours utilisateurs métiers complets (une série d'actions UI faisant potentiellement appel à différents endpoints tRPC) ne sont plus couverts (ou tout du moins plus couverts automatiquement) depuis que les tests cypress existants ne fonctionnent plus en CI. Et aucun nouveau test n'est ajouté pour les nouvelles fonctionnalités. La mise en place récente de playwright (y compris dans la CI) permet de remplacer ces tests et probablement de faciliter leur mise en place.

Ces tests e2e sont complémentaires dans la pyramide de test car:

- ils sont les plus proches de l'usage réel de nos utilisateurs
- ils permettent de vérifier qu'un enchainement d'action fonctionne toujours:
  - ex: tRPC ne permet pas de vérifier qu'un cache est bien invalidé lors de la mise à jour d'une entité et donc que l'affichage est bien mis à jour.
  - ex2: plus simplement, la navigation dans les différentes pages de l'application n'est plus testée actuellement.
  - ex3: les query parameters issus de manipulation UI et leur utilisation dans les appels backend n'est pas non plus testée en l'état.

Attention cependant, les tests e2e peuvent être couteux à écrire comme cela semblait le cas jusqu'à présent. La surcouche gherkin qui était en place peut expliquer une partie de ce coût de mise en place et sa suppression devrait simplifier le processus. Mais il faut surtout prêter une attention particulière au tooling permettant la mise en place facilitée de données de test ainsi qu'au partage de logique entre les tests. Il faut également être vigilant au coût de leur maintenance (robustesse aux changements, gestion des données de test) et leurs temps d'exécution en CI.

## Besoins

A la lumière de ce constat, l'objectif de ce document est de définir un cadre de test e2e permettant :

- De définir ce qui doit être testé et ce qui ne doit pas l'être. L'objectif étant de couvrir les principaux cas d'usage de la plateforme sans pour autant couvrir finement toutes les parties applicatives (ce qui serait trop couteûx). Cela doit permettre de définir dans une epic les scenari qui seront testés et d'ajuster le chiffrage en conséquence.
- De définir comment cela doit être testé (gestion des données de test et partage de logique en particulier) afin de faciliter au maximum la mise en place et d'assurer la robustesse/stabilité des tests aux changements.

## Décisions

### Périmètre des tests e2e

Les tests e2e doivent se focaliser sur des parcours utilisateurs réels comportant des navigations et une succession d'action.

Afin d'illustrer, plusieurs scenarios peuvent être pris:

- En tant qu'auditeur, je peux consulter un référentiel puis naviguer sur une mesure/sous-mesure et changer son statut, le score affiché doit avoir été mis à jour
- En tant qu'utilisateur d'une collectivité, je veux pouvoir aller consulter les messages d'une discussion sur une mesure donnée et y répondre. Le nombre de message de la mesure doit avoir été mis à jour.
- En tant qu'utilisateur sur une nouvelle collectivité, je dois pouvoir créer un plan puis une action dans ce plan et éditer cette action.

En revanche, il n'est pas nécessaire (au moins dans un premier temps) de tester l'exhaustivité des capacités d'édition d'une fiche action ou l'exhaustivité des filtres permettant de rechercher les fiches actions. En effet,

- D'une part les tests de services ou tests e2e backend doivent déjà avoir été mis en place et représentent un bon niveau pour tester l'exhaustivité des cas.
- D'autre part, cela serait relativement couteûx à mettre en place.

L'idée est donc de se limiter à un nombre restreint de tests e2e de très haut niveau couvrant le maximum de l'applicatif (en termes d'écran / navigation).

A noter que ce choix initial pourrait être remis en question en fonction:

- Des retours d'expérience de temps passé à mettre en place les premiers tests (en particulier via l'utilisation de l'enregistrement des actions).
- De l'utilisation de l'IA pour compléter / dériver un ensemble de tests plus exhaustifs à partir d'un exemple.

En particulier car si on reprend l'exemple initial: les filtres saisis par l'utilisateur peuvent tout à fait être correctement visibles dans l'interface mais ne pas être envoyés au backend (ex: mapping des query parameters ne fonctionne plus) et donc ne pas s'appliquer. En d'autres termes, un test exhaustif du backend ne garantit en aucun cas le bon fonctionnement pour l'utilisateur final. Il faudrait donc idéalement tout tester en e2e mais l'objectif est d'arriver à définir un compromis réalisable sur la durée surface de test / coût de test.

### Organisation des tests

Il est proposé d'organiser les tests avec le même découpage en domaine / sous-domaine que le reste du code. A noter cependant que par essence ce niveau de test est sensé être plus transverse. Il y aura donc des tests dans des dossiers `shared` au niveau d'un domaine lorsqu'ils touchent plusieurs sous-domaines ou même dans un dossier shared à la racine lorsque ces tests touchent plusieurs domaines d'un coup.

Afin d'illustrer ce propos, voilà des exemples de tests et l'arborescence associée:

- `plans`
  - `fiches`: scenario listant les fiches, et éditant une des fiches
  - `shared`: scenario créant un plan et une fiche dans ce plan
- `indicateurs`
- `shared`: Créant une fiche, y associant un indicateur et allant sur l'indicateur associé afin d'y renseigner une valeur. Ce test pouvant cependant également être associé au sous-domaine fiche car il s'agit du point d'entrée principal du test.

L'utilisation du point d'entrée principal / domaine principale d'un point de vue utilisateur est également à privilégier pour les notions transverses:

- La gestion des discussions est un sous-domaine factorisé d'un point de vue technique et donc rattaché au niveau du domaine de la collectivité. En revanche, d'un point de vue tests e2e, les discussions seront testées dans le contexte des actions/mesures de référentiel d'une part puis dans le contexte des fiches actions. Il y aura donc des tests placés dans referentiels/actions/discussions et d'autres dans plans/fiches/discussions. Cela n'empêche pas de partager du code de manipulation des interfaces de gestion des discussions lorsque cela est possible à travers le concept de [page object model](https://playwright.dev/docs/pom) (voir plus bas).
- Le même cas s'applique à la gestion des documents par exemple.

### Données de test / Etat nécessaire

Il est souvent nécessaire de placer la base de données dans un état spécifique afin de pouvoir tester une fonctionnalité. Plusieurs options techniques sont envisageables avec les avantages / inconvénients associés.

- **Tests e2e couvrant également la création**
  - Avantages: 
    - Couverture plus large de l'applicatif lors des étapes de création des données initiales.
  - Inconvénients:
    - Tests plus lents à écrire
    - Tests lents à executer
    - Tests pouvant plus facilement casser uniquement du fait de l'étape de préparation

- **Base de données de test vient avec un preset de données pouvant être réinitialisées**
  - Avantages: rapidité de mise en place de test et d'éxecution
  - Inconvénient: Les tests ne sont pas indépendants et peuvent "se marcher sur les pieds" au fur et à mesure que la couverture augmente. Il y a donc des problèmes de maintenance moyen terme.
  
- **Fonction SQL RPC**:
  - Avantages:
    - fonctions déjà en place pour certaines.
    - Par ailleurs, il est facile de faire en sorte que ces fonctions ne soit pas déployées sur la base de production (à travers le mécanisme de seed).
  - Inconvénient:
    - pas de contrôle de typage
    - duplication de certaines logiques entre le code SQL et le code typescript du backend

- **Fonctions typescript utilisant drizzle pour les écritures en BDD**:
  - Avantages: 
    - Toute la flexibilité sur la bdd 
    - tout en bénéficiant du typage backend à travers la définition des tables drizzle
  - Inconvénient: 
    - ne bénéficie pas de la logique implémentée côté backend (ex: un seul appel tRPC permet de créer une fiche ainsi que toutes ses relations).
  
- **Utilisation des services backend**:
  - Avantages: 
    - Bénéficie de logique implémentée côté backend 
    - Permet d'appeler des services non exposés en tRPC
  - Inconvénient: 
    - inclure dans le backend du code propre aux tests même s'il n'est pas exposé.

- **Utilisation du client tRPC**:
  - Avantages:
    - Bénéficie de logique implémentée côté backend (ex: un seul appel tRPC permet de créer une fiche ainsi que toutes ses relations).
    - Augmente la couverture de test de ces endpoints tRPC
  - Inconvénient:
    - peut amener à créer des endpoints tRPC cohérents en terme de produit mais utilisés uniquement par les tests.
    - nécessite dans certains cas de mettre en place une "surcouche" typescript enchainant plusieurs appels tRPC.

**Décision**:

- Les tests doivent être autant que possible isolés les uns des autres en créant (et supprimant) les données de test associées (collectivité, utilisateur, etc). En d'autre termes, les données de seed ne doivent pas sauf exception être utilisées.
- L'utilisation des endpoints tRPC est à privilégier au maximum lorsque cela est possible. 
- En revanche, lorsque la logique est purement propre aux tests (ex: création de collectivité de tests ce qui n'a pas de sens d'être exposé en tRPC), l'utilisation de fonctions typescript utilisant drizzle est recommandée. Ces fonctions seront placées dans la partie backend et exposées dans le domaine afin de pouvoir être utilisées à la fois dans les tests backend et dans les tests e2e (exemple: [création de collectivité de test](../../apps/backend/src/collectivites/fixtures/collectivites.test-fixtures.ts))

L'accès aux endpoints tRPC est facilité par un [fixture service](../../e2e/tests/users/users.fixture.ts) mettant à disposition des fonctions permettant la mise en place de données de test et leur suppression automatique.

### Identification des composants lors de l'écriture des tests

Il est recommandé d'utiliser l'enregistreur de test fourni par Playwright. En ce qui concerne les selecteurs (`locators`) permettant d'identifier les composants sur lesquels interragir, Playwright recommande de tester ce que l'utilisateur voit ([Test user-visible behavior](https://playwright.dev/docs/best-practices#test-user-visible-behavior)). En revanche, beaucoup d'articles recommandent également d'utiliser un attribut spécifique `data-test` afin d'assurer plus de stabilité aux tests lors d'un renommage de bouton par exemple. Il faut également noter que l'attribut `data-test` est automatiquement détecté par l'enregistreur de Playwright. Il n'est donc pas forcément évident de trancher entre les deux stratégies. Dans tous les cas, il faut bien sûr être vigilant à ne pas utiliser des selecteurs trop spécifiques de l'implémentation sous-jacente comme les classes css.

La préférence d'utilisation des roles/labels en lieu et place des data-test est défendue entre autre par le créateur de [React testing library](https://testing-library.com/docs/queries/bytestid/#api).

> Using data-testid attributes do not resemble how your software is used and should be avoided if possible. That said, they are way better than querying based on DOM structure or styling css class names.

Un autre argument en faveur de l'utilisation des roles/labels réside dans le fait que cela va également dans le sens d'une bonne accessibilité.

Les règles suivantes peuvent donc être utilisées:

1. Privilégier les sélecteurs sémantiques lorsque cela est possible

Utiliser les rôles ARIA, getByRole, getByLabel, etc.
→ Ces sélecteurs reflètent la façon dont un utilisateur (ou un lecteur d’écran) perçoit l’interface.
Ex. :

```page.getByRole('button', { name: 'Envoyer' })```

2. Utiliser data-test comme contrat explicite sinon

Quand les éléments sont complexes ou sans sémantique claire (icônes, accordeon, toggles, etc.), ajoutez un attribut data-test.
Ex. :

```page.locator('[data-test="sidebar-toggle"]')```

3. Utiliser les textes visibles pour les assertions

Les sélecteurs textuels (getByText, locator('text=...')) sont parfaits pour vérifier qu’un contenu s’affiche.
Ex. :

```await expect(page.getByText('Article ajouté au panier')).toBeVisible();```

### Partage de code entre tests

Afin de faciliter l'écriture de test, il est souvent nécessaire de partager du code d'interaction UI entre différents tests. Playwright préconise d'utiliser des [Page Object Model](https://playwright.dev/docs/pom) permettant de centraliser l'identification d'éléments d'une page et l'interraction avec ces éléments. Cela devra être mis en place avec des fichiers avec la nomenclature *.pom.ts.

## Example

Un [test simple de référence](../../e2e/tests/plans/fiches/list-fiches/list-fiches-filter.spec.ts) a été mis en place afin d'illustrer ces différents points:

- Création d'une collectivité et d'un utilisateur pour chaque test en utilisant tRPC pour la création des fiches.
- Identification des composants en utilisant en priorité `page.getByRole` lorsque cela est applicable, les data-test sinon.
- Factorisation du code en utilisant un Page Object Model.
