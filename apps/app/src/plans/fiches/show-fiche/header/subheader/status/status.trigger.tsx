import { StatusBadge } from '@/app/plans/fiches/show-fiche/components/status.badge';
import { Statut } from '@tet/domain/plans';
import { useEditionModalManager } from '../../context/edition-modal-manager-context';

export const Status = ({ status }: { status: Statut | null }): JSX.Element => {
  const { openModal } = useEditionModalManager();
  return (
    <button onClick={() => openModal('status')} type="button">
      <StatusBadge status={status} />
    </button>
  );
};
