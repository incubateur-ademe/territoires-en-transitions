import classNames from 'classnames';
import { Icon } from '../Icon';

type TagProps = {
  /** Libellé affiché dans l'étiquette */
  title: string;
  /** Appelée lors du clic sur le bouton "Fermer". Ne pas spécifier pour masquer le bouton. */
  onClose?: () => void;
  /** Pour désactiver les interactions */
  disabled?: boolean;
  /** Permet de surcharger les styles */
  className?: string;
  /** Change la couleur par défaut pour distinguer les étiquettes prédéfinies
   * des étiquettes utilisateur */
  isUserCreated?: boolean;
  /** Restreint le titre à une seule ligne */
  trim?: boolean;
};

/** Affiche une étiquette */
export const Tag = ({
  className,
  title,
  disabled,
  onClose,
  isUserCreated,
  trim = false,
}: TagProps) => {
  if (!title || title.length === 0) {
    return null;
  }
  const canClose = onClose && !disabled;

  return (
    <div
      className={classNames(
        'flex items-center px-3 py-0.5 rounded-full',
        isUserCreated
          ? 'text-gray-900 bg-white border border-gray-300'
          : 'text-white bg-primary',
        { 'pr-2': canClose },
        className
      )}
    >
      <span className={classNames('py-0.5 text-sm', { 'line-clamp-1': trim })}>
        {title}
      </span>
      {canClose && (
        <div
          className="flex ml-1 rounded-full cursor-pointer"
          onClick={(evt) => {
            evt.stopPropagation();
            onClose();
          }}
        >
          <Icon icon="close-line" size="md" className="m-auto" />
        </div>
      )}
    </div>
  );
};
