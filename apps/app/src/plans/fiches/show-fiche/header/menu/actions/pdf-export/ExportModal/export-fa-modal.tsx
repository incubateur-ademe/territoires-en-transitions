import { appLabels } from '@/app/labels/catalog';
import {
  SortOptions,
  useListFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Filters } from '@/app/plans/fiches/list-all-fiches/filters/types';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import {
  Alert,
  Button,
  Event,
  Modal,
  ModalFooter,
  ModalProps,
  useEventTracker,
} from '@tet/ui';
import { useState } from 'react';
import {
  useDownloadPdfExport,
  UseDownloadPdfExportOptions,
} from '../use-download-pdf-export';
import { sectionsInitValue, sectionsValuesToApiInput } from '../utils';
import ExportFicheActionTable from './export-fa-table';

// Doit rester aligné avec FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches côté backend.
const PDF_EXPORT_MAX_FICHES = 200;

// Même ordre que la liste des fiches d'un axe sur la page du plan.
const PLAN_EXPORT_SORT: SortOptions = [{ field: 'titre', direction: 'asc' }];

const ExportFicheModalWrapper = ({
  openState,
  onClose,
  warning,
  submitButton,
  children: trigger,
}: {
  openState?: ModalProps['openState'];
  onClose?: () => void;
  warning?: string;
  submitButton: (
    close: () => void,
    options: typeof sectionsInitValue
  ) => React.ReactNode;
  children?: React.ReactElement;
}): React.ReactElement => {
  const [options, setOptions] = useState(sectionsInitValue);
  return (
    <Modal
      openState={openState}
      onClose={onClose}
      title={appLabels.exporterPdf}
      subTitle={appLabels.parametresExport}
      size="xl"
      render={() => (
        <div className="flex flex-col gap-4">
          {warning && <Alert state="warning" description={warning} />}
          <ExportFicheActionTable options={options} setOptions={setOptions} />
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooter variant="right">
          <Button variant="outlined" onClick={close}>
            {appLabels.annuler}
          </Button>
          {submitButton(close, options)}
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
}): React.ReactElement => {
  return (
    <ExportFicheModalWrapper
      openState={{
        isOpen: true,
        setIsOpen: () => {},
      }}
      onClose={onClose}
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
  const collectiviteId = useCollectiviteId();
  const effectiveCount =
    selectedFicheIds === 'all' ? totalFilteredCount : selectedFicheIds.length;
  const isOverLimit = effectiveCount > PDF_EXPORT_MAX_FICHES;

  const input =
    selectedFicheIds === 'all'
      ? { mode: 'all' as const, collectiviteId, filters, sort }
      : { mode: 'selection' as const, ficheIds: selectedFicheIds };

  const warning = isOverLimit
    ? appLabels.exportPdfLimiteFiches({
        max: PDF_EXPORT_MAX_FICHES,
        count: effectiveCount,
      })
    : undefined;

  return (
    <ExportFicheModalWrapper
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
      >
        {appLabels.exporterPdf}
      </Button>
    </ExportFicheModalWrapper>
  );
};

/**
 * Export PDF de toutes les fiches d'un plan, ouvert depuis le menu du plan.
 * Les sous-actions restent dans la page de leur fiche parente.
 */
export const ExportPlanFichesModal = ({
  planId,
  openState,
}: {
  planId: number;
  openState: ModalProps['openState'];
}): React.ReactElement => {
  const collectiviteId = useCollectiviteId();
  const tracker = useEventTracker();
  const filters = { planActionIds: [planId] };

  // Compte les fiches que l'utilisateur peut lire, comme le contrôle du
  // backend (seules les fiches partagées par une autre collectivité peuvent
  // différer). Le backend reste juge de la limite (TOO_MANY_FICHES).
  const { count, isLoading } = useListFiches(collectiviteId, {
    filters,
    queryOptions: { limit: 1 },
  });
  const isOverLimit = count > PDF_EXPORT_MAX_FICHES;

  const warning = isOverLimit
    ? appLabels.exportPdfPlanLimiteFiches({
        max: PDF_EXPORT_MAX_FICHES,
        count,
      })
    : undefined;

  return (
    <ExportFicheModalWrapper
      openState={openState}
      warning={warning}
      submitButton={(close, options) => (
        <ExportPdfButton
          input={{
            mode: 'all',
            collectiviteId,
            filters,
            sort: PLAN_EXPORT_SORT,
          }}
          sections={options}
          close={close}
          disabled={isLoading || isOverLimit}
          trackSuccess={(variables) =>
            tracker(Event.plans.exportPlan, {
              format: 'pdf',
              sections: variables.sections ?? [],
            })
          }
        />
      )}
    />
  );
};

function ExportPdfButton({
  input,
  sections,
  close,
  disabled,
  trackSuccess,
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
  trackSuccess?: UseDownloadPdfExportOptions['trackSuccess'];
}): React.ReactElement {
  const { mutate, isPending } = useDownloadPdfExport({ trackSuccess });
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
      {appLabels.exporter}
    </Button>
  );
}
