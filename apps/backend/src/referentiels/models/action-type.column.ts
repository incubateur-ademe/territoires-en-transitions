import { orderedActionType } from '@tet/domain/referentiels';
import { pgEnum } from 'drizzle-orm/pg-core';

export const actionTypePgEnum = pgEnum('action_type', orderedActionType);
