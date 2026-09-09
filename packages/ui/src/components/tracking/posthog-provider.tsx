'use client';

import posthog, { PostHog } from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { ReactNode, useEffect } from 'react';
import { getConsent } from './Consent';
import { PostHogIdentifyUser } from './posthog-identify-user';
import { PostHogPageView } from './posthog-pageview';

type PostHogConfig = {
  host?: string;
  key?: string;
  shouldIdentifyUser?: boolean;
};

/**
 * Configuration déjà initialisée, ou `null`. Au niveau module — comme
 * l'instance `posthog` elle-même — pour survivre au double rendu de
 * StrictMode et aux remontages du provider.
 */
let initializedFor: string | null = null;

/**
 * Initialise le client, une fois, PENDANT LE RENDU du provider.
 *
 * Surtout pas dans un `useEffect` : React exécute les effets des enfants avant
 * ceux du parent, donc tout enfant qui capture au montage (`$pageview`, et les
 * marqueurs one-shot déposés par les redirections OIDC) partirait avant l'init
 * et posthog-js jetterait l'appel. Le rendu du parent, lui, précède toujours
 * celui des enfants.
 */
const ensureInitialized = ({ host, key }: PostHogConfig): void => {
  // Le provider est rendu côté serveur (`root-providers.tsx`) : pas de client
  // à initialiser là, et `getConsent()` a besoin de `document`.
  if (typeof window === 'undefined' || !key) {
    return;
  }

  const configKey = `${key}|${host ?? ''}`;
  if (initializedFor === configKey) {
    return;
  }
  initializedFor = configKey;

  posthog.init(key, {
    api_host: host,
    ui_host: 'https://eu.posthog.com',
    // create profiles for authenticated users only
    person_profiles: 'identified_only',
    persistence: getConsent() ? 'localStorage+cookie' : 'memory',
    // Disable automatic pageview capture, as we capture manually
    capture_pageview: false,
    capture_pageleave: true,

    integrations: {
      crispChat: true,
      intercom: false,
    },

    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
};

export const PostHogProvider = ({
  config,
  onClientInit,
  children,
}: {
  config: PostHogConfig;
  onClientInit?: (client: PostHog) => void;
  children: ReactNode;
}) => {
  ensureInitialized(config);

  const { host, key, shouldIdentifyUser = true } = config;

  // Dans un effet et non dans le rendu : les consommateurs y posent un état
  // (`apps/panier`), ce qui serait un setState de parent pendant le rendu d'un
  // enfant. L'init a déjà eu lieu, la notification peut attendre.
  useEffect(() => {
    if (!key) {
      return;
    }
    onClientInit?.(posthog);
  }, [host, key, onClientInit]);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {shouldIdentifyUser && <PostHogIdentifyUser />}
      {children}
    </PHProvider>
  );
};
