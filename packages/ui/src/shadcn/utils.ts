import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined)[]) {
  return twMerge(classNames(inputs));
}
