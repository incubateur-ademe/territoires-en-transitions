import { FicheWithRelations } from '@tet/domain/plans';
import { ReactNode } from 'react';
import { FicheProvider } from '../context/fiche-context';
import { LinkFichesView } from './actions-liees/side-menu/link-fiches.view';
import { LinkIndicateursView } from './indicateurs/side-menu/link-indicateur.view';

export type SidePanelAction = 'indicateurs' | 'actions-liees' | 'none';

export type SidePanelConfig = {
  title: string;
  content: (fiche: FicheWithRelations) => ReactNode;
};

export const SIDE_PANEL_CONFIG: Record<
  Exclude<SidePanelAction, 'none'>,
  SidePanelConfig
> = {
  indicateurs: {
    title: 'Lier des indicateurs',
    content: (fiche) => (
      <FicheProvider fiche={fiche}>
        <LinkIndicateursView />
      </FicheProvider>
    ),
  },
  'actions-liees': {
    title: 'Lier une action',
    content: (fiche) => (
      <FicheProvider fiche={fiche}>
        <LinkFichesView />
      </FicheProvider>
    ),
  },
} as const;
