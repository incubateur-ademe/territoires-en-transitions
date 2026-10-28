// Guide HogQL servi au modèle comme ressource MCP `tet://docs/posthog-hogql`.
// Adapté de data/posthog_hogql.md du dashboard de Baptiste
// (BaptisteTCS/dashboard_tet) : sans espace de travail DuckDB ni `save_as`.

export const POSTHOG_HOGQL_DOC = `# PostHog (HogQL) : événements de l'application

Ressource pour \`run_hogql_query\`. Adaptée du guide \`data/posthog_hogql.md\` du dashboard de Baptiste (BaptisteTCS/dashboard_tet).

## Quand utiliser PostHog

- PostHog contient les événements de l'application : pages vues, clics, navigation, sessions, usage fin d'une fonctionnalité.
- Pour compter des utilisateurs actifs ou la fréquentation, privilégier \`public.activite_semaine\` (source de vérité, qui contourne les bloqueurs de publicité). PostHog sert au détail : quelles pages, quels parcours, quelles fonctionnalités.
- Si la question se résout avec la base analytique seule, ne pas utiliser PostHog.
- Les événements PostHog sont quasi temps réel ; les tables de statistiques sont à J-1.

## Écrire une requête HogQL

- Table principale : \`events\` (colonnes \`event\`, \`timestamp\`, \`distinct_id\`, \`properties\`, \`person\`).
- Propriétés d'événement : \`properties.<nom>\` (ex. \`properties.collectivite_id\`, \`properties.$current_url\`, \`properties.$pathname\`). Propriétés de la personne : \`person.properties.<nom>\` (ex. \`person.properties.email\`).
- Page vue : \`event = '$pageview'\`. Pour découvrir les autres événements : \`SELECT event, count() AS n FROM events WHERE timestamp >= now() - INTERVAL 30 DAY GROUP BY event ORDER BY n DESC LIMIT 200\`. Pour voir les propriétés d'un événement : \`SELECT properties FROM events WHERE event = '...' LIMIT 5\`.
- Filtrer l'app de production : \`properties.$current_url ILIKE '%app.territoiresentransitions.fr%'\`.
- Toujours filtrer une plage de \`timestamp\` : sans filtre de date, la requête est lente et peut expirer. Commencer par 30 à 90 jours.
- Fonctions de date : \`toStartOfWeek(timestamp)\`, \`toStartOfMonth(timestamp)\`, \`toDate(timestamp)\`, \`now() - INTERVAL 90 DAY\`.
- Mettre toujours un \`LIMIT\` explicite (50 000 au maximum) : sans \`LIMIT\`, PostHog ne renvoie que 100 lignes.
- Agréger et filtrer au maximum côté PostHog (\`GROUP BY\`, \`DISTINCT\`, filtres d'URL et d'événement) : ne pas rapatrier d'événements bruts.
- Donner des alias simples en minuscules à toutes les colonnes (\`AS email\`, \`AS collectivite_id\`, \`AS semaine\`).
- HogQL suit le dialecte ClickHouse, pas PostgreSQL : \`toDate(x)\`, \`toInt64OrNull(x)\`, \`toString(x)\`, \`today()\`, \`INTERVAL 3 MONTH\`, \`toStartOfMonth(d)\`, \`argMax(valeur, date)\` avec \`GROUP BY\` à la place de \`DISTINCT ON\`, \`UNION DISTINCT\`, \`arrayStringConcat(groupArray(x), ', ')\`. \`count(DISTINCT x)\` est exact, \`uniq(x)\` est approximatif. \`a / b\` renvoie un flottant ; protéger les divisions par zéro avec \`if(b = 0, NULL, a / b)\`. Avec \`NULL\`, \`x != 'test'\` est faux : écrire \`coalesce(x, '') != 'test'\`. Un \`LEFT JOIN\` sans correspondance donne la valeur par défaut du type (chaîne vide, 0), pas \`NULL\`.
- \`person.properties.email\` est nul pour les visiteurs anonymes.

## Découpage par mois (\`{start}\` / \`{end}\`)

Une requête renvoie 50 000 lignes au maximum. Pour une période longue, utiliser les marqueurs \`{start}\` et \`{end}\` et fournir \`dateFrom\` (et \`dateTo\`, sinon maintenant) : la requête est exécutée mois par mois (24 mois au maximum) puis les résultats sont concaténés et dédoublonnés. Si \`meta.truncatedWindows\` n'est pas vide, une fenêtre a atteint la limite : ajouter des filtres ou agréger davantage.

Exemple (\`dateFrom = '2025-01-01'\`) :

\`\`\`sql
SELECT DISTINCT
    toStartOfWeek(timestamp) AS semaine,
    properties.collectivite_id AS collectivite_id,
    person.properties.email AS email,
    properties.$current_url AS url
FROM events
WHERE event = '$pageview'
  AND properties.collectivite_id IS NOT NULL
  AND timestamp >= toDateTime('{start}', 'UTC')
  AND timestamp < toDateTime('{end}', 'UTC')
  AND properties.$current_url ILIKE '%app.territoiresentransitions.fr%'
LIMIT 50000
\`\`\`

Sans marqueurs, la requête est exécutée une seule fois : mettre soi-même un filtre sur \`timestamp\`.

## Utilisateurs internes et adresses e-mail

Les lignes dont la colonne \`email\` appartient aux utilisateurs internes (\`public.internal_users\`) sont retirées automatiquement (\`meta.internalRowsRemoved\`), à condition de nommer la colonne exactement \`email\`. **La colonne \`email\` est ensuite supprimée du résultat renvoyé** : utiliser \`count(DISTINCT person.properties.email)\` pour compter des personnes, pas pour les lister.

## Croiser PostHog et la base analytique

Il n'y a pas d'espace de travail partagé entre les deux sources. Démarche : agréger côté PostHog par \`collectivite_id\` (texte, à convertir avec \`toInt64OrNull\`), puis réinjecter les identifiants obtenus dans \`run_sql_query\` (\`WHERE collectivite_id IN (...)\`) pour enrichir avec \`prod.*\` ou \`public.*\`. Garder des listes courtes (quelques centaines d'identifiants) ; au-delà, agréger davantage.
`;
