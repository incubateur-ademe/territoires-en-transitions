import { AirtableRowDto } from '@/tools-automation-api/airtable/airtable-row.dto';

export interface AirtableInsertRecordsResponse<TFields> {
  records: AirtableRowDto<TFields>[];
}
