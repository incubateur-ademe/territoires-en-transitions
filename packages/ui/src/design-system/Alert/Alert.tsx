import classNames from 'classnames';
import { useState } from 'react';
import { Icon, IconValue } from '../../design-system/Icon';
import { AlertState, alertClassnames, stateToIcon } from './utils';

export type AlertProps = {
  /** Titre du bloc alerte */
  title?: string | React.ReactNode;
  /** Texte additionnel optionnel */
  description?: string | React.ReactNode;
  /** Possibilité d'ajouter un composant custom en fin de bloc */
  footer?: React.ReactNode;
  /** Etat du bloc alerte */
  state?: AlertState;
  /** Remplace l'icône par défaut */
  customIcon?: IconValue;
  /** Supprime l'icône */
  noIcon?: boolean;
  /** Initialisation de l'état open */
  isOpen?: boolean;
  /** Gestion de l'affichage pour les alertes sur toute la largeur de page */
  fullPageWidth?: boolean;
  /** Arrondi des angles de la div */
  rounded?: boolean;
  /** Ajoute une bordure en ton sur ton */
  withBorder?: boolean;
  /** Classname custom */
  className?: string;
  /** Détecte la fermeture du bloc */
  onClose?: () => void;
};

/**
 * Affiche un bloc alerte
 */

export const Alert = ({
  title,
  description,
  footer,
  state = 'info',
  customIcon,
  noIcon = false,
  isOpen = true,
  fullPageWidth = false,
  rounded = false,
  withBorder = false,
  className,
  onClose,
}: AlertProps) => {
  const disableClose = !onClose;
  const styles = alertClassnames[state];

  const handleOnClose = () => onClose?.();

  return (
    <div
      className={classNames(
        {
          'w-full px-4 lg:px-6': fullPageWidth,
          'rounded-lg': rounded,
          [styles.border]: withBorder,
        },
        styles.background,
        className
      )}
    >
      <div
        className={classNames(
          'py-3 flex gap-4',
          {
            hidden: !isOpen,
            'px-4': !fullPageWidth,
            'w-full mx-auto xl:max-w-7xl 2xl:max-w-8xl': fullPageWidth,
            'rounded-lg': rounded,
          },
          styles.background
        )}
      >
        {/* Icône à gauche du bloc */}
        {!noIcon && (
          <Icon
            icon={customIcon ? customIcon : stateToIcon[state]}
            className={classNames('mt-0.5', styles.text)}
          />
        )}

        {/* Titre et texte additionnel */}
        <div className="w-full flex flex-col gap-3 justify-center">
          {!!title && (
            <div
              className={classNames(
                'text-base font-bold flex flex-col',
                styles.text
              )}
            >
              {title}
            </div>
          )}
          {!!description &&
            (typeof description === 'string' ? (
              <div className="text-sm [&_*]:text-sm font-medium text-grey-9 [&_*]:text-grey-9 [&>*]:last:mb-0 flex flex-col gap-3">
                {description}
              </div>
            ) : (
              description
            ))}
          {!!footer && footer}
        </div>

        {/* Bouton close, optionnel */}
        {!disableClose && (
          <div
            onClick={handleOnClose}
            className="ml-auto cursor-pointer h-fit w-fit"
          >
            <Icon icon="close-line" className={styles.text} />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Affiche un bloc alerte avec gestion autonome de son état d'ouverture
 */

export const ControlledAlert = ({ ...props }: AlertProps) => {
  const [isAlertOpen, setIsAlertOpen] = useState(true);

  return (
    <Alert
      {...props}
      isOpen={isAlertOpen}
      onClose={() => setIsAlertOpen(false)}
    />
  );
};
