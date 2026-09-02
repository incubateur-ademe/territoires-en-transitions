import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  getEnabledReferentielIdsFromDisplayMap,
  REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY,
} from '@tet/domain/collectivites';
import { describe, expect, it, vi } from 'vitest';
import { CollectivitePreferencesService } from './collectivite-preferences.service';

describe('CollectivitePreferencesService', () => {
  const user = { id: 'user-id' } as AuthenticatedUser;
  const collectiviteId = 1;

  const repository = {
    updatePreferences: vi.fn(),
    getPreferencesByCollectiviteId: vi.fn(),
  } as unknown;
  const permission = {
    assertAllowed: vi.fn().mockResolvedValue(undefined),
  } as unknown;

  const service = new CollectivitePreferencesService(
    repository as never,
    permission as never
  );

  describe('getEnabledReferentiels', () => {
    it('retourne les référentiels par défaut quand le feature flag est désactivé', async () => {
      const getPreferencesSpy = vi.spyOn(service, 'getPreferences');

      const enabledReferentiels = await service.getEnabledReferentiels(
        false,
        collectiviteId,
        user
      );

      expect(getPreferencesSpy).not.toHaveBeenCalled();
      expect(enabledReferentiels).toEqual(['eci', 'cae']);
    });

    it('retourne les préférences collectivité quand le feature flag est activé', async () => {
      vi.spyOn(service, 'getPreferences').mockResolvedValue({
        success: true,
        data: {
          referentiels: {
            cae: { display: false, mode: 'archived' },
            eci: { display: true, mode: 'write' },
            te: { display: true, mode: 'readonly' },
          },
        },
      });

      const enabledReferentiels = await service.getEnabledReferentiels(
        true,
        collectiviteId,
        user
      );

      expect(enabledReferentiels).toEqual(['eci', 'te']);
    });

    it('exclut un référentiel archivé même s’il reste affiché dans la nav', async () => {
      vi.spyOn(service, 'getPreferences').mockResolvedValue({
        success: true,
        data: {
          referentiels: {
            // archivé post-bascule mais conservé dans la nav pour consultation
            cae: { display: true, mode: 'archived' },
            eci: { display: false, mode: 'archived' },
            te: {
              display: true,
              mode: 'write',
              populatedFromCaeEci: {
                populatedAt: '2026-06-01T00:00:00.000Z',
                populatedBy: 'user-id',
              },
            },
          },
        },
      });

      const enabledReferentiels = await service.getEnabledReferentiels(
        true,
        collectiviteId,
        user
      );

      expect(enabledReferentiels).toEqual(['te']);
    });

    it('revient au comportement par défaut si la lecture des préférences échoue', async () => {
      vi.spyOn(service, 'getPreferences').mockResolvedValue({
        success: false,
        error: 'PREFERENCES_PARSE_ERROR',
      });

      const enabledReferentiels = await service.getEnabledReferentiels(
        true,
        collectiviteId,
        user
      );

      expect(enabledReferentiels).toEqual(
        getEnabledReferentielIdsFromDisplayMap(
          REFERENTIEL_TE_DISABLED_REFERENTIELS_DISPLAY
        )
      );
    });

    it("revient au comportement par défaut si les préférences n'existent pas", async () => {
      vi.spyOn(service, 'getPreferences').mockResolvedValue({
        success: true,
        data: null,
      });

      const enabledReferentiels = await service.getEnabledReferentiels(
        true,
        collectiviteId,
        user
      );

      expect(enabledReferentiels).toEqual(['eci', 'cae']);
    });
  });
});
