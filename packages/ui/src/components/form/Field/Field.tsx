import classNames from 'classnames';

type Props = {
  /** Titre */
  title: string;
  /** Enfant: input, select... */
  children: React.ReactNode;
  /** class donnée au container */
  className?: string;
  /** Complément d'informations */
  hint?: string;
  /** Pour lier à un formulaire */
  htmlFor?: string;
  /** État */
  state?: 'default' | 'info' | 'error' | 'success' | 'warning' | 'disabled';
  /** Message de l'état afficher dessous */
  message?: string;
};

/** Wrapper pour élément de formulaire donnant des informations et un état */
const Field = ({
  title,
  className,
  hint,
  htmlFor,
  state = 'default',
  message,
  children,
}: Props) => {
  return (
    <div className={classNames(`flex-grow flex flex-col gap-3`, className)}>
      <label htmlFor={htmlFor}>
        {/** Title */}
        <div
          className={classNames('font-medium text-grey-8', {
            '!text-grey-5': state === 'disabled',
          })}
        >
          {title}
        </div>
        {/** Hint */}
        {hint !== undefined && (
          <div
            className={classNames('mt-2 text-xs text-grey-6', {
              '!text-grey-5': state === 'disabled',
            })}
          >
            {hint}
          </div>
        )}
      </label>
      {children}
      {message !== undefined && (
        <div
          className={classNames('flex items-center', {
            'text-info-1': state === 'info',
            'text-error-1': state === 'error',
            'text-success-1': state === 'success',
            'text-warning-1': state === 'warning',
          })}
        >
          <span
            className={classNames('flex mr-1 before:h-4 before:w-4', {
              'fr-icon-info-fill': state === 'info',
              'fr-icon-error-fill': state === 'error',
              'fr-icon-success-fill': state === 'success',
              'fr-icon-warning-fill': state === 'warning',
            })}
          />
          <span className="text-xs">{message}</span>
        </div>
      )}
    </div>
  );
};

export default Field;
