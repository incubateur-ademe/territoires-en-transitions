/** Renvoie "Sans titre" si le string est undefined ou null */
export const generateTitle = (title?: string | null): string =>
  title || 'Sans titre';
