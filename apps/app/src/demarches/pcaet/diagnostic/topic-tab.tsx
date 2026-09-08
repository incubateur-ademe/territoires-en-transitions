'use client';

import { TabsTab } from '@tet/ui/design-system/TabsNext/index';
import { JSX } from 'react';
import { getDemarcheCompletionBadgeProps } from '../../components/completion.badge';
import type { DemarcheCompletionStatut } from '../../types';
import type { DiagnosticTab } from './diagnostic.tabs.utils';

type TopicTabProps = {
  tab: DiagnosticTab;
  isActive: boolean;
  statut: DemarcheCompletionStatut;
  onSelect: () => void;
};

/**
 * Volet du diagnostic, rendu avec la variante `card` des onglets : le volet
 * sélectionné vient du paramètre `?topic=`, l'onglet est donc un bouton et non
 * un lien.
 */
export const TopicTab = ({
  tab,
  isActive,
  statut,
  onSelect,
}: TopicTabProps): JSX.Element => (
  <TabsTab
    id={`demarche-topic-tab-${tab.code}`}
    dataTest={`demarches.pcaet.diagnostic.topic-${tab.code}`}
    label={tab.label}
    icon={tab.icon}
    isActive={isActive}
    onClick={onSelect}
    // L'icône du volet est juste au-dessus : la répéter dans le badge déborde
    // dès que la sidebar est dépliée.
    badge={getDemarcheCompletionBadgeProps(statut, { withIcon: false })}
  />
);
