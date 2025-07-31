import { AirtableRowDto } from '@/tools/airtable/airtable-row.dto';

export interface AirtableInsertRecordsResponse<TFields> {
  records: AirtableRowDto<TFields>[];
}
