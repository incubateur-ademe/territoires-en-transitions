'use client';

import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  type CollectiviteReferentielPreferenceId,
  type ReferentielMode,
  type ReferentielPreference,
  referentielModeValues,
} from '@tet/domain/collectivites';
import {
  Alert,
  Checkbox,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { format, isValid } from 'date-fns';
import { useListMembres } from '../membres/list-membres/use-list-membres';
import { useUpdateCollectivitePreferences } from './use-update-collectivite-preferences';

const REFERENTIEL_IDS_WITH_EDITABLE_DISPLAY_PREFERENCES = [
  'cae',
  'eci',
  'te',
] as const satisfies CollectiviteReferentielPreferenceId[];

const referentielModeToLabel: Record<ReferentielMode, string> = {
  write: appLabels.referentielPreferenceModeWrite,
  readonly: appLabels.referentielPreferenceModeReadonly,
  archived: appLabels.referentielPreferenceModeArchived,
};

const referentielModeOptions = referentielModeValues.map((mode) => ({
  label: referentielModeToLabel[mode],
  value: mode,
}));

export const AffichageReferentielsPage = () => {
  const currentCollectivite = useCurrentCollectivite();
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();

  const { referentiels } = currentCollectivite.collectivitePreferences;
  const {
    mutate: updateCollectivitePreferences,
    isPending: isUpdatingCollectivitePreferences,
  } = useUpdateCollectivitePreferences();

  // l'auteur n'est connu que par son identifiant : son nom est retrouvé parmi
  // les membres de la collectivité, et omis s'il n'en fait pas (ou plus) partie
  const bascule = referentiels.te.populatedFromCaeEci;
  const { data: membres } = useListMembres({
    enabled: isSuperAdminRoleEnabled && !!bascule,
  });
  const basculeAuteur = membres?.find(
    (membre) => membre.userId === bascule?.populatedBy
  );
  const basculeDate = bascule ? new Date(bascule.populatedAt) : null;
  const basculeLabel =
    bascule && basculeDate && isValid(basculeDate)
      ? appLabels.referentielPreferenceBasculeRealisee({
          date: format(basculeDate, 'dd/MM/yyyy'),
          heure: format(basculeDate, 'HH:mm'),
          auteur: basculeAuteur
            ? `${basculeAuteur.prenom} ${basculeAuteur.nom}`
            : bascule.populatedBy,
        })
      : null;

  if (!isSuperAdminRoleEnabled) {
    return null;
  }

  // mode et display sont choisis librement, sans dépendance entre référentiels
  const handleChange = (
    referentielId: CollectiviteReferentielPreferenceId,
    patch: Partial<ReferentielPreference>
  ) => {
    updateCollectivitePreferences({
      collectiviteId: currentCollectivite.collectiviteId,
      preferences: {
        referentiels: {
          ...referentiels,
          [referentielId]: { ...referentiels[referentielId], ...patch },
        },
      },
    });
  };

  return (
    <div>
      <h2 className="mb-6">{appLabels.affichageDesReferentiels}</h2>
      <p className="mb-4 text-sm text-grey-6">
        {appLabels.choisirReferentielsAffichesEtatDesLieux}
      </p>
      <Alert
        state="warning"
        className="mb-4"
        title={appLabels.referentielPreferenceAlerteTitle}
        description={
          <div className="flex flex-col gap-3 text-sm text-grey-9">
            <p className="mb-0 text-sm">
              {appLabels.referentielPreferenceAlerteIntro}
            </p>
            <ul className="mb-0 pl-4 list-disc flex flex-col gap-2">
              {appLabels.referentielPreferenceAlerteConsequences.map(
                ({ titre, description }) => (
                  <li key={titre} className="text-sm">
                    <span className="font-bold">{titre}</span>
                    {description}
                  </li>
                )
              )}
            </ul>
          </div>
        }
      />
      <div className="p-4 pt-2 bg-white rounded-xl border border-grey-3">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                {appLabels.referentielPreferenceReferentiel}
              </TableHeaderCell>
              <TableHeaderCell>
                {appLabels.referentielPreferenceDisplay}
              </TableHeaderCell>
              <TableHeaderCell>
                {appLabels.referentielPreferenceMode}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {REFERENTIEL_IDS_WITH_EDITABLE_DISPLAY_PREFERENCES.map(
              (referentielId) => (
                <TableRow key={referentielId}>
                  <TableCell>
                    <div className="text-sm text-primary-10 font-bold">
                      {referentielToName[referentielId]}
                    </div>
                    {referentielId === 'te' && basculeLabel && (
                      <div className="mt-1 text-xs text-grey-6">
                        {basculeLabel}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={appLabels.referentielPreferenceDisplay}
                      checked={referentiels[referentielId].display}
                      onChange={(e) =>
                        handleChange(referentielId, {
                          display: e.target.checked,
                        })
                      }
                      disabled={isUpdatingCollectivitePreferences}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      options={referentielModeOptions}
                      values={referentiels[referentielId].mode}
                      onChange={(value) => {
                        const mode = referentielModeValues.find(
                          (m) => m === value
                        );
                        if (mode) {
                          handleChange(referentielId, { mode });
                        }
                      }}
                      disabled={isUpdatingCollectivitePreferences}
                      small
                    />
                  </TableCell>
                </TableRow>
              )
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};
