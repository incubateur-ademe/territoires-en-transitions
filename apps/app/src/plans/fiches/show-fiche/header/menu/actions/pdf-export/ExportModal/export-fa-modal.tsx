import { appLabels } from '@/app/labels/catalog';
import { SortOptions } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Alert, Button } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { useDownloadPdfExport } from '../use-download-pdf-export';
import { sectionsInitValue, sectionsValuesToApiInput } from '../utils';
import ExportFicheActionTable from './export-fa-table';

// Doit rester aligné avec FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches côté backend.
const PDF_EXPORT_MAX_FICHES = 200;

type OpenState = { isOpen: boolean; setIsOpen: (open: boolean) => void };

type ExportFicheModalWrapperProps = {
  openState?: OpenState;
  warning?: string;
  submitButton: (
    close: () => void,
    options: typeof sectionsInitValue
  ) => React.ReactNode;
  children?: React.ReactElement;
};

const ExportFicheModalWrapper = ({
  openState,
  warning,
  submitButton,
  children: trigger,
}: ExportFicheModalWrapperProps): React.ReactElement => {
  const [options, setOptions] = useState(sectionsInitValue);
  const close = () => openState?.setIsOpen(false);

  return (
    <Modal openState={openState} size="xl">
      {trigger && <Modal.Trigger>{trigger}</Modal.Trigger>}
      <Modal.Header>
        <Modal.Title>{appLabels.exporterEnPdf}</Modal.Title>
        <Modal.Subtitle>{appLabels.parametresExport}</Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-4">
          {warning && <Alert state="warning" description={warning} />}
          <ExportFicheActionTable options={options} setOptions={setOptions} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        {submitButton(close, options)}
      </Modal.Footer>
    </Modal>
  );
};

export const ExportFicheModal = ({
  fiche,
  onClose,
}: {
  fiche: FicheWithRelations;
  onClose?: () => void;
}): React.ReactElement => {
  return (
    <ExportFicheModalWrapper
      openState={{
        isOpen: true,
        setIsOpen: (open) => {
          if (!open) onClose?.();
        },
      }}
      submitButton={(close, options) => (
        <ExportPdfButton
          input={{ mode: 'selection', ficheIds: [fiche.id] }}
          sections={options}
          close={() => {
            onClose?.();
            close();
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
  totalFilteredCount,
  filters,
}: {
  disabled?: boolean;
  selectedFicheIds: number[] | 'all';
  totalFilteredCount: number;
  filters: Filters;
  sort?: SortOptions;
}): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const collectiviteId = useCollectiviteId();
  const effectiveCount =
    selectedFicheIds === 'all' ? totalFilteredCount : selectedFicheIds.length;
  const isOverLimit = effectiveCount > PDF_EXPORT_MAX_FICHES;

  const input =
    selectedFicheIds === 'all'
      ? { mode: 'all' as const, collectiviteId, filters, sort }
      : { mode: 'selection' as const, ficheIds: selectedFicheIds };

  const warning = isOverLimit
    ? `L'export est limité à ${PDF_EXPORT_MAX_FICHES} fiches. Vous en avez sélectionné ${effectiveCount}.`
    : undefined;

  return (
    <ExportFicheModalWrapper
      openState={{ isOpen, setIsOpen }}
      warning={warning}
      submitButton={(close, options) => (
        <ExportPdfButton
          input={input}
          sections={options}
          close={close}
          disabled={isOverLimit}
        />
      )}
    >
      <Button
        icon="download-fill"
        size="xs"
        variant="outlined"
        disabled={disabled}
      />
    </ExportFicheModalWrapper>
  );
};

function ExportPdfButton({
  input,
  sections,
  close,
  disabled,
}: {
  input:
    | { mode: 'selection'; ficheIds: number[] }
    | {
        mode: 'all';
        collectiviteId: number;
        filters?: Filters;
        sort?: SortOptions;
      };
  sections: typeof sectionsInitValue;
  close: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const { mutate, isPending } = useDownloadPdfExport();
  const apiOptions = sectionsValuesToApiInput(sections);

  return (
    <Button
      loading={isPending}
      disabled={disabled || isPending}
      onClick={() =>
        mutate({ ...input, ...apiOptions }, { onSuccess: () => close() })
      }
      size="md"
      variant="outlined"
      icon="download-fill"
    >
      Export PDF
    </Button>
  );
}
