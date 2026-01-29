import { z } from 'zod';
import {
  notificationStatusSchema,
  notificationStatusValues,
} from './notification-status.enum.schema';
import { notifiedOnSchema } from './notified-on.enum.schema';

export const notificationSchema = z.object({
  id: z.number(),
  entityId: z.string().nullable(),
  status: notificationStatusSchema,
  sendTo: z.string().uuid(),
  sendAfter: z.string().datetime().nullable(),
  sentAt: z.string().datetime().nullable(),
  sentToEmail: z.string().nullable(),
  errorMessage: z.string().nullable(),
  retries: z.number(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  notifiedOn: notifiedOnSchema,
  notificationData: z.unknown(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const notificationInsertSchema = z.object({
  entityId: z.string().nullable().optional(),
  status: z.enum(notificationStatusValues).default('pending'),
  sendTo: z.string().uuid(),
  sendAfter: z.string().datetime().nullable().optional(),
  sentAt: z.string().datetime().nullable().optional(),
  sentToEmail: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  retries: z.number().default(0).optional(),
  createdBy: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  notifiedOn: notifiedOnSchema,
  notificationData: z.unknown().optional(),
});

export type NotificationInsert = z.infer<typeof notificationInsertSchema>;
