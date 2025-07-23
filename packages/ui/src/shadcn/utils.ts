import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';

export function cn(
  ...inputs: (string | number | boolean | undefined | null)[]
) {
  return twMerge(classNames(inputs));
}
