import { AirtableRowInsertDto } from './airtable-row-insert.dto';

export interface AirtableInsertRecordsRequest<TFields> {
  typecast?: boolean;
  records: AirtableRowInsertDto<TFields>[];
  performUpsert?: { fieldsToMergeOn: string[] };
}
