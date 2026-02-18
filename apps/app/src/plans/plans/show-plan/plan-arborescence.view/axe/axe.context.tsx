import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { waitForMarkup } from '@/app/utils/waitForMarkup';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { PlanNode } from '@tet/domain/plans';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { childrenOfPlanNodes } from '../../../utils';
import { useCreateAxe } from '../../data/use-create-axe';
import { useListAxeIndicateurs } from '../../data/use-list-axe-indicateurs';
import { useUpdateAxe } from '../../data/use-update-axe';
import { usePlanOptions } from '../plan-options.context';
import { useToggleAxe } from '../use-toggle-axe';

export const AxeCreatedEvent = 'axe-created';
export const AxeDescriptionCreatedEvent = 'axe-description-created';

export type AxeContextValue = {
  updateAxe: ReturnType<typeof useUpdateAxe>;
  createFicheResume: ReturnType<typeof useCreateFicheResume>;
  createSousAxe: ReturnType<typeof useCreateAxe>;
  planOptions: ReturnType<typeof usePlanOptions>;
  sousAxes: PlanNode[];
  isReadOnly: boolean;

  // indique un axe à la racine du plan
  isMainAxe: boolean;

  // état d'ouverture de l'axe
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  // indique qu'un effet doit être appliqué pour scroller jusqu'à l'axe
  shouldScroll: boolean;

  // sélection des indicateurs associés à l'axe
  selectedIndicateurs: IndicateurDefinitionListItem[];
  toggleIndicateur: (indicateur: IndicateurDefinitionListItem) => Promise<void>;

  // édition du titre de l'axe
  isOpenEditTitle: boolean;
  setIsOpenEditTitle: (isOpen: boolean) => void;

  // paramètres passés à l'instance du provider
  providerProps: Omit<AxeProviderProps, 'children'>;
};

const AxeContext = createContext<AxeContextValue | null>(null);

export const useAxeContext = () => {
  const context = useContext(AxeContext);
  if (!context) {
    throw new Error('useAxeContext must be used within an AxeProvider');
  }
  return context;
};

type AxeProviderProps = {
  axe: PlanNode;
  rootAxe: PlanNode;
  axes: PlanNode[];
  collectivite: CollectiviteCurrent;
  children: ReactNode;
};

export const AxeProvider = (props: AxeProviderProps) => {
  const { children, ...providerProps } = props;
  const { axe, rootAxe, axes, collectivite } = providerProps;
  const collectiviteId = collectivite.collectiviteId;
  const isReadOnly = !collectivite.hasCollectivitePermission('plans.mutate');

  const updateAxe = useUpdateAxe({
    axe,
    collectiviteId,
    planId: rootAxe.id,
  });

  const createFicheResume = useCreateFicheResume({
    collectiviteId,
    axeId: axe.id,
    planId: rootAxe.id,
    axeFichesIds: axe.fiches,
  });

  const createSousAxe = useCreateAxe({
    collectiviteId,
    parentAxe: axe,
    planId: rootAxe.id,
  });

  const planOptions = usePlanOptions();

  const { isOpen, setIsOpen, shouldScroll } = useToggleAxe(axe.id, axes);

  const { selectedIndicateurs, toggleIndicateur } = useListAxeIndicateurs({
    axe,
    collectiviteId,
    planId: rootAxe.id,
    enabled: isOpen,
  });

  const [isOpenEditTitle, setIsOpenEditTitle] = useState(false);

  const isMainAxe = axe.depth === 1;
  const sousAxes = childrenOfPlanNodes(axe, axes);

  // écoute l'événement de création d'axe pour activer l'édition du titre
  useEffect(() => {
    const handleAxeCreated = (event: CustomEvent<{ axeId: number }>) => {
      if (event.detail.axeId === axe.id && !isReadOnly) {
        // ouvre l'axe s'il n'est pas déjà ouvert
        if (!isOpen) {
          setIsOpen(true);
        }
        setIsOpenEditTitle(true);
      }
    };

    window.addEventListener(AxeCreatedEvent, handleAxeCreated as EventListener);
    return () => {
      window.removeEventListener(
        AxeCreatedEvent,
        handleAxeCreated as EventListener
      );
    };
  }, [axe.id, isOpen, setIsOpen, setIsOpenEditTitle, isReadOnly]);

  // écoute l'événement de création de la description pour activer l'édition
  useEffect(() => {
    const handleDescriptionCreated = (
      event: CustomEvent<{ axeId: number }>
    ) => {
      if (event.detail.axeId === axe.id && !isReadOnly) {
        // ouvre l'axe s'il n'est pas déjà ouvert
        if (!isOpen) {
          setIsOpen(true);
        }
        waitForMarkup(`#axe-desc-${axe.id} div[contenteditable]`).then((el) => {
          (el as HTMLInputElement)?.focus?.();
        });
      }
    };
    window.addEventListener(
      AxeDescriptionCreatedEvent,
      handleDescriptionCreated as EventListener
    );
    return () => {
      window.removeEventListener(
        AxeDescriptionCreatedEvent,
        handleDescriptionCreated as EventListener
      );
    };
  }, [axe.id, isOpen, setIsOpen, isReadOnly]);

  return (
    <AxeContext.Provider
      value={{
        updateAxe,
        createSousAxe,
        createFicheResume,
        planOptions,
        sousAxes,
        isReadOnly,
        isMainAxe,
        isOpen,
        setIsOpen,
        shouldScroll,
        selectedIndicateurs,
        toggleIndicateur,
        isOpenEditTitle,
        setIsOpenEditTitle,
        providerProps,
      }}
    >
      {children}
    </AxeContext.Provider>
  );
};
