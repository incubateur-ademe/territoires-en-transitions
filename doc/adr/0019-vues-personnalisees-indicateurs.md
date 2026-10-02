# 19. Vues personnalisées des indicateurs

Date : 2026-09-28

## Statut

Accepté.

## Contexte

Les collectivités doivent retrouver leurs sélections d'indicateurs sans reconstruire
les filtres à chaque visite. Une vue nommée enregistre ces filtres et apparaît dans un onglet.

Le parcours permet de créer et mettre à jour les vues depuis « Filtrer », ainsi que de les renommer et de les supprimer.
Le panneau retire le bouton de réinitialisation.
Le bouton de création est nommé **« Créer une nouvelle vue »**.

## Décisions

### 1. Des vues appartenant à la collectivité

Les membres partagent les mêmes vues. Tout utilisateur ayant les **droits en écriture sur
la collectivité** peut les créer, les modifier et les supprimer, quel que soit leur auteur.
Les utilisateurs en lecture peuvent les consulter. L'auteur sert uniquement à la traçabilité ;
son départ ne supprime pas ses vues.

Le backend contrôle les droits sur la collectivité stockée. Les modifications et suppressions
ciblent `id` et `collectivite_id`, ce dernier étant immuable. Une vue ne donne aucun droit
supplémentaire sur les indicateurs ou leurs valeurs.

### 2. Persister les filtres dans le domaine `indicateurs`

Créer une ressource `indicateur_vue` sous `indicateurs/vues` :

| Donnée            | Rôle                          |
| ----------------- | ----------------------------- |
| `id`              | Identité stable de la vue     |
| `collectivite_id` | Collectivité propriétaire     |
| `nom`             | Libellé de l'onglet           |
| `filtres`         | Critères de sélection en JSON |
| auteur et dates   | Traçabilité                   |

Une vue enregistre **tous les critères actifs**, y compris la recherche textuelle et
`estFavori: true` pour les favoris de la collectivité. Les critères hérités d'un onglet
restent visibles et modifiables dans la vue créée. Ses résultats suivent l'évolution
des indicateurs ; elle ne stocke ni liste figée de résultats, ni pagination, tri ou
préférences de présentation.
Un schéma Zod partagé réutilise les primitives des filtres existants et valide les données
à l'écriture et à la lecture. Les changements incompatibles passent par une migration Sqitch.
Une vue invalide est signalée sans retirer ses critères ni bloquer les autres vues.

Les opérations passent par `indicateurs.vues`, des services avec autorisation et retour
`Result`, puis un repository Drizzle. Le stockage n'est pas directement exposé au client.

### 3. Séparer les filtres enregistrés de la consultation en cours

- Ouvrir un onglet applique ses filtres. Les modifier ou les réinitialiser ne sauvegarde rien
  automatiquement. Le bouton de suppression des filtres, situé auprès des badges hors du
  panneau, efface les critères de consultation sans modifier les vues.
- Si les filtres de la vue ouverte ont changé, **« Enregistrer les modifications »** permet
  de les remplacer explicitement. Cette action conserve son identifiant, son nom et sa
  collectivité ; elle cible toujours la vue ouverte, même si les nouveaux filtres correspondent
  à une autre vue. Une mise à jour peut enregistrer une sélection sans critère après réinitialisation.
- Le renommage d'une vue est accessible depuis le menu de l'onglet et conserve ses filtres et son identifiant.
- **« Créer une nouvelle vue »** crée une vue distincte, même si ses filtres correspondent
  à ceux d'une vue existante. Cette action nécessite au moins un critère actif.
- Comparer les filtres après normalisation partagée : ordre des clés indifférent, sélections
  dédupliquées et sans ordre, listes vides équivalentes à l'absence lorsque le moteur les ignore.
  Préserver les différences significatives, notamment `false`, et la sémantique de recherche.
- L'URL (`nuqs`) porte la consultation courante ; la base porte la définition enregistrée.
  Conserver les anciens liens filtrés et synchroniser recherche, badges et exports avec
  les critères actifs. Un changement de vue, de collectivité ou de filtres réinitialise la pagination.

Les onglets fixes restent accessibles. Les vues ajoutées sont ordonnées par création puis
identifiant ; le réordonnancement manuel reste hors périmètre. Une vue supprimée ou
inaccessible permet de revenir à la liste.

### 4. Réutiliser le moteur de liste

Le filtre « Catégorie » devient « Modèle », avec les mêmes libellés dans le menu et les badges.
Les valeurs restent les noms de catégories fournis par le serveur, sous `categorieNoms`, pour
préserver les vues et liens existants.

## Conséquences et alternatives

La persistance serveur permet le partage entre appareils et impose de maintenir la
compatibilité des filtres et leur comparaison. Une mise à jour des filtres s'applique
à tous les membres de la collectivité.

Le stockage navigateur seul ne couvre pas ce besoin. `tableau_de_bord_module` possède un
cycle de vie spécifique ; une ressource dédiée évite ce couplage. Un moteur de vues commun
à tous les domaines n'est pas justifié à ce stade.

La validation couvrira la persistance, la modification par un autre utilisateur autorisé,
le refus des mutations en lecture ou hors collectivité, la comparaison des filtres et les
parcours de création, renommage, mise à jour des filtres, suppression et réinitialisation.
Vérifier que la mise à jour conserve l’identité de la vue et reste distincte de la création.

## Références

- [Ticket Notion](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/Vues-personnalis-es-indicateurs-3d76523d57d780c08d79d7689670cda1).
- [Filtres existants](../../packages/domain/src/indicateurs/definitions/list-definitions.input.ts) et [moteur de liste](../../apps/backend/src/indicateurs/indicateurs/list-indicateurs/list-indicateurs.repository.ts).
- [Permissions](../../packages/domain/src/users/authorizations/permission.models.ts).
- [Architecture des services](0011-architecture-service-ddd.md) et [pattern Result](0012-pattern-result.md).
