import { describe, expect, it } from 'vitest';
import { isTransientError } from './llm.service';

describe('isTransientError', () => {
  it('réessaie une limitation de débit', () => {
    expect(isTransientError({ kind: 'rate_limited' })).toBe(true);
  });

  it('réessaie une erreur réseau (sans statut HTTP)', () => {
    expect(isTransientError({ kind: 'api_error', httpStatus: null })).toBe(true);
  });

  it('réessaie une erreur serveur 5xx', () => {
    expect(isTransientError({ kind: 'api_error', httpStatus: 504 })).toBe(true);
  });

  it('ne réessaie pas une erreur client 4xx', () => {
    expect(isTransientError({ kind: 'api_error', httpStatus: 400 })).toBe(
      false
    );
  });

  it('ne réessaie pas une réponse tronquée', () => {
    expect(isTransientError({ kind: 'truncated' })).toBe(false);
  });

  it('ne réessaie pas un JSON invalide', () => {
    expect(
      isTransientError({ kind: 'invalid_json', rawTextLength: 10 })
    ).toBe(false);
  });
});
