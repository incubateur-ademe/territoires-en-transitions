import { levierIdEnumValues } from '@tet/domain/shared';
import { pgEnum } from 'drizzle-orm/pg-core';

export const levierGesIdPgEnum = pgEnum('levier_ges_id', levierIdEnumValues);
