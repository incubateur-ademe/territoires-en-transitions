import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';
import {
  getDemarchePcaetInputSchema,
  getDemarchePcaetOutputSchema,
  GetDemarchePcaetService,
} from './get-demarche-pcaet.service';

@Injectable()
export class GetDemarchePcaetTool implements McpTool {
  constructor(
    private readonly getDemarchePcaetService: GetDemarchePcaetService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'get_demarche_pcaet',
      {
        title: "Démarche PCAET d'une collectivité",
        description:
          "État de la démarche PCAET en cours (sinon la plus récente) d'une collectivité : statut et étape du parcours (élaboration, transmis, finalisation, publié, archivé), dates clés, pilotes, plans rattachés, transitions possibles avec les conditions qui bloquent (ex. dossierComplet), et pièces attendues avec leur couverture. Sert à comprendre où en est une collectivité et pourquoi elle ne peut pas avancer. Conditions possibles dans bloqueePar : estPilote (l'appelant n'est pas pilote de la démarche ; évaluée pour l'appelant, pas pour la collectivité), dossierComplet (pièces amont requises, lignes requises du diagnostic, programme d'actions rattaché, vérifié et avec ses secteurs renseignés), avisTousRendus (chaque demande d'avis a reçu ses avis), delaiAvisEcoule (délai légal des instances consultatives écoulé), pcaetSuivantAdopte (un PCAET plus récent a été publié), documentsAvalComplets (pièces après avis, dont la délibération d'adoption).",
        inputSchema: getDemarchePcaetInputSchema,
        outputSchema: getDemarchePcaetOutputSchema,
        annotations: READ_ONLY_TOOL_ANNOTATIONS,
      },
      async (input) =>
        toToolResult(await this.getDemarchePcaetService.run(input, { user }))
    );
  }
}
