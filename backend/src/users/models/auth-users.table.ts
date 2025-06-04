import { sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgSchema,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createdAt } from '../../utils/column.utils';

export const authSchemaDB = pgSchema('auth');

export const authUsersTable = authSchemaDB.table('users', {
  id: uuid('id').primaryKey().notNull(),
  email: varchar('email', { length: 255 }),
  instanceId: uuid('instance_id'),
  createdAt,
  aud: varchar('aud', { length: 255 }),
  role: varchar('role', { length: 255 }),
  encryptedPassword: varchar('encrypted_password', { length: 255 }),
  emailConfirmedAt: timestamp('email_confirmed_at', {
    withTimezone: true,
    mode: 'string',
  }),
  invitedAt: timestamp('invited_at', { withTimezone: true, mode: 'string' }),
  confirmationToken: varchar('confirmation_token', { length: 255 }),
  confirmationSentAt: timestamp('confirmation_sent_at', {
    withTimezone: true,
    mode: 'string',
  }),
  recoveryToken: varchar('recovery_token', { length: 255 }),
  recoverySentAt: timestamp('recovery_sent_at', {
    withTimezone: true,
    mode: 'string',
  }),
  emailChangeTokenNew: varchar('email_change_token_new', { length: 255 }),
  emailChange: varchar('email_change', { length: 255 }),
  emailChangeSentAt: timestamp('email_change_sent_at', {
    withTimezone: true,
    mode: 'string',
  }),
  lastSignInAt: timestamp('last_sign_in_at', {
    withTimezone: true,
    mode: 'string',
  }),
  rawAppMetaData: jsonb('raw_app_meta_data'),
  rawUserMetaData: jsonb('raw_user_meta_data'),
  isSuperAdmin: boolean('is_super_admin'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  phone: text('phone').default(sql`NULL`),
  phoneConfirmedAt: timestamp('phone_confirmed_at', {
    withTimezone: true,
    mode: 'string',
  }),
  phoneChange: text('phone_change').default(''),
  phoneChangeToken: varchar('phone_change_token', { length: 255 }).default(''),
  phoneChangeSentAt: timestamp('phone_change_sent_at', {
    withTimezone: true,
    mode: 'string',
  }),
  confirmedAt: timestamp('confirmed_at', {
    withTimezone: true,
    mode: 'string',
  }).generatedAlwaysAs(sql`LEAST(email_confirmed_at, phone_confirmed_at)`),
  emailChangeTokenCurrent: varchar('email_change_token_current', {
    length: 255,
  }).default(''),
  emailChangeConfirmStatus: smallint('email_change_confirm_status').default(0),
  bannedUntil: timestamp('banned_until', {
    withTimezone: true,
    mode: 'string',
  }),
  reauthenticationToken: varchar('reauthentication_token', {
    length: 255,
  }).default(''),
  reauthenticationSentAt: timestamp('reauthentication_sent_at', {
    withTimezone: true,
    mode: 'string',
  }),
  isSsoUser: boolean('is_sso_user').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
});
