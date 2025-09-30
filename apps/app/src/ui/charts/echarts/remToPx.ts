/**
 * Useful because rem are not well supported for SSR rendering
 * @param rem
 * @returns
 */
export const remToPx = (rem: number | string): number => {
  const value = typeof rem === 'string' ? parseFloat(rem) : rem;
  // Guard against SSR where window/document/getComputedStyle are not available
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return value * 16; // Fallback to 16px base font size
  }
  const rootElement = document.documentElement;
  const baseFontSizeString =
    typeof getComputedStyle === 'function'
      ? getComputedStyle(rootElement).fontSize
      : '16px';
  const baseFontSize = parseFloat(baseFontSizeString || '16');
  return value * (Number.isNaN(baseFontSize) ? 16 : baseFontSize);
};
