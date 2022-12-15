export const shortenLabel = (label: string) =>
  label.slice(0, 15) + `${label.length > 15 ? '...' : ''}`;
