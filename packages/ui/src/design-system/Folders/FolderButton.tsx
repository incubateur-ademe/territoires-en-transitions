import {Icon} from '@design-system/Icon';
import classNames from 'classnames';

type FolderButtonProps = {
  id: number | string;
  /** Nom du dossier */
  label: string;
  /** Le dossier est actuellement sélectionné */
  isSelected?: boolean;
  /** Le dossier contient l'élément sélectionné */
  containsSelectedFolder?: boolean;
  /** Le dossier contient d'autres dossiers */
  hasChildren?: boolean;
  /** Sélection du dossier */
  onSelect: () => void;
};

const FolderButton = ({
  id,
  label,
  isSelected = false,
  containsSelectedFolder = false,
  hasChildren = false,
  onSelect,
}: FolderButtonProps) => {
  return (
    <button
      id={id.toString()}
      className={classNames(
        'transition-all font-medium text-sm text-left w-full py-2 px-4 rounded-lg flex items-center justify-between gap-2',
        {
          'bg-white text-primary-9 hover:!bg-primary-1':
            !isSelected && !containsSelectedFolder,
          'bg-primary-7 text-white hover:!bg-primary-6 hover:!text-white':
            isSelected,
          'bg-primary-4 text-white hover:!bg-primary-5 hover:!text-white':
            containsSelectedFolder,
        }
      )}
      onClick={onSelect}
    >
      {label}
      {hasChildren && <Icon icon="arrow-right-s-line" />}
    </button>
  );
};

export default FolderButton;
