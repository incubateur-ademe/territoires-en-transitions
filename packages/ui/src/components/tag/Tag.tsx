import classNames from 'classnames';

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
};

/** Affiche une étiquette */
export const Tag = ({
  className,
  title,
  disabled,
  onClose,
  isUserCreated,
}: TagProps) => {
  if (!title || title.length === 0) {
    return null;
  }
  const canClose = onClose && !disabled;

  return (
    <div
      className={classNames(
        'flex items-center px-3 py-0.5 text-white bg-primary rounded-full',
        { 'pr-2': canClose },
        {
          '!bg-white !border !border-gray-300 !text-gray-900': isUserCreated,
        },
        className
      )}
    >
      <span className="py-0.5 text-sm">{title}</span>
      {canClose && (
        <div
          className="ml-1 rounded-full cursor-pointer"
          onClick={(evt) => {
            evt.stopPropagation();
            onClose();
          }}
        >
          <div className="fr-fi-close-line flex m-auto scale-75" />
        </div>
      )}
    </div>
  );
};
