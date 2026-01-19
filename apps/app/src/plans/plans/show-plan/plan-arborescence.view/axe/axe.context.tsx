import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';
import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { childrenOfPlanNodes } from '../../../utils';
import { useAxeIndicateurs } from '../../data/use-axe-indicateurs';
import { useCreateAxe } from '../../data/use-create-axe';
import { useUpdateAxe } from '../../data/use-update-axe';
import { usePlanOptions } from '../plan-options.context';
import { useToggleAxe } from '../use-toggle-axe';

export const AxeCreatedEvent = 'axe-created';

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

  // détection de la visibilité de l'axe à l'écran
  intersectionRef: ReturnType<typeof useIntersectionObserver>['ref'];

  // indique qu'un effet doit être appliqué pour scroller jusqu'à l'axe
  shouldScroll: boolean;

  // sélection des indicateurs associés à l'axe
  selectedIndicateurs: IndicateurDefinitionListItem[];
  toggleIndicateur: (indicateur: IndicateurDefinitionListItem) => Promise<void>;
  isOpenPanelIndicateurs: boolean;
  setIsOpenPanelIndicateurs: (isOpen: boolean) => void;

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
  collectivite: CollectiviteAccess;
  children: ReactNode;
};

export const AxeProvider = (props: AxeProviderProps) => {
  const { children, ...providerProps } = props;
  const { axe, rootAxe, axes, collectivite } = providerProps;
  const collectiviteId = collectivite.collectiviteId;
  const isReadOnly =
    collectivite.isReadOnly ||
    !hasPermission(collectivite.permissions, 'plans.mutate');

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
  const { ref: intersectionRef, entry } = useIntersectionObserver();

  const { selectedIndicateurs, toggleIndicateur } = useAxeIndicateurs({
    axe,
    collectiviteId,
    planId: rootAxe.id,
    enabled: (isOpen && entry?.isIntersecting) || false,
  });

  const [isOpenPanelIndicateurs, setIsOpenPanelIndicateurs] = useState(false);
  const [isOpenEditTitle, setIsOpenEditTitle] = useState(false);

  const isMainAxe = axe.depth === 1;
  const sousAxes = childrenOfPlanNodes(axe, axes);

  // écoute l'événement de création d'axe pour activer l'édition du titre
  useEffect(() => {
    const handleAxeCreated = (event: CustomEvent<{ axeId: number }>) => {
      if (event.detail.axeId === axe.id && !collectivite.isReadOnly) {
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
  }, [axe.id, isOpen, setIsOpen, setIsOpenEditTitle, collectivite.isReadOnly]);

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
        intersectionRef,
        selectedIndicateurs,
        toggleIndicateur,
        isOpenPanelIndicateurs,
        setIsOpenPanelIndicateurs,
        isOpenEditTitle,
        setIsOpenEditTitle,
        providerProps,
      }}
    >
      {children}
    </AxeContext.Provider>
  );
};
