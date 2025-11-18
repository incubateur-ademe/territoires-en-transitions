import { ListCollectiviteInput } from '@/backend/collectivites/list-collectivites/list-collectivites.input';
import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { auditTable } from '@/backend/referentiels/labellisations/audit.table';
import { labellisationDemandeTable } from '@/backend/referentiels/labellisations/labellisation-demande.table';
import { labellisationTable } from '@/backend/referentiels/labellisations/labellisation.table';
import {
  LabellisationRecord,
  ListLabellisationApiResponse,
} from '@/backend/referentiels/labellisations/list-labellisations.api-response';
import { SnapshotJalonEnum } from '@/backend/referentiels/snapshots/snapshot-jalon.enum';
import { snapshotTable } from '@/backend/referentiels/snapshots/snapshot.table';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { roundTo } from '@/backend/utils/number.utils';
import { Injectable, Logger } from '@nestjs/common';
import { desc, getTableColumns, inArray, isNotNull } from 'drizzle-orm';
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
      await this.collectiviteService.listCollectivites(input);
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
        etoiles: snapshotTable.etoiles,
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

    const labelisationRecords = labellisations
      .map((labellisation) => {
        if (!labellisation.etoiles || !labellisation.auditId) {
          return null;
        }
        const annee = DateTime.fromISO(labellisation.date).year;
        const labellisationrecord: LabellisationRecord = {
          id: labellisation.auditId,
          collectiviteId: labellisation.collectiviteId,
          referentiel: labellisation.referentielId,
          obtenueLe: labellisation.date,
          etoiles: labellisation.etoiles,
          annee: annee,
          scoreRealise: labellisation.pointPotentiel
            ? roundTo(
                (labellisation.pointFait * 100.0) /
                  labellisation.pointPotentiel,
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
        return labellisationrecord;
      })
      .filter((labellisation) => labellisation !== null);

    // It seems that there are still some old labellisations for which there is no score
    // Or for the  1st star, no score computed too
    // TODO:  find a better way to handle this

    const oldLabellisations: LabellisationRecord[] =
      await this.databaseService.db
        .select({
          ...getTableColumns(labellisationTable),
          obtenueLe: getISOFormatDateQuery(labellisationTable.obtenueLe),
        })
        .from(labellisationTable)
        .where(inArray(labellisationTable.collectiviteId, collectiviteIds))
        .orderBy(desc(labellisationTable.obtenueLe));

    const labelisationRecordsToAdd: LabellisationRecord[] = [];
    oldLabellisations.forEach((oldLabellisation) => {
      const existingLabellisation = labelisationRecords.find(
        (labellisation) =>
          labellisation.etoiles === oldLabellisation.etoiles &&
          labellisation.referentiel === oldLabellisation.referentiel &&
          labellisation.collectiviteId === oldLabellisation.collectiviteId
      );
      if (!existingLabellisation) {
        labelisationRecordsToAdd.push(oldLabellisation);
      }
    });
    labelisationRecords.push(...labelisationRecordsToAdd);

    // Sort etoiles descending with all labellisation records
    labelisationRecords.sort((a, b) => {
      return b.etoiles - a.etoiles;
    });

    labelisationRecords.forEach((labelisationRecord) => {
      const referentiel = labelisationRecord.referentiel;
      const collectivite = collectivites.data.find(
        (collectivite) => collectivite.id === labelisationRecord.collectiviteId
      );
      if (collectivite) {
        // No need the collectiviteId anymore, remove it to simplify the response
        delete labelisationRecord.collectiviteId;
        if (!collectivite.labellisations) {
          collectivite.labellisations = {};
        }
        if (!collectivite.labellisations[referentiel]) {
          collectivite.labellisations[referentiel] = {
            courante: labelisationRecord,
            historique: [],
          };
        } else if (
          collectivite.labellisations[referentiel]?.courante?.etoiles ===
          labelisationRecord.etoiles
        ) {
          this.logger.warn(
            `Labellisation ${labelisationRecord.etoiles} étoiles  pour la collectivité ${collectivite.id} et le referentiel ${referentiel} est pour la même étoile que la courante, on prend la plus vielle`
          );

          if (collectivite.labellisations[referentiel]?.courante) {
            collectivite.labellisations[referentiel].courante =
              labelisationRecord;
          }
        } else {
          if (collectivite.labellisations[referentiel]?.historique) {
            collectivite.labellisations[referentiel].historique.push(
              labelisationRecord
            );
          }
        }
      }
    });

    return collectivites;
  }
}
