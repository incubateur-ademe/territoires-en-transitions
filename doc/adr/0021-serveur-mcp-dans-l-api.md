# 21. Serveur MCP hébergé dans l'API

Date : 2026-10-29

## Statut

Proposé.

## Contexte

L'équipe veut interroger les données de la plateforme depuis un assistant
conversationnel : chiffrer une esquisse (pitch Shape Up), comprendre la
situation d'une collectivité pour le support, et, à terme, offrir un assistant
aux collectivités elles-mêmes (« où en est mon PCAET ? »). La demande d'origine
(rétrospective, octobre 2026) était de « brancher Claude sur la base ».

Brancher un LLM directement sur la base de production poserait trois problèmes :
les données personnelles partiraient chez un fournisseur de modèle, la base de
production porterait des requêtes ad hoc, et l'accès serait lié à un outil
précis. Il fallait plutôt un accès propre à l'application, encadré, et
indépendant du modèle qui l'utilise.

Le [Model Context Protocol](https://modelcontextprotocol.io) (MCP) est le
standard ouvert qui décrit ce qu'un assistant peut lire ou faire : des
**outils** (fonctions typées), des **ressources** (documents de référence) et
des **prompts** (points d'entrée guidés). Claude, et de plus en plus d'autres
clients, savent s'y connecter.

Trois couches évoluent à des rythmes différents :

- **les outils** : ce que l'assistant peut lire, puis faire (ce serveur MCP) ;
- **le cerveau** : le modèle et sa boucle d'appels d'outils (Claude via ses
  connecteurs aujourd'hui, un agent sur Albert ensuite) ;
- **les interfaces** : Claude.ai et Claude Code, Crisp pour le support, l'app.

Plusieurs briques existaient déjà et ont été reprises plutôt que refaites :

- le tableau de bord de l'équipe data, avec sa base analytique séparée
  (schéma `prod` en miroir, schéma `public` de statistiques à J-1), sa
  validation SQL en lecture seule, son outil HogQL pour PostHog, et surtout sa
  couche sémantique (documentation des tables, glossaire, pièges, règles
  métier) ;
- le backend : authentification par JWT Supabase et clés d'API (ADR 7),
  modèle de permissions, pattern `Result` (ADR 12), journalisation ;
- Supabase Auth, qui sait jouer le rôle de serveur d'autorisation OAuth 2.1.

## Décision

### 1. Un adaptateur de protocole dans l'API

Le serveur MCP vit dans le backend NestJS, dans `apps/backend/src/utils/mcp/`,
au même titre que `utils/trpc/` : c'est une façon d'exposer des services, pas
un domaine. Il répond sur `POST /api/v1/mcp` en Streamable HTTP, **sans
session** : chaque requête construit son serveur MCP, fermé avec la réponse.
Cela tient avec plusieurs instances derrière un répartiteur de charge, sans
état partagé.

Pas d'instance séparée à exploiter, pas de second système d'authentification.
Le SDK officiel `@modelcontextprotocol/sdk` est utilisé directement ; un
framework MCP pour NestJS a été écarté (versions incompatibles avec le reste du
dépôt, guards dupliquant les nôtres).

### 2. L'authentification de l'API, rien de plus

Le guard global de l'API authentifie les appels MCP comme les autres :

- **OAuth 2.1** pour les clients distants (Claude.ai, Claude Desktop,
  `mcp-remote`) : Supabase Auth est le serveur d'autorisation, avec
  enregistrement dynamique des clients ; l'API publie ses métadonnées de
  ressource protégée (RFC 9728, `/.well-known/oauth-protected-resource`) et
  répond `401` avec l'en-tête `WWW-Authenticate` qui y renvoie ; l'app héberge
  la page de consentement (`/oauth/consent`) ;
- **clés d'API** pour les scripts et les clients qui acceptent un en-tête.

Un jeton `service_role` est refusé : chaque appel est fait par une personne
identifiée.

### 3. Les permissions de l'app, vérifiées dans chaque outil

L'autorisation se fait en deux temps, sans permission nouvelle pour les
données :

1. **À l'entrée** : la permission `utils.mcp.read`, accordée aux rôles
   plateforme `SUPPORT` et `SUPER_ADMIN`. Le MCP est réservé à l'équipe tant
   qu'il n'est pas ouvert explicitement.
2. **Dans chaque outil** : les permissions existantes sur la ressource
   (`collectivites.read`, `plans.read`, `demarches.pcaet.mutate`,
   `referentiels.read`…, en variante `*_confidentiel` pour une collectivité en
   accès restreint), **vérifiées explicitement par l'outil**, même quand le
   service appelé en fait une, parce que plusieurs services n'en font pas.

Le refus est la règle (_fail-closed_). Un compte support lit les données d'une
collectivité dont il n'est pas membre en activant le mode super admin, comme
dans l'app ; le message d'erreur renvoyé au modèle le dit.

Conséquence voulue : ouvrir un outil aux collectivités ne demande aucun travail
de droits, seulement de retirer la porte `utils.mcp.read` pour cet outil.

### 4. Les données : jamais de SQL libre sur la production

- **Analytique** : le SQL libre (`run_sql_query`) ne vise que la base
  analytique, par une connexion distincte, avec un rôle Postgres en lecture
  seule sans les tables nominatives, `default_transaction_read_only` posé à la
  connexion, une validation du texte SQL, une sous-requête `LIMIT` et un délai
  de 10 s. Les questions récurrentes passent par des **requêtes nommées**
  revues par l'équipe data.
- **Métier** : les outils par collectivité ou par utilisateur appellent les
  services applicatifs ou des requêtes Drizzle typées sur la base de
  production, après contrôle des droits. Pas de SQL fourni par le modèle.
- **PostHog** : requêtes HogQL fournies par le modèle pour l'analytique (avec
  retrait des utilisateurs internes et des colonnes e-mail), ou construites
  côté serveur pour le parcours d'une personne.
- **Données personnelles** : noms de personnes (pilotes, référents, membre
  cherché) quand la question les demande ; jamais d'e-mail, de téléphone ni
  d'identifiant interne en sortie.
- **Une seule écriture tolérée** : la lecture du score courant peut recalculer
  et enregistrer un snapshot périmé, comme dans l'app ; l'outil n'est pas
  annoncé en lecture seule.

### 5. Anatomie d'un outil

Chaque outil est un dossier `tools/<verbe-entite>/` :

| Fichier | Rôle |
| --- | --- |
| `*.service.ts` | `run(input, { user }): Result<…>` ; contrôle des droits en tête ; orchestration des services de l'app |
| `*.tool.ts` | `registerTool` : nom `snake_case` en anglais, titre et description en français, `inputSchema` et `outputSchema` zod, annotations (`readOnlyHint`, `idempotentHint`…) |
| `*.repository.ts` | lectures Drizzle propres à l'outil, s'il en faut |
| `*.spec.ts` / `*.e2e-spec.ts` | règles pures en unitaire ; droits et lectures réelles en e2e |

La description d'un outil est écrite pour le modèle : quand l'utiliser, ce
qu'il renvoie, ses limites. Un résultat chiffré permet de retrouver sa source
(requête exécutée, nom de la requête revue).

### 6. La connaissance dans des ressources, pas dans le code

Règles métier, documentation des tables, guide HogQL et modèle d'esquisse sont
des ressources MCP versionnées dans `utils/mcp/resources/*.doc.ts`. Les prompts
(`analyse-stats`, `esquisse-shape-up`) les assemblent en points d'entrée. La
qualité des réponses se règle en éditant ces fichiers et le catalogue de
requêtes nommées, avec l'équipe data, pas en touchant aux outils.

### 7. Ce que cette couche ne fait pas

- **Aucun appel à un modèle** : le cerveau est toujours un client du MCP
  (Claude, ou l'agent du backend, à côté de cette couche, cf. décision 8).
- **Pas de double emploi avec les connecteurs du client** : dans Claude.ai,
  Notion est lu par le connecteur Notion de Claude ; le MCP n'expose que ce qui
  est propre à Territoires en Transitions.
- **Pas d'écriture métier pour l'instant** : les futurs outils d'écriture
  (import de plan…) seront annoncés non idempotents et destructifs, pour que le
  client demande confirmation, et s'exécuteront avec les droits de
  l'utilisateur.

### 8. Le cerveau du backend : un client MCP en mémoire

L'agent du backend (`utils/assistant/`, mutation tRPC `assistant.ask`) est un
client de ce même serveur, branché en mémoire (`InMemoryTransport`) sur le
`McpServer` construit pour l'utilisateur : mêmes outils, mêmes permissions,
même prompt que dans Claude.ai, sans saut réseau ni seconde authentification.

- Le fournisseur est neutre : `LlmService.chat` (appels d'outils) est
  implémenté pour Albert et Gemini, choisi par `LLM_PROVIDER`.
- L'historique est porté par l'appelant ; rien n'est stocké.
- Depuis Crisp (`/tet`, appelé par `apps/tools` avec le jeton service),
  l'agent agit au nom de l'opérateur support, lu comme en mode super admin
  mais limité aux opérations de lecture des outils MCP : l'élévation n'est
  posée que par le code serveur, jamais tirée d'un jeton.
- La boucle est bornée (8 appels au modèle, 4 outils par tour, 120 s). Un
  outil inconnu, des arguments illisibles, un refus de droits ou un appel
  répété reviennent au modèle comme une erreur qu'il peut corriger ; au
  plafond, un dernier tour sans outils force une réponse.
- La qualité se mesure par une évaluation réelle (`make assistant-eval`) qui
  juge les actes (outils, arguments, absence d'e-mail ou de chiffre non
  sourcé) et pas la prose ; une empreinte du prompt et des outils, vérifiée en
  CI, signale qu'il faut la relancer.

Première évaluation (29/10/2026, 9 scénarios hors base analytique) :
gpt-oss-120b sur Albert 9/9, gemini-3.5-flash 8/9, Albert deux fois plus
sobre en tokens.

## Alternatives considérées

- **Brancher Claude sur la base de production** (serveur MCP Postgres
  générique) : refusé. Données personnelles exposées, requêtes ad hoc sur la
  production, accès lié à un fournisseur.
- **Un serveur MCP Python à côté du tableau de bord de l'équipe data** :
  rapide à écrire, mais une instance de plus, une authentification à refaire,
  et aucun accès aux services et permissions de l'app pour les outils métier.
- **Des permissions propres au MCP** (« le support lit tout ») : refusé. Deux
  modèles de droits finiraient par diverger, et l'ouverture aux collectivités
  demanderait de tout reprendre.
- **Un framework MCP pour NestJS** : écarté pour l'instant (cf. décision 1).
- **Le connecteur PostHog officiel seul** : gardé en complément, pas en
  remplacement. Il renvoie les données brutes, e-mails compris, et ignore nos
  conventions (internes, application de production).

## Conséquences

Positives :

- les services, permissions, journalisation et configuration de l'app sont
  réutilisés ; un outil métier est surtout de l'orchestration ;
- l'accès est indépendant du modèle : changer de cerveau ou d'interface ne
  touche pas aux outils ;
- les outils métier sont prêts à être ouverts aux collectivités, avec leurs
  droits.

Négatives et points d'attention :

- un compte support doit activer le mode super admin pour lire une
  collectivité dont il n'est pas membre ; un compte vérifié lit déjà ce que
  l'app montre à tout visiteur vérifié ;
- la base analytique et son pipeline de mise à jour reposent sur l'équipe
  data ; son hébergement et ses accès d'administration sont à partager ;
- le SDK MCP est en v1 (compatible avec la version de zod du dépôt) ; la v2
  demandera une montée de zod et une migration avant début 2027 ;
- le serveur d'autorisation OAuth de Supabase est en bêta et devra être
  remplacé si l'application quitte Supabase Auth.

Suite prévue, sur la même base : le support dans Crisp (`/tet <question>` en
note privée, avec le contexte de la conversation), puis l'assistant dans
l'app.

Références : `apps/backend/src/utils/mcp/README.md` (mode d'emploi, outils,
configuration), `apps/backend/src/utils/assistant/README.md` (agent, évaluation)
et le ticket de pilotage « Assistant TeT » dans Notion.
