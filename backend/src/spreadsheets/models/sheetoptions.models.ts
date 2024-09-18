/**
 * See https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption?hl=fr
 */
export enum SheetValueInputOption {
  /**
   * Default input value. This value must not be used.
   */
  INPUT_VALUE_OPTION_UNSPECIFIED = 'INPUT_VALUE_OPTION_UNSPECIFIED',
  /**
   * The values the user has entered will not be parsed and will be stored as-is.
   */
  RAW = 'RAW',

  /**
   * The values will be parsed as if the user typed them into the UI. Numbers will stay as numbers, but strings may be converted to numbers, dates, etc. following the same rules that are applied when entering text into a cell via the Google Sheets UI.
   */
  USER_ENTERED = 'USER_ENTERED',
}

export enum SheetValueRenderOption {
  /**
   * Values will be calculated & formatted in the response according to the cell's formatting. Formatting is based on the spreadsheet's locale, not the requesting user's locale. For example, if A1 is 1.23 and A2 is =A1 and formatted as currency, then A2 would return "$1.23".
   */
  FORMATTED_VALUE = 'FORMATTED_VALUE',

  /**
   * Values will be calculated, but not formatted in the reply. For example, if A1 is 1.23 and A2 is =A1 and formatted as currency, then A2 would return the number 1.23.
   */
  UNFORMATTED_VALUE = 'UNFORMATTED_VALUE',

  /**
   * Values will not be calculated. The reply will include the formulas. For example, if A1 is 1.23 and A2 is =A1 and formatted as currency, then A2 would return "=A1".
   */
  FORMULA = 'FORMULA',
}
