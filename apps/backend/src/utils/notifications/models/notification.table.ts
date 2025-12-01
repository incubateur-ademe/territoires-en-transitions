import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import {
  createdAt,
  createdBy,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import {
  integer,
  jsonb,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import {
  NotificationStatus,
  NotificationStatusEnum,
  NotificationStatusType,
} from './notification-status.enum';
import { notificationsSchema } from './notifications.schema';
import { NotifiedOn, NotifiedOnType } from './notified-on.enum';

export const notificationTable = notificationsSchema.table('notification', {
  id: serial('id').primaryKey(),
  entityId: text('entity_id'),
  status: text('status')
    .notNull()
    .default(NotificationStatusEnum.PENDING)
    .$type<NotificationStatusType>(),
  sendTo: uuid('send_to')
    .references(() => authUsersTable.id)
    .notNull(),
  sentAt: timestamp('sent_at', TIMESTAMP_OPTIONS),
  sentToEmail: text('sent_to_email'),
  errorMessage: text('error_message'),
  retries: integer().notNull().default(0),
  createdBy,
  createdAt,
  notifiedOn: text('notified_on').notNull().$type<NotifiedOnType>(),
  notificationData: jsonb('notification_data'),
});

export const notificationSchema = createSelectSchema(notificationTable, {
  status: z.enum(NotificationStatus),
  notifiedOn: z.enum(NotifiedOn),
  notificationData: z.unknown(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const notificationInsertSchema = createInsertSchema(
  notificationTable
).extend({
  status: z.enum(NotificationStatus).default('pending'),
  notifiedOn: z.enum(NotifiedOn),
});

export type NotificationInsert = z.infer<typeof notificationInsertSchema>;
