import classNames from 'classnames';
import {Icon} from '@design-system/Icon';

export type FieldState =
  | 'default'
  | 'info'
  | 'error'
  | 'success'
  | 'warning'
  | 'disabled';

export const stateToTextColor: Record<FieldState, string> = {
  info: 'text-info-1',
  error: 'text-error-1',
  success: 'text-success-1',
  warning: 'text-warning-1',
  default: 'text-grey-8',
  disabled: 'text-grey-6',
};

const stateToIcon: Record<FieldState, string> = {
  info: 'information-fill',
  error: 'spam-fill',
  success: 'checkbox-circle-fill',
  warning: 'alert-fill',
  default: '',
  disabled: '',
};

type Props = {
  /** Titre */
  title: string;
  /** Enfant: input, select... */
  children: React.ReactNode;
  /** Pour surcharger les styles du container */
  className?: string;
  /** Complément d'informations */
  hint?: string;
  /** Pour lier le libellé et le champ qu'il contient */
  htmlFor?: string;
  /** État */
  state?: FieldState;
  /** Message d'état affiché en dessous du champ */
  message?: string;
  /** Réduit la taille du titre */
  small?: boolean;
};

/** Wrapper pour élément de formulaire donnant des informations et un état */
export const Field = ({
  title,
  className,
  hint,
  htmlFor,
  state = 'default',
  message,
  children,
  small,
}: Props) => {
  return (
    <div className={classNames(`flex-grow flex flex-col gap-3`, className)}>
      <label htmlFor={htmlFor}>
        {/** Title */}
        <div
          className={classNames('font-medium text-grey-8', {
            'text-grey-5': state === 'disabled',
            'text-sm': small,
          })}
        >
          {title}
        </div>
        {/** Hint */}
        {hint !== undefined && (
          <span
            className={classNames('block mt-2 text-xs text-grey-7', {
              'text-grey-5': state === 'disabled',
            })}
          >
            {hint}
          </span>
        )}
      </label>
      {children}
      {message !== undefined && (
        <div
          className={classNames('flex items-center', stateToTextColor[state])}
        >
          {state !== 'disabled' && state !== 'default' && (
            <Icon icon={stateToIcon[state]} size="sm" className="mr-1" />
          )}
          <span className="text-xs">{message}</span>
        </div>
      )}
    </div>
  );
};
