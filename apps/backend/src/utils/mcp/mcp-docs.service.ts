import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BASE_ANALYTIQUE_DOC } from './resources/base-analytique.doc';
import { ESQUISSE_MODELE_DOC } from './resources/esquisse-modele.doc';
import { POSTHOG_HOGQL_DOC } from './resources/posthog-hogql.doc';
import { REGLES_METIER_DOC } from './resources/regles-metier.doc';
import { SUPPORT_CRISP_DOC } from './resources/support-crisp.doc';

type McpDoc = {
  name: string;
  uri: string;
  title: string;
  description: string;
  text: string;
};

const REGLES_METIER: McpDoc = {
  name: 'regles-metier',
  uri: 'tet://docs/regles-metier',
  title: 'Règles métier et glossaire',
  description:
    'À lire avant toute requête : les deux schémas, les filtres obligatoires, le vocabulaire métier et ses correspondances en base.',
  text: REGLES_METIER_DOC,
};

const BASE_ANALYTIQUE: McpDoc = {
  name: 'base-analytique',
  uri: 'tet://docs/base-analytique',
  title: 'Tables de statistiques (schéma public)',
  description:
    'Description de chaque table de statistiques pré-agrégées, avec leur usage et leurs pièges.',
  text: BASE_ANALYTIQUE_DOC,
};

const POSTHOG_HOGQL: McpDoc = {
  name: 'posthog-hogql',
  uri: 'tet://docs/posthog-hogql',
  title: 'PostHog et HogQL',
  description:
    'Quand et comment interroger les événements PostHog (HogQL), découpage par mois, croisement avec la base.',
  text: POSTHOG_HOGQL_DOC,
};

const ESQUISSE_MODELE: McpDoc = {
  name: 'esquisse-modele',
  uri: 'tet://docs/esquisse-modele',
  title: "Modèle d'esquisse (formalisation Shape Up)",
  description:
    "Le gabarit d'esquisse de l'équipe (problème, impact, signaux, appétit, solution, pièges, hors périmètre, recherche) et son vocabulaire.",
  text: ESQUISSE_MODELE_DOC,
};

const SUPPORT_CRISP: McpDoc = {
  name: 'support-crisp',
  uri: 'tet://docs/support-crisp',
  title: 'Support (Crisp) : segments et temps passé',
  description:
    "Taxonomie des segments Crisp du support, ses ruptures, et la méthode d'estimation du temps passé.",
  text: SUPPORT_CRISP_DOC,
};

export const MCP_DOCS: readonly McpDoc[] = [
  REGLES_METIER,
  BASE_ANALYTIQUE,
  POSTHOG_HOGQL,
  ESQUISSE_MODELE,
  SUPPORT_CRISP,
];

export const MCP_ANALYSE_STATS_PROMPT_NAME = 'analyse-stats';
export const MCP_ESQUISSE_PROMPT_NAME = 'esquisse-shape-up';
export const MCP_SUPPORT_PROMPT_NAME = 'support-conversation';
export const MCP_APP_PROMPT_NAME = 'assistant-app';

const ANALYSE_STATS_INSTRUCTIONS = `Tu assistes l'équipe de Territoires en Transitions pour répondre à des questions chiffrées sur l'usage de la plateforme, les collectivités, les plans d'action, les indicateurs et les référentiels.

Méthode :
1. Lis les règles métier ci-dessous avant la première requête.
2. Question sur une collectivité, un utilisateur ou une démarche précise : utilise les outils métier (get_collectivite, list_plans, get_demarche_pcaet, get_referentiel_scores, find_user, list_recent_events), pas la base analytique, et réponds dès qu'ils suffisent. S'ils répondent UNAUTHORIZED, transmets la consigne (activer le mode super admin) sans contourner par la base analytique.
3. Question sur l'activité du support (demandes reçues dans Crisp, types de retours, temps passé par le support, sur un sujet comme le référentiel CR) : get_support_stats pour les chiffres, puis sample_support_conversations si on te demande ce que disent les usagers ; ni la base analytique ni PostHog. Donne la période, recopie les avertissements de l'outil et présente le temps passé comme une estimation.
4. Statistique d'ensemble, ou question sur les chiffres que tu sais produire : commence par list_named_queries, jamais de mémoire ; si une requête nommée répond à la question, utilise run_named_query (SQL déjà revu). Sinon, vérifie les noms de tables et de colonnes avec list_tables et describe_table plutôt que de les deviner.
5. Privilégie le schéma public (statistiques déjà calculées) ; passe par prod pour le détail, en excluant les collectivités de test.
6. N'annonce aucun chiffre qui ne vient pas d'un résultat d'outil ; si tu ne sais pas, dis-le.
7. Cite la requête ou l'outil qui a produit chaque chiffre, pour qu'un lecteur puisse le retrouver.
8. Réponds en français, de façon factuelle et concise.`;

const SUPPORT_INSTRUCTIONS = `${ANALYSE_STATS_INSTRUCTIONS}

Tu réponds ici à un membre du support, dans une note privée de sa conversation avec un utilisateur de la plateforme. Le message peut commencer par le contexte de la conversation : le profil de l'utilisateur (sa ou ses collectivités, ses rôles) et ses derniers messages.
- « il », « elle », « l'utilisateur », « sa collectivité » désignent cet utilisateur et sa collectivité : sers-toi de leurs identifiants sans les redemander.
- Pour comprendre un blocage, croise ce qu'il écrit avec l'état réel (démarche, pièces, conditions qui bloquent, événements récents) et propose une piste concrète au support.
- Réponds en quelques lignes, en texte simple avec des puces, sans tableau ni titre.
- Une question sur le support dans son ensemble (statistiques, retours des usagers sur un sujet) ne concerne pas cet utilisateur : ignore son contexte et applique le point 3.
- Ne recopie jamais d'adresse e-mail ni de numéro de téléphone.`;

const APP_INSTRUCTIONS = `${ANALYSE_STATS_INSTRUCTIONS}

Tu réponds ici dans l'assistant de l'application, à un membre de l'équipe (support ou super admin), dans une conversation qui peut durer plusieurs tours.

Comprendre avant d'agir :
- Si la demande est ambiguë (sujet ou segment visé, période, collectivité, ce qu'on veut savoir), ne devine pas : appelle propose_choices avec une question courte et 2 à 6 réponses concrètes, puis arrête-toi. Pour un sujet du support, appuie les réponses sur les segments réels (list_support_segments). Une seule question à la fois ; si tu peux raisonnablement trancher, tranche et dis l'hypothèse retenue.
- Après une réponse, propose si c'est utile une suite en une phrase (comparer à la période précédente, voir les retours des usagers, segmenter des conversations…).

Écrire dans Crisp (rôle support seulement) :
- La seule écriture possible est l'ajout d'un segment à des conversations du support. Choisis un segment existant (list_support_segments) ; s'il n'existe pas, propose les segments proches avec propose_choices avant d'en créer un.
- Appelle prepare_segment_tagging avec le filtre le plus précis possible (sujet, termes, période), puis résume l'aperçu : nombre de conversations, segment exact, exemples. L'utilisateur confirme avec le bouton affiché sous ta réponse. Tu ne peux pas écrire toi-même : n'annonce jamais que c'est fait.
- Si l'outil répond UNAUTHORIZED, explique que l'écriture est réservée au rôle support, le mode super admin n'y donnant pas droit.

Forme : Markdown, titres courts, tableaux pour les chiffres. Ne recopie jamais d'adresse e-mail ni de numéro de téléphone.`;

const esquisseArgsSchema = {
  sujet: z
    .string()
    .describe(
      "Le sujet à formaliser, en une phrase (ex. : améliorer l'activation des communes de moins de 5 000 habitants)."
    ),
  appetit: z
    .string()
    .optional()
    .describe(
      "Appétit envisagé : 'petite' (2 semaines) ou 'grande' (6 semaines). Absent : à proposer et justifier."
    ),
  contexte: z
    .string()
    .optional()
    .describe(
      'Ce que le PS sait déjà : retours entendus, hypothèses, contraintes, liens Notion.'
    ),
};

function buildEsquisseInstructions({
  sujet,
  appetit,
  contexte,
}: {
  sujet: string;
  appetit?: string;
  contexte?: string;
}): string {
  const appetitLine = appetit
    ? `Appétit envisagé par le PS : ${appetit}. Vérifie qu'il est cohérent avec la solution ; sinon, dis pourquoi.`
    : 'Aucun appétit imposé : propose une fournée (petite, 2 semaines, ou grande, 6 semaines) et justifie-la.';
  const contexteBlock = contexte
    ? `\n\nContexte fourni par le PS :\n${contexte}`
    : '';

  return `Tu aides un product strategist (PS) de Territoires en Transitions à formaliser une esquisse (pitch Shape Up) sur le sujet suivant :

« ${sujet} »

${appetitLine}${contexteBlock}

Méthode, dans l'ordre :
1. Reformule le sujet en problème : besoin non satisfait, persona, fréquence. Si le sujet est trop flou pour avancer, pose au plus trois questions courtes ; sinon avance avec des hypothèses explicites.
2. Cherche les chiffres avec les outils de ce serveur : d'abord list_named_queries puis run_named_query (requêtes revues par l'équipe data), ensuite run_sql_query en respectant les règles métier ci-dessous, et run_hogql_query seulement pour l'usage fin d'une fonctionnalité. Pour illustrer avec des collectivités précises (exemples, cas typiques), utilise get_collectivite, list_plans et get_demarche_pcaet. Chaque chiffre cité porte sa requête ou son outil dans la section Recherche.
3. Cherche les précédents : si un connecteur Notion est disponible dans cette conversation, trouve les esquisses, rétros et retours de table des paris proches du sujet dans l'espace « Territoires en transitions » (Cycles & Roadmap, Échanges d'équipe) et cite-les avec leur lien. Sinon, écris que tu n'as pas pu consulter les précédents.
4. Rédige l'esquisse dans le modèle ci-dessous, en français, avec le vocabulaire de l'équipe. Un seul appétit, justifié. Chaque piège a un contournement. Le hors périmètre est explicite.
5. Termine par les inconnues : chiffres non obtenus, hypothèses à valider, expert à consulter.

Règles : n'invente ni chiffre ni retour utilisateur ; ne propose pas de solution dans la section Problème ; ne crée et ne modifie aucune page Notion, rends le texte au PS qui le collera lui-même.`;
}

/** Ressources (documentation) et prompts partagés par tous les outils. */
@Injectable()
export class McpDocsService {
  register(server: McpServer): void {
    for (const doc of MCP_DOCS) {
      server.registerResource(
        doc.name,
        doc.uri,
        {
          title: doc.title,
          description: doc.description,
          mimeType: 'text/markdown',
        },
        async (uri) => ({
          contents: [
            { uri: uri.href, mimeType: 'text/markdown', text: doc.text },
          ],
        })
      );
    }

    server.registerPrompt(
      MCP_ANALYSE_STATS_PROMPT_NAME,
      {
        title: 'Analyser des statistiques de la plateforme',
        description:
          'Charge les règles métier et la méthode de travail pour répondre à une question chiffrée avec les outils de ce serveur.',
      },
      async () => ({
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: ANALYSE_STATS_INSTRUCTIONS },
          },
          ...[REGLES_METIER, BASE_ANALYTIQUE, POSTHOG_HOGQL, SUPPORT_CRISP].map(
            toResourceMessage
          ),
        ],
      })
    );

    server.registerPrompt(
      MCP_SUPPORT_PROMPT_NAME,
      {
        title: 'Répondre au support sur une conversation',
        description:
          "Aide un membre du support à comprendre la situation d'un utilisateur : profil, collectivité, démarche, blocages, avec les outils de ce serveur.",
      },
      async () => ({
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: SUPPORT_INSTRUCTIONS },
          },
          ...[REGLES_METIER, POSTHOG_HOGQL].map(toResourceMessage),
        ],
      })
    );

    server.registerPrompt(
      MCP_APP_PROMPT_NAME,
      {
        title: "Assistant de l'application",
        description:
          "Conversation dans l'assistant de l'app : clarifie la demande, propose des choix, prépare les ajouts de segments Crisp à confirmer.",
      },
      async () => ({
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: APP_INSTRUCTIONS },
          },
          ...[REGLES_METIER, BASE_ANALYTIQUE, POSTHOG_HOGQL, SUPPORT_CRISP].map(
            toResourceMessage
          ),
        ],
      })
    );

    server.registerPrompt(
      MCP_ESQUISSE_PROMPT_NAME,
      {
        title: 'Formaliser une esquisse (Shape Up)',
        description:
          "Rédige un premier jet d'esquisse au format de l'équipe, chiffres sourcés par les outils de ce serveur, précédents lus dans Notion quand un connecteur est disponible.",
        argsSchema: esquisseArgsSchema,
      },
      async (args) => ({
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: buildEsquisseInstructions(args) },
          },
          ...[ESQUISSE_MODELE, REGLES_METIER].map(toResourceMessage),
        ],
      })
    );
  }
}

function toResourceMessage(doc: McpDoc) {
  return {
    role: 'user' as const,
    content: {
      type: 'resource' as const,
      resource: { uri: doc.uri, mimeType: 'text/markdown', text: doc.text },
    },
  };
}
