import { unaccent } from '@tet/backend/utils/unaccent.utils';

export const normalizeName = (name: string): string =>
  unaccent(name.trim().toLowerCase()).replace(/\s+/g, ' ');
