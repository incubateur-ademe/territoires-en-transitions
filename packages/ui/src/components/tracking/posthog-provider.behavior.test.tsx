import { render } from '@testing-library/react';
import { ReactNode, useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Ordre réel des appels au client posthog, tous composants confondus. `hoisted`
 * car les factories de `vi.mock` sont remontées au-dessus des imports.
 */
const { calls } = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(() => {
      calls.push('init');
    }),
    capture: vi.fn(() => {
      calls.push('capture');
    }),
    debug: vi.fn(),
  },
}));

vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: ReactNode }) => children,
}));

// Les deux enfants montés par le provider tirent `next/navigation` et
// `@tet/api` : hors sujet ici. L'objet du test est l'ordre init/capture pour
// N'IMPORTE QUEL enfant qui capture au montage.
vi.mock('./posthog-pageview', () => ({ PostHogPageView: () => null }));
vi.mock('./posthog-identify-user', () => ({ PostHogIdentifyUser: () => null }));

import posthog from 'posthog-js';
import { PostHogProvider } from './posthog-provider';

/**
 * Reproduit le motif de `ToastLiaisonComptes` et de `TrackLoginUserWithOidc` :
 * une capture dans un effet de montage, déclenchée par un marqueur one-shot
 * déposé par une redirection OIDC.
 */
const ChildCapturingOnMount = () => {
  useEffect(() => {
    posthog.capture('enfant_monte');
  }, []);
  return null;
};

describe('PostHogProvider — ordre init / capture', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  // Régression : l'init était dans un `useEffect` du provider, or React
  // exécute les effets des enfants AVANT ceux du parent — la capture partait
  // donc avant l'init et posthog-js la jetait.
  it("initialise le client avant qu'un enfant ne capture au montage", () => {
    render(
      <PostHogProvider config={{ key: 'phc_ordre', host: 'https://ph.test' }}>
        <ChildCapturingOnMount />
      </PostHogProvider>
    );

    expect(calls).toEqual(['init', 'capture']);
  });

  it("n'initialise qu'une fois pour une même configuration", () => {
    const config = { key: 'phc_idempotence', host: 'https://ph.test' };

    const { unmount } = render(
      <PostHogProvider config={config}>
        <ChildCapturingOnMount />
      </PostHogProvider>
    );
    unmount();
    render(
      <PostHogProvider config={config}>
        <ChildCapturingOnMount />
      </PostHogProvider>
    );

    expect(calls.filter((call) => call === 'init')).toHaveLength(1);
  });

  it("n'initialise pas sans clé", () => {
    render(
      <PostHogProvider config={{}}>
        <ChildCapturingOnMount />
      </PostHogProvider>
    );

    expect(calls).not.toContain('init');
  });
});
