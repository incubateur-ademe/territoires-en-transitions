# Serveur MCP « Territoires en Transitions »

Serveur [MCP](https://modelcontextprotocol.io) (Model Context Protocol) hébergé dans le backend, sur `POST /api/v1/mcp` (transport Streamable HTTP, sans session). Il permet à un assistant (Claude, ou tout client MCP) d'interroger la base analytique et PostHog en lecture seule, avec des chiffres sourcés par la requête qui les a produits.

Réservé à l'équipe : utilisateurs **support** (`utilisateur_support`) et super admin, via la permission `utils.mcp.read`.

## Ce que le serveur expose

| Type | Nom | Rôle |
| --- | --- | --- |
| outil | `run_sql_query` | SELECT en lecture seule sur la base analytique (schéma `public` : statistiques à J-1 ; schéma `prod` : miroir applicatif). Aperçu de 20 lignes + nombre total. |
| outil | `list_tables`, `describe_table` | Catalogue de la base analytique, limité aux objets lisibles par le rôle. |
| outil | `run_hogql_query` | HogQL sur PostHog (événements), découpage mensuel `{start}`/`{end}`, internes retirés, colonnes e-mail supprimées du résultat. |
| outil | `list_named_queries`, `run_named_query` | Catalogue de requêtes SQL revues pour les questions récurrentes (activation, activité, plans actifs, labellisation), avec paramètres ; la requête exécutée est renvoyée pour être citée. |
| outil | `get_collectivite` | Fiche d'une collectivité (par id ou SIREN) : identité, COT, accès restreint, membres actifs, nombre de plans. |
| outil | `list_plans` | Plans d'une collectivité avec pilotes, référents, fiches par statut, dernière modification et fiches modifiées sur 90 jours. |
| outil | `get_demarche_pcaet` | Démarche PCAET en cours : statut, étape, dates, pilotes, transitions possibles et conditions bloquantes, pièces attendues et leur couverture. |
| outil | `get_referentiel_scores` | Score courant sur `cae`, `eci` ou `te` : points et pourcentages, étoiles (peut recalculer un snapshot périmé). |
| outil | `find_user` | Utilisateur par e-mail : prénom, nom, état du compte, collectivités avec niveau d'accès et fonction ; ni e-mail ni téléphone en sortie. |
| outil | `list_recent_events` | 50 derniers événements PostHog d'un utilisateur sur 1 à 90 jours, requête construite côté serveur. |
| ressource | `tet://docs/regles-metier` | Règles métier, filtres obligatoires, glossaire. |
| ressource | `tet://docs/base-analytique` | Description des tables de statistiques. |
| ressource | `tet://docs/posthog-hogql` | Guide HogQL. |
| ressource | `tet://docs/esquisse-modele` | Le modèle d'esquisse (pitch Shape Up) de l'équipe et son vocabulaire. |
| prompt | `analyse-stats` | Méthode de travail + les ressources de données. |
| prompt | `esquisse-shape-up` | Arguments `sujet`, `appetit`, `contexte` : rédige un premier jet d'esquisse au format de l'équipe, chiffres sourcés par les outils, précédents lus dans Notion quand un connecteur est disponible dans la conversation. |

Les ressources sont des fichiers TypeScript dans `resources/`, repris du dashboard de Baptiste (`BaptisteTCS/dashboard_tet`) et du gabarit Notion « [FORMALISATION] ». C'est là que vit la qualité des réponses : corriger une règle métier ou le modèle d'esquisse se fait dans ces fichiers. Les requêtes nommées vivent dans `tools/run-named-query/named-queries.catalog.ts` : ajouter une question récurrente = une entrée relue par l'équipe data. Le jeu de questions de recette est dans `eval/questions-esquisse.md`.

## Formaliser une esquisse depuis Claude.ai

1. Brancher le connecteur (voir plus bas) et, pour les précédents, activer le connecteur Notion de Claude.
2. Dans une conversation, choisir le prompt `esquisse-shape-up`, renseigner le sujet (et l'appétit ou le contexte si connus).
3. L'assistant pose au plus trois questions si le sujet est flou, cherche les chiffres (requêtes nommées, puis SQL), cherche les précédents dans Notion, et rend l'esquisse en Markdown dans le modèle de l'équipe, avec une section Recherche (chaque chiffre et sa requête) et une section Inconnues.
4. Coller le texte dans la page Notion de l'esquisse. L'assistant n'écrit pas dans Notion.

Les décisions d'architecture (hébergement dans l'API, authentification, permissions, anatomie d'un outil, données personnelles) sont dans l'ADR [0021](../../../../../doc/adr/0021-serveur-mcp-dans-l-api.md).

## Outils métier et mode super admin

Les outils par collectivité ou par utilisateur vérifient les permissions de l'app sur la ressource (`collectivites.read`, `plans.read`, `demarches.pcaet.mutate`, `referentiels.read`, `collectivites.membres.read`, variante `*_confidentiel` pour une collectivité en accès restreint). Un compte support qui n'est pas membre de la collectivité doit **activer le mode super admin** dans l'app ; sans lui, l'outil répond `UNAUTHORIZED` avec cette consigne. Un compte vérifié lit déjà ce que l'app montre à tout visiteur vérifié (fiche de collectivité, plans publics).

## Sécurité

- **Authentification** : le guard global du backend (JWT Supabase). Trois sources de jeton fonctionnent : une session utilisateur, un jeton OAuth émis par Supabase Auth (connecteurs Claude.ai / Claude Desktop), un jeton de clé API (`POST /api/v1/oauth/token`).
- **Autorisation** : utilisateur humain (un jeton `service_role` est refusé) porteur de `utils.mcp.read`. Vérifiée au contrôleur et dans chaque service d'outil.
- **Lecture seule** : rôle Postgres `mcp_readonly` sur la base analytique `tet-shared` (Postgres managé Koyeb, `koyeb databases list`) : `SELECT` sur `public` et `prod`, nouvelles tables comprises (privilèges par défaut de `koyeb-adm`), aucune écriture. S'y ajoutent `default_transaction_read_only` posé à la connexion, la validation SQL (`validate-select-sql.rules.ts`), la sous-requête `LIMIT` et un `statement_timeout` de 10 s.
- **Données personnelles** : `mcp_readonly` lit tout `prod`, tables personnelles comprises (`auth_users`, `public_dcp`…) : l'accès est réservé aux comptes support. Côté PostHog, les colonnes `email` sont retirées du résultat.
- **Journalisation** : chaque requête SQL ou HogQL est tracée (requête seule, jamais les données), avec l'utilisateur et le `client_id` du contexte ; chaque appel émet l'événement PostHog `api_post_mcp`.

## Configuration

| Variable | Rôle |
| --- | --- |
| `ANALYTICS_DATABASE_URL` | URL Postgres de la base analytique (Neon, `?sslmode=verify-full`), avec le rôle lecture seule. Sans elle, les outils SQL répondent `ANALYTICS_DATABASE_NOT_CONFIGURED`. |
| `POSTHOG_PERSONAL_API_KEY` | Clé API personnelle PostHog en lecture. Sans elle, `run_hogql_query` répond `POSTHOG_NOT_CONFIGURED`. |
| `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST` | Projet et hôte PostHog (défauts : 12975, `https://eu.posthog.com`). |
| `BACKEND_PUBLIC_URL` | URL publique de l'API pour les métadonnées OAuth ; à défaut, l'en-tête Host. |

Découverte OAuth (RFC 9728) : `GET /.well-known/oauth-protected-resource` renvoie le serveur d'autorisation (`<SUPABASE_URL>/auth/v1`). Le serveur OAuth 2.1 de Supabase Auth doit être activé dans le dashboard (Authentication > OAuth Server, enregistrement dynamique des clients, chemin d'autorisation `/oauth/consent`), et l'app héberge la page de consentement.

## Brancher un client

**Claude.ai / Claude Desktop** : Paramètres > Connecteurs > Ajouter un connecteur personnalisé, URL `https://<api>/api/v1/mcp`. Claude ouvre la page de consentement de l'app ; se connecter avec son compte Territoires en Transitions (support).

**Claude Code** (ou tout client acceptant un en-tête) : obtenir un jeton avec une clé API (voir `apps/backend/QuickstartApi.md`, clé créée avec la permission `utils.mcp.read`), puis :

```sh
claude mcp add --transport http tet https://<api>/api/v1/mcp --header "Authorization: Bearer <jeton>"
```

**En local** : le backend sur `http://localhost:8080/api/v1/mcp`, avec `ANALYTICS_DATABASE_URL` pointée sur la base locale et un jeton d'un utilisateur support (session Supabase ou clé API). `npx @modelcontextprotocol/inspector` permet de parcourir outils, ressources et prompt.

## Évolutions prévues

- Outils métier typés avec les droits de l'utilisateur (collectivités, plans, scores…), pour ouvrir le MCP au-delà de l'équipe.
- Service agent sur Albert consommant ce MCP.
- Migration vers la v2 du SDK MCP (`@modelcontextprotocol/node`, zod ≥ 4.2) avant la fin de maintenance de la v1.
