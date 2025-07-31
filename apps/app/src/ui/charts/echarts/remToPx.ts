/**
 * Useful because rem are not well supported for SSR rendering
 * @param rem
 * @returns
 */
export const remToPx = (rem: number | string): number => {
  const value = typeof rem === 'string' ? parseFloat(rem) : rem;
  return (
    value * parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
};
