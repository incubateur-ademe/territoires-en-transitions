import { AirtableRowDto } from '@/tools/airtable/airtable-row.dto';

export interface AirtableFetchRecordsResponse<TFields> {
  offset?: string;
  records: AirtableRowDto<TFields>[];
}
