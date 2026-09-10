export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');
