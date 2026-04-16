import { useExportComparisonScores } from '@/app/referentiels/audits/AuditComparaison/useExportComparisonScore';
import { DownloadSnapshotsDropdown } from '@/app/referentiels/comparisons/dropdowns/download-snapshots.dropdown';
import { appLabels } from '@/app/labels/catalog';
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
      nom: snap.ref === 'score-courant' ? appLabels.etatDesLieuxActuel : snap.nom,
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
        title={appLabels.telechargerEtatDesLieux}
        size="md"
        openState={openState}
        render={() => (
          <div className="space-y-6">
            {hasEMTSnapshots ? (
              <Alert description={appLabels.telechargementAuditHorsTetAlerte} />
            ) : null}

            <fieldset>
              <legend className="mb-2">{appLabels.formatTelechargement}</legend>
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
                {appLabels.selectionnerVersionsTelecharger}
              </legend>
              <div
                id="selection-help"
                className="text-sm text-gray-600 mb-3"
                role="note"
                aria-live="polite"
              >
                {appLabels.telechargementDeuxVersionsMaximum}
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
                {appLabels.deuxVersionsMemeFichierComparaison}
              </div>
            </fieldset>
          </div>
        )}
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{
              onClick: close,
              'aria-label': appLabels.annulerTelechargement,
            }}
            btnOKProps={{
              children: appLabels.valider,
              onClick: () => {
                if (hasValidSelection) {
                  handleExport();
                  close();
                }
              },
              disabled: !hasValidSelection,
              'aria-label': hasValidSelection
                ? appLabels.telechargerVersionsAriaLabel({
                    count: selectedSnapshots.length,
                    format: selectedFormat.toUpperCase(),
                  })
                : appLabels.veillezSelectionnerVersionAvantValidation,
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
