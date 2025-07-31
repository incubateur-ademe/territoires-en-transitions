/**
 * See https://airtable.com/developers/web/api/list-records
 */
export interface AirtableFetchRecordsRequest {
  filterByFormula?: string;
  pageSize?: number;
  maxRecords?: number;
  sort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  view?: string;
  offset?: string;
  cellFormat?: 'json' | 'string';
  fields?: string[];
}
