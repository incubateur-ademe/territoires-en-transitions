import {Option, OptionSection, SelectOption} from './Options';

/** Option section type guards */
export function isOptionSection(option: SelectOption): option is OptionSection {
  return (option as OptionSection).title !== undefined;
}

/** Option type guards */
export function isOption(option: SelectOption): option is Option {
  type NewType = Option;
  return (option as NewType).value !== undefined;
}

/** Renvoie un tableau d'options, quelles soient dans une section ou non */
export const getOptions = (selectOptions: SelectOption[]): Option[] =>
  selectOptions.reduce(
    (acc: Option[], curr) =>
      acc.concat(isOptionSection(curr) ? curr.options : curr),
    []
  );
