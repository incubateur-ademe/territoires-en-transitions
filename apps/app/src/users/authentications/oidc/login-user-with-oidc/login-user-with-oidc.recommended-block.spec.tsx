import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OidcRecommendedBlock } from './login-user-with-oidc.recommended-block';

// useEventTracker requiert un contexte PostHog absent en environnement de test.
vi.mock('@tet/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tet/ui')>();
  return { ...actual, useEventTracker: () => vi.fn() };
});

const getProviderLink = () =>
  screen.getByRole('link', { name: /S’identifier avec/ });

describe('OidcRecommendedBlock', () => {
  it('emporte la destination dans le lien du fournisseur', () => {
    render(
      <OidcRecommendedBlock
        backendUrl="http://localhost:8080"
        provider="moncompteademe"
        next="/invitation/a35176bd"
      />
    );

    expect(getProviderLink().getAttribute('href')).toBe(
      'http://localhost:8080/api/v1/moncompteademe/login?next=%2Finvitation%2Fa35176bd'
    );
  });

  it('reste un lien de connexion simple sans destination', () => {
    render(
      <OidcRecommendedBlock
        backendUrl="http://localhost:8080"
        provider="moncompteademe"
      />
    );

    expect(getProviderLink().getAttribute('href')).toBe(
      'http://localhost:8080/api/v1/moncompteademe/login'
    );
  });
});
