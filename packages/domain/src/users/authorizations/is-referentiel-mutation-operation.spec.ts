import { describe, expect, it } from 'vitest';
import {
  isReferentielMutationOperation,
  isReferentielReadOperation,
} from './is-referentiel-mutation-operation';

describe('isReferentielReadOperation', () => {
  it.each([
    'referentiels.read',
    'referentiels.read_confidentiel',
    'referentiels.discussions.read',
  ] as const)('accepte %s', (operation) => {
    expect(isReferentielReadOperation(operation)).toBe(true);
  });

  it('refuse referentiels.mutate', () => {
    expect(isReferentielReadOperation('referentiels.mutate')).toBe(false);
  });
});

describe('isReferentielMutationOperation', () => {
  it.each([
    'referentiels.mutate',
    'referentiels.discussions.mutate',
    'referentiels.labellisations.request',
    'referentiels.labellisations.start_audit',
    'referentiels.labellisations.validate_audit',
    'referentiels.labellisations.mutate_action_audit_statut',
  ] as const)('accepte %s', (operation) => {
    expect(isReferentielMutationOperation(operation)).toBe(true);
  });

  it.each([
    'referentiels.read',
    'referentiels.read_confidentiel',
    'referentiels.discussions.read',
    'plans.mutate',
  ] as const)('refuse %s', (operation) => {
    expect(isReferentielMutationOperation(operation)).toBe(false);
  });
});
