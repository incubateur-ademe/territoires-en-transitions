import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  Result,
  success,
  failure,
  isSuccess,
  isFailure,
} from '@tet/backend/utils/result.type';
import { chunkedMap } from '@tet/backend/utils/chunked-map.utils';
import type { ListFichesRequestFilters } from '@tet/domain/plans';
import type {
  FicheActionPdfExtendedProps,
  PdfSectionKey,
} from '@tet/pdf-components';
import type { QueryOptionsSchema } from '@tet/backend/plans/fiches/list-fiches/list-fiches.request';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { FICHE_ACTION_PDF_EXPORT_CONFIG } from './fiche-action-pdf-export.config';
import { FicheExportPayloadService } from './fiche-export-payload.service';
import { PdfRendererService } from './pdf-renderer.service';

type GeneratePdfInput = {
  user: AuthenticatedUser;
  sections?: PdfSectionKey[];
  notesYears: number[] | 'all';
} & (
  | { mode: 'selection'; ficheIds: number[] }
  | {
      mode: 'all';
      collectiviteId: number;
      filters?: ListFichesRequestFilters;
      sort?: QueryOptionsSchema['sort'];
    }
);

type GeneratePdfOutput = {
  pdf: string;
  fileName: string;
  includedFicheIds: number[];
  skippedForAuthFicheIds: number[];
  skippedForErrorFicheIds: number[];
};

type GeneratePdfError =
  | 'NO_FICHES'
  | 'RENDER_ERROR'
  | 'INTERNAL_ERROR'
  | 'TOO_MANY_FICHES';

type FichePayloadOutcome = Result<
  FicheActionPdfExtendedProps,
  { ficheId: number; error: string }
>;

@Injectable()
export class FicheActionPdfExportService {
  private readonly logger = new Logger(FicheActionPdfExportService.name);
  private static readonly CHUNK_SIZE = 5;

  constructor(
    private readonly payloadService: FicheExportPayloadService,
    private readonly renderer: PdfRendererService,
    private readonly fichePermissions: FicheActionPermissionsService,
    private readonly listFichesService: ListFichesService,
  ) {}

  async generatePdf(
    input: GeneratePdfInput
  ): Promise<Result<GeneratePdfOutput, GeneratePdfError>> {
    const requestedIds = await this.resolveRequestedIds(input);
    const { authorizedIds, deniedIds } = await this.authorizeIds(
      requestedIds,
      input.user
    );

    if (authorizedIds.length === 0) {
      return failure('NO_FICHES');
    }

    if (authorizedIds.length > FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches) {
      this.logger.warn(
        `Export refusé : ${authorizedIds.length} fiches autorisées, maximum ${FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches}`
      );
      return failure('TOO_MANY_FICHES');
    }

    const outcomes = await chunkedMap({
      items: authorizedIds,
      chunkSize: FicheActionPdfExportService.CHUNK_SIZE,
      fn: (ficheId) => this.buildFichePayload(ficheId, input.user),
    });

    const successfulOutcomes = outcomes.filter(isSuccess);
    const failedOutcomes = outcomes.filter(isFailure);

    for (const failed of failedOutcomes) {
      this.logger.warn(
        `Payload assembly failed for fiche ${failed.error.ficheId}: ${failed.error.error}`
      );
    }

    if (successfulOutcomes.length === 0) {
      return failure('NO_FICHES');
    }

    const fiches = successfulOutcomes.map((o) => o.data);
    const includedFicheIds = fiches.map((f) => f.fiche.id);
    const skippedForErrorFicheIds = failedOutcomes.map((f) => f.error.ficheId);

    const renderResult = await this.renderer.render({
      fiches,
      sections: input.sections,
      notesYears: input.notesYears,
      timeoutMs: FICHE_ACTION_PDF_EXPORT_CONFIG.jobTimeoutMs,
    });

    if (!renderResult.success) {
      this.logger.error(`Rendu PDF échoué : ${renderResult.error}`);
      return failure('RENDER_ERROR');
    }

    const fileName =
      includedFicheIds.length === 1
        ? `fiche-action-${includedFicheIds[0]}.pdf`
        : `fiches-action-${Date.now()}.pdf`;

    return success({
      pdf: renderResult.data.toString('base64'),
      fileName,
      includedFicheIds,
      skippedForAuthFicheIds: deniedIds,
      skippedForErrorFicheIds,
    });
  }

  private async buildFichePayload(
    ficheId: number,
    user: AuthenticatedUser
  ): Promise<FichePayloadOutcome> {
    const payload = await this.payloadService.buildFicheExportPayload({
      ficheId,
      user,
    });
    return payload.success
      ? success(payload.data)
      : failure({ ficheId, error: payload.error });
  }

  private async resolveRequestedIds(input: GeneratePdfInput): Promise<number[]> {
    if (input.mode === 'selection') {
      return input.ficheIds;
    }
    return this.listAllFicheIds({
      collectiviteId: input.collectiviteId,
      filters: input.filters,
      sort: input.sort,
    });
  }

  private async authorizeIds(
    ids: number[],
    user: AuthenticatedUser
  ): Promise<{ authorizedIds: number[]; deniedIds: number[] }> {
    const outcomes = await chunkedMap({
      items: ids,
      chunkSize: FicheActionPdfExportService.CHUNK_SIZE,
      fn: async (ficheId) => {
        try {
          await this.fichePermissions.canReadFiche(ficheId, user);
          return { authorized: true as const, ficheId };
        } catch (error) {
          if (error instanceof ForbiddenException) {
            return { authorized: false as const, ficheId };
          }
          this.logger.error(
            `Erreur inattendue lors de la vérification des droits pour la fiche ${ficheId} : ${error}`
          );
          return { authorized: false as const, ficheId };
        }
      },
    });

    return {
      authorizedIds: outcomes
        .filter((o) => o.authorized)
        .map((o) => o.ficheId),
      deniedIds: outcomes.filter((o) => !o.authorized).map((o) => o.ficheId),
    };
  }

  private async listAllFicheIds({
    collectiviteId,
    filters,
    sort,
  }: {
    collectiviteId: number;
    filters?: ListFichesRequestFilters;
    sort?: QueryOptionsSchema['sort'];
  }): Promise<number[]> {
    try {
      const { data } = await this.listFichesService.listFichesQuery(
        collectiviteId,
        filters,
        { limit: 'all' as const, sort },
      );
      return data.map((fiche) => fiche.id);
    } catch (error) {
      this.logger.error(
        `Impossible de résoudre les IDs des fiches pour la collectivité ${collectiviteId} : ${error}`
      );
      return [];
    }
  }
}
