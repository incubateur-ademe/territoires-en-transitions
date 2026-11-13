import { GristDocumentRules } from '@tet/backend/utils/grist/grist-document.rules';
import { Injectable } from '@nestjs/common';
import { ReadGristService } from '@tet/backend/utils/grist/read-grist.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { electrificationGristConfig } from '../../config/electrification-grist.config';
import { ElectrificationDataError } from '../electrification-data.errors';
import {
  electrificationGristFields,
  ElectrificationGristData,
  ElectrificationGristTable,
} from './electrification-grist.schema';

@Injectable()
export class ReadElectrificationGristService {
  constructor(private readonly grist: ReadGristService) {}

  async read(
    links: string[]
  ): Promise<
    Result<
      { data: ElectrificationGristData; revision: string; sourceUrl: string },
      ElectrificationDataError
    >
  > {
    if (!links.length) return failure('SOURCE_NOT_CONFIGURED');
    const documentId = GristDocumentRules.getCommonDocumentId(links);
    if (!documentId) return failure('INVALID_SOURCE');
    const { tables: sourceTables } = electrificationGristConfig.catalogue;
    const tables = Object.keys(
      electrificationGristFields
    ) as ElectrificationGristTable[];
    const snapshot = await this.grist.read(
      documentId,
      tables.map((table) => sourceTables[table])
    );
    if (!snapshot.success) return snapshot;
    if (
      !snapshot.data.tables[sourceTables.Axes].length ||
      !snapshot.data.tables[sourceTables.Actions].length
    ) {
      return failure('INVALID_SOURCE');
    }
    try {
      const entries = tables.map((table) => [
        table,
        snapshot.data.tables[sourceTables[table]].map(({ id, fields }) => ({
          id,
          fields: electrificationGristFields[table].parse(fields),
        })),
      ]);
      return success({
        data: Object.fromEntries(entries) as ElectrificationGristData,
        revision: snapshot.data.revision,
        sourceUrl: GristDocumentRules.getUrl(documentId),
      });
    } catch {
      return failure('INVALID_SOURCE');
    }
  }
}
