enum SheetValueRenderOption {
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
export default SheetValueRenderOption;
