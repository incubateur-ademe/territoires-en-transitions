import { AirtableRowDto } from './airtable-row.dto';

export interface AirtableInsertRecordsResponse<TFields> {
  records: AirtableRowDto<TFields>[];
}
