import {useEffect, useRef} from 'react';

export const onlyNumericWithFloatRegExp = new RegExp(
  /^-?(?:\d|\s)*[.,]?(?:\d|\s)*$/
);
export const onlyNumericRegExp = new RegExp(/^\d?\d*$/);

const EVENTS = [
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mouseup',
  'select',
  'contextmenu',
  'drop',
  'focusout',
];

/**
 * Permet de n'autoriser que certains caractères dans un input ou textarea.
 *
 * Basé sur cette solution:
 * https://stackoverflow.com/a/469362/16408731
 * @param inputFilter Regex que l'on souhaite appliquer au filtre
 * @param errMsg Si le message d'erreur est défini, affiche le message quand un caractère non autorisé est renseigné
 * @returns ref La référence à associer l'input
 */
export const useInputFilterRef = <
  T extends HTMLInputElement | HTMLTextAreaElement
>(
  inputFilter: RegExp,
  errMsg?: string
) => {
  const ref = useRef<T>(null);

  function handleEvent(
    this: (HTMLInputElement | HTMLTextAreaElement) & {
      oldValue: string;
      oldSelectionStart: number | null;
      oldSelectionEnd: number | null;
    },
    e: Event
  ) {
    if (inputFilter.test(this.value)) {
      if (errMsg && ['keydown', 'mousedown', 'focusout'].includes(e.type)) {
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
      if (this.oldSelectionStart !== null && this.oldSelectionEnd !== null) {
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      }
    } else {
      this.value = '';
    }
  }

  useEffect(() => {
    EVENTS.forEach(event => {
      ref?.current?.addEventListener(event, handleEvent);
    });
    return () => {
      EVENTS.forEach(event => {
        ref?.current?.removeEventListener(event, handleEvent);
      });
    };
  }, [ref.current]);

  return ref;
};
