import { AirtableRowDto } from '@/tools-automation-api/airtable/airtable-row.dto';

export interface AirtableFetchRecordsResponse<TFields> {
  offset?: string;
  records: AirtableRowDto<TFields>[];
}
