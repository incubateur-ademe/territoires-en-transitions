import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { LevierId } from '@tet/domain/shared';
import { createElement, useCallback, useEffect, useState } from 'react';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierPanel } from './levier.panel';
import { LevierPriorisation } from './to-leviers-priorisation';
import { Preselection } from './use-preselection';

type LevierSidePanel = {
  selectedLevierId?: LevierId;
  select: (levierId: LevierId) => void;
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
  const [selectedLevierId, setSelectedLevierId] = useState<LevierId>();
  const onClose = useCallback(() => setSelectedLevierId(undefined), []);
  const { setPanel } = useSidePanel({ onClose });

  const selectedLevier = leviers.find(
    ({ levierId }) => levierId === selectedLevierId
  );

  useEffect(() => {
    if (selectedLevier === undefined) {
      return;
    }
    setPanel({
      type: 'open',
      title: selectedLevier.nom,
      content: createElement(LevierPanel, {
        key: selectedLevier.levierId,
        levier: selectedLevier,
        preselection,
        upsertPertinence,
      }),
    });
  }, [selectedLevier, preselection, upsertPertinence, setPanel]);

  return { selectedLevierId, select: setSelectedLevierId };
};
