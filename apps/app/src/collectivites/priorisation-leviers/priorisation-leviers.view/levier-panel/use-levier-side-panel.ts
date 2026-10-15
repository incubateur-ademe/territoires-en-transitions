import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import {
  createElement,
  Ref,
  RefCallback,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Preselection } from '../../use-preselection';
import { LevierPriorisation } from '../data/to-leviers-priorisation';
import { LevierPlace } from '../data/to-matrix-points';
import { UpsertPertinence } from '../data/use-upsert-pertinence';
import { SelectLevier } from '../select-levier';
import { LevierHeader } from './levier.header';
import { LevierPanel } from './levier.panel';
import { toLevierSubtitle } from './to-levier-subtitle';

type LevierSelection = {
  levierId: LevierId;
  categorie?: CategorieAction;
  clickCount: number;
};

type LevierSidePanel = {
  selectedLevierId?: LevierId;
  selectedCategorie?: CategorieAction;
  select: SelectLevier;
  close: () => void;
};

type UseLevierSidePanelArgs = {
  leviers: LevierPriorisation[];
  places: LevierPlace[];
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
  headerRef?: Ref<HTMLDivElement>;
  actionsRef?: RefCallback<HTMLDivElement>;
};

export const useLevierSidePanel = ({
  leviers,
  places,
  preselection,
  upsertPertinence,
  headerRef,
  actionsRef,
}: UseLevierSidePanelArgs): LevierSidePanel => {
  const [selection, setSelection] = useState<LevierSelection>();
  const onClose = useCallback(() => setSelection(undefined), []);
  const { setPanel } = useSidePanel({ onClose });
  const select = useCallback<SelectLevier>(
    (levierId, categorie) =>
      setSelection((current) => ({
        levierId,
        categorie,
        clickCount: (current?.clickCount ?? 0) + 1,
      })),
    []
  );
  const close = useCallback(() => {
    setSelection(undefined);
    setPanel({ type: 'close' });
  }, [setPanel]);

  const selectedLevier = leviers.find(
    ({ levierId }) => levierId === selection?.levierId
  );
  const potentielScore = places.find(
    ({ levierId }) => levierId === selection?.levierId
  )?.potentielScore;
  const initialCategorie = selection?.categorie;
  const clickCount = selection?.clickCount;

  useEffect(() => {
    if (selectedLevier === undefined) {
      return;
    }
    setPanel({
      type: 'open',
      title: selectedLevier.nom,
      headerExtra: createElement(LevierHeader, {
        levier: selectedLevier,
        subtitle: toLevierSubtitle({
          secteur: selectedLevier.secteur,
          potentielScore,
        }),
        upsertPertinence,
        headerRef,
      }),
      content: createElement(LevierPanel, {
        key: `${selectedLevier.levierId}/${
          initialCategorie ?? ''
        }/${clickCount}`,
        levier: selectedLevier,
        initialCategorie,
        preselection,
        actionsRef,
      }),
    });
  }, [
    selectedLevier,
    initialCategorie,
    clickCount,
    preselection,
    upsertPertinence,
    potentielScore,
    headerRef,
    actionsRef,
    setPanel,
  ]);

  return {
    selectedLevierId: selection?.levierId,
    selectedCategorie: selection?.categorie,
    select,
    close,
  };
};

type LevierSidePanelControls = Pick<LevierSidePanel, 'select' | 'close'>;

export type { LevierSidePanel, LevierSidePanelControls };
