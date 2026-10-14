import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { CategorieAction, LevierId } from '@tet/domain/shared';
import { createElement, useCallback, useEffect, useState } from 'react';
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
  select: SelectLevier;
};

type UseLevierSidePanelArgs = {
  leviers: LevierPriorisation[];
  places: LevierPlace[];
  preselection: Preselection;
  upsertPertinence?: UpsertPertinence;
};

export const useLevierSidePanel = ({
  leviers,
  places,
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
      header: createElement(LevierHeader, {
        levier: selectedLevier,
        subtitle: toLevierSubtitle({
          secteur: selectedLevier.secteur,
          potentielScore,
        }),
        upsertPertinence,
      }),
      content: createElement(LevierPanel, {
        key: `${selectedLevier.levierId}/${
          initialCategorie ?? ''
        }/${clickCount}`,
        levier: selectedLevier,
        initialCategorie,
        preselection,
      }),
    });
  }, [
    selectedLevier,
    initialCategorie,
    clickCount,
    preselection,
    upsertPertinence,
    potentielScore,
    setPanel,
  ]);

  return { selectedLevierId: selection?.levierId, select };
};
