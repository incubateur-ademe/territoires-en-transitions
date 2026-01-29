import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import {
  createdAt,
  createdBy,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import {
  NotificationStatusEnum,
  type NotificationStatus,
  type NotifiedOn,
} from '@tet/domain/utils';
import {
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { notificationsDatabaseSchema } from './notifications.database-schema';

export const notificationTable = notificationsDatabaseSchema.table(
  'notification',
  {
    id: serial('id').primaryKey(),
    entityId: text('entity_id'),
    status: text('status')
      .notNull()
      .default(NotificationStatusEnum.PENDING)
      .$type<NotificationStatus>(),
    sendTo: uuid('send_to')
      .references(() => authUsersTable.id)
      .notNull(),
    sendAfter: timestamp('send_after', TIMESTAMP_OPTIONS),
    sentAt: timestamp('sent_at', TIMESTAMP_OPTIONS),
    sentToEmail: text('sent_to_email'),
    errorMessage: text('error_message'),
    retries: integer().notNull().default(0),
    createdBy,
    createdAt,
    notifiedOn: text('notified_on').notNull().$type<NotifiedOn>(),
    notificationData: jsonb('notification_data'),
  }
);
