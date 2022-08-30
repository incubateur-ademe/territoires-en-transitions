export const onlyNumericWithFloatRegExp = new RegExp(/^-?\d*[.,]?\d*$/);

/**
 * Permet de n'autoriser que certains caractères dans un  ou textarea.
 *
 * Basé sur cette solution:
 * https://stackoverflow.com/a/469362/16408731
 * @param ref La référence de l'input
 * @param inputFilter Regex que l'on souhaite appliquer au filtre
 * @param errMsg Si le message d'erreur est défini, affiche le message quand un caractère non autorisé est renseigné
 */
export const setInputFilter = (
  ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
  inputFilter: (value: string) => boolean,
  errMsg?: string
): void => {
  [
    'input',
    'keydown',
    'keyup',
    'mousedown',
    'mouseup',
    'select',
    'contextmenu',
    'drop',
    'focusout',
  ].forEach(event => {
    ref &&
      ref.current &&
      ref.current.addEventListener(
        event,
        function (
          this: (HTMLInputElement | HTMLTextAreaElement) & {
            oldValue: string;
            oldSelectionStart: number | null;
            oldSelectionEnd: number | null;
          },
          e: Event
        ) {
          if (inputFilter(this.value)) {
            if (
              errMsg &&
              ['keydown', 'mousedown', 'focusout'].indexOf(e.type) >= 0
            ) {
              this.setCustomValidity('');
            }
            this.oldValue = this.value;
            this.oldSelectionStart = this.selectionStart;
            this.oldSelectionEnd = this.selectionEnd;
          } else if (Object.prototype.hasOwnProperty.call(this, 'oldValue')) {
            if (errMsg) {
              this.setCustomValidity(errMsg);
              this.reportValidity();
            }
            this.value = this.oldValue;
            if (
              this.oldSelectionStart !== null &&
              this.oldSelectionEnd !== null
            ) {
              this.setSelectionRange(
                this.oldSelectionStart,
                this.oldSelectionEnd
              );
            }
          } else {
            this.value = '';
          }
        }
      );
  });
};
