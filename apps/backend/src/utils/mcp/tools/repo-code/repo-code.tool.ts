import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { REPO_FULL_NAME } from '../../resources/carte-du-depot.doc';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';
import {
  listRepoFilesInputSchema,
  readCodeInputSchema,
  RepoCodeService,
  searchCodeInputSchema,
} from './repo-code.service';

/** GitHub est un service tiers : les réponses dépendent de son état. */
const REPO_TOOL_ANNOTATIONS = {
  ...READ_ONLY_TOOL_ANNOTATIONS,
  openWorldHint: true,
};

/**
 * Lecture du code source pour les clients sans connecteur GitHub, à commencer
 * par l'agent du backend : chercher, lister un dossier, lire un fichier.
 */
@Injectable()
export class RepoCodeTool implements McpTool {
  constructor(private readonly repoCodeService: RepoCodeService) {}

  register(server: McpServer): void {
    server.registerTool(
      'search_code',
      {
        title: 'Chercher dans le code source',
        description: `Cherche des mots dans le code du dépôt ${REPO_FULL_NAME} (branche main) et renvoie les fichiers qui les contiennent avec un extrait. Sert à trouver où est traitée une fonctionnalité avant de la lire avec read_code. Chercher d'abord dans le dossier du domaine donné par la carte du dépôt. Répond GITHUB_NOT_CONFIGURED ou GITHUB_RATE_LIMITED quand la recherche est indisponible : passer alors par list_repo_files avec un filtre.`,
        inputSchema: searchCodeInputSchema,
        annotations: REPO_TOOL_ANNOTATIONS,
      },
      async (input) => toToolResult(await this.repoCodeService.search(input))
    );

    server.registerTool(
      'list_repo_files',
      {
        title: "Lister les fichiers d'un dossier du dépôt",
        description:
          "Liste les fichiers d'un dossier du dépôt : tous s'il est petit, sinon ses fichiers directs et ses sous-dossiers avec leur taille. Avec `filtre`, renvoie les fichiers du sous-arbre dont le chemin contient ce texte (nom de fonctionnalité, suffixe comme .rules.ts). Le nom d'un dossier de fonctionnalité commence par un verbe : il dit ce que fait le code. La liste est limitée à 150 chemins : si `totalFichiers` dépasse le nombre de chemins renvoyés, ou si `partiel` est présent, préciser le filtre ou lister un sous-dossier avant de conclure qu'un fichier est absent.",
        inputSchema: listRepoFilesInputSchema,
        annotations: REPO_TOOL_ANNOTATIONS,
      },
      async (input) => toToolResult(await this.repoCodeService.list(input))
    );

    server.registerTool(
      'read_code',
      {
        title: 'Lire un fichier du dépôt',
        description:
          "Lit un fichier du dépôt, lignes numérotées, par tranche (120 lignes par défaut, 200 au plus) : relancer avec `debut` pour la suite. À lire en priorité : .rules.ts (règle métier), .service.ts (droits, enchaînement), .errors.ts (messages d'erreur), les fichiers de apps/app/src/labels (textes d'interface). Citer le chemin et les lignes dans la réponse.",
        inputSchema: readCodeInputSchema,
        annotations: REPO_TOOL_ANNOTATIONS,
      },
      async (input) => {
        const result = await this.repoCodeService.read(input);
        if (!result.success) {
          return toToolResult(result);
        }
        const { chemin, debut, fin, totalLignes, contenu, url } = result.data;
        // Texte brut : le JSON échapperait chaque saut de ligne du code.
        return {
          content: [
            {
              type: 'text',
              text: `${chemin} — lignes ${debut} à ${fin} sur ${totalLignes} — ${url}\n\n${contenu}`,
            },
          ],
        };
      }
    );
  }
}
