import { AirtableRowInsertDto } from '@/tools-automation-api/airtable/airtable-row-insert.dto';

export interface AirtableInsertRecordsRequest<TFields> {
  records: AirtableRowInsertDto<TFields>[];
  performUpsert?: { fieldsToMergeOn: string[] };
}
