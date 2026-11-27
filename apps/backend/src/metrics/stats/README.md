# Route `/api/stats` — KPI publique

Route publique qui expose, au format commun de l'Accélérateur de la transition
écologique, le **nombre de fiches action créées par période**. Elle est lue
par le tableau de bord des startups de l'incubateur (`stats.incubateur.ademe.fr`).

Spec commune : [Route /stats (Notion)](https://app.notion.com/p/accelerateur-transition-ecologique-ademe/Route-stats-9ccb601c7b9649878b2568b175e86456).

## URL

| Environnement | URL                                                         |
| ------------- | ----------------------------------------------------------- |
| Prod          | `https://api.territoiresentransitions.fr/api/stats`         |
| Staging       | `https://staging-api.territoiresentransitions.fr/api/stats` |
| Local         | `http://localhost:8080/api/stats`                           |

La spec impose le chemin `/api/stats` : la route est donc servie **hors du
préfixe `api/v1`** (entrée `api/stats` dans `GLOBAL_PREFIX_EXCLUDED_PATHS`,
`utils/nest/global-prefix.ts`). Pas d'authentification.

## Paramètres (query string)

| Paramètre     | Type                                 | Défaut            | Effet                                                        |
| ------------- | ------------------------------------ | ----------------- | ------------------------------------------------------------ |
| `periodicity` | `day` \| `week` \| `month` \| `year` | `month`           | Taille de la période.                                        |
| `since`       | entier, 1 à 3660                     | tout l'historique | Nombre de périodes renvoyées, **période en cours comprise**. |

Exemples :

```bash
curl 'https://api.territoiresentransitions.fr/api/stats'                          # par mois, tout l'historique
curl 'https://api.territoiresentransitions.fr/api/stats?periodicity=week&since=12' # 12 dernières semaines
curl 'https://api.territoiresentransitions.fr/api/stats?periodicity=day&since=30'  # 30 derniers jours
```

## Réponse

```json
{
  "description": "Nombre de fiches action créées par semaine",
  "stats": [
    { "value": 412, "date": 1756684800000 },
    { "value": 0, "date": 1757289600000 }
  ]
}
```

- `date` : **timestamp UTC en millisecondes** du début de la période, à 00:00
  UTC (format préféré par la spec). Les semaines commencent le lundi (ISO).
- `value` : nombre de créations sur la période, **non cumulé**.
- La série est **continue** : une entrée par période, de la première à la
  période en cours incluse, `0` quand rien n'a été créé.
  - avec `since` : exactement `since` entrées ;
  - sans `since` : depuis la période de la première fiche créée.
- La période en cours est incomplète : sa valeur augmente jusqu'à sa fin.

## Ce qui est compté

Une ligne de `fiche_action` (base applicative) par fiche créée, datée par
`created_at`, en excluant :

- les **sous-actions** (`parent_id` renseigné) ;
- les **fiches supprimées** (`deleted` vrai) ;
- les fiches des **collectivités de test** (`collectivite.type = 'test'`) ;
- les fiches sans `created_at` (anciennes sous-actions migrées).

Les deux premières règles sont celles du calcul North Star « création de
fiches » de tet-stats ; l'exclusion des collectivités de test s'y ajoute parce
que la valeur est publique. Une fiche créée puis supprimée sort du compte de
sa période : les valeurs passées peuvent donc baisser légèrement.

La requête est dans `get-stats.repository.ts`.

## Comportement HTTP

| Cas                               | Réponse                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `GET` valide                      | `200` + JSON ci-dessus                                        |
| `periodicity` ou `since` invalide | `400`                                                         |
| `POST`, `PUT`, `PATCH`, `DELETE`… | `405` + en-tête `Allow: GET, OPTIONS`                         |
| `OPTIONS` (pré-vol CORS)          | `204`, géré par le middleware CORS global de `main.ts`        |
| Trop de requêtes                  | `429`, limiteur global (`PUBLIC_API_THROTTLE_TTL` / `_LIMIT`) |
| Erreur base de données            | `500`                                                         |

**Cache** : `Cache-Control: public, max-age=N`, où `N` ne dépasse jamais la
fin de la période en cours (règle de la spec) et reste plafonné à 1 h pour
que la période en cours se mette à jour. Pas de cache côté serveur : la
requête est un simple `group by` sur `fiche_action`.

La route apparaît dans la doc OpenAPI (`/api-docs/v1`, tag « Statistiques »).

## Organisation du code

```
metrics/stats/
  get-stats.controller.ts         # Route REST GET /api/stats (+ 405 pour les autres méthodes)
  get-stats.input.ts              # Schéma Zod des paramètres
  get-stats.output.ts             # Schéma Zod de la réponse
  get-stats.service.ts            # Orchestration, renvoie un Result
  get-stats.repository.ts         # Requête Drizzle : comptes par période
  get-stats.rules.ts              # Règles pures : périodes, série continue, cache
  get-stats.rules.spec.ts         # Tests unitaires des règles
  get-stats.controller.e2e-spec.ts # Tests e2e de la route (vraie base de test)
```

Le contrôleur est déclaré dans `metrics/metrics.module.ts`.

## Tests

```bash
nx test backend 'get-stats.rules.spec.ts'          # unitaires, sans base
nx test backend 'get-stats.controller.e2e-spec.ts' # e2e, base locale requise (make db-init)
```

La spec e2e insère des fiches datées de 1990 (antérieures à toute donnée de
test) pour pouvoir vérifier une valeur exacte malgré les autres specs qui
créent des fiches en parallèle.

## Faire évoluer

- **Changer le périmètre compté** : modifier le `where` de
  `get-stats.repository.ts`, la section « Ce qui est compté » ci-dessus et le
  test e2e. La valeur étant suivie dans le temps par l'incubateur, prévenir
  l'équipe produit avant de la changer.
- **Changer le libellé** : `getStatsDescription` (`get-stats.rules.ts`). Il
  sert de légende de graphe : rester explicite et court.
- **Exposer une autre KPI** : la spec prévoit une seule route par startup.
  Pour une autre mesure, en discuter d'abord avec l'Accélérateur plutôt que
  d'ajouter des paramètres.
