import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import { createElement, useCallback, useEffect, useState } from 'react';
import { Preselection } from '../../use-preselection';
import { LevierPriorisation } from '../data/to-leviers-priorisation';
import { UpsertPertinence } from '../data/use-upsert-pertinence';
import { SelectLevier } from '../select-levier';
import { LevierPanel } from './levier.panel';

type LevierSelection = {
  levierId: LevierId;
  categorie?: CategorieAction;
  clickCount: number;
};

type LevierSidePanel = {
  selectedLevierId?: LevierId;
  select: SelectLevier;
};

type UseLevierSidePanelArgs = {
  leviers: LevierPriorisation[];
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
};

export const useLevierSidePanel = ({
  leviers,
  preselection,
  upsertPertinence,
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

  const selectedLevier = leviers.find(
    ({ levierId }) => levierId === selection?.levierId
  );
  const initialCategorie = selection?.categorie;
  const clickCount = selection?.clickCount;

  useEffect(() => {
    if (selectedLevier === undefined) {
      return;
    }
    setPanel({
      type: 'open',
      title: selectedLevier.nom,
      content: createElement(LevierPanel, {
        key: `${selectedLevier.levierId}/${
          initialCategorie ?? ''
        }/${clickCount}`,
        levier: selectedLevier,
        initialCategorie,
        preselection,
        upsertPertinence,
      }),
    });
  }, [
    selectedLevier,
    initialCategorie,
    clickCount,
    preselection,
    upsertPertinence,
    setPanel,
  ]);

  return { selectedLevierId: selection?.levierId, select };
};
