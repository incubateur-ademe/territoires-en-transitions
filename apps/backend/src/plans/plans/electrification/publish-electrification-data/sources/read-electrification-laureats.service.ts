import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { GristDocumentRules } from '@tet/backend/utils/grist/grist-document.rules';
import { Injectable } from '@nestjs/common';
import { ReadGristService } from '@tet/backend/utils/grist/read-grist.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationLaureatsConfig } from '@tet/domain/plans';
import { inArray, or } from 'drizzle-orm';
import { electrificationGristConfig } from '../../config/electrification-grist.config';
import { ElectrificationDataError } from '../electrification-data.errors';
import {
  electrificationLaureatGristFields,
  ElectrificationLaureatGrist,
} from './electrification-grist.schema';

@Injectable()
export class ReadElectrificationLaureatsService {
  constructor(
    private readonly grist: ReadGristService,
    private readonly configuration: ConfigurationService,
    private readonly database: DatabaseService
  ) {}

  async read(): Promise<
    Result<
      {
        data: Omit<ElectrificationLaureatsConfig, 'version' | 'validFrom'>;
        revision: string;
        excluded: number;
      },
      ElectrificationDataError
    >
  > {
    const documentId = this.configuration.get(
      'ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID'
    );
    if (!documentId) return failure('SOURCE_NOT_CONFIGURED');
    const { table } = electrificationGristConfig.laureats;
    const snapshot = await this.grist.read(documentId, [
      {
        id: table,
        columnLabels: electrificationLaureatGristFields.keyof().options,
      },
    ]);
    if (!snapshot.success) return snapshot;
    let records: ElectrificationLaureatGrist[];
    try {
      records = snapshot.data.tables[table].map(({ fields }) =>
        electrificationLaureatGristFields.parse(fields)
      );
    } catch {
      return failure('INVALID_SOURCE');
    }
    if (
      new Set(records.map((row) => row['Code territoire'])).size !==
      records.length
    )
      return failure('INVALID_SOURCE');

    const resolved = await this.resolveCollectivites(records);
    if (!resolved.success) return resolved;
    const laureats = resolved.data;
    // Ne pas vider silencieusement l'éligibilité sur une source vide ou non résolue.
    if (!laureats.length) return failure('INVALID_SOURCE');
    return success({
      revision: snapshot.data.revision,
      excluded: records.length - laureats.length,
      data: {
        validUntil: null,
        source: GristDocumentRules.getUrl(documentId),
        laureats: laureats.sort((a, b) =>
          a.reference < b.reference ? -1 : a.reference > b.reference ? 1 : 0
        ),
      },
    });
  }

  private async resolveCollectivites(
    records: ElectrificationLaureatGrist[]
  ): Promise<
    Result<ElectrificationLaureatsConfig['laureats'], ElectrificationDataError>
  > {
    const identifiers = records.flatMap((row) =>
      row['Identifiant public'] ? [row['Identifiant public']] : []
    );
    let collectivites;
    try {
      collectivites = identifiers.length
        ? await this.database.db
            .select({
              id: collectiviteTable.id,
              type: collectiviteTable.type,
              siren: collectiviteTable.siren,
              communeCode: collectiviteTable.communeCode,
            })
            .from(collectiviteTable)
            .where(
              or(
                inArray(collectiviteTable.siren, identifiers),
                inArray(collectiviteTable.communeCode, identifiers)
              )
            )
        : [];
    } catch {
      return failure('DATABASE_ERROR');
    }
    const laureats: ElectrificationLaureatsConfig['laureats'] = [];
    for (const row of records) {
      const reference = row['Code territoire'];
      if (row['Nature du périmètre'] === 'Groupement de collectivités')
        continue;
      const identifier = row['Identifiant public'];
      if (!identifier) continue;
      const candidates = collectivites.filter((collectivite) =>
        row['Nature du périmètre'] === 'Commune'
          ? collectivite.type === 'commune' &&
            collectivite.communeCode === identifier
          : collectivite.type === 'epci' && collectivite.siren === identifier
      );
      if (candidates.length !== 1) continue;
      laureats.push({ reference, collectiviteId: candidates[0].id });
    }
    return success(laureats);
  }
}
