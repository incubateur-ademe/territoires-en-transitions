import classNames from 'classnames';
import {Icon} from '../../icons/Icon';

type State = 'default' | 'info' | 'error' | 'success' | 'warning' | 'disabled';

const stateToColor: Record<State, string> = {
  info: 'text-info-1',
  error: 'text-error-1',
  success: 'text-success-1',
  warning: 'text-warning-1',
  default: '',
  disabled: '',
};

const stateToIcon: Record<State, string> = {
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
  state?: State;
  /** Message d'état affiché en dessous du champ */
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
          <span
            className={classNames('block mt-2 text-xs text-grey-6', {
              '!text-grey-5': state === 'disabled',
            })}
          >
            {hint}
          </span>
        )}
      </label>
      {children}
      {message !== undefined && (
        <div className={classNames('flex items-center', stateToColor[state])}>
          <Icon icon={stateToIcon[state]} size="sm" className="mr-1" />
          <span className="text-xs">{message}</span>
        </div>
      )}
    </div>
  );
};

export default Field;
