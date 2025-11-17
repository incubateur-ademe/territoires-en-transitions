import { AirtableRowDto } from './airtable-row.dto';

export interface AirtableFetchRecordsResponse<TFields> {
  offset?: string;
  records: AirtableRowDto<TFields>[];
}
