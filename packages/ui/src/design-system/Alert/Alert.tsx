import {Icon} from '@design-system/Icon';
import classNames from 'classnames';
import {AlertState, alertClassnames, stateToIcon} from './utils';
import {useState} from 'react';

type AlertProps = {
  /** Titre du bloc alerte */
  title: string;
  /** Texte additionnel optionnel */
  description?: string;
  /** Possibilité d'ajouter un composant custom en fin de bloc */
  footer?: React.ReactNode;
  /** Etat du bloc alerte */
  state?: AlertState;
  /** Initialisation de l'état open */
  isOpen?: boolean;
  /** Gestion de l'affichage pour les alertes sur toute la largeur de page */
  fullPageWidth?: boolean;
  /** Classname custom */
  classname?: string;
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
  isOpen = true,
  fullPageWidth = false,
  classname,
  onClose,
}: AlertProps) => {
  const disableClose = !onClose;
  const styles = alertClassnames[state];

  const handleOnClose = () => onClose?.();

  return (
    <div
      className={classNames(
        {'w-full px-4 lg:px-6': fullPageWidth},
        styles.background
      )}
    >
      <div
        className={classNames(
          'py-3 flex gap-4',
          {
            hidden: !isOpen,
            'px-4': !fullPageWidth,
            'w-full mx-auto xl:max-w-7xl 2xl:max-w-8xl': fullPageWidth,
          },
          styles.background,
          classname
        )}
      >
        {/* Icône à gauche du bloc */}
        <Icon
          icon={stateToIcon[state]}
          className={classNames('mt-0.5', styles.text)}
        />

        {/* Titre et texte additionnel */}
        <div className="flex flex-col gap-3">
          <div className={classNames('text-base font-bold', styles.text)}>
            {title}
          </div>
          {!!description && (
            <div className="text-sm font-medium text-grey-9">{description}</div>
          )}
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

export const ControlledAlert = ({...props}: AlertProps) => {
  const [isAlertOpen, setIsAlertOpen] = useState(true);

  return (
    <Alert
      {...props}
      isOpen={isAlertOpen}
      onClose={() => setIsAlertOpen(false)}
    />
  );
};
