'use client';

import { Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { JSX } from 'react';
import { DemarcheCompletionBadge } from '../../components/completion.badge';
import type { DemarcheCompletionStatut } from '../../types';
import type { DiagnosticTab } from './diagnostic.tabs.utils';

type TopicTabProps = {
  tab: DiagnosticTab;
  isActive: boolean;
  statut: DemarcheCompletionStatut;
  /** Omis en consultation : l'avancement ne concerne que la collectivité. */
  isComplete?: boolean;
  onSelect: () => void;
};

export const TopicTab = ({
  tab,
  isActive,
  statut,
  onSelect,
}: TopicTabProps): JSX.Element => (
  <li role="presentation" className="p-0">
    <button
      type="button"
      role="tab"
      id={`demarche-topic-tab-${tab.code}`}
      aria-selected={isActive}
      aria-controls={`demarche-topic-panel-${tab.code}`}
      onClick={onSelect}
      className={cn(
        'group flex h-full w-full flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors cursor-pointer',
        isActive
          ? 'border-primary-7 bg-primary-0 border-2'
          : 'border-grey-3 hover:border-primary-5 hover:bg-primary-0'
      )}
      data-test={`demarches.pcaet.diagnostic.topic-${tab.code}`}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          statut === 'complete'
            ? 'bg-success-2 text-success-9'
            : 'bg-primary-1 text-primary-9'
        )}
      >
        <Icon icon={tab.icon} size="md" />
      </span>
      <span className="text-sm font-semibold text-primary-9">{tab.label}</span>
      {/* Le rond d'icône du volet est juste au-dessus : la répéter dans le
          badge déborde dès que la sidebar est dépliée. */}
      <DemarcheCompletionBadge statut={statut} size="xs" withIcon={false} />
    </button>
  </li>
);
