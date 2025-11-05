import { useCollectiviteId } from '@/api/collectivites';
import { useListAllFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { FicheWithRelations, SortOptions } from '@/domain/plans';
import { Button, Modal, ModalFooter, useEventTracker } from '@/ui';
import { Event } from '@/ui/components/tracking/posthog-events';
import { mapValues } from 'es-toolkit';
import { useState } from 'react';
import { ExportFicheActionButton } from '../ExportFicheActionButton';
import ExportFicheActionGroupeesButton from '../ExportFicheActionGroupeesButton';
import { sectionsInitValue } from '../utils';
import ExportFicheActionTable from './export-fa-table';

const ExportFicheModalWrapper = ({
  disabled,
  children,
  onClick,
}: {
  disabled?: boolean;
  children: (close: () => void) => React.ReactNode;
  onClick?: () => void;
}) => {
  const [options, setOptions] = useState(sectionsInitValue);
  return (
    <Modal
      title="Exporter en PDF"
      subTitle="Paramètres de l’export"
      size="xl"
      render={() => (
        <ExportFicheActionTable options={options} setOptions={setOptions} />
      )}
      renderFooter={({ close }) => (
        <ModalFooter variant="right">
          <Button variant="outlined" onClick={close}>
            Annuler
          </Button>
          {children(close)}
        </ModalFooter>
      )}
    >
      <Button
        icon="download-fill"
        size="xs"
        variant="outlined"
        disabled={disabled}
        onClick={onClick}
      />
    </Modal>
  );
};

export const ExportFicheModal = ({
  disabled,
  fiche,
}: {
  disabled?: boolean;
  fiche: FicheWithRelations;
}) => {
  const [options, setOptions] = useState(sectionsInitValue);

  return (
    <ExportFicheModalWrapper disabled={disabled}>
      {(close) => (
        <ExportFicheActionButton
          fiche={fiche}
          options={options}
          disabled={!Object.values(options).find((opt) => opt.isChecked)}
          onDownloadEnd={() => {
            close();
            setOptions(sectionsInitValue);
          }}
        />
      )}
    </ExportFicheModalWrapper>
  );
};

export const ExportMultipleFichesModal = ({
  sort,
  disabled,
  selectedFicheIds,
  filters,
}: {
  disabled?: boolean;
  selectedFicheIds: number[] | 'all';
  filters: Filters;
  sort?: SortOptions;
}) => {
  const [options, setOptions] = useState(sectionsInitValue);
  const [fichesIds, setFichesIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const tracker = useEventTracker();
  const collectiviteId = useCollectiviteId();
  const { listAllFiches } = useListAllFiches({
    collectiviteId,
    filters: filters,
    sort,
    requested: selectedFicheIds === 'all',
  });

  const fetchSelectedFichesIds = async () => {
    setIsLoading(true);

    const fichesIds =
      selectedFicheIds !== 'all'
        ? selectedFicheIds
        : (await listAllFiches()).data.map((fiche) => fiche.id);
    setFichesIds(fichesIds);
    setIsLoading(false);
  };

  return (
    <ExportFicheModalWrapper
      disabled={disabled || isLoading}
      onClick={fetchSelectedFichesIds}
    >
      {(close) => (
        <ExportFicheActionGroupeesButton
          fichesIds={fichesIds}
          options={options}
          disabled={!Object.values(options).find((opt) => opt.isChecked)}
          onDownloadEnd={() => {
            const selectedOptions = Object.keys(
              mapValues(
                options,
                (value: { isChecked: boolean }) => value.isChecked
              )
            ).filter(Boolean);
            tracker(Event.fiches.exportPdfGroupe, {
              sections: selectedOptions,
            });
            setOptions(sectionsInitValue);
            close();
          }}
        />
      )}
    </ExportFicheModalWrapper>
  );
};
