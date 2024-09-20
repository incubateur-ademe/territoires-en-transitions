import { pgSchema } from 'drizzle-orm/pg-core';
import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const authSchemaDB = pgSchema('auth');

export const authUsersTable = authSchemaDB.table('users', {
  id: uuid('user_id').primaryKey().notNull(),
  email: varchar('email', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  lastSignInAt: timestamp('last_sign_in_at', {
    withTimezone: true,
    mode: 'string',
  }),

  /*
  TODO
  instance_id                 uuid,
  aud                         varchar(255),
  role                        varchar(255),
  encrypted_password          varchar(255),
  email_confirmed_at          timestamp with time zone,
  invited_at                  timestamp with time zone,
  confirmation_token          varchar(255),
  confirmation_sent_at        timestamp with time zone,
  recovery_token              varchar(255),
  recovery_sent_at            timestamp with time zone,
  email_change_token_new      varchar(255),
  email_change                varchar(255),
  email_change_sent_at        timestamp with time zone,
  raw_app_meta_data           jsonb,
  raw_user_meta_data          jsonb,
  is_super_admin              boolean,
  updated_at                  timestamp with time zone,
  phone                       text         default NULL::character varying
unique,
  phone_confirmed_at          timestamp with time zone,
  phone_change                text         default ''::character varying,
  phone_change_token          varchar(255) default ''::character varying,
  phone_change_sent_at        timestamp with time zone,
  confirmed_at                timestamp with time zone generated always as (LEAST(email_confirmed_at, phone_confirmed_at)) stored,
  email_change_token_current  varchar(255) default ''::character varying,
  email_change_confirm_status smallint     default 0
constraint users_email_change_confirm_status_check
check ((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)),
banned_until                timestamp with time zone,
  reauthentication_token      varchar(255) default ''::character varying,
  reauthentication_sent_at    timestamp with time zone,
  is_sso_user                 boolean      default false not null,
  deleted_at                  timestamp with time zone,
  is_anonymous                boolean      default false not null
   */
});
