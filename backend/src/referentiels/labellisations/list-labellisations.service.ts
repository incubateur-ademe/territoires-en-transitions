import { ListCollectiviteInput } from '@/backend/collectivites/list-collectivites/list-collectivites.input';
import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { auditTable } from '@/backend/referentiels/labellisations/audit.table';
import { labellisationDemandeTable } from '@/backend/referentiels/labellisations/labellisation-demande.table';
import {
  LabellisationRecord,
  ListLabellisationApiResponse,
} from '@/backend/referentiels/labellisations/list-labellisations.api-response';
import { SnapshotJalonEnum } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { snapshotTable } from '@/backend/referentiels/snapshots/snapshot.table';
import { DatabaseService } from '@/backend/utils';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { roundTo } from '@/backend/utils/number.utils';
import { Injectable, Logger } from '@nestjs/common';
import { inArray, isNotNull } from 'drizzle-orm';
import { desc } from 'drizzle-orm/expressions';
import { and, eq } from 'drizzle-orm/sql';
import { DateTime } from 'luxon';

//site_labellisation

@Injectable()
export class ListLabellisationsService {
  private readonly logger = new Logger(ListLabellisationsService.name);

  constructor(
    private readonly collectiviteService: ListCollectivitesService,
    private readonly databaseService: DatabaseService
  ) {}

  async listCollectiviteLabellisations(
    input: ListCollectiviteInput
  ): Promise<ListLabellisationApiResponse> {
    const collectivites: ListLabellisationApiResponse =
      await this.collectiviteService.listCollectivites(input, 'resume');
    collectivites.data?.forEach((collectivite) => {
      collectivite.labellisations = {};
    });

    const collectiviteIds = collectivites.data.map(
      (collectivite) => collectivite.id
    );

    // We do not need the labellisation table anymore. instead, use the snapshot table
    const labellisations = await this.databaseService.db
      .select({
        collectiviteId: snapshotTable.collectiviteId,
        referentielId: snapshotTable.referentielId,
        date: getISOFormatDateQuery(snapshotTable.date),
        pointFait: snapshotTable.pointFait,
        pointProgramme: snapshotTable.pointProgramme,
        pointPotentiel: snapshotTable.pointPotentiel,
        etoiles: labellisationDemandeTable.etoiles,
        auditId: snapshotTable.auditId,
      })
      .from(snapshotTable)
      .leftJoin(auditTable, eq(auditTable.id, snapshotTable.auditId))
      .leftJoin(
        labellisationDemandeTable,
        eq(labellisationDemandeTable.id, auditTable.demandeId)
      )
      .where(
        and(
          inArray(snapshotTable.collectiviteId, collectiviteIds),
          eq(snapshotTable.jalon, SnapshotJalonEnum.POST_AUDIT),
          eq(auditTable.valideLabellisation, true),
          eq(auditTable.valide, true),
          isNotNull(labellisationDemandeTable.etoiles)
        )
      )
      .orderBy(desc(snapshotTable.date));

    labellisations.forEach((labellisation) => {
      const etoiles: number = parseInt(labellisation.etoiles!);
      const annee = DateTime.fromISO(labellisation.date).year;
      const labellisationrecord: LabellisationRecord = {
        id: labellisation.auditId!,
        obtenueLe: labellisation.date,
        etoiles: etoiles,
        annee: annee,
        scoreRealise: labellisation.pointPotentiel
          ? roundTo(
              (labellisation.pointFait * 100.0) / labellisation.pointPotentiel,
              1
            )
          : 0,
        scoreProgramme: labellisation.pointProgramme
          ? roundTo(
              (labellisation.pointProgramme * 100.0) /
                labellisation.pointPotentiel,
              1
            )
          : 0,
      };

      const collectivite = collectivites.data.find(
        (collectivite) => collectivite.id === labellisation.collectiviteId
      );
      if (collectivite) {
        if (!collectivite.labellisations) {
          collectivite.labellisations = {};
        }
        if (!collectivite.labellisations[labellisation.referentielId]) {
          collectivite.labellisations[labellisation.referentielId] = {
            courante: labellisationrecord,
            historique: [],
          };
        } else {
          collectivite.labellisations[
            labellisation.referentielId
          ]!.historique.push(labellisationrecord);
        }
      }
    });

    return collectivites;
  }
}
