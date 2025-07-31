import { AirtableRowInsertDto } from '@/tools/airtable/airtable-row-insert.dto';

export interface AirtableRowDto<TFields> extends AirtableRowInsertDto<TFields> {
  id: string;

  createdTime: string;

  /**
   * Not in the response, added dynamically
   */
  url?: string;
}
