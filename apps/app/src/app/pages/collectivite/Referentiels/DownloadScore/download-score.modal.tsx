import { useExportComparisonScores } from '@/app/referentiels/audits/AuditComparaison/useExportComparisonScore';
import { DownloadSnapshotsDropdown } from '@/app/referentiels/comparisons/dropdowns/download-snapshots.dropdown';
import { useListSnapshots } from '@/app/referentiels/use-snapshot';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ReferentielId, SnapshotJalonEnum } from '@tet/domain/referentiels';
import { Alert, Icon, Modal, ModalFooterOKCancel, RadioButton } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useEffect, useMemo, useState } from 'react';

export type DownloadScoreProps = {
  referentielId: ReferentielId;
  collectiviteId: number;
};

export const DownloadScoreModal = ({
  referentielId,
  collectiviteId,
  openState,
}: DownloadScoreProps & {
  openState: OpenState;
}) => {
  const { data: rawSnapshots } = useListSnapshots({ referentielId });
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'csv'>(
    'excel'
  );

  const [selectedSnapshots, setSelectedSnapshots] = useState<
    typeof rawSnapshots
  >([]);

  const { mutate: exportComparison } = useExportComparisonScores(
    referentielId,
    collectiviteId,
    selectedFormat,
    false,
    selectedSnapshots?.map((s) => s.ref)
  );

  const handleExport = () => {
    exportComparison();
  };

  const snapshots = useMemo(() => {
    if (!rawSnapshots) return [];

    return rawSnapshots.map((snap) => ({
      ...snap,
      nom: snap.ref === 'score-courant' ? 'État des lieux actuel' : snap.nom,
    }));
  }, [rawSnapshots]);

  useEffect(() => {
    if (rawSnapshots) {
      setSelectedSnapshots([]);
    }
  }, [rawSnapshots]);

  if (!rawSnapshots) {
    return <SpinnerLoader />;
  }

  const hasValidSelection = selectedSnapshots && selectedSnapshots.length > 0;
  const hasEMTSnapshots =
    snapshots.findIndex(
      (s) => s.jalon === SnapshotJalonEnum.LABELLISATION_EMT
    ) !== -1;

  return (
    <>
      <Modal
        title="Télécharger l'état des lieux"
        size="md"
        openState={openState}
        render={() => (
          <div className="space-y-6">
            {hasEMTSnapshots ? (
              <Alert description="Il n'est pas possible de sélectionner les sauvegardes issues de labellisations dont l'audit n'a pas été réalisé sur Territoires en Transitions." />
            ) : null}

            <fieldset>
              <legend className="mb-2">Format&nbsp;:</legend>
              <div
                className="flex gap-4"
                role="radiogroup"
                aria-labelledby="format-legend"
                aria-required="true"
              >
                <RadioButton
                  name="format"
                  value="excel"
                  label="Excel"
                  checked={selectedFormat === 'excel'}
                  onChange={() => setSelectedFormat('excel')}
                  aria-describedby="format-description"
                />
                <RadioButton
                  name="format"
                  value="csv"
                  label="CSV"
                  checked={selectedFormat === 'csv'}
                  onChange={() => setSelectedFormat('csv')}
                  aria-describedby="format-description"
                />
              </div>
            </fieldset>

            <fieldset>
              <legend id="versions-legend" className="mt-4 mb-2">
                Sélectionnez la ou les versions à télécharger&nbsp;:
              </legend>
              <div
                id="selection-help"
                className="text-sm text-gray-600 mb-3"
                role="note"
                aria-live="polite"
              >
                Vous ne pouvez sélectionner que deux versions maximum.
              </div>

              <DownloadSnapshotsDropdown
                values={selectedSnapshots ?? []}
                onChange={setSelectedSnapshots}
                options={snapshots}
                maxBadgesToShow={2}
                aria-labelledby="versions-legend"
                aria-describedby="selection-help"
                aria-required="true"
                aria-invalid={!hasValidSelection}
              />

              <div className="text-sm text-info-1 mt-4">
                <Icon icon="information-fill" size="sm" className="mr-1" />
                Si vous sélectionnez deux versions, elles seront téléchargées
                dans un même fichier Excel pour comparaison.
              </div>
            </fieldset>
          </div>
        )}
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{
              onClick: close,
              'aria-label': 'Annuler le téléchargement',
            }}
            btnOKProps={{
              children: `Valider`,
              onClick: () => {
                if (hasValidSelection) {
                  handleExport();
                  close();
                }
              },
              disabled: !hasValidSelection,
              'aria-label': hasValidSelection
                ? `Télécharger ${
                    selectedSnapshots?.length
                  } version(s) au format ${selectedFormat.toUpperCase()}`
                : 'Veuillez sélectionner au moins une version avant de valider',
              'aria-describedby': !hasValidSelection
                ? 'validation-error'
                : undefined,
            }}
          />
        )}
      />
    </>
  );
};
