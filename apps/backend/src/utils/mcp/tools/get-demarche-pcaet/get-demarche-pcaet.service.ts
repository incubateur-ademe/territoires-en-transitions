import { Injectable } from '@nestjs/common';
import { ListDemarchePcaetDocumentsService } from '@tet/backend/demarches/pcaet/documents/list-documents/list-documents.service';
import { ListDemarchesPcaetService } from '@tet/backend/demarches/pcaet/list-demarches-pcaet/list-demarches-pcaet.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  computeDemarcheDocumentsCoverage,
  type DemarchePcaet,
  getEtapeDemarchePcaet,
  isDemarchePcaetEnCours,
  isDemarcheDocumentsAvalComplet,
  isDemarcheDossierDocumentsComplet,
} from '@tet/domain/demarches';
import { z } from 'zod';
import {
  CollectiviteAccessError,
  CollectiviteAccessService,
  SUPER_ADMIN_REQUIRED_MESSAGE,
} from '../shared/collectivite-access.service';

export const getDemarchePcaetInputSchema = z.object({
  collectiviteId: z
    .number()
    .int()
    .positive()
    .describe('Identifiant TeT de la collectivité'),
});
export type GetDemarchePcaetInput = z.infer<typeof getDemarchePcaetInputSchema>;

export const getDemarchePcaetOutputSchema = z.object({
  demarche: z.object({
    demarcheId: z.number(),
    titre: z.string(),
    status: z.string(),
    etape: z
      .string()
      .describe('elaboration, transmis, finalisation, publie ou archive'),
    enCours: z.boolean(),
    obligation: z.string(),
    transmisHorsPlateforme: z.boolean(),
    lanceeLe: z.string().nullable(),
    transmiseLe: z.string().nullable(),
    echeanceAvis: z.string().nullable(),
    adopteeLe: z.string().nullable(),
    publieeLe: z.string().nullable(),
    pilotes: z.array(z.string()),
    plansRattaches: z.number(),
    plansAVerifier: z.number(),
    plansSecteursARenseigner: z.number(),
    transitions: z
      .array(
        z.object({
          transition: z.string(),
          possible: z.boolean(),
          bloqueePar: z.array(z.string()),
        })
      )
      .describe(
        'Transitions atteignables depuis le statut actuel, et les conditions qui manquent pour les franchir'
      ),
  }),
  documents: z.object({
    dossierComplet: z
      .boolean()
      .describe('Pièces amont requises couvertes (condition de transmission)'),
    avalComplet: z
      .boolean()
      .describe('Pièces aval requises couvertes (condition de publication)'),
    attendus: z.array(
      z.object({
        documentId: z.string(),
        nom: z.string(),
        etape: z.string(),
        requis: z.boolean(),
        couvert: z.boolean(),
        couvertPar: z.string().nullable(),
        deposeLe: z.string().nullable(),
      })
    ),
    piecesAdditionnelles: z.number(),
  }),
  autresDemarches: z.array(
    z.object({ demarcheId: z.number(), titre: z.string(), status: z.string() })
  ),
});
export type GetDemarchePcaetOutput = z.infer<
  typeof getDemarchePcaetOutputSchema
>;

type GetDemarchePcaetError =
  | CollectiviteAccessError
  | 'DEMARCHE_PCAET_NOT_FOUND';

/**
 * La lecture complète d'une démarche (en cours comprise) demande
 * `demarches.pcaet.mutate` dans l'app : l'outil applique la même règle.
 */
@Injectable()
export class GetDemarchePcaetService {
  constructor(
    private readonly listDemarchesPcaetService: ListDemarchesPcaetService,
    private readonly listDocumentsService: ListDemarchePcaetDocumentsService,
    private readonly collectiviteAccessService: CollectiviteAccessService
  ) {}

  async run(
    input: GetDemarchePcaetInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<GetDemarchePcaetOutput, GetDemarchePcaetError>> {
    const access = await this.collectiviteAccessService.assertAllowed(
      input.collectiviteId,
      {
        public: 'demarches.pcaet.mutate',
        confidentiel: 'demarches.pcaet.mutate',
      },
      user
    );
    if (!access.success) {
      return access;
    }

    const demarches = await this.listDemarchesPcaetService.listDemarchesPcaet(
      { collectiviteId: input.collectiviteId },
      { user }
    );
    if (!demarches.success) {
      return failure('UNAUTHORIZED', new Error(SUPER_ADMIN_REQUIRED_MESSAGE));
    }
    const demarche =
      demarches.data.find((d) => isDemarchePcaetEnCours(d.status)) ??
      demarches.data[0];
    if (!demarche) {
      return failure(
        'DEMARCHE_PCAET_NOT_FOUND',
        new Error('Aucune démarche PCAET pour cette collectivité')
      );
    }

    const documents = await this.listDocumentsService.listDocuments(
      { collectiviteId: input.collectiviteId, demarcheId: demarche.id },
      { user }
    );
    if (!documents.success) {
      return failure(
        documents.error === 'UNAUTHORIZED'
          ? 'UNAUTHORIZED'
          : 'DEMARCHE_PCAET_NOT_FOUND'
      );
    }
    const snapshot = documents.data;
    const coverage = new Map(
      computeDemarcheDocumentsCoverage(snapshot).map((c) => [c.documentId, c])
    );

    return success({
      demarche: toDemarcheSummary(demarche),
      documents: {
        dossierComplet: isDemarcheDossierDocumentsComplet(snapshot),
        avalComplet: isDemarcheDocumentsAvalComplet(snapshot),
        attendus: [...snapshot.definitions]
          .sort((a, b) => a.ordre - b.ordre)
          .map((definition) => {
            const couverture = coverage.get(definition.id);
            const depot = snapshot.documents
              .filter(
                (d) => d.documentId === definition.id && d.fichier !== null
              )
              .map((d) => d.modifiedAt)
              .sort()
              .at(-1);
            return {
              documentId: definition.id,
              nom: definition.nom,
              etape: definition.etape,
              requis: definition.requis,
              couvert: couverture?.couvert ?? false,
              couvertPar: couverture?.substitutId ?? null,
              deposeLe: depot ?? null,
            };
          }),
        piecesAdditionnelles: snapshot.documentsAdditional.filter(
          (d) => d.fichier !== null
        ).length,
      },
      autresDemarches: demarches.data
        .filter((d) => d.id !== demarche.id)
        .map((d) => ({ demarcheId: d.id, titre: d.titre, status: d.status })),
    });
  }
}

function toDemarcheSummary(
  demarche: DemarchePcaet
): GetDemarchePcaetOutput['demarche'] {
  return {
    demarcheId: demarche.id,
    titre: demarche.titre,
    status: demarche.status,
    etape: getEtapeDemarchePcaet(demarche.status),
    enCours: isDemarchePcaetEnCours(demarche.status),
    obligation: demarche.obligation,
    transmisHorsPlateforme: demarche.transmittedOffPlatform,
    lanceeLe: demarche.launchedAt,
    transmiseLe: demarche.transmittedAt,
    echeanceAvis: demarche.avisDeadlineAt,
    adopteeLe: demarche.adoptedAt,
    publieeLe: demarche.publishedAt,
    pilotes: demarche.pilotes.map((pilote) => pilote.nom),
    plansRattaches: demarche.planActionIds.length,
    plansAVerifier: demarche.unverifiedPlanActionIds.length,
    plansSecteursARenseigner: demarche.secteursARenseignerPlanActionIds.length,
    transitions: Object.entries(demarche.transitions)
      .filter(([, evaluation]) => evaluation.reachable)
      .map(([transition, evaluation]) => ({
        transition,
        possible: evaluation.enabled,
        bloqueePar: [...evaluation.blockedBy],
      })),
  };
}
