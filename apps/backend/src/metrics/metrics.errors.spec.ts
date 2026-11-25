import { failure } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { toMetricsReadDeniedFailure } from './metrics.errors';

describe('toMetricsReadDeniedFailure', () => {
  it("nomme l'utilisateur et la collectivité refusés", () => {
    expect(
      toMetricsReadDeniedFailure({
        userId: 'user-1',
        collectiviteId: 3,
        isApiKeyDenied: false,
      })
    ).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          "Droits insuffisants, l'utilisateur user-1 n'a pas l'autorisation collectivites.read sur la ressource Collectivité 3"
        )
      )
    );
  });

  it("écrit « l'utilisateur null » quand l'utilisateur n'a pas d'identifiant, comme avant", () => {
    expect(
      toMetricsReadDeniedFailure({
        userId: null,
        collectiviteId: 3,
        isApiKeyDenied: false,
      })
    ).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          "Droits insuffisants, l'utilisateur null n'a pas l'autorisation collectivites.read sur la ressource Collectivité 3"
        )
      )
    );
  });

  it("nomme la clé d'api refusée sans citer l'utilisateur", () => {
    expect(
      toMetricsReadDeniedFailure({
        userId: 'user-1',
        collectiviteId: 3,
        isApiKeyDenied: true,
      })
    ).toEqual(
      failure(
        'UNAUTHORIZED',
        new Error(
          "Droits insuffisants, la clé d'api n'a pas l'autorisation collectivites.read."
        )
      )
    );
  });
});
