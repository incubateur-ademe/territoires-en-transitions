import { useCollectiviteId } from '@/api/collectivites';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useListAllFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { SortOptions } from '@/domain/plans/fiches';
import { Button, Modal, ModalFooter, useEventTracker } from '@/ui';
import { Event } from '@/ui/components/tracking/posthog-events';
import { useState } from 'react';
import { ExportFicheActionButton } from '../ExportFicheActionButton';
import ExportFicheActionGroupeesButton from '../ExportFicheActionGroupeesButton';
import { sectionsInitValue } from '../utils';
import ExportFicheActionTable from './export-fa-table';

const ExportFicheActionModalWithoutContent = ({
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

export const ExportSingleFicheModal = ({
  disabled,
  fiche,
}: {
  disabled?: boolean;
  fiche: Fiche;
}) => {
  const [options, setOptions] = useState(sectionsInitValue);

  return (
    <ExportFicheActionModalWithoutContent disabled={disabled}>
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
    </ExportFicheActionModalWithoutContent>
  );
};

export const ExportFichesModal = ({
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
    <ExportFicheActionModalWithoutContent
      disabled={disabled || isLoading}
      onClick={fetchSelectedFichesIds}
    >
      {(close) => (
        <ExportFicheActionGroupeesButton
          fichesIds={fichesIds}
          options={options}
          disabled={!Object.values(options).find((opt) => opt.isChecked)}
          onDownloadEnd={() => {
            const selectedOptions = Object.keys(options).filter(
              (k) => options[k].isChecked === true
            );
            tracker(Event.fiches.exportPdfGroupe, {
              sections: selectedOptions,
            });
            setOptions(sectionsInitValue);
            close();
          }}
        />
      )}
    </ExportFicheActionModalWithoutContent>
  );
};
