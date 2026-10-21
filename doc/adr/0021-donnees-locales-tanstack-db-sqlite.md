# 21. Données locales côté client avec TanStack DB et SQLite (OPFS)

Date : 2026-10-21

## Statut

Proposé.

## Contexte

Le front charge toutes ses données à la demande via tRPC et React Query. Le
cache de React Query vit en mémoire : il disparaît à chaque rechargement de
page et chaque onglet a le sien.

Le cas des référentiels montre la limite de ce modèle. Par exemple les définitions du
référentiel CAE pèsent environ 3,4 Mo de JSON, soit environ 680 Ko une
fois compressés. Elles sont publiques, identiques pour toutes les collectivités
et ne changent qu'à la publication d'une nouvelle version. Pourtant, elles
étaient retéléchargées et réanalysées à chaque ouverture d'onglet. Le plan
TET-8095
([2026-10-01-001](../plans/2026-10-01-001-perf-optim-refetch-referentiel-score-plan.md))
a déjà séparé les définitions (statiques) de l'état propre à la collectivité
(scores, pilotes, services). Il restait à ne plus retélécharger la partie
statique.

Au-delà de cette optimisation, on veut se donner la possibilité de **travailler
hors ligne** : consulter, puis à terme modifier, ses données sans connexion ou
avec une connexion médiocre. Ce n'est pas faisable sans une couche de données
locale qui :

1. survit au rechargement de la page et à la fermeture de l'onglet ;
2. reste cohérente entre plusieurs onglets ouverts sur la même base ;
3. permet de lire et combiner des données sans repasser par le serveur
   (filtres, jointures) ;
4. sait porter des écritures optimistes, puis à terme des écritures en attente
   d'envoi.

Un simple cache HTTP ne couvre que le premier point, et seulement pour des
réponses entières.

## Décision

On introduit **TanStack DB** comme couche de données locale du front, avec une
persistance **SQLite dans le navigateur** (`@tanstack/browser-db-sqlite-persistence`,
qui embarque wa-sqlite et stocke la base dans l'OPFS, l'_Origin Private File
System_).

Premier pas, volontairement limité aux définitions des actions des
référentiels :

| Donnée                                      | Collection                                                                 | Persistée        |
| ------------------------------------------- | -------------------------------------------------------------------------- | ---------------- |
| Définitions des actions (publiques)         | collection locale, alimentée par `listActionDefinitions`                   | oui, SQLite OPFS |
| État d'un référentiel pour une collectivité | `queryCollectionOptions`, adossée à la query tRPC `listActionsGroupedById` | non, mémoire     |

Le hook `useListActionsGroupedById` reconstitue son résultat par une jointure
(live query) entre les deux collections. Son contrat ne change pas pour les
consommateurs.

### Principes

1. **Le serveur reste la source de vérité.** La base locale est un cache
   structuré, pas une base primaire. Toute écriture passe par une mutation
   tRPC. Une donnée locale doit pouvoir être effacée à tout moment sans perte.
2. **On ne persiste que des données publiques tant qu'aucune décision n'a été
   prise sur le reste.** Les définitions des référentiels sont publiques. L'état
   d'une collectivité contient des noms de personnes (pilotes) : le persister
   demande d'abord de trancher les questions listées plus bas (poste partagé,
   déconnexion, RGPD).
3. **Une version décide du rechargement.** Les définitions stockées portent la
   version du référentiel. On ne les recharge que si elles sont absentes ou si
   la version publiée, renvoyée avec l'état de la collectivité, diffère. Chaque
   écart ne déclenche qu'un rechargement, jamais une boucle.
4. **La forme des lignes stockées est versionnée.** `SCHEMA_VERSION` est
   incrémenté à chaque changement de forme des lignes. La base est alors vidée
   puis rechargée (`schemaMismatchPolicy: 'reset'`).
5. **La persistance est une amélioration, pas une dépendance.** Si l'OPFS est
   indisponible (navigation privée, navigateur ancien, worker bloqué, erreur
   ultérieure de la base), on bascule sur une collection en mémoire. L'écran
   fonctionne comme avant, sans le gain de chargement.
6. **Les invalidations React Query existantes restent valables.** La collection
   d'état utilise la même clé de cache que la query tRPC. Les
   `invalidateQueries` et `setQueriesData` déjà en place continuent de
   s'appliquer sans modification.

### Conventions de code

- Le code TanStack DB d'une fonctionnalité vit dans un sous-dossier `db/`
  (`src/referentiels/actions/db/`).
- Suffixes : `*.collection.ts` (création d'une collection), `*.live-queries.ts`
  (requêtes réutilisables), `*.action.ts` (mutation optimiste via
  `createOptimisticAction`), `*.store.ts` (résultat partagé entre instances d'un
  hook).
- La logique de jointure et d'assemblage reste dans des fonctions pures, testées
  sans React (voir `assemble-actions-grouped-by-id.ts`).
- Une collection est créée une fois par périmètre (par exemple collectivité et
  référentiel) et réutilisée. On ne crée pas de collection dans le corps d'un
  composant.

## Alternatives considérées

**Cache HTTP (`Cache-Control` et version dans l'entrée de la requête).** C'est
la solution la plus simple pour le seul problème des définitions, et elle
n'ajoute aucune dépendance. Mais elle ne donne ni jointure locale, ni
cohérence entre onglets, ni écriture locale. Elle ne mène pas vers le hors
ligne.

**Persister le cache React Query (`persistQueryClient` vers IndexedDB).** Peu de
code, et cela couvre la persistance des lectures. Mais le cache est stocké
réponse par réponse, en blocs entiers : on ne peut ni interroger ni joindre ces
données, chaque modification réécrit tout le bloc, et rien n'est prévu pour
des écritures en attente.

**Moteur de synchronisation complet (réplication Postgres vers le client).**
C'est la cible la plus riche pour le hors ligne. Mais cela demande une
infrastructure côté serveur (réplication, règles d'accès par ligne exposées
au client) hors de proportion avec ce premier besoin. TanStack DB laisse cette
porte ouverte : une collection peut plus tard être branchée sur un tel moteur
sans changer les live queries qui la lisent.

**IndexedDB sans SQLite.** Pas de worker ni de wasm, donc un bundle plus
léger. Mais on perd les requêtes et les index d'un vrai moteur, et on doit
gérer soi-même la coordination entre onglets. Si le poids du worker devient
un problème, cette option est à réévaluer, la persistance étant un module
interchangeable sous TanStack DB.

## Conséquences

### Mesures du premier pas

Mesuré sur un build de production local, page Progression CAE :

| Temps avant affichage des lignes | Base locale remplie | Base locale vide | Repli en mémoire (≈ ancien comportement) |
| -------------------------------- | ------------------- | ---------------- | ---------------------------------------- |
| Processeur normal                | 530–570 ms          | 570–1 040 ms     | 960–1 015 ms                             |
| Processeur ralenti 4×            | 1,8–2,0 s           | 1,8–2,4 s        | 2,5–2,7 s                                |

En local, le réseau ne compte pas. L'écart mesure surtout l'analyse des 3,4 Mo
de JSON évitée à chaque session. Sur un vrai réseau s'ajoutent les quelque
680 Ko de définitions compressées qu'on ne télécharge plus.

### Coût

| Ajout                                    | Taille (gzip) | Chargement                                              |
| ---------------------------------------- | ------------- | ------------------------------------------------------- |
| TanStack DB (cœur, live queries)         | 104 Ko        | thread principal, pages qui lisent les référentiels     |
| `query-db-collection`                    | 16 Ko         | idem                                                    |
| Module de persistance (import dynamique) | 23 Ko         | après l'affichage                                       |
| Worker wa-sqlite (wasm inclus)           | 688 Ko        | hors thread principal, mis en cache un an (`immutable`) |

- **Première visite plus lourde.** Environ 1,5 Mo compressé contre environ
  680 Ko avant. Les visites suivantes ne téléchargent plus de définitions.
- **Le wasm est inclus en base64 dans le worker.** C'est le worker
  précompilé que publie la librairie. Servi comme fichier `.wasm` séparé, il
  tomberait à environ 550 Ko compressés au total (−140 Ko), et le navigateur
  pourrait le compiler pendant son téléchargement. La librairie ne permet pas
  de fournir son propre worker. On a essayé un patch pnpm qui fait compiler
  par Next le source du worker (publié dans le paquet), avec le paquet ajouté
  à `transpilePackages`. Le build fonctionnait, mais on l'a écarté : le patch
  est lié à la version exacte de la librairie et contourne son packaging. À
  reprendre si la librairie expose un jour une option pour fournir son propre
  worker ou l'URL du wasm.
- **À la première visite, les définitions attendent l'ouverture du worker.**
  Cela ajoute un temps d'attente sur réseau lent. L'état de la collectivité, lui,
  ne l'attend pas.

### Risques

- **Librairies jeunes.** `@tanstack/db` et la persistance SQLite sont en
  version 0.x. Il faut s'attendre à des changements d'API, et les montées de
  version demandent une relecture de leurs notes.
- **Comportements subtils de `query-db-collection`.** Exemple déjà rencontré :
  avec un `select` dérivé, `writeUpdate` ne modifie pas le cache tRPC brut. De
  plus, après une écriture directe, la collection ignore les `setQueryData`
  suivants. Pour cette raison, les écritures passent par le cache tRPC
  (`setQueryData`), que la collection observe.
- **Plusieurs onglets.** Le coordinateur élit un onglet qui écrit. On n'a pas
  éprouvé les cas limites (deux onglets qui chargent en même temps sur une base
  vide, fermeture de l'onglet qui écrit pendant une écriture).
- **Navigateurs.** Sans OPFS, on bascule en mémoire. Il faudra suivre en
  production la part d'utilisateurs concernés.

## Vers le hors ligne

Ce premier pas ne rend **rien** consultable hors ligne. Il pose la couche
locale sur laquelle les étapes suivantes s'appuieront. Chacune fera l'objet
d'une décision propre :

1. **Persister l'état des collectivités.** Prérequis : effacer la base locale à
   la déconnexion, une base par utilisateur, et un avis sur la conservation de
   données personnelles (pilotes) sur un poste éventuellement partagé.
2. **Lire hors ligne.** Il faut que l'application elle-même se charge sans
   réseau (service worker pour le code de l'app). Il faut aussi savoir
   afficher des données datées (« à jour au … ») et désactiver ce qui exige le
   serveur.
3. **Écrire hors ligne.** Il faut une file de mutations persistée, rejouée au
   retour du réseau, avec une règle de résolution des conflits. Les scores sont
   calculés côté serveur : une saisie faite hors ligne s'affiche « en attente de
   calcul » tant qu'elle n'est pas synchronisée.

## Points ouverts

- Servir le wasm séparément du worker, dès que la librairie le permet (voir
  « Coût »).
- Lancer la requête des définitions sans attendre le worker à la première
  visite, puis les écrire en base une fois celle-ci ouverte.
- Remonter vers PostHog les replis en mémoire et les durées d'ouverture de la
  base, pour suivre ces cas en production.
