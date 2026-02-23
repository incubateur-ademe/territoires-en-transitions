'use client';

import { referentielToName } from '@/app/app/labels';
import { useReferentielsResetDisplayPreferences } from '@/app/referentiels/display-preferences/use-reset-display-preferences';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { type CollectiviteReferentielDisplayId } from '@tet/domain/collectivites';
import { useUpdateCollectivitePreferences } from './use-update-collectivite-preferences';

const REFERENTIEL_IDS_WITH_EDITABLE_DISPLAY_PREFERENCES = [
  'cae',
  'eci',
  'te',
] as const satisfies CollectiviteReferentielDisplayId[];

export const AffichageReferentielsPage = () => {
  const currentCollectivite = useCurrentCollectivite();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();

  const display =
    currentCollectivite.collectivitePreferences.referentiels.display;
  const {
    mutate: updateCollectivitePreferences,
    isPending: isUpdatingCollectivitePreferences,
  } = useUpdateCollectivitePreferences();

  const {
    mutate: resetCollectivitePreferences,
    isPending: isResettingCollectivitePreferences,
  } = useReferentielsResetDisplayPreferences();

  const isMutatingPreferences =
    isUpdatingCollectivitePreferences || isResettingCollectivitePreferences;

  if (!isSuperAdminRoleEnabled) {
    return null;
  }

  const handleToggle = async (
    referentielId: CollectiviteReferentielDisplayId
  ) => {
    const newDisplay = {
      ...display,
      [referentielId]: !display[referentielId],
    };
    updateCollectivitePreferences({
      collectiviteId: currentCollectivite.collectiviteId,
      preferences: { referentiels: { display: newDisplay } },
    });
  };

  return (
    <div className="max-w-xl">
      <h2 className="mb-6">Affichage des référentiels</h2>
      <p className="mb-4 text-sm text-grey-6">
        Choisir les référentiels affichés dans le menu « État des lieux » pour
        cette collectivité.
      </p>
      <div className="space-y-4 border border-grey-3 rounded-lg p-6 bg-white">
        {REFERENTIEL_IDS_WITH_EDITABLE_DISPLAY_PREFERENCES.map(
          (referentielId) => (
            <label
              key={referentielId}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={display[referentielId]}
                onChange={() => handleToggle(referentielId)}
                disabled={isMutatingPreferences}
                data-test={`preferences-referentiel-${referentielId}`}
                className="rounded border-grey-4"
              />
              <span>{referentielToName[referentielId]}</span>
            </label>
          )
        )}
        <div className="pt-4 border-t border-grey-3">
          <button
            type="button"
            onClick={() =>
              resetCollectivitePreferences({
                collectiviteId: currentCollectivite.collectiviteId,
              })
            }
            disabled={isMutatingPreferences}
            className="text-sm text-grey-8 underline hover:no-underline"
            data-test="affichage-referentiels-reset"
          >
            Réinitialiser selon le remplissage
          </button>
          <p className="text-xs text-grey-6 mt-1">
            Affiche/cache automatiquement les référentiels CAE et ECI en
            fonction de leur remplissage.
          </p>
        </div>
      </div>
    </div>
  );
};
