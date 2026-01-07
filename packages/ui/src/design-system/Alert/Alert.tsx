import { Icon, IconValue } from '../../design-system/Icon';
import { cn } from '../../utils/cn';
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
  /** Classname custom */
  className?: string;
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
  className,
}: AlertProps) => {
  const styles = alertClassnames[state];

  return (
    <div className={cn('rounded-lg', styles.background, className)}>
      <div className={cn('py-3 px-4 flex gap-4 rounded-lg', styles.background)}>
        {/* Icône à gauche du bloc */}
        <Icon
          icon={customIcon ? customIcon : stateToIcon[state]}
          className={cn('mt-0.5', styles.text)}
        />

        {/* Titre et texte additionnel */}
        <div className="w-full flex flex-col gap-3 justify-center">
          {!!title && (
            <div
              className={cn('text-base font-bold flex flex-col', styles.text)}
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
      </div>
    </div>
  );
};
