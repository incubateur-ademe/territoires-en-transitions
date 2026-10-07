import { categorieActionEnumValues } from '@tet/domain/shared';
import { pgEnum } from 'drizzle-orm/pg-core';

export const voletCategoriePgEnum = pgEnum(
  'volet_categorie',
  categorieActionEnumValues
);
