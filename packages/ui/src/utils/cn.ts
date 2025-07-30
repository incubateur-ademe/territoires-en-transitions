import classNames from 'classnames';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function that combines classNames and twMerge
 * - classNames: for conditional/dynamic class building
 * - twMerge: for resolving Tailwind utility conflicts (last one wins)
 */
export function cn(...inputs: any[]) {
  return twMerge(classNames(inputs));
}
