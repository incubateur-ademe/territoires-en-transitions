import { Icon } from '@tet/ui';
import classNames from 'classnames';

type BoutonTableauEmplacementProps = {
  /** Id associé au bouton, permettant le scroll */
  id: number;
  /** Nom de l'axe */
  label: string;
  /** L'axe est actuellement sélectionné */
  isSelected?: boolean;
  /** L'axe contient l'axe sélectionné */
  containsSelectedAxe?: boolean;
  /** L'axe contient d'autres axes */
  hasChildren?: boolean;
  /** Sélection de l'axe */
  onSelect: () => void;
};

export const BoutonTableauEmplacement = ({
  id,
  label,
  isSelected = false,
  containsSelectedAxe = false,
  hasChildren = false,
  onSelect,
}: BoutonTableauEmplacementProps) => {
  return (
    <button
      id={id.toString()}
      className={classNames(
        'transition-all font-medium text-sm text-left w-full py-2 px-4 rounded-lg flex items-center justify-between gap-2',
        {
          'bg-white text-primary-9 hover:!bg-primary-1':
            !isSelected && !containsSelectedAxe,
          'bg-primary-7 text-white hover:!bg-primary-6 hover:!text-white':
            isSelected,
          'bg-primary-4 text-white hover:!bg-primary-5 hover:!text-white':
            containsSelectedAxe,
        }
      )}
      onClick={onSelect}
    >
      {label}
      {hasChildren && <Icon icon="arrow-right-s-line" />}
    </button>
  );
};
