import { Injectable } from '@nestjs/common';
import { getDownloadUrlErrorConfig } from '@tet/backend/collectivites/documents/get-download-url/get-download-url.errors';
import { GetDownloadUrlService } from '@tet/backend/collectivites/documents/get-download-url/get-download-url.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { CloseDossierLabellisationService } from './close-dossier-labellisation.service';
import { dossiersLabellisationErrorConfig } from './dossiers-labellisation.errors';
import {
  addAuditeurInputSchema,
  closeDossierLabellisationInputSchema,
  dossierLabellisationIdInputSchema,
  getActeEngagementDownloadUrlInputSchema,
  listCotInputSchema,
  listDossiersLabellisationInputSchema,
  removeAuditeurInputSchema,
  toggleCotActifInputSchema,
  updateDemandeLabellisationInputSchema,
} from './dossiers-labellisation.input';
import { HandleCotService } from './handle-cot.service';
import { ListDossiersLabellisationService } from './list-dossiers-labellisation.service';
import { UpdateDossierLabellisationService } from './update-dossier-labellisation.service';

/**
 * Administration des audits, labellisations et COT par l'équipe du programme
 * TETE (permission `labellisations.admin`), en remplacement de Retool.
 */
@Injectable()
export class DossiersLabellisationRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    dossiersLabellisationErrorConfig
  );
  private readonly getDownloadUrlOrThrowError = createTrpcErrorHandler(
    getDownloadUrlErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly listService: ListDossiersLabellisationService,
    private readonly updateService: UpdateDossierLabellisationService,
    private readonly closeService: CloseDossierLabellisationService,
    private readonly cotService: HandleCotService,
    private readonly getDownloadUrlService: GetDownloadUrlService
  ) {}

  router = this.trpc.router({
    admin: this.trpc.router({
      listDossiers: this.trpc.authedProcedure
        .input(listDossiersLabellisationInputSchema)
        .query(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.listService.listDossiers(input, { user })
          )
        ),

      getDossier: this.trpc.authedProcedure
        .input(dossierLabellisationIdInputSchema)
        .query(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.listService.getDossier(input, { user })
          )
        ),

      getActeEngagementDownloadUrl: this.trpc.authedProcedure
        .input(getActeEngagementDownloadUrlInputSchema)
        .mutation(async ({ input, ctx: { user } }) => {
          const { collectiviteId } = this.getResultDataOrThrowError(
            await this.listService.checkActeEngagementOfDossier(input, { user })
          );
          return this.getDownloadUrlOrThrowError(
            await this.getDownloadUrlService.createDownloadUrl({
              collectiviteId,
              fichierId: input.fichierId,
              canReadConfidentiel: true,
            })
          );
        }),

      updateDemande: this.trpc.authedProcedure
        .input(updateDemandeLabellisationInputSchema)
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.updateService.updateDemande(input, { user })
          )
        ),

      listAuditeurs: this.trpc.authedProcedure.query(
        async ({ ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.listService.listAuditeurs({ user })
          )
      ),

      addAuditeur: this.trpc.authedProcedure
        .input(addAuditeurInputSchema)
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.updateService.addAuditeur(input, { user })
          )
        ),

      removeAuditeur: this.trpc.authedProcedure
        .input(removeAuditeurInputSchema)
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.updateService.removeAuditeur(input, { user })
          )
        ),

      closeDossier: this.trpc.authedProcedure
        .input(closeDossierLabellisationInputSchema)
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.closeService.closeDossier(input, { user })
          )
        ),

      listCot: this.trpc.authedProcedure
        .input(listCotInputSchema)
        .query(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.cotService.listCot(input, { user })
          )
        ),

      toggleCotActif: this.trpc.authedProcedure
        .input(toggleCotActifInputSchema)
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.cotService.toggleCotActif(input, { user })
          )
        ),
    }),
  });
}
