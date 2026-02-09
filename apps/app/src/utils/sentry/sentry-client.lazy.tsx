import type { Client, Scope } from '@sentry/core';
import { defaultSentryConfig, isSentryEnabled } from './sentry.utils';

let SentryModule: typeof import('@sentry/nextjs') | undefined;
let sentryClientPromise: Promise<Client> | undefined;

async function getSentryModule(): Promise<typeof import('@sentry/nextjs')> {
  if (!SentryModule) {
    SentryModule = await import('@sentry/nextjs');
  }

  return SentryModule;
}

async function getSentryClient(): Promise<Client> {
  if (!sentryClientPromise) {
    sentryClientPromise = new Promise((resolve) => {
      getSentryModule().then((Sentry) => {
        const sentryClient = Sentry.init({
          ...defaultSentryConfig,

          // Replay may only be enabled for the client-side
          integrations: [Sentry.replayIntegration()],

          // replay enregistré uniquement en cas d'erreur
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 1.0,
        });

        if (sentryClient === undefined) {
          throw new Error('Failed to initialize Sentry client');
        }

        resolve(sentryClient);
      });
    });
  }

  return sentryClientPromise;
}

export function initSentry() {
  if (!isSentryEnabled) {
    return;
  }

  return getSentryClient();
}

export function captureException({
  error,
  crashId,
}: {
  error: unknown;
  crashId?: string;
}) {
  if (!isSentryEnabled) {
    return;
  }

  getSentryClient().then(async (sentryClient) => {
    let scope: Scope | undefined;

    if (crashId) {
      const Sentry = await getSentryModule();
      scope = new Sentry.Scope();
      scope.setTag('crash_id', crashId);
    }

    sentryClient.captureException(error, undefined, scope);
  });
}

export function captureRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
) {
  if (!isSentryEnabled) {
    return;
  }

  getSentryModule().then((Sentry) => {
    Sentry.captureRouterTransitionStart(url, navigationType);
  });
}
