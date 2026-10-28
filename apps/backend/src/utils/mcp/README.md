# Serveur MCP « Territoires en Transitions »

Serveur [MCP](https://modelcontextprotocol.io) (Model Context Protocol) hébergé dans le backend, sur `POST /api/v1/mcp` (transport Streamable HTTP, sans session). Il permet à un assistant (Claude, ou tout client MCP) d'interroger la base analytique et PostHog en lecture seule, avec des chiffres sourcés par la requête qui les a produits.

Réservé à l'équipe : utilisateurs **support** (`utilisateur_support`) et super admin, via la permission `utils.mcp.read`.

## Ce que le serveur expose

| Type | Nom | Rôle |
| --- | --- | --- |
| outil | `run_sql_query` | SELECT en lecture seule sur la base analytique (schéma `public` : statistiques à J-1 ; schéma `prod` : miroir applicatif). Aperçu de 20 lignes + nombre total. |
| outil | `list_tables`, `describe_table` | Catalogue de la base analytique, limité aux objets lisibles par le rôle. |
| outil | `run_hogql_query` | HogQL sur PostHog (événements), découpage mensuel `{start}`/`{end}`, internes retirés, colonnes e-mail supprimées du résultat. |
| ressource | `tet://docs/regles-metier` | Règles métier, filtres obligatoires, glossaire. |
| ressource | `tet://docs/base-analytique` | Description des tables de statistiques. |
| ressource | `tet://docs/posthog-hogql` | Guide HogQL. |
| prompt | `analyse-stats` | Méthode de travail + les trois ressources. |

Les ressources sont des fichiers TypeScript dans `resources/`, repris du dashboard de Baptiste (`BaptisteTCS/dashboard_tet`). C'est là que vit la qualité des réponses : corriger une règle métier se fait dans ces fichiers.

## Sécurité

- **Authentification** : le guard global du backend (JWT Supabase). Trois sources de jeton fonctionnent : une session utilisateur, un jeton OAuth émis par Supabase Auth (connecteurs Claude.ai / Claude Desktop), un jeton de clé API (`POST /api/v1/oauth/token`).
- **Autorisation** : utilisateur humain (un jeton `service_role` est refusé) porteur de `utils.mcp.read`. Vérifiée au contrôleur et dans chaque service d'outil.
- **Lecture seule** : rôle Postgres en lecture seule sur la base analytique (hors dépôt, à créer par l'équipe data), `default_transaction_read_only` posé à la connexion, validation SQL (`validate-select-sql.rules.ts`), sous-requête `LIMIT`, `statement_timeout` de 10 s.
- **Données personnelles** : le rôle analytique n'a pas accès aux tables personnelles (`auth_users`, `dcp`, droits, membres…) ; côté PostHog, les colonnes `email` sont retirées du résultat.
- **Journalisation** : chaque requête SQL ou HogQL est tracée (requête seule, jamais les données), avec l'utilisateur et le `client_id` du contexte ; chaque appel émet l'événement PostHog `api_post_mcp`.

## Configuration

| Variable | Rôle |
| --- | --- |
| `ANALYTICS_DATABASE_URL` | URL Postgres de la base analytique, avec le rôle lecture seule. Sans elle, les outils SQL répondent `ANALYTICS_DATABASE_NOT_CONFIGURED`. |
| `ANALYTICS_DATABASE_SSL_ROOT_CERT` | CA PEM optionnelle, comme pour la base principale. |
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
