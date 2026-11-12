import { appLabels } from '@/app/labels/catalog';
import { describe, expect, it } from 'vitest';
import {
  getCollectiviteErrorMessage,
  getErrorKey,
} from './get-collectivite-error-message';

describe('getCollectiviteErrorMessage', () => {
  it('traduit un code connu', () => {
    expect(
      getCollectiviteErrorMessage({ data: { errorKey: 'SIREN_INVALIDE' } })
    ).toBe(appLabels.erreursApi.SIREN_INVALIDE);
  });

  it('retombe sur le message générique pour un code inconnu', () => {
    expect(
      getCollectiviteErrorMessage({
        data: { errorKey: 'Failed query: insert into "collectivite"' },
      })
    ).toBe(appLabels.formErreurInattendue);
  });

  it('retombe sur le message générique sans code', () => {
    expect(getCollectiviteErrorMessage({ data: null })).toBe(
      appLabels.formErreurInattendue
    );
    expect(getCollectiviteErrorMessage({})).toBe(
      appLabels.formErreurInattendue
    );
  });
});

describe('getErrorKey', () => {
  it('renvoie le code de l’API', () => {
    expect(
      getErrorKey({ data: { errorKey: 'COLLECTIVITE_EXISTE_DEJA' } })
    ).toBe('COLLECTIVITE_EXISTE_DEJA');
  });
});
