import { AirtableRowInsertDto } from './airtable-row-insert.dto';

export interface AirtableInsertRecordsRequest<TFields> {
  records: AirtableRowInsertDto<TFields>[];
  performUpsert?: { fieldsToMergeOn: string[] };
}
