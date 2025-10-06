export interface AirtableRowInsertDto<TFields> {
  fields: TFields;
}

export interface AirtableUpdateRowDto<TFields>
  extends AirtableRowInsertDto<TFields> {
  id: string;
}
