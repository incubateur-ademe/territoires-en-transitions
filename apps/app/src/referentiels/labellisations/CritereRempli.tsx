import { Icon } from '@/ui';
import classNames from 'classnames';

/** Affiche le picto et le libellé pour un critère rempli */
export const CritereRempli = ({ className }: { className?: string }) => (
  <span className="flex items-center gap-2 italic text-sm text-grey-10">
    <Icon
      icon="checkbox-circle-fill"
      className={classNames('ml-4 text-success', className)}
    />
    Terminé
  </span>
);
