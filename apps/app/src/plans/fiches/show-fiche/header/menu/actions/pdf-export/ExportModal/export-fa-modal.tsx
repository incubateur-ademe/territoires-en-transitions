import {
  SortOptions,
  useListAllFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import {
  Button,
  Modal,
  ModalFooter,
  ModalProps,
  useEventTracker,
} from '@tet/ui';
import { Event } from '@tet/ui/components/tracking/posthog-events';
import { mapValues } from 'es-toolkit';
import { useState } from 'react';
import { ExportFicheActionButton } from '../ExportFicheActionButton';
import ExportFicheActionGroupeesButton from '../ExportFicheActionGroupeesButton';
import { sectionsInitValue } from '../utils';
import ExportFicheActionTable from './export-fa-table';

const ExportFicheModalWrapper = ({
  openState,
  onClose,
  submitButton,
  children: trigger,
}: {
  openState?: ModalProps['openState'];
  onClose?: () => void;
  disabled?: boolean;
  submitButton: (
    close: () => void,
    options: typeof sectionsInitValue,
    setOptions: (options: typeof sectionsInitValue) => void
  ) => React.ReactNode;
  onClick?: () => void;
  children?: React.ReactElement;
}) => {
  const [options, setOptions] = useState(sectionsInitValue);
  return (
    <Modal
      openState={openState}
      onClose={onClose}
      title="Exporter en PDF"
      subTitle="Paramètres de l'export"
      size="xl"
      render={() => (
        <ExportFicheActionTable options={options} setOptions={setOptions} />
      )}
      renderFooter={({ close }) => (
        <ModalFooter variant="right">
          <Button variant="outlined" onClick={close}>
            Annuler
          </Button>
          {submitButton(close, options, setOptions)}
        </ModalFooter>
      )}
    >
      {trigger}
    </Modal>
  );
};

export const ExportFicheModal = ({
  fiche,
  onClose,
}: {
  fiche: FicheWithRelations;
  onClose?: () => void;
}) => {
  return (
    <ExportFicheModalWrapper
      openState={{
        isOpen: true,
        setIsOpen: () => {},
      }}
      onClose={onClose}
      submitButton={(close, options, setOptions) => (
        <ExportFicheActionButton
          fiche={fiche}
          options={options}
          disabled={!Object.values(options).find((opt) => opt.isChecked)}
          onDownloadEnd={() => {
            onClose?.();
            close();
            setOptions(sectionsInitValue);
          }}
        />
      )}
    />
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
      onClick={fetchSelectedFichesIds}
      submitButton={(close, options, setOptions) => (
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
    >
      <Button
        icon="download-fill"
        size="xs"
        variant="outlined"
        disabled={disabled || isLoading}
      />
    </ExportFicheModalWrapper>
  );
};
