/**
 * See https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption?hl=fr
 */
enum SheetValueInputOption {
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
export default SheetValueInputOption;
