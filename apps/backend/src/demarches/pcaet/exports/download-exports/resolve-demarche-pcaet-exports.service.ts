import { Injectable, Logger } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarcheTypeEnum,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq } from 'drizzle-orm';
import { DemarchePcaetExportRepository } from '../demarche-pcaet-export.repository';
import { DemarchePcaetLectureService } from '../../shared/demarche-pcaet-lecture.service';
import {
  DepotPermissionsService,
  type DossierConsultable,
} from '../../shared/depot-permissions.service';
import type { DemarchePcaetExportRow } from '../../shared/models/demarche-pcaet-export.table';
import {
  DemarchePcaetExportsError,
  DemarchePcaetExportsErrorEnum,
} from './demarche-pcaet-exports.errors';
import type { DemarchePcaetExportRef } from './demarche-pcaet-exports.input';
import {
  resolveDemarchePcaetExportSources,
  type DemarchePcaetExportSources,
} from './resolve-demarche-pcaet-exports.rules';

export type ResolvedDemarchePcaetExports = {
  demarcheId: number;
  collectiviteId: number;
  /**
   * Le membre d'un EPCI couvert par le dépôt d'un Supra : il ne voit pas les
   * fiches restreintes à l'écran, il ne les reçoit pas dans l'export.
   */
  lectureSeule: boolean;
  /** Le service au titre duquel on lit, pour un instructeur ; `null` sinon. */
  dossier: DossierConsultable | null;
  sources: DemarchePcaetExportSources<DemarchePcaetExportRow>;
};

/**
 * Qui peut télécharger les classeurs d'un dépôt, et lesquels. La règle d'accès
 * des trois points d'entrée (liste, lien signé, export du jour), écrite une
 * fois :
 * - par la saisine, le service instructeur saisi (`canConsulterDossier`), qui
 *   reçoit le plan complet ;
 * - par la démarche, la déposante (plan complet) ou un membre d'un EPCI
 *   couvert par le dépôt d'un Supra (`canRead`, plan sans fiche restreinte).
 */
@Injectable()
export class ResolveDemarchePcaetExportsService {
  private readonly logger = new Logger(ResolveDemarchePcaetExportsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly lectureService: DemarchePcaetLectureService,
    private readonly exportRepository: DemarchePcaetExportRepository
  ) {}

  async resolve(
    ref: DemarchePcaetExportRef,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ResolvedDemarchePcaetExports, DemarchePcaetExportsError>> {
    let lecteur: Omit<ResolvedDemarchePcaetExports, 'sources'>;
    let status: DemarchePcaetStatus | null;
    let rows: DemarchePcaetExportRow[];
    try {
      const lecteurResult = await this.resolveLecteur(ref, { user, tx });
      if (!lecteurResult.success) {
        return lecteurResult;
      }
      lecteur = lecteurResult.data;

      // Le couple (démarche, collectivité) est vérifié en base plutôt que
      // déduit de l'entrée : sans quoi l'identifiant d'une démarche d'une autre
      // collectivité passerait la barrière de permission.
      status = await this.getStatus(lecteur, tx);
      if (status === null) {
        return failure(DemarchePcaetExportsErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }
      rows = await this.exportRepository.listByDemarcheId(
        lecteur.demarcheId,
        tx
      );
    } catch (error) {
      this.logger.error(
        `Lecture des classeurs du dépôt PCAET impossible : ${getErrorMessage(
          error
        )}`
      );
      return failure(
        DemarchePcaetExportsErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : undefined
      );
    }
    const { demarcheId, collectiviteId, lectureSeule, dossier } = lecteur;

    return success({
      demarcheId,
      collectiviteId,
      lectureSeule,
      dossier,
      sources: resolveDemarchePcaetExportSources({
        status,
        rows,
        lectureSeule,
      }),
    });
  }

  private async resolveLecteur(
    ref: DemarchePcaetExportRef,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<
      Omit<ResolvedDemarchePcaetExports, 'sources'>,
      DemarchePcaetExportsError
    >
  > {
    if ('demandeAvisId' in ref) {
      const consultableResult =
        await this.depotPermissionsService.canConsulterDossier(ref, {
          user,
          tx,
        });
      if (!consultableResult.success) {
        return failure(
          consultableResult.error === 'DEMANDE_AVIS_NOT_FOUND'
            ? DemarchePcaetExportsErrorEnum.DEMANDE_AVIS_NOT_FOUND
            : consultableResult.error === 'NOT_FOUND'
            ? DemarchePcaetExportsErrorEnum.DEMARCHE_PCAET_NOT_FOUND
            : DemarchePcaetExportsErrorEnum.UNAUTHORIZED
        );
      }
      const dossier = consultableResult.data;
      return success({
        demarcheId: dossier.demarcheId,
        collectiviteId: dossier.collectiviteId,
        // Les instructeurs lisent le dossier transmis, fiches restreintes
        // comprises.
        lectureSeule: false,
        dossier,
      });
    }

    const lectureResult = await this.lectureService.canRead(ref, { user, tx });
    if (!lectureResult.success) {
      return failure(DemarchePcaetExportsErrorEnum.UNAUTHORIZED);
    }
    return success({
      demarcheId: ref.demarcheId,
      collectiviteId: ref.collectiviteId,
      lectureSeule: lectureResult.data.lectureSeule,
      dossier: null,
    });
  }

  private async getStatus(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx: ServiceSecondArg['tx']
  ): Promise<DemarchePcaetStatus | null> {
    const [demarche] = await (tx ?? this.databaseService.db)
      .select({ status: demarcheTable.status })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
        )
      )
      .limit(1);
    return (demarche?.status as DemarchePcaetStatus | undefined) ?? null;
  }
}
