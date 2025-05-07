import { ListCollectiviteInput } from '@/backend/collectivites/list-collectivites/list-collectivites.input';
import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { labellisationTable } from '@/backend/referentiels/labellisations/labellisation.table';
import { ListLabellisationApiResponse } from '@/backend/referentiels/labellisations/list-labellisations.api-response';
import { DatabaseService } from '@/backend/utils';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { Injectable, Logger } from '@nestjs/common';
import { getTableColumns, inArray } from 'drizzle-orm';
import { desc } from 'drizzle-orm/expressions';
import { omit } from 'es-toolkit';

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

    const labellisations = await this.databaseService.db
      .select({
        ...getTableColumns(labellisationTable),
        obtenueLe: getISOFormatDateQuery(labellisationTable.obtenueLe),
      })
      .from(labellisationTable)
      .where(inArray(labellisationTable.collectiviteId, collectiviteIds))
      .orderBy(desc(labellisationTable.obtenueLe));

    labellisations.forEach((labellisation) => {
      const labellisationrecord = omit(labellisation, [
        'collectiviteId',
        'referentiel',
      ]);

      const collectivite = collectivites.data.find(
        (collectivite) => collectivite.id === labellisation.collectiviteId
      );
      if (collectivite) {
        if (!collectivite.labellisations) {
          collectivite.labellisations = {};
        }
        if (!collectivite.labellisations[labellisation.referentiel]) {
          collectivite.labellisations[labellisation.referentiel] = {
            courante: labellisationrecord,
            historique: [],
          };
        } else {
          collectivite.labellisations[
            labellisation.referentiel
          ]!.historique.push(labellisationrecord);
        }
      }
    });

    return collectivites;
  }
}
