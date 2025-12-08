import { PriorityBadge } from '@/app/plans/fiches/show-fiche/components/priority.badge';
import { Priorite } from '@tet/domain/plans';
import { useEditionModalManager } from '../../context/edition-modal-manager-context';
export const Priority = ({
  priority,
}: {
  priority: Priorite | null;
}): JSX.Element => {
  const { openModal } = useEditionModalManager();
  return (
    <button onClick={() => openModal('priority')} type="button">
      <PriorityBadge priority={priority} />
    </button>
  );
};
