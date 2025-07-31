import { Event } from '@sentry/core';

export interface SentryEventWebhookPayload {
  id: string;
  project: string;
  project_name: string;
  project_slug: string;
  logger: string | null;
  level: string;
  culprit: string;
  message: string;
  url: string;
  triggering_rules: string[];
  event: Event;
}
