import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { BASE_ANALYTIQUE_DOC } from './resources/base-analytique.doc';
import { POSTHOG_HOGQL_DOC } from './resources/posthog-hogql.doc';
import { REGLES_METIER_DOC } from './resources/regles-metier.doc';

type McpDoc = {
  name: string;
  uri: string;
  title: string;
  description: string;
  text: string;
};

export const MCP_DOCS: readonly McpDoc[] = [
  {
    name: 'regles-metier',
    uri: 'tet://docs/regles-metier',
    title: 'Règles métier et glossaire',
    description:
      'À lire avant toute requête : les deux schémas, les filtres obligatoires, le vocabulaire métier et ses correspondances en base.',
    text: REGLES_METIER_DOC,
  },
  {
    name: 'base-analytique',
    uri: 'tet://docs/base-analytique',
    title: 'Tables de statistiques (schéma public)',
    description:
      'Description de chaque table de statistiques pré-agrégées, avec leur usage et leurs pièges.',
    text: BASE_ANALYTIQUE_DOC,
  },
  {
    name: 'posthog-hogql',
    uri: 'tet://docs/posthog-hogql',
    title: 'PostHog et HogQL',
    description:
      'Quand et comment interroger les événements PostHog (HogQL), découpage par mois, croisement avec la base.',
    text: POSTHOG_HOGQL_DOC,
  },
];

export const MCP_ANALYSE_STATS_PROMPT_NAME = 'analyse-stats';

const ANALYSE_STATS_INSTRUCTIONS = `Tu assistes l'équipe de Territoires en Transitions pour répondre à des questions chiffrées sur l'usage de la plateforme, les collectivités, les plans d'action, les indicateurs et les référentiels.

Méthode :
1. Lis les règles métier ci-dessous avant la première requête.
2. Vérifie les noms de tables et de colonnes avec list_tables et describe_table plutôt que de les deviner.
3. Privilégie le schéma public (statistiques déjà calculées) ; passe par prod pour le détail, en excluant les collectivités de test.
4. N'annonce aucun chiffre qui ne vient pas d'un résultat d'outil ; si tu ne sais pas, dis-le.
5. Cite la requête qui a produit chaque chiffre, pour qu'un lecteur puisse la rejouer.
6. Réponds en français, de façon factuelle et concise.`;

/** Ressources (documentation) et prompt partagés par tous les outils. */
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
          ...MCP_DOCS.map((doc) => ({
            role: 'user' as const,
            content: {
              type: 'resource' as const,
              resource: {
                uri: doc.uri,
                mimeType: 'text/markdown',
                text: doc.text,
              },
            },
          })),
        ],
      })
    );
  }
}
